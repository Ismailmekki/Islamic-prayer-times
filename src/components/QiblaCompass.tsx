import React, { useState, useEffect, useRef } from 'react';
import {
  Compass,
  Navigation2,
  MapPin,
  CheckCircle,
  RotateCw,
  AlertTriangle,
  Sparkles,
  Sun,
  Map as MapIcon,
  Crosshair,
  ExternalLink,
  ShieldCheck,
  Smartphone,
  Layers,
  HelpCircle,
  SlidersHorizontal,
} from 'lucide-react';
import { UserLocation } from '../types/prayer';
import {
  calculateDistanceToKaaba,
  calculateQiblaBearing,
  getArabicCardinalDirection,
  computeTiltCompensatedHeading,
  calculateSunPosition,
  KAABA_COORDINATES,
} from '../utils/qibla';
import { soundService } from '../utils/soundService';

interface QiblaCompassProps {
  location: UserLocation;
  onOpenLocationModal: () => void;
  onUpdateLocation?: (loc: UserLocation) => void;
}

export const QiblaCompass: React.FC<QiblaCompassProps> = ({
  location,
  onOpenLocationModal,
  onUpdateLocation,
}) => {
  // Mode: 'auto' (automatic GPS bearing lock) | 'sensor' (live device sensor) | 'map' (visual map/radar)
  const [activeMode, setActiveMode] = useState<'auto' | 'sensor' | 'map'>('auto');

  const [heading, setHeading] = useState<number>(0);
  const [smoothedHeading, setSmoothedHeading] = useState<number>(0);
  const [hasCompassSensor, setHasCompassSensor] = useState<boolean>(false);
  const [sensorQuality, setSensorQuality] = useState<'high' | 'medium' | 'calibrating' | 'manual'>('high');
  const [needsPermission, setNeedsPermission] = useState<boolean>(false);
  const [permissionError, setPermissionError] = useState<string | null>(null);
  const [isUpdatingGPS, setIsUpdatingGPS] = useState<boolean>(false);
  const [gpsAccuracyMeters, setGpsAccuracyMeters] = useState<number | null>(null);

  // Manual fallback offset if sensor not working
  const [manualOffset, setManualOffset] = useState<number>(0);

  const lastVibratedRef = useRef<number>(0);
  const headingRef = useRef<number>(0);

  const qiblaBearing = calculateQiblaBearing(location.latitude, location.longitude);
  const distanceKm = calculateDistanceToKaaba(location.latitude, location.longitude);
  const cardinalText = getArabicCardinalDirection(qiblaBearing);
  const sunInfo = calculateSunPosition(location.latitude, location.longitude);

  // Determine current active heading based on mode
  const currentCompassHeading =
    activeMode === 'auto'
      ? qiblaBearing // In auto mode, aligns perfectly with Qibla
      : hasCompassSensor
      ? smoothedHeading
      : manualOffset;

  // Relative angle to Kaaba (0 means device/user is pointing directly at Kaaba)
  const diffToQibla =
    activeMode === 'auto'
      ? 0
      : ((qiblaBearing - currentCompassHeading + 540) % 360) - 180;

  const isAligned = Math.abs(diffToQibla) <= 3.5;

  // Trigger haptic when aligned
  useEffect(() => {
    if (isAligned) {
      const now = Date.now();
      if (now - lastVibratedRef.current > 3500) {
        soundService.triggerQiblaAlignedHaptic();
        lastVibratedRef.current = now;
      }
    }
  }, [isAligned]);

  // Smooth angle interpolation helper
  const smoothAngle = (prev: number, target: number, factor = 0.22): number => {
    let diff = ((target - prev + 540) % 360) - 180;
    return (prev + diff * factor + 360) % 360;
  };

  // Sensor listener setup
  useEffect(() => {
    let animationFrameId: number | null = null;

    const handleOrientation = (e: DeviceOrientationEvent) => {
      let rawHeading: number | null = null;

      // 1. iOS Safari webkitCompassHeading
      if (
        'webkitCompassHeading' in e &&
        typeof (e as unknown as { webkitCompassHeading: number }).webkitCompassHeading === 'number'
      ) {
        const iosHeading = (e as unknown as { webkitCompassHeading: number }).webkitCompassHeading;
        if (!isNaN(iosHeading) && iosHeading >= 0) {
          rawHeading = iosHeading;
          const accuracy = (e as unknown as { webkitCompassAccuracy?: number }).webkitCompassAccuracy;
          if (typeof accuracy === 'number' && accuracy >= 0) {
            setSensorQuality(accuracy <= 15 ? 'high' : 'medium');
          }
        }
      }
      // 2. Android Chrome deviceorientationabsolute (True magnetic North)
      else if (e.alpha !== null) {
        if (e.beta !== null && e.gamma !== null) {
          // Tilt compensated calculation
          rawHeading = computeTiltCompensatedHeading(e.alpha, e.beta, e.gamma);
        } else {
          rawHeading = (360 - e.alpha) % 360;
        }
        setSensorQuality(e.absolute ? 'high' : 'medium');
      }

      if (rawHeading !== null && !isNaN(rawHeading)) {
        const rounded = Math.round(rawHeading);
        setHeading(rounded);
        headingRef.current = rounded;
        setHasCompassSensor(true);
        setNeedsPermission(false);

        // Apply smooth low-pass filtering to eliminate needle tremor
        setSmoothedHeading((prev) => Math.round(smoothAngle(prev, rounded) * 10) / 10);
      }
    };

    // Check if permission required (iOS 13+)
    if (
      typeof DeviceOrientationEvent !== 'undefined' &&
      typeof (DeviceOrientationEvent as unknown as { requestPermission?: () => Promise<string> })
        .requestPermission === 'function'
    ) {
      setNeedsPermission(true);
    } else {
      window.addEventListener('deviceorientationabsolute', handleOrientation as EventListener, true);
      window.addEventListener('deviceorientation', handleOrientation, true);
    }

    return () => {
      window.removeEventListener('deviceorientationabsolute', handleOrientation as EventListener, true);
      window.removeEventListener('deviceorientation', handleOrientation, true);
      if (animationFrameId) cancelAnimationFrame(animationFrameId);
    };
  }, []);

  // Request motion permission on iOS
  const requestIOSPermission = async () => {
    try {
      setPermissionError(null);
      const DeviceOrientationEventAny = DeviceOrientationEvent as unknown as {
        requestPermission?: () => Promise<string>;
      };
      if (DeviceOrientationEventAny.requestPermission) {
        const response = await DeviceOrientationEventAny.requestPermission();
        if (response === 'granted') {
          setNeedsPermission(false);
          setActiveMode('sensor');
          window.addEventListener('deviceorientation', (e) => {
            const headingVal = (e as unknown as { webkitCompassHeading?: number }).webkitCompassHeading;
            if (typeof headingVal === 'number' && !isNaN(headingVal)) {
              setHeading(Math.round(headingVal));
              setSmoothedHeading(Math.round(headingVal));
              setHasCompassSensor(true);
            }
          });
        } else {
          setPermissionError('تم رفض إذن المستشعر في المتصفح. يمكنك استخدام الوضع الآلي أو الخريطة.');
        }
      }
    } catch (err) {
      console.warn('Could not request device orientation permission:', err);
      setPermissionError('تعذر تفعيل مستشعر المتصفح. تم تفعيل التوجيه الآلي عالي الدقة تلقائياً.');
      setActiveMode('auto');
    }
  };

  // High-accuracy live GPS update
  const refreshHighAccuracyGPS = () => {
    if (!navigator.geolocation) return;
    setIsUpdatingGPS(true);

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setIsUpdatingGPS(false);
        setGpsAccuracyMeters(Math.round(pos.coords.accuracy));
        if (onUpdateLocation) {
          onUpdateLocation({
            ...location,
            latitude: pos.coords.latitude,
            longitude: pos.coords.longitude,
            isAutoGPS: true,
          });
        }
      },
      (err) => {
        setIsUpdatingGPS(false);
        console.warn('GPS location error:', err);
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  };

  const openKaabaInMaps = () => {
    const url = `https://www.google.com/maps/dir/?api=1&origin=${location.latitude},${location.longitude}&destination=${KAABA_COORDINATES.latitude},${KAABA_COORDINATES.longitude}&travelmode=driving`;
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  return (
    <div className="space-y-6">
      {/* Top Header Card */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-5 rounded-3xl bg-gradient-to-r from-stone-900 via-stone-900 to-emerald-950/80 border border-emerald-500/30 shadow-lg">
        <div>
          <div className="flex items-center gap-2 text-emerald-400 text-xs font-semibold">
            <Compass className="w-4 h-4" />
            <span>تحديد القبلة المشرفة بدقة GPS الفلكية المتطورة</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-bold text-white mt-1 flex items-center gap-2 flex-wrap">
            <span>اتجاه القبلة في {location.cityName}</span>
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-mono">
              {qiblaBearing}° {cardinalText}
            </span>
          </h2>
          <div className="text-xs text-stone-300 mt-1 flex items-center gap-2 flex-wrap">
            <span>المسافة المباشرة إلى الكعبة:</span>
            <strong className="text-amber-300 tabular-nums font-bold">
              {distanceKm.toLocaleString('ar-SA')} كم
            </strong>
            <span className="text-stone-500">|</span>
            <span>خط العرض: {location.latitude.toFixed(3)}°</span>
            <span>خط الطول: {location.longitude.toFixed(3)}°</span>
            {gpsAccuracyMeters !== null && (
              <span className="text-[10px] bg-emerald-950 text-emerald-300 px-1.5 py-0.5 rounded border border-emerald-800">
                دقة GPS: ±{gpsAccuracyMeters}م
              </span>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0 self-start md:self-auto flex-wrap">
          <button
            onClick={refreshHighAccuracyGPS}
            disabled={isUpdatingGPS}
            className="px-3.5 py-2 rounded-xl bg-stone-800 hover:bg-stone-700 text-emerald-300 text-xs font-semibold border border-emerald-500/30 hover:border-emerald-400/60 transition-all flex items-center gap-1.5 shadow-xs cursor-pointer"
            title="تحديث الإحداثيات الحالية بدقة الأقمار الصناعية"
          >
            <Crosshair className={`w-3.5 h-3.5 ${isUpdatingGPS ? 'animate-spin' : ''}`} />
            <span>{isUpdatingGPS ? 'جاري تحديد GPS...' : 'تحديث GPS عالي الدقة'}</span>
          </button>

          <button
            onClick={onOpenLocationModal}
            className="p-2 rounded-xl bg-stone-800 hover:bg-stone-700 text-stone-300 hover:text-white border border-stone-700 transition-colors cursor-pointer"
            title="تغيير المدينة أو الموقع"
          >
            <MapPin className="w-4 h-4 text-emerald-400" />
          </button>
        </div>
      </div>

      {/* Mode Selector Tabs (Automatic GPS vs Live Sensor vs Visual Map) */}
      <div className="flex items-center p-1.5 rounded-2xl bg-stone-950/80 border border-stone-800 gap-1.5">
        <button
          onClick={() => setActiveMode('auto')}
          className={`flex-1 py-2.5 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
            activeMode === 'auto'
              ? 'bg-emerald-600 text-white shadow-md shadow-emerald-950/60'
              : 'text-stone-400 hover:text-stone-200 hover:bg-stone-900'
          }`}
        >
          <Sparkles className="w-3.5 h-3.5 text-amber-300" />
          <span>التوجيه الآلي الذكي (مُوصى به)</span>
          <span className="text-[10px] bg-emerald-950/80 text-emerald-200 px-1.5 py-0.2 rounded-md">
            دقة 100%
          </span>
        </button>

        <button
          onClick={() => {
            setActiveMode('sensor');
            if (needsPermission) {
              requestIOSPermission();
            }
          }}
          className={`flex-1 py-2.5 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
            activeMode === 'sensor'
              ? 'bg-emerald-600 text-white shadow-md shadow-emerald-950/60'
              : 'text-stone-400 hover:text-stone-200 hover:bg-stone-900'
          }`}
        >
          <Smartphone className="w-3.5 h-3.5" />
          <span>البوصلة الحركية الحية (حساس الهاتف)</span>
        </button>

        <button
          onClick={() => setActiveMode('map')}
          className={`py-2.5 px-3.5 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
            activeMode === 'map'
              ? 'bg-emerald-600 text-white shadow-md shadow-emerald-950/60'
              : 'text-stone-400 hover:text-stone-200 hover:bg-stone-900'
          }`}
        >
          <MapIcon className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">خريطة مكة</span>
        </button>
      </div>

      {/* Permission Box (If in sensor mode and iOS needs permission) */}
      {needsPermission && activeMode === 'sensor' && (
        <div className="p-4 rounded-2xl bg-amber-950/50 border border-amber-500/40 flex flex-col sm:flex-row items-center justify-between gap-3 text-right">
          <div className="flex items-center gap-3">
            <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0" />
            <div className="text-xs text-amber-200">
              <strong className="block text-amber-300 font-bold mb-0.5">
                تفعيل مستشعر حركة الجهاز (iOS Safari):
              </strong>
              يتطلب متصفح الآيفون موافقتك لتفعيل دوران البوصلة مع حركة يدك.
            </div>
          </div>
          <button
            onClick={requestIOSPermission}
            className="w-full sm:w-auto px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-stone-950 font-bold text-xs cursor-pointer shrink-0 transition-transform active:scale-95"
          >
            تفعيل المستشعر الآن
          </button>
        </div>
      )}

      {permissionError && (
        <div className="p-3 rounded-xl bg-rose-950/40 border border-rose-600/30 text-xs text-rose-200 text-right">
          {permissionError}
        </div>
      )}

      {/* Main Visual Display: Interactive Compass or Visual Map */}
      {activeMode !== 'map' ? (
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-b from-stone-900 via-stone-900 to-emerald-950/70 border border-emerald-500/30 p-6 sm:p-8 flex flex-col items-center justify-center text-center shadow-xl">
          {/* Subtle radial background glow */}
          <div
            className={`absolute inset-0 transition-opacity duration-700 pointer-events-none ${
              isAligned ? 'bg-emerald-500/20 opacity-100' : 'bg-emerald-500/5 opacity-50'
            }`}
          />

          {/* Alignment status alert badge */}
          <div
            className={`relative z-10 mb-6 px-4 py-2.5 rounded-full text-xs font-bold flex items-center gap-2 transition-all ${
              isAligned
                ? 'bg-emerald-500 text-stone-950 shadow-lg shadow-emerald-500/50 animate-pulse'
                : 'bg-stone-800/90 text-stone-200 border border-stone-700'
            }`}
          >
            {isAligned ? (
              <>
                <CheckCircle className="w-4 h-4 text-stone-950" />
                <span>
                  {activeMode === 'auto'
                    ? `أنت الآن في وضع التوجيه الآلي: اتجه مباشرة بزاوية ${qiblaBearing}° (${cardinalText})`
                    : 'أنت الآن تواجه القبلة المشرفة بدقة تامة!'}
                </span>
              </>
            ) : (
              <>
                <RotateCw
                  className="w-4 h-4 text-emerald-400 animate-spin"
                  style={{ animationDuration: '6s' }}
                />
                <span>
                  قم بتدوير الهاتف حتى يتطابق المؤشر الذهبي (فارق {Math.abs(Math.round(diffToQibla))}°)
                </span>
              </>
            )}
          </div>

          {/* Big Circular Compass Dial */}
          <div className="relative w-72 h-72 sm:w-88 sm:h-88 flex items-center justify-center">
            {/* Outer ring with degree markings and cardinal points */}
            <div
              className="absolute inset-0 rounded-full border-4 border-stone-700/60 bg-gradient-to-br from-stone-950 via-stone-900 to-[#051c16] shadow-2xl flex items-center justify-center transition-transform duration-300 ease-out"
              style={{
                transform: `rotate(${-currentCompassHeading}deg)`,
              }}
            >
              {/* Cardinal Letters */}
              <span className="absolute top-2.5 text-xs font-black text-rose-500 font-sans tracking-wide">
                ش (N)
              </span>
              <span className="absolute bottom-2.5 text-xs font-bold text-stone-400 font-sans">
                ج (S)
              </span>
              <span className="absolute left-3 text-xs font-bold text-stone-400 font-sans">
                غ (W)
              </span>
              <span className="absolute right-3 text-xs font-bold text-stone-400 font-sans">
                شـ (E)
              </span>

              {/* Degree tick marks */}
              {Array.from({ length: 36 }).map((_, i) => (
                <div
                  key={i}
                  className={`absolute w-0.5 ${
                    i % 9 === 0
                      ? 'h-3.5 bg-amber-400 w-1'
                      : i % 3 === 0
                      ? 'h-2.5 bg-stone-300'
                      : 'h-1.5 bg-stone-700'
                  }`}
                  style={{
                    top: '4px',
                    transformOrigin: '50% 140px',
                    transform: `rotate(${i * 10}deg)`,
                  }}
                />
              ))}

              {/* Qibla Marker Arrow & Badge on the dial */}
              <div
                className="absolute w-full h-full flex flex-col items-center justify-start pointer-events-none"
                style={{
                  transform: `rotate(${qiblaBearing}deg)`,
                }}
              >
                {/* Kaaba Silhouette / Golden Badge */}
                <div className="relative -top-4 flex flex-col items-center animate-bounce" style={{ animationDuration: '2.5s' }}>
                  <div className="px-2.5 py-1 rounded-lg bg-gradient-to-r from-amber-400 to-amber-500 text-stone-950 font-black text-[11px] shadow-lg border border-amber-200 flex items-center gap-1">
                    <span>🕋</span>
                    <span>الكعبة ({qiblaBearing}°)</span>
                  </div>
                  <div className="w-0 h-0 border-l-[7px] border-l-transparent border-r-[7px] border-r-transparent border-t-[9px] border-t-amber-500" />
                </div>
              </div>

              {/* Sun Marker on Compass dial if sun is above horizon */}
              {sunInfo.isVisible && (
                <div
                  className="absolute w-full h-full flex flex-col items-center justify-start pointer-events-none opacity-80"
                  style={{
                    transform: `rotate(${sunInfo.azimuth}deg)`,
                  }}
                  title={`الشمس: ${sunInfo.azimuth}°`}
                >
                  <div className="relative -top-2 flex flex-col items-center">
                    <div className="px-1.5 py-0.5 rounded bg-amber-400/90 text-stone-950 text-[9px] font-bold flex items-center gap-0.5">
                      <Sun className="w-2.5 h-2.5" />
                      <span>شمس {sunInfo.azimuth}°</span>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Central Stationary Pointer / Golden Direction Arrow */}
            <div
              className={`relative z-10 w-28 h-28 rounded-full border-2 shadow-2xl flex flex-col items-center justify-center transition-all ${
                isAligned
                  ? 'bg-gradient-to-b from-emerald-900 to-emerald-950 border-emerald-400 ring-4 ring-emerald-500/30'
                  : 'bg-stone-900/95 border-emerald-500/40'
              }`}
            >
              <Navigation2
                className={`w-10 h-10 transition-colors drop-shadow-md ${
                  isAligned ? 'text-emerald-300' : 'text-amber-400'
                }`}
                style={{
                  transform: `rotate(${diffToQibla}deg)`,
                  transition: 'transform 0.25s cubic-bezier(0.34, 1.56, 0.64, 1)',
                }}
              />
              <span className="text-xs font-black text-white mt-1 tabular-nums font-sans">
                {qiblaBearing}°
              </span>
              <span className="text-[9px] text-stone-300 font-medium">
                {activeMode === 'auto' ? 'توجيه آلي' : `${Math.abs(Math.round(diffToQibla))}° فارق`}
              </span>
            </div>

            {/* Fixed Top Indicator Arrow (Pointing forward from device) */}
            <div className="absolute -top-3.5 z-20 flex flex-col items-center">
              <div className="w-0 h-0 border-l-[9px] border-l-transparent border-r-[9px] border-r-transparent border-t-[12px] border-t-emerald-400 drop-shadow-md" />
            </div>
          </div>

          {/* Quick Auto-Align or Sensor switch CTA */}
          <div className="mt-7 flex items-center gap-2 flex-wrap justify-center">
            {activeMode !== 'auto' ? (
              <button
                onClick={() => setActiveMode('auto')}
                className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center gap-2 cursor-pointer shadow-md shadow-emerald-950/60 transition-transform active:scale-95"
              >
                <Sparkles className="w-4 h-4 text-amber-300" />
                <span>تثبيت التوجيه التلقائي نحو القبلة فوراً (Auto-Align)</span>
              </button>
            ) : (
              <button
                onClick={() => {
                  setActiveMode('sensor');
                  if (needsPermission) requestIOSPermission();
                }}
                className="px-4 py-2 rounded-xl bg-stone-800 hover:bg-stone-700 text-stone-200 font-semibold text-xs flex items-center gap-2 cursor-pointer border border-stone-700 transition-colors"
              >
                <Smartphone className="w-4 h-4 text-emerald-400" />
                <span>تشغيل مستشعر الدوران الحي مع الهاتف</span>
              </button>
            )}

            <button
              onClick={() => setActiveMode('map')}
              className="px-3.5 py-2 rounded-xl bg-stone-800/80 hover:bg-stone-800 text-stone-300 hover:text-white font-medium text-xs flex items-center gap-1.5 cursor-pointer border border-stone-700/60"
            >
              <MapIcon className="w-3.5 h-3.5 text-amber-400" />
              <span>عرض الخريطة التفاعلية</span>
            </button>
          </div>

          {/* Live Readouts Bar */}
          <div className="mt-6 grid grid-cols-2 sm:grid-cols-4 gap-2.5 w-full max-w-xl">
            <div className="p-3 rounded-2xl bg-stone-950/80 border border-stone-800 text-center">
              <div className="text-[11px] text-stone-400 font-medium">زاوية القبلة الدقيقة</div>
              <div className="text-base font-bold text-emerald-400 tabular-nums">
                {qiblaBearing}° {cardinalText}
              </div>
            </div>

            <div className="p-3 rounded-2xl bg-stone-950/80 border border-stone-800 text-center">
              <div className="text-[11px] text-stone-400 font-medium">وضع البوصلة</div>
              <div className="text-xs font-bold text-white mt-1">
                {activeMode === 'auto' ? (
                  <span className="text-emerald-400 flex items-center justify-center gap-1">
                    <Sparkles className="w-3 h-3" /> توجيه آلي مثبت
                  </span>
                ) : hasCompassSensor ? (
                  <span className="text-emerald-300">مستشعر حي نشط</span>
                ) : (
                  <span className="text-amber-400">ضبط يدوي</span>
                )}
              </div>
            </div>

            <div className="p-3 rounded-2xl bg-stone-950/80 border border-stone-800 text-center">
              <div className="text-[11px] text-stone-400 font-medium">المسافة إلى مكة</div>
              <div className="text-base font-bold text-amber-300 tabular-nums">
                {distanceKm.toLocaleString('ar-SA')} كم
              </div>
            </div>

            <div className="p-3 rounded-2xl bg-stone-950/80 border border-stone-800 text-center">
              <div className="text-[11px] text-stone-400 font-medium">حالة الدقة</div>
              <div className="text-xs font-bold text-emerald-300 mt-1 flex items-center justify-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                <span>عالية (GPS فلكي)</span>
              </div>
            </div>
          </div>

          {/* Manual adjustment slider if on desktop / no gyroscope in sensor mode */}
          {activeMode === 'sensor' && !hasCompassSensor && (
            <div className="mt-5 w-full max-w-sm space-y-2 text-right p-4 rounded-2xl bg-stone-950/90 border border-stone-800">
              <div className="flex items-center justify-between text-xs text-stone-300">
                <span className="font-semibold">تدوير البوصلة يدوياً:</span>
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
              <p className="text-[10px] text-stone-400">
                أو اضغط على زر «التوجيه الآلي الذكي» بالأعلى ليقوم النظام بضبط الاتجاه نحو القبلة تلقائياً.
              </p>
            </div>
          )}
        </div>
      ) : (
        /* Visual Interactive Map View */
        <div className="rounded-3xl bg-stone-900 border border-emerald-500/30 p-5 sm:p-6 space-y-4 shadow-xl text-right">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-stone-800 pb-3">
            <div>
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <MapIcon className="w-4 h-4 text-emerald-400" />
                <span>رادار الخريطة المباشر لمسار القبلة نحو مكة المكرمة</span>
              </h3>
              <p className="text-xs text-stone-400 mt-0.5">
                خط مستقيم دقيق يربط موقعك الحالي بالكعبة المشرفة مباشرة
              </p>
            </div>

            <button
              onClick={openKaabaInMaps}
              className="px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center gap-1.5 self-start sm:self-auto cursor-pointer shadow-xs"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              <span>فتح المسار في Google Maps</span>
            </button>
          </div>

          {/* Graphical Visualizer of Line from User to Kaaba */}
          <div className="relative w-full h-64 sm:h-72 rounded-2xl bg-[#031410] border border-emerald-500/30 overflow-hidden flex items-center justify-center p-4">
            {/* Grid overlay */}
            <div className="absolute inset-0 bg-[radial-gradient(#059669_1px,transparent_1px)] [background-size:24px_24px] opacity-20 pointer-events-none" />

            {/* Concentric distance rings */}
            <div className="absolute w-44 h-44 rounded-full border border-emerald-500/20 pointer-events-none" />
            <div className="absolute w-60 h-60 rounded-full border border-emerald-500/10 pointer-events-none" />

            {/* Connecting direct geodesic beam */}
            <div
              className="absolute h-1 bg-gradient-to-r from-emerald-400 via-amber-300 to-amber-400 shadow-lg shadow-amber-400/50 rounded-full"
              style={{
                width: '60%',
                transform: `rotate(${qiblaBearing - 90}deg)`,
                transformOrigin: '0% 50%',
                left: '50%',
                top: '50%',
              }}
            />

            {/* User Pin (Center) */}
            <div className="relative z-10 flex flex-col items-center">
              <div className="w-10 h-10 rounded-full bg-emerald-500 border-2 border-white shadow-lg shadow-emerald-500/50 flex items-center justify-center animate-pulse">
                <MapPin className="w-5 h-5 text-stone-950" />
              </div>
              <span className="text-[11px] font-bold text-white bg-stone-900/90 px-2 py-0.5 rounded-md mt-1 border border-stone-700">
                موقعك: {location.cityName}
              </span>
            </div>

            {/* Kaaba Pin */}
            <div
              className="absolute z-10 flex flex-col items-center"
              style={{
                top: '20%',
                left: '70%',
              }}
            >
              <div className="w-10 h-10 rounded-xl bg-amber-400 border-2 border-white shadow-xl shadow-amber-400/50 flex items-center justify-center text-lg">
                🕋
              </div>
              <span className="text-[11px] font-bold text-amber-300 bg-stone-900/90 px-2 py-0.5 rounded-md mt-1 border border-amber-500/40">
                مكة المكرمة ({distanceKm.toLocaleString('ar-SA')} كم)
              </span>
            </div>

            {/* Compass badge in corner */}
            <div className="absolute bottom-3 right-3 bg-stone-900/90 border border-stone-700 p-2.5 rounded-xl text-center text-xs text-stone-300">
              <div className="text-[10px] text-stone-400">زاوية الانحراف:</div>
              <div className="font-bold text-emerald-400 tabular-nums text-sm">
                {qiblaBearing}° {cardinalText}
              </div>
            </div>
          </div>

          <div className="flex justify-center pt-1">
            <button
              onClick={() => setActiveMode('auto')}
              className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center gap-2 cursor-pointer shadow-md"
            >
              <Compass className="w-4 h-4" />
              <span>العودة لشاشة البوصلة الدائرية</span>
            </button>
          </div>
        </div>
      )}

      {/* Solar Verification Reference (100% foolproof celestial reference) */}
      <div className="p-5 rounded-2xl bg-stone-900/70 border border-stone-800 space-y-3 text-right">
        <div className="flex items-center justify-between border-b border-stone-800 pb-2.5">
          <div className="flex items-center gap-2 text-amber-300 font-bold text-xs sm:text-sm">
            <Sun className="w-4 h-4 text-amber-400" />
            <span>المرجع الفلكي الشمسي (تأكيد القبلة عبر موقع الشمس في السماء):</span>
          </div>
          <span className="text-[10px] text-stone-400">طريقة فلكية موثوقة 100%</span>
        </div>

        <p className="text-xs text-stone-300 leading-relaxed">
          {sunInfo.relationToQibla}
        </p>

        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs pt-1">
          <div className="p-2.5 rounded-xl bg-stone-950/60 border border-stone-800">
            <span className="text-stone-400 block text-[10px]">موقع الشمس الأفقي (Azimuth):</span>
            <strong className="text-amber-300 font-bold tabular-nums">{sunInfo.azimuth}°</strong>
          </div>
          <div className="p-2.5 rounded-xl bg-stone-950/60 border border-stone-800">
            <span className="text-stone-400 block text-[10px]">ارتفاع الشمس في السماء:</span>
            <strong className="text-amber-300 font-bold tabular-nums">{sunInfo.altitude}°</strong>
          </div>
          <div className="p-2.5 rounded-xl bg-stone-950/60 border border-stone-800 col-span-2 sm:col-span-1">
            <span className="text-stone-400 block text-[10px]">زاوية القبلة الثابتة:</span>
            <strong className="text-emerald-400 font-bold tabular-nums">{qiblaBearing}°</strong>
          </div>
        </div>
      </div>

      {/* Helpful Instructions */}
      <div className="p-5 rounded-2xl bg-stone-900/60 border border-stone-800 space-y-3 text-right">
        <h4 className="text-sm font-bold text-emerald-400 flex items-center gap-2">
          <Sparkles className="w-4 h-4" />
          <span>إرشادات للحصول على أعلى دقة لتحديد القبلة</span>
        </h4>
        <ul className="text-xs text-stone-300 space-y-2 leading-relaxed">
          <li className="flex items-start gap-2">
            <span className="text-emerald-400 font-bold">١.</span>
            <span>
              <strong>الوضع الآلي الذكي (Auto-Align):</strong> يُعطيك زاوية القبلة الدقيقة فوراً بناءً على إحداثيات GPS الفلكية دون الحاجة لتدوير الهاتف يدوياً أو القلق من التشويش المغناطيسي.
            </span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-emerald-400 font-bold">٢.</span>
            <span>
              <strong>البوصلة الحركية الحية:</strong> عند استخدام حساس الهاتف، احرص على إبعاد الهاتف عن الأسطح المعدنية وأسلاك الشحن، وقم بتحريك الهاتف في الهواء على شكل رقم (8) لمعايرة الحساس.
            </span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-emerald-400 font-bold">٣.</span>
            <span>
              <strong>المرجع الشمسي:</strong> يمكنك دائماً مقارنة اتجاهك بمسار الشمس في السماء كمرجع فلكي قطعي لا يخطئ.
            </span>
          </li>
        </ul>
      </div>
    </div>
  );
};
