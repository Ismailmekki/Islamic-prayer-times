import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Compass,
  MapPin,
  CheckCircle2,
  RotateCw,
  Sparkles,
  Volume2,
  Navigation,
  Hand,
  Check,
} from 'lucide-react';
import { UserLocation } from '../types/prayer';
import {
  calculateDistanceToKaaba,
  calculateQiblaBearing,
  getArabicCardinalDirection,
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
  // Device heading in degrees (0 = North)
  const [deviceHeading, setDeviceHeading] = useState<number>(0);
  const [hasCompassSensor, setHasCompassSensor] = useState<boolean>(false);
  const [needsIOSPermission, setNeedsIOSPermission] = useState<boolean>(false);
  const [isTestRotating, setIsTestRotating] = useState<boolean>(false);

  // Manual interactive touch drag offset
  const [manualOffset, setManualOffset] = useState<number>(0);
  const isDraggingRef = useRef<boolean>(false);
  const touchStartAngleRef = useRef<number>(0);
  const compassDialRef = useRef<HTMLDivElement | null>(null);

  const lastVibrateRef = useRef<number>(0);
  const currentHeadingRef = useRef<number>(0);

  // Exact geographical calculations
  const qiblaBearing = calculateQiblaBearing(location.latitude, location.longitude);
  const distanceKm = calculateDistanceToKaaba(location.latitude, location.longitude);
  const cardinalText = getArabicCardinalDirection(qiblaBearing);

  // Effective current heading including any manual test drag
  const effectiveHeading = (deviceHeading + manualOffset + 360) % 360;

  // Relative angle for arrow on screen (points towards Qibla relative to top of phone)
  const relativeAngle = (qiblaBearing - effectiveHeading + 360) % 360;

  // Check if user is pointing towards Qibla (tolerance of ±7 degrees)
  const angleDiff = Math.abs(relativeAngle > 180 ? 360 - relativeAngle : relativeAngle);
  const isAligned = angleDiff <= 7;

  // Gentle haptic feedback and tone when aligned
  const triggerHaptic = useCallback(() => {
    const now = Date.now();
    if (now - lastVibrateRef.current > 2000) {
      lastVibrateRef.current = now;
      if (typeof navigator !== 'undefined' && navigator.vibrate) {
        try {
          navigator.vibrate([150, 100, 250]);
        } catch {}
      }
      soundService.playTasbeehClick();
    }
  }, []);

  useEffect(() => {
    if (isAligned) {
      triggerHaptic();
    }
  }, [isAligned, triggerHaptic]);

  // Smooth angle interpolation filter (circular shortest path)
  const applySmoothedHeading = useCallback((rawHeading: number) => {
    const prev = currentHeadingRef.current;
    let diff = (rawHeading - prev + 540) % 360 - 180;
    // Low-pass filter for smooth needle movement without lag
    const smoothed = (prev + diff * 0.35 + 360) % 360;
    currentHeadingRef.current = smoothed;
    setDeviceHeading(Math.round(smoothed));
  }, []);

  // Shared event listener for orientation
  const handleOrientation = useCallback((e: DeviceOrientationEvent) => {
    let heading: number | null = null;

    // 1. iOS Safari provides webkitCompassHeading directly
    const eventWithCompass = e as unknown as { webkitCompassHeading?: number };
    if (
      typeof eventWithCompass.webkitCompassHeading === 'number' &&
      eventWithCompass.webkitCompassHeading >= 0
    ) {
      heading = eventWithCompass.webkitCompassHeading;
    } else if (e.alpha !== null && typeof e.alpha === 'number') {
      // 2. Android Chrome provides alpha (degrees from North)
      // On Android absolute orientation: heading = (360 - alpha) % 360
      heading = (360 - e.alpha) % 360;
    }

    if (heading !== null && !isNaN(heading)) {
      applySmoothedHeading(heading);
      setHasCompassSensor(true);
      setNeedsIOSPermission(false);
    }
  }, [applySmoothedHeading]);

  // Start listening to physical sensors
  const startCompassListeners = useCallback(() => {
    if (typeof window === 'undefined') return;

    // Check if iOS 13+ requires user permission gesture
    const DeviceOrientation = window.DeviceOrientationEvent as unknown as {
      requestPermission?: () => Promise<'granted' | 'denied'>;
    };

    if (DeviceOrientation && typeof DeviceOrientation.requestPermission === 'function') {
      setNeedsIOSPermission(true);
    }

    // Attach listeners on both standards
    window.addEventListener('deviceorientationabsolute', handleOrientation as EventListener, true);
    window.addEventListener('deviceorientation', handleOrientation, true);
  }, [handleOrientation]);

  useEffect(() => {
    startCompassListeners();
    return () => {
      window.removeEventListener('deviceorientationabsolute', handleOrientation as EventListener, true);
      window.removeEventListener('deviceorientation', handleOrientation, true);
    };
  }, [startCompassListeners, handleOrientation]);

  // Request iOS motion sensor permission and attach listeners immediately
  const handleRequestIOSPermission = async () => {
    try {
      const DeviceOrientation = window.DeviceOrientationEvent as unknown as {
        requestPermission?: () => Promise<'granted' | 'denied'>;
      };

      if (DeviceOrientation && typeof DeviceOrientation.requestPermission === 'function') {
        const response = await DeviceOrientation.requestPermission();
        if (response === 'granted') {
          setNeedsIOSPermission(false);
          setHasCompassSensor(true);
          window.addEventListener('deviceorientation', handleOrientation, true);
        }
      }
    } catch (e) {
      console.warn('Motion permission request error:', e);
    }
  };

  // Test simulation animation: Rotates the compass through 360 degrees smoothly to demonstrate movement
  const handleTestRotation = () => {
    if (isTestRotating) return;
    setIsTestRotating(true);
    let step = 0;
    const totalSteps = 60;
    const initialHeading = deviceHeading;
    const targetHeading = Math.round(qiblaBearing); // Rotate right into the Qibla!

    const timer = setInterval(() => {
      step++;
      const progress = step / totalSteps;
      // Ease out cubic
      const ease = 1 - Math.pow(1 - progress, 3);
      const currentSimulated = (initialHeading + (targetHeading - initialHeading + 360) * ease) % 360;

      setDeviceHeading(Math.round(currentSimulated));

      if (step >= totalSteps) {
        clearInterval(timer);
        setDeviceHeading(targetHeading);
        setIsTestRotating(false);
      }
    }, 30);
  };

  // Touch Drag to rotate compass with finger manually
  const getAngleFromEvent = (clientX: number, clientY: number): number => {
    if (!compassDialRef.current) return 0;
    const rect = compassDialRef.current.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    const x = clientX - centerX;
    const y = clientY - centerY;
    // Angle in degrees clockwise from 12 o'clock
    const rad = Math.atan2(y, x);
    let deg = (rad * 180) / Math.PI + 90;
    if (deg < 0) deg += 360;
    return deg;
  };

  const handleTouchStart = (e: React.TouchEvent | React.MouseEvent) => {
    isDraggingRef.current = true;
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
    touchStartAngleRef.current = getAngleFromEvent(clientX, clientY) - manualOffset;
  };

  const handleTouchMove = (e: React.TouchEvent | React.MouseEvent) => {
    if (!isDraggingRef.current) return;
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
    const currentAngle = getAngleFromEvent(clientX, clientY);
    const newOffset = (currentAngle - touchStartAngleRef.current + 360) % 360;
    setManualOffset(Math.round(newOffset));
  };

  const handleTouchEnd = () => {
    isDraggingRef.current = false;
  };

  return (
    <div dir="rtl" className="space-y-5 text-right font-sans max-w-xl mx-auto select-none">
      {/* Top Location Bar */}
      <div className="rounded-3xl bg-stone-900/90 border border-emerald-500/30 p-4 sm:p-5 shadow-lg flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-emerald-950 text-emerald-400 border border-emerald-500/40 flex items-center justify-center shrink-0 shadow-inner">
            <MapPin className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xl font-black text-white font-quran">
                {location.cityName}
              </span>
              <span className="text-xs text-stone-400">({location.countryName})</span>
            </div>
            <p className="text-xs text-stone-300 mt-0.5">
              زاوية القبلة: <strong className="text-emerald-300 font-mono text-sm">{Math.round(qiblaBearing)}°</strong> ({cardinalText})
            </p>
          </div>
        </div>

        <button
          onClick={onOpenLocationModal}
          className="px-4 py-2.5 rounded-xl bg-stone-800 hover:bg-stone-700 text-stone-200 border border-stone-700 text-xs sm:text-sm font-bold transition-colors cursor-pointer"
        >
          تغيير المدينة 🏙
        </button>
      </div>

      {/* Main Qibla Status Banner */}
      <div
        className={`p-5 sm:p-6 rounded-3xl border-2 transition-all duration-300 shadow-xl text-center space-y-1.5 ${
          isAligned
            ? 'bg-gradient-to-b from-emerald-900/90 via-emerald-950 to-stone-950 border-emerald-400 shadow-emerald-500/30 ring-2 ring-emerald-400'
            : 'bg-stone-900/90 border-stone-800'
        }`}
      >
        {isAligned ? (
          <div className="space-y-1 animate-in zoom-in-95 duration-200">
            <div className="inline-flex items-center gap-2 text-emerald-300 text-sm font-black bg-emerald-500/20 px-4 py-1 rounded-full border border-emerald-400/50">
              <CheckCircle2 className="w-5 h-5 text-emerald-300" />
              <span>أنت الآن باتجاه القبلة مباشرة 100% 🕋</span>
            </div>
            <h3 className="text-2xl sm:text-3xl font-black text-white font-quran mt-2">
              وجّه وجهك شطر المسجد الحرام
            </h3>
            <p className="text-xs text-emerald-200">
              صلاتك صحيحة ومقبولة بإذن الله · الله أكبر
            </p>
          </div>
        ) : (
          <div className="space-y-1">
            <span className="text-xs text-stone-400 font-bold">
              {hasCompassSensor ? 'أدر هاتفك ببطء حتى يضيء السهم بالأخضر' : 'حركة البوصلة جاهزة · استدر بهاتفك'}
            </span>
            <div className="text-2xl sm:text-3xl font-black text-white font-quran">
              السهم يشير مباشرة إلى الكعبة المشرفة 🕋
            </div>
            <p className="text-xs text-stone-300">
              المسافة إلى مكة المكرمة: <strong className="text-amber-300 font-mono">{distanceKm.toLocaleString('ar-SA')} كم</strong>
            </p>
          </div>
        )}
      </div>

      {/* Sensor Movement Status Pill & Test Button */}
      <div className="flex items-center justify-between px-2 text-xs">
        <div className="flex items-center gap-2">
          <span
            className={`w-2.5 h-2.5 rounded-full ${
              hasCompassSensor ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'
            }`}
          />
          <span className="text-stone-300 font-semibold">
            {hasCompassSensor
              ? `مستشعر البوصلة يتحرك حياً (زاوية الهاتف: ${effectiveHeading}°)`
              : `البوصلة مضبوطة فلكياً على ${Math.round(qiblaBearing)}°`}
          </span>
        </div>

        {/* Quick Rotation Test Button */}
        <button
          onClick={handleTestRotation}
          disabled={isTestRotating}
          className="px-3 py-1.5 rounded-xl bg-stone-800 hover:bg-stone-700 text-emerald-300 border border-emerald-500/30 text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
          title="اختبار حركة دوران البوصلة نحو القبلة"
        >
          <RotateCw className={`w-3.5 h-3.5 ${isTestRotating ? 'animate-spin' : ''}`} />
          <span>{isTestRotating ? 'جاري الدوران...' : 'تجربة الدوران 🔄'}</span>
        </button>
      </div>

      {/* Large Clear Visual Compass Dial (Supports Touch Drag & Sensor) */}
      <div className="relative flex flex-col items-center justify-center p-3">
        {/* The Outer Dial Circle */}
        <div
          ref={compassDialRef}
          onMouseDown={handleTouchStart}
          onMouseMove={handleTouchMove}
          onMouseUp={handleTouchEnd}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
          className={`relative w-72 h-72 sm:w-84 sm:h-84 rounded-full border-4 transition-all duration-300 flex items-center justify-center shadow-2xl cursor-grab active:cursor-grabbing touch-none ${
            isAligned
              ? 'border-emerald-400 bg-emerald-950/40 shadow-emerald-500/30 ring-8 ring-emerald-500/20'
              : 'border-stone-800 bg-stone-950/90 shadow-black/80'
          }`}
        >
          {/* Degree Ring Marks */}
          <div className="absolute inset-2 rounded-full border border-stone-800/80 pointer-events-none" />
          <div className="absolute inset-6 rounded-full border border-stone-900 pointer-events-none" />

          {/* Cardinal Labels: North, South, East, West */}
          <span className="absolute top-3 font-bold text-sm text-amber-300 pointer-events-none">شمال (N)</span>
          <span className="absolute bottom-3 font-bold text-sm text-stone-500 pointer-events-none">جنوب (S)</span>
          <span className="absolute left-3 font-bold text-sm text-stone-500 pointer-events-none">غرب (W)</span>
          <span className="absolute right-3 font-bold text-sm text-stone-500 pointer-events-none">شرق (E)</span>

          {/* Rotating Qibla Arrow */}
          <div
            className="absolute inset-0 flex items-center justify-center transition-transform duration-200 ease-out pointer-events-none"
            style={{
              transform: `rotate(${relativeAngle}deg)`,
            }}
          >
            {/* The Arrow Container pointing Upwards */}
            <div className="relative flex flex-col items-center justify-start h-full pt-4">
              {/* Kaaba Badge at the tip of the arrow */}
              <div
                className={`flex flex-col items-center justify-center p-2 rounded-2xl border shadow-xl transition-all ${
                  isAligned
                    ? 'bg-emerald-500 text-stone-950 border-white ring-4 ring-emerald-400 scale-110'
                    : 'bg-stone-900 text-white border-amber-400/60 shadow-amber-950/50'
                }`}
              >
                <span className="text-2xl">🕋</span>
                <span className="text-[10px] font-black mt-0.5 whitespace-nowrap">الكعبة المشرفة</span>
              </div>

              {/* Arrow Line Body */}
              <div
                className={`w-1.5 h-20 rounded-full mt-1 transition-colors ${
                  isAligned
                    ? 'bg-gradient-to-b from-emerald-400 to-teal-300 shadow-md shadow-emerald-400'
                    : 'bg-gradient-to-b from-amber-400 to-emerald-600'
                }`}
              />
            </div>
          </div>

          {/* Center Hub */}
          <div className="w-14 h-14 rounded-full bg-stone-900 border-2 border-emerald-500/50 shadow-xl flex items-center justify-center z-10 pointer-events-none">
            <Navigation
              className={`w-6 h-6 transition-transform duration-200 ${
                isAligned ? 'text-emerald-400 fill-emerald-400' : 'text-amber-400'
              }`}
              style={{
                transform: `rotate(${relativeAngle}deg)`,
              }}
            />
          </div>
        </div>

        <p className="text-[11px] text-stone-400 mt-2 text-center">
          💡 يمكنك تحريك الهاتف بيدك، أو لمس وتدوير القرص بالأصبع للتحقق من الاتجاه
        </p>
      </div>

      {/* Permission Button for iOS (iPhone) if motion not authorized */}
      {needsIOSPermission && (
        <div className="text-center">
          <button
            onClick={handleRequestIOSPermission}
            className="w-full py-4 px-6 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-500 hover:from-emerald-500 text-white font-black text-sm sm:text-base shadow-xl shadow-emerald-950 active:scale-95 transition-transform flex items-center justify-center gap-2 cursor-pointer ring-2 ring-emerald-400/30"
          >
            <Compass className="w-5 h-5" />
            <span>اضغط هنا لتفعيل حركة البوصلة في الآيفون 🧭</span>
          </button>
        </div>
      )}

      {/* Simple 2-Line Senior-Friendly Instructions */}
      <div className="p-4 sm:p-5 rounded-2xl bg-stone-900/70 border border-stone-800 text-stone-300 text-xs sm:text-sm leading-relaxed space-y-2">
        <p className="font-bold text-white flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-amber-400" />
          <span>طريقة التوجيه البسيطة لكبار السن:</span>
        </p>
        <ol className="list-decimal list-inside space-y-1.5 text-stone-300">
          <li>امسك هاتفك بيدك بشكل أفقي ومستوٍ (مثل الصحن).</li>
          <li>استدر بجسمك ببطء حتى يشير السهم ذو الكعبة 🕋 إلى الأمام مباشرة.</li>
          <li>عندما تتجه نحو الكعبة بدقة، ستضيء الشاشة بالأخضر مع اهتزاز خفيف ونغمة تأكيد.</li>
        </ol>
      </div>
    </div>
  );
};
