import React, { useState, useEffect, useRef } from 'react';
import { Compass, Navigation2, MapPin, CheckCircle, RotateCw, AlertTriangle, Sparkles } from 'lucide-react';
import { UserLocation } from '../types/prayer';
import { calculateDistanceToKaaba, calculateQiblaBearing, getArabicCardinalDirection } from '../utils/qibla';
import { soundService } from '../utils/soundService';

interface QiblaCompassProps {
  location: UserLocation;
  onOpenLocationModal: () => void;
}

export const QiblaCompass: React.FC<QiblaCompassProps> = ({
  location,
  onOpenLocationModal,
}) => {
  const [heading, setHeading] = useState<number>(0);
  const [hasCompassSensor, setHasCompassSensor] = useState<boolean>(false);
  const [needsPermission, setNeedsPermission] = useState<boolean>(false);
  const [manualOffset, setManualOffset] = useState<number>(0);
  const [isCalibrated, setIsCalibrated] = useState<boolean>(false);
  const lastVibratedRef = useRef<number>(0);

  const qiblaBearing = calculateQiblaBearing(location.latitude, location.longitude);
  const distanceKm = calculateDistanceToKaaba(location.latitude, location.longitude);
  const cardinalText = getArabicCardinalDirection(qiblaBearing);

  // Compass active heading
  const currentCompassHeading = hasCompassSensor ? heading : manualOffset;

  // Relative angle to Kaaba: 0 means device is pointing directly at Kaaba
  const diffToQibla = ((qiblaBearing - currentCompassHeading + 540) % 360) - 180;
  const isAligned = Math.abs(diffToQibla) <= 4;

  // Trigger haptic when user aligns with Qibla
  useEffect(() => {
    if (isAligned) {
      const now = Date.now();
      if (now - lastVibratedRef.current > 3000) {
        soundService.triggerQiblaAlignedHaptic();
        lastVibratedRef.current = now;
      }
    }
  }, [isAligned]);

  // Setup Device Orientation listener
  useEffect(() => {
    const handleOrientation = (e: DeviceOrientationEvent) => {
      let compassHeading: number | null = null;

      // WebKit (iOS) compass heading
      if ('webkitCompassHeading' in e && typeof (e as unknown as { webkitCompassHeading: number }).webkitCompassHeading === 'number') {
        compassHeading = (e as unknown as { webkitCompassHeading: number }).webkitCompassHeading;
      } else if (e.alpha !== null) {
        // Standard Android / Web absolute heading
        // alpha: 0 is north when absolute is true
        compassHeading = 360 - e.alpha;
      }

      if (compassHeading !== null && !isNaN(compassHeading)) {
        setHeading(Math.round(compassHeading));
        setHasCompassSensor(true);
        setIsCalibrated(true);
      }
    };

    // Check iOS permission requirement
    if (
      typeof DeviceOrientationEvent !== 'undefined' &&
      typeof (DeviceOrientationEvent as unknown as { requestPermission?: () => Promise<string> }).requestPermission === 'function'
    ) {
      setNeedsPermission(true);
    } else if (window.DeviceOrientationEvent) {
      window.addEventListener('deviceorientation', handleOrientation, true);
      window.addEventListener('deviceorientationabsolute', handleOrientation as EventListener, true);
    }

    return () => {
      window.removeEventListener('deviceorientation', handleOrientation, true);
      window.removeEventListener('deviceorientationabsolute', handleOrientation as EventListener, true);
    };
  }, []);

  const requestIOSPermission = async () => {
    try {
      const DeviceOrientationEventAny = DeviceOrientationEvent as unknown as {
        requestPermission?: () => Promise<string>;
      };
      if (DeviceOrientationEventAny.requestPermission) {
        const response = await DeviceOrientationEventAny.requestPermission();
        if (response === 'granted') {
          setNeedsPermission(false);
          window.addEventListener('deviceorientation', (e) => {
            const headingVal = (e as unknown as { webkitCompassHeading?: number }).webkitCompassHeading;
            if (typeof headingVal === 'number') {
              setHeading(Math.round(headingVal));
              setHasCompassSensor(true);
              setIsCalibrated(true);
            }
          });
        }
      }
    } catch {
      // ignore
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Info */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 rounded-2xl bg-stone-900/60 border border-stone-800">
        <div>
          <div className="flex items-center gap-2 text-emerald-400 text-xs font-semibold">
            <Compass className="w-4 h-4" />
            <span>بوصلة تحديد القبلة المشرفة بدقة GPS</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-bold text-white mt-1">
            اتجاه الكعبة المشرفة في {location.cityName}
          </h2>
          <div className="text-xs text-stone-400 mt-0.5">
            زاوية القبلة: <span className="text-emerald-400 font-bold tabular-nums">{qiblaBearing}°</span> ({cardinalText}) · المسافة إلى مكة:{' '}
            <span className="text-emerald-400 font-bold tabular-nums">{distanceKm.toLocaleString('ar-SA')} كم</span>
          </div>
        </div>

        <button
          onClick={onOpenLocationModal}
          className="px-3.5 py-2 rounded-xl bg-stone-800 hover:bg-stone-700 text-stone-200 text-xs font-medium border border-stone-700 transition-colors flex items-center gap-2 shrink-0 self-start sm:self-auto"
        >
          <MapPin className="w-4 h-4 text-emerald-400" />
          <span>تحديث إحداثيات الموقع</span>
        </button>
      </div>

      {/* Permission prompt for iOS */}
      {needsPermission && (
        <div className="p-4 rounded-2xl bg-amber-950/40 border border-amber-600/40 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0" />
            <div className="text-xs text-amber-200">
              لتفعيل دوران البوصلة الحي مع حركة جهازك، يرجى تفعيل إذن مستشعر الاتجاه.
            </div>
          </div>
          <button
            onClick={requestIOSPermission}
            className="px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-semibold text-xs whitespace-nowrap"
          >
            تفعيل البوصلة
          </button>
        </div>
      )}

      {/* Main Interactive Compass Display */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-b from-stone-900 via-stone-900 to-emerald-950/60 border border-emerald-500/30 p-8 flex flex-col items-center justify-center text-center shadow-xl">
        {/* Subtle radial background glow */}
        <div
          className={`absolute inset-0 transition-opacity duration-700 pointer-events-none ${
            isAligned
              ? 'bg-emerald-500/15 opacity-100'
              : 'bg-emerald-500/5 opacity-50'
          }`}
        />

        {/* Alignment status alert badge */}
        <div
          className={`relative z-10 mb-6 px-4 py-2 rounded-full text-xs font-semibold flex items-center gap-2 transition-all ${
            isAligned
              ? 'bg-emerald-500 text-stone-950 shadow-lg shadow-emerald-500/40 animate-pulse'
              : 'bg-stone-800/90 text-stone-300 border border-stone-700'
          }`}
        >
          {isAligned ? (
            <>
              <CheckCircle className="w-4 h-4" />
              <span>أنت الآن تواجه القبلة المشرفة بدقة!</span>
            </>
          ) : (
            <>
              <RotateCw className="w-4 h-4 text-emerald-400 animate-spin" style={{ animationDuration: '6s' }} />
              <span>
                قم بتدوير الهاتف حتى يتطابق المؤشر الذهبي (بفارق {Math.abs(Math.round(diffToQibla))}°)
              </span>
            </>
          )}
        </div>

        {/* Big Circular Compass Dial */}
        <div className="relative w-72 h-72 sm:w-84 sm:h-84 flex items-center justify-center">
          {/* Outer ring with degree markings */}
          <div
            className="absolute inset-0 rounded-full border-4 border-stone-700/60 bg-stone-950/80 shadow-2xl flex items-center justify-center transition-transform duration-200 ease-out"
            style={{
              transform: `rotate(${-currentCompassHeading}deg)`,
            }}
          >
            {/* Cardinal Letters */}
            <span className="absolute top-2 text-xs font-bold text-rose-500">ش (N)</span>
            <span className="absolute bottom-2 text-xs font-bold text-stone-400">ج (S)</span>
            <span className="absolute left-3 text-xs font-bold text-stone-400">غ (W)</span>
            <span className="absolute right-3 text-xs font-bold text-stone-400">شـ (E)</span>

            {/* Degree tick marks */}
            {Array.from({ length: 36 }).map((_, i) => (
              <div
                key={i}
                className={`absolute w-0.5 ${i % 3 === 0 ? 'h-3 bg-stone-400' : 'h-1.5 bg-stone-700'}`}
                style={{
                  top: '4px',
                  transformOrigin: '50% 140px',
                  transform: `rotate(${i * 10}deg)`,
                }}
              />
            ))}

            {/* Qibla Marker Arrow on the dial */}
            <div
              className="absolute w-full h-full flex flex-col items-center justify-start pointer-events-none"
              style={{
                transform: `rotate(${qiblaBearing}deg)`,
              }}
            >
              {/* Kaaba Silhouette / Emerald Arrow */}
              <div className="relative -top-3 flex flex-col items-center">
                <div className="px-2 py-0.5 rounded-md bg-amber-500 text-stone-950 font-bold text-[10px] shadow-md border border-amber-300">
                  الكعبة
                </div>
                <div className="w-0 h-0 border-l-[6px] border-l-transparent border-r-[6px] border-r-transparent border-t-[8px] border-t-amber-500" />
              </div>
            </div>
          </div>

          {/* Central Stationary Pointer / Phone Forward Line */}
          <div className="relative z-10 w-24 h-24 rounded-full bg-stone-900 border-2 border-emerald-500/50 shadow-inner flex flex-col items-center justify-center">
            <Navigation2
              className={`w-8 h-8 transition-colors ${
                isAligned ? 'text-emerald-400' : 'text-amber-400'
              }`}
              style={{
                transform: `rotate(${diffToQibla}deg)`,
                transition: 'transform 0.2s ease-out',
              }}
            />
            <span className="text-[11px] font-bold text-stone-300 mt-1 tabular-nums">
              {qiblaBearing}°
            </span>
          </div>

          {/* Fixed Top Indicator Arrow (Pointing forward from device) */}
          <div className="absolute -top-3 z-20 flex flex-col items-center">
            <div className="w-0 h-0 border-l-[8px] border-l-transparent border-r-[8px] border-r-transparent border-t-[10px] border-t-emerald-400" />
          </div>
        </div>

        {/* Readouts */}
        <div className="mt-8 grid grid-cols-2 sm:grid-cols-4 gap-3 w-full max-w-lg">
          <div className="p-3 rounded-xl bg-stone-950/70 border border-stone-800 text-center">
            <div className="text-[11px] text-stone-400">زاوية القبلة</div>
            <div className="text-base font-bold text-emerald-400 tabular-nums">{qiblaBearing}°</div>
          </div>

          <div className="p-3 rounded-xl bg-stone-950/70 border border-stone-800 text-center">
            <div className="text-[11px] text-stone-400">اتجاه جهازك</div>
            <div className="text-base font-bold text-stone-200 tabular-nums">{currentCompassHeading}°</div>
          </div>

          <div className="p-3 rounded-xl bg-stone-950/70 border border-stone-800 text-center">
            <div className="text-[11px] text-stone-400">المسافة للكعبة</div>
            <div className="text-base font-bold text-amber-300 tabular-nums">{distanceKm} كم</div>
          </div>

          <div className="p-3 rounded-xl bg-stone-950/70 border border-stone-800 text-center">
            <div className="text-[11px] text-stone-400">حالة المستشعر</div>
            <div className="text-xs font-semibold text-stone-300 mt-0.5">
              {hasCompassSensor ? 'مستشعر نشط' : 'وضع يدوي'}
            </div>
          </div>
        </div>

        {/* Manual adjustment slider if on desktop / no gyroscope */}
        {!hasCompassSensor && (
          <div className="mt-6 w-full max-w-sm space-y-2 text-right">
            <div className="flex items-center justify-between text-xs text-stone-400">
              <span>تدوير البوصلة يدوياً (لأجهزة الكمبيوتر):</span>
              <span className="tabular-nums font-bold text-emerald-400">{manualOffset}°</span>
            </div>
            <input
              type="range"
              min="0"
              max="359"
              value={manualOffset}
              onChange={(e) => setManualOffset(parseInt(e.target.value))}
              className="w-full accent-emerald-500 cursor-pointer"
            />
          </div>
        )}
      </div>

      {/* Guide on finding Qibla */}
      <div className="p-5 rounded-2xl bg-stone-900/60 border border-stone-800 space-y-3">
        <h4 className="text-sm font-bold text-emerald-400 flex items-center gap-2">
          <Sparkles className="w-4 h-4" />
          <span>إرشادات للحصول على أدق قراءة للبوصلة</span>
        </h4>
        <ul className="text-xs text-stone-300 space-y-2 leading-relaxed">
          <li className="flex items-start gap-2">
            <span className="text-emerald-400 font-bold">١.</span>
            <span>ضع هاتفك على سطح مستوٍ أفقياً واجعله موازياً للأرض.</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-emerald-400 font-bold">٢.</span>
            <span>ابتعد عن الأجسام المعدنية القوية، والمغناطيس، والأجهزة الكهربائية لتجنب التشويش المغناطيسي.</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-emerald-400 font-bold">٣.</span>
            <span>حرّك الجهاز برسم شكل (8) في الهواء لمعايرة مستشعر البوصلة عند الحاجة.</span>
          </li>
        </ul>
      </div>
    </div>
  );
};
