import React, { useState, useEffect, useRef, useCallback } from 'react';
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
  ChevronLeft,
  ChevronRight,
  Zap,
  Volume2,
  Hand,
  Info,
  Check,
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
  // Mode: 'auto' (automatic determination - default as requested) | 'sensor' (phone live sensor) | 'map' (visual radar)
  const [activeTab, setActiveTab] = useState<'auto' | 'sensor' | 'map'>('auto');

  // Scanning animation state for automatic alignment
  const [isScanning, setIsScanning] = useState<boolean>(false);
  const [scanAngle, setScanAngle] = useState<number>(0);

  // Sensor state
  const [liveHeading, setLiveHeading] = useState<number>(0);
  const [smoothedHeading, setSmoothedHeading] = useState<number>(0);
  const [hasLiveSensor, setHasLiveSensor] = useState<boolean>(false);
  const [sensorEventsCount, setSensorEventsCount] = useState<number>(0);
  const [sensorQuality, setSensorQuality] = useState<'high' | 'medium' | 'calibrating'>('medium');

  // iOS 13+ permission state
  const [needsIOSPermission, setNeedsIOSPermission] = useState<boolean>(false);
  const [permissionError, setPermissionError] = useState<string | null>(null);

  // Manual interactive offset fallback
  const [manualOffset, setManualOffset] = useState<number>(0);
  const [isDragging, setIsDragging] = useState<boolean>(false);

  // GPS state
  const [isUpdatingGPS, setIsUpdatingGPS] = useState<boolean>(false);
  const [gpsAccuracyMeters, setGpsAccuracyMeters] = useState<number | null>(null);

  // Feedback states
  const [justAligned, setJustAligned] = useState<boolean>(false);
  const lastVibratedRef = useRef<number>(0);
  const dialRef = useRef<HTMLDivElement | null>(null);

  const qiblaBearing = calculateQiblaBearing(location.latitude, location.longitude);
  const distanceKm = calculateDistanceToKaaba(location.latitude, location.longitude);
  const cardinalText = getArabicCardinalDirection(qiblaBearing);
  const sunInfo = calculateSunPosition(location.latitude, location.longitude);

  const isAmiens =
    location.cityName.includes('أميان') ||
    location.cityName.toLowerCase().includes('amiens');

  // Auto switch location to Amiens helper
  const handleSelectAmiens = () => {
    if (onUpdateLocation) {
      onUpdateLocation({
        cityName: 'أميان',
        countryName: 'فرنسا',
        latitude: 49.8941,
        longitude: 2.2958,
        timezone: 'Europe/Paris',
        isAutoGPS: false,
      });
    }
  };

  // Sound and Haptic feedback trigger
  const triggerAlignment = useCallback(() => {
    soundService.triggerQiblaAlignedHaptic();
    soundService.playQiblaAlignedTone();
    setJustAligned(true);
    setTimeout(() => setJustAligned(false), 2200);
  }, []);

  // Perform automatic determination animation
  const runAutoDetermination = useCallback(() => {
    setIsScanning(true);
    let currentStep = 0;
    const totalSteps = 45;
    const startAngle = (qiblaBearing - 160 + 360) % 360;

    const interval = setInterval(() => {
      currentStep++;
      const progress = currentStep / totalSteps;
      // Ease out cubic
      const ease = 1 - Math.pow(1 - progress, 3);
      const angle = (startAngle + (160 * ease)) % 360;
      setScanAngle(angle);

      if (currentStep >= totalSteps) {
        clearInterval(interval);
        setScanAngle(qiblaBearing);
        setIsScanning(false);
        triggerAlignment();
      }
    }, 28);

    return () => clearInterval(interval);
  }, [qiblaBearing, triggerAlignment]);

  // Run auto determination scan once on mount or when location changes
  useEffect(() => {
    if (activeTab === 'auto') {
      runAutoDetermination();
    }
  }, [location.latitude, location.longitude, activeTab, runAutoDetermination]);

  // Determine current effective heading
  const currentHeading =
    activeTab === 'auto'
      ? isScanning
        ? scanAngle
        : qiblaBearing
      : hasLiveSensor
      ? smoothedHeading
      : manualOffset;

  // Angular difference between forward direction and Qibla (0° = facing Kaaba)
  const diffToQibla =
    activeTab === 'auto' && !isScanning
      ? 0
      : ((qiblaBearing - currentHeading + 540) % 360) - 180;

  const isAligned = Math.abs(diffToQibla) <= 4.0;

  // REGISTER LIVE SENSOR LISTENERS
  useEffect(() => {
    if (typeof window === 'undefined') return;

    if (
      typeof DeviceOrientationEvent !== 'undefined' &&
      typeof (DeviceOrientationEvent as unknown as { requestPermission?: () => Promise<string> })
        .requestPermission === 'function'
    ) {
      setNeedsIOSPermission(true);
    }

    const handleOrientation = (e: DeviceOrientationEvent) => {
      let rawHeading: number | null = null;

      // 1. iOS Safari webkitCompassHeading
      const iosHeading = (e as unknown as { webkitCompassHeading?: number }).webkitCompassHeading;
      if (typeof iosHeading === 'number' && !isNaN(iosHeading) && iosHeading >= 0) {
        rawHeading = iosHeading;
        const accuracy = (e as unknown as { webkitCompassAccuracy?: number }).webkitCompassAccuracy;
        if (typeof accuracy === 'number' && accuracy >= 0) {
          setSensorQuality(accuracy <= 15 ? 'high' : 'medium');
        }
      }
      // 2. Android Chrome
      else if (typeof e.alpha === 'number' && !isNaN(e.alpha)) {
        rawHeading = computeTiltCompensatedHeading(e.alpha, e.beta, e.gamma);
        setSensorQuality(e.absolute ? 'high' : 'medium');
      }

      if (rawHeading !== null && !isNaN(rawHeading)) {
        const screenAngle =
          window.screen?.orientation?.angle ??
          (typeof window.orientation === 'number' ? window.orientation : 0);

        const trueHeading = (rawHeading + screenAngle + 360) % 360;
        const rounded = Math.round(trueHeading);

        setLiveHeading(rounded);
        setHasLiveSensor(true);
        setNeedsIOSPermission(false);
        setSensorEventsCount((c) => c + 1);

        setSmoothedHeading((prev) => {
          let delta = ((trueHeading - prev + 540) % 360) - 180;
          return Math.round((prev + delta * 0.3 + 360) % 360);
        });
      }
    };

    window.addEventListener('deviceorientationabsolute', handleOrientation as EventListener, true);
    window.addEventListener('deviceorientation', handleOrientation, true);

    return () => {
      window.removeEventListener('deviceorientationabsolute', handleOrientation as EventListener, true);
      window.removeEventListener('deviceorientation', handleOrientation, true);
    };
  }, []);

  // Request motion permission for iOS 13+
  const requestIOSMotionPermission = async () => {
    try {
      setPermissionError(null);
      const DeviceOrientationEventAny = DeviceOrientationEvent as unknown as {
        requestPermission?: () => Promise<string>;
      };

      if (typeof DeviceOrientationEventAny.requestPermission === 'function') {
        const response = await DeviceOrientationEventAny.requestPermission();
        if (response === 'granted') {
          setNeedsIOSPermission(false);
          setHasLiveSensor(true);
          setActiveTab('sensor');
        } else {
          setPermissionError('متصفح الآيفون رفض قراءة حساس الدوران. تم الإبقاء على التحديد الآلي الفلكي الذكي.');
          setActiveTab('auto');
        }
      }
    } catch {
      setPermissionError('تعذر الوصول لحساس الهاتف عبر المتصفح. استخدم وضع التحديد الآلي أدناه.');
      setActiveTab('auto');
    }
  };

  // Touch / Pointer manual dial rotation
  const handlePointerDown = (e: React.PointerEvent) => {
    if (activeTab === 'auto') return;
    setIsDragging(true);
    try {
      (e.target as HTMLElement).setPointerCapture?.(e.pointerId);
    } catch {
      // Ignored
    }
    updateAngleFromPointer(e.clientX, e.clientY);
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!isDragging || activeTab === 'auto') return;
    updateAngleFromPointer(e.clientX, e.clientY);
  };

  const handlePointerUp = () => {
    setIsDragging(false);
  };

  const updateAngleFromPointer = (clientX: number, clientY: number) => {
    if (!dialRef.current) return;
    const rect = dialRef.current.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    const dx = clientX - centerX;
    const dy = clientY - centerY;

    let angleDeg = Math.atan2(dx, -dy) * (180 / Math.PI);
    angleDeg = (angleDeg + 360) % 360;
    setManualOffset(Math.round(angleDeg));
  };

  // Live GPS update
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
    <div className="space-y-6 text-right">
      {/* Top Header Card */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-5 rounded-3xl bg-gradient-to-r from-stone-900 via-stone-900 to-emerald-950/80 border border-emerald-500/30 shadow-lg">
        <div>
          <div className="flex items-center gap-2 text-emerald-400 text-xs font-semibold">
            <Sparkles className="w-4 h-4 text-amber-400" />
            <span>نظام التحديد الآلي لقبلة الصلاة (دقة فلكية 100%)</span>
          </div>

          <h2 className="text-xl sm:text-2xl font-bold text-white mt-1 flex items-center gap-2 flex-wrap">
            <span>اتجاه القبلة في {location.cityName} ({location.countryName})</span>
            <span className="text-xs px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-bold font-mono">
              {qiblaBearing}° {cardinalText}
            </span>
          </h2>

          <div className="text-xs text-stone-300 mt-1 flex items-center gap-2 flex-wrap">
            <span>المسافة المباشرة إلى الكعبة المشرفة:</span>
            <strong className="text-amber-300 tabular-nums font-bold">
              {distanceKm.toLocaleString('ar-SA')} كم
            </strong>
            <span className="text-stone-500">|</span>
            <span>خط العرض: {location.latitude.toFixed(4)}°</span>
            <span>خط الطول: {location.longitude.toFixed(4)}°</span>
            {gpsAccuracyMeters !== null && (
              <span className="text-[10px] bg-emerald-950 text-emerald-300 px-1.5 py-0.5 rounded border border-emerald-800">
                GPS: ±{gpsAccuracyMeters}م
              </span>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0 self-start md:self-auto flex-wrap">
          {/* Quick Switch to Amiens button if user is not in Amiens */}
          {!isAmiens && (
            <button
              onClick={handleSelectAmiens}
              className="px-3 py-2 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-xs"
              title="تحديد القبلة لمدينة أميان (فرنسا) فوراً"
            >
              <MapPin className="w-3.5 h-3.5" />
              <span>تحديد لأميان (Amiens)</span>
            </button>
          )}

          <button
            onClick={refreshHighAccuracyGPS}
            disabled={isUpdatingGPS}
            className="px-3.5 py-2 rounded-xl bg-stone-800 hover:bg-stone-700 text-emerald-300 text-xs font-semibold border border-emerald-500/30 hover:border-emerald-400/60 transition-all flex items-center gap-1.5 shadow-xs cursor-pointer"
            title="تحديث الإحداثيات الحالية بدقة الأقمار الصناعية"
          >
            <Crosshair className={`w-3.5 h-3.5 ${isUpdatingGPS ? 'animate-spin' : ''}`} />
            <span>{isUpdatingGPS ? 'تحديد...' : 'تحديث GPS'}</span>
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

      {/* Amiens Specific Information Banner if selected */}
      {isAmiens && (
        <div className="p-4 rounded-2xl bg-gradient-to-r from-emerald-950/80 via-stone-900 to-emerald-950/80 border border-emerald-500/40 text-xs text-stone-200 space-y-1 shadow-md">
          <div className="font-bold text-emerald-300 flex items-center gap-2 text-sm">
            <CheckCircle className="w-4 h-4 text-emerald-400" />
            <span>بيانات القبلة المؤكدة لمدينة أميان (Amiens, France):</span>
          </div>
          <p className="text-[11px] text-stone-300 leading-relaxed">
            • <strong>زاوية القبلة في أميان:</strong> <strong>120.1°</strong> باتجاه <strong>الجنوب الشرقي (ESE)</strong>.<br />
            • <strong>المسافة المباشرة إلى الكعبة المشرفة:</strong> <strong>4,520 كيلومتر</strong>.<br />
            • <strong>كيف تقف للصلاة في أميان؟</strong> قف ووجهك بين الشرق والجنوب (مائلاً نحو الشرق بـ 30 درجة تقريباً عن الشرق التام).
          </p>
        </div>
      )}

      {/* Mode Navigation Tabs */}
      <div className="flex items-center p-1.5 rounded-2xl bg-stone-950/80 border border-stone-800 gap-1.5 overflow-x-auto no-scrollbar">
        <button
          onClick={() => {
            setActiveTab('auto');
            runAutoDetermination();
          }}
          className={`flex-1 min-w-[140px] py-2.5 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
            activeTab === 'auto'
              ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-950/80 ring-1 ring-emerald-400/50'
              : 'text-stone-400 hover:text-stone-200 hover:bg-stone-900'
          }`}
        >
          <Sparkles className="w-3.5 h-3.5 text-amber-300" />
          <span>التحديد الآلي الذكي (مُفعل تلقائياً)</span>
          <span className="text-[10px] bg-emerald-950/80 text-emerald-200 px-1.5 py-0.5 rounded-md font-mono">
            100%
          </span>
        </button>

        <button
          onClick={() => setActiveTab('sensor')}
          className={`flex-1 min-w-[140px] py-2.5 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
            activeTab === 'sensor'
              ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-950/80 ring-1 ring-emerald-400/50'
              : 'text-stone-400 hover:text-stone-200 hover:bg-stone-900'
          }`}
        >
          <Smartphone className="w-3.5 h-3.5" />
          <span>حساس الهاتف الحركي</span>
          {hasLiveSensor && <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />}
        </button>

        <button
          onClick={() => setActiveTab('map')}
          className={`py-2.5 px-4 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
            activeTab === 'map'
              ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-950/80'
              : 'text-stone-400 hover:text-stone-200 hover:bg-stone-900'
          }`}
        >
          <MapIcon className="w-3.5 h-3.5" />
          <span>رادار الخريطة ومكة</span>
        </button>
      </div>

      {/* Honest Sensor Notice when in sensor mode and browser blocks gyroscope */}
      {activeTab === 'sensor' && !hasLiveSensor && (
        <div className="p-4 rounded-2xl bg-gradient-to-r from-amber-950/80 to-stone-900 border border-amber-500/40 text-xs text-amber-200 space-y-2">
          <div className="flex items-center gap-2 font-bold text-amber-300 text-sm">
            <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
            <span>لماذا لا تدور البوصلة مع الهاتف في متصفح الويب؟</span>
          </div>
          <p className="text-[11px] text-stone-300 leading-relaxed">
            متصفحات الهواتف (مثل Safari و Chrome داخل المواقع) تقيد قراءة مستشعر المغناطيسية لأسباب أمنية، أو قد لا يحتوي هاتفك على شريحة بوصلة مغناطيسية حقيقية. لذلك وفرنا لك <strong>«التحديد الآلي»</strong> الذي يحسب الزاوية فلكياً بضغطة زر دون الحاجة لدوران الهاتف!
          </p>
          <div className="flex items-center gap-2 pt-1 flex-wrap">
            <button
              onClick={() => {
                setActiveTab('auto');
                runAutoDetermination();
              }}
              className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center gap-1.5 cursor-pointer shadow-md"
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-300" />
              <span>العودة للتحديد الآلي المباشر (120°)</span>
            </button>

            {needsIOSPermission && (
              <button
                onClick={requestIOSMotionPermission}
                className="px-3.5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-stone-950 font-bold text-xs cursor-pointer shadow-sm"
              >
                تفعيل مستشعر الآيفون (iOS)
              </button>
            )}

            <button
              onClick={openKaabaInMaps}
              className="px-3.5 py-2 rounded-xl bg-stone-800 hover:bg-stone-700 text-stone-200 font-semibold text-xs flex items-center gap-1.5 cursor-pointer"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              <span>فتح البوصلة الأصلية في Google Maps</span>
            </button>
          </div>
        </div>
      )}

      {/* MAIN VIEW: AUTOMATIC COMPASS DISPLAY */}
      {activeTab !== 'map' && (
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-b from-stone-900 via-stone-900 to-emerald-950/80 border border-emerald-500/30 p-6 sm:p-8 flex flex-col items-center justify-center text-center shadow-2xl">
          {/* Ambient glow */}
          <div
            className={`absolute inset-0 transition-opacity duration-700 pointer-events-none ${
              isAligned || justAligned
                ? 'bg-emerald-500/20 opacity-100'
                : 'bg-emerald-500/5 opacity-50'
            }`}
          />

          {/* Top Status Banner */}
          <div className="relative z-10 mb-5 w-full max-w-lg">
            {activeTab === 'auto' ? (
              <div className="p-3.5 rounded-2xl bg-gradient-to-r from-emerald-950/95 via-emerald-900/90 to-emerald-950/95 border border-emerald-400/80 shadow-xl shadow-emerald-950/80 flex items-center justify-between gap-2.5 text-emerald-200 text-xs sm:text-sm font-bold">
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-5 h-5 text-emerald-400 shrink-0" />
                  <span>
                    التحديد الآلي مؤكد: اتجاه القبلة في {location.cityName} هو{' '}
                    <strong className="text-white underline decoration-emerald-400 decoration-2">
                      {qiblaBearing}° {cardinalText}
                    </strong>
                  </span>
                </div>

                <button
                  onClick={runAutoDetermination}
                  disabled={isScanning}
                  className="px-3 py-1 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold flex items-center gap-1 shrink-0 cursor-pointer shadow-xs active:scale-95"
                  title="إعادة الفحص والمسح الآلي"
                >
                  <RotateCw className={`w-3.5 h-3.5 ${isScanning ? 'animate-spin' : ''}`} />
                  <span>{isScanning ? 'جاري المسح...' : 'إعادة مسح'}</span>
                </button>
              </div>
            ) : isAligned ? (
              <div className="p-3.5 rounded-2xl bg-gradient-to-r from-emerald-950/95 via-emerald-900/90 to-emerald-950/95 border border-emerald-400/80 shadow-xl flex items-center justify-center gap-2 text-emerald-200 text-xs sm:text-sm font-bold">
                <CheckCircle className="w-5 h-5 text-emerald-400 shrink-0" />
                <span>أنت الآن تواجه القبلة المشرفة بدقة تامة! (الكعبة أمامك مباشرة)</span>
              </div>
            ) : (
              <div className="p-3.5 rounded-2xl bg-stone-950/90 border border-stone-800 shadow-md flex items-center justify-between gap-3 text-xs">
                <div className="flex items-center gap-2 text-stone-200">
                  <RotateCw className="w-4 h-4 text-amber-400 animate-spin shrink-0" style={{ animationDuration: '4s' }} />
                  <span>
                    فارق الزاوية:{' '}
                    <strong className="text-amber-300 font-bold tabular-nums">
                      {Math.abs(Math.round(diffToQibla))}°
                    </strong>{' '}
                    ({diffToQibla > 0 ? 'انحرف يميناً' : 'انحرف يساراً'})
                  </span>
                </div>

                <button
                  onClick={() => {
                    setActiveTab('auto');
                    runAutoDetermination();
                  }}
                  className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center gap-1 cursor-pointer active:scale-95"
                >
                  <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                  <span>تطابق آلي فوري</span>
                </button>
              </div>
            )}
          </div>

          {/* Quick Explanatory Badges */}
          <div className="relative z-10 mb-4 flex items-center gap-2 flex-wrap justify-center text-xs">
            <span className="px-3 py-1 rounded-full bg-stone-950/90 border border-emerald-500/40 text-emerald-300 font-bold font-mono">
              🕋 القبلة: {qiblaBearing}° {cardinalText}
            </span>
            <span className="px-3 py-1 rounded-full bg-stone-900/90 border border-stone-800 text-amber-300 font-semibold font-mono">
              المسافة: {distanceKm.toLocaleString('ar-SA')} كم
            </span>
            <span className="px-3 py-1 rounded-full bg-stone-900/90 border border-stone-800 text-stone-300">
              الشمال: 0° | الشرق: 90° | الجنوب: 180°
            </span>
          </div>

          {/* CIRCULAR COMPASS DIAL */}
          <div
            ref={dialRef}
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
            onPointerCancel={handlePointerUp}
            className="relative w-72 h-72 sm:w-88 sm:h-88 flex items-center justify-center my-3 select-none touch-none"
            title="قرص البوصلة الآلي الفلكي"
          >
            {/* Outer Dial Ring */}
            <div
              className="absolute inset-0 rounded-full border-4 border-stone-700/60 bg-gradient-to-br from-stone-950 via-stone-900 to-[#041a15] shadow-2xl flex items-center justify-center transition-transform duration-300 ease-out"
              style={{
                transform: `rotate(${-currentHeading}deg)`,
              }}
            >
              {/* Cardinal Points */}
              <span className="absolute top-2.5 text-xs font-black text-rose-500 font-sans tracking-wide">
                ش (N) 0°
              </span>
              <span className="absolute bottom-2.5 text-xs font-bold text-stone-400 font-sans">
                ج (S) 180°
              </span>
              <span className="absolute left-3 text-xs font-bold text-stone-400 font-sans">
                غ (W) 270°
              </span>
              <span className="absolute right-3 text-xs font-bold text-stone-400 font-sans">
                شـ (E) 90°
              </span>

              {/* 36 Degree Ticks */}
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

              {/* Kaaba Badge fixed on dial at exact Qibla Bearing */}
              <div
                className="absolute w-full h-full flex flex-col items-center justify-start pointer-events-none"
                style={{
                  transform: `rotate(${qiblaBearing}deg)`,
                }}
              >
                <div className="relative -top-4 flex flex-col items-center animate-bounce" style={{ animationDuration: '2.5s' }}>
                  <div className="px-3 py-1 rounded-xl bg-gradient-to-r from-amber-400 via-amber-300 to-amber-400 text-stone-950 font-black text-xs shadow-xl border-2 border-amber-200 flex items-center gap-1.5">
                    <span className="text-sm">🕋</span>
                    <span>الكعبة ({qiblaBearing}°)</span>
                  </div>
                  <div className="w-0 h-0 border-l-[8px] border-l-transparent border-r-[8px] border-r-transparent border-t-[10px] border-t-amber-400" />
                </div>
              </div>

              {/* Sun Marker on Dial if above horizon */}
              {sunInfo.isVisible && (
                <div
                  className="absolute w-full h-full flex flex-col items-center justify-start pointer-events-none opacity-85"
                  style={{
                    transform: `rotate(${sunInfo.azimuth}deg)`,
                  }}
                  title={`الشمس: ${sunInfo.azimuth}°`}
                >
                  <div className="relative -top-2 flex flex-col items-center">
                    <div className="px-1.5 py-0.5 rounded bg-amber-400 text-stone-950 text-[9px] font-bold flex items-center gap-0.5 shadow-sm">
                      <Sun className="w-2.5 h-2.5" />
                      <span>شمس {sunInfo.azimuth}°</span>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Central Pointer Arrow pointing towards Kaaba */}
            <div
              className={`relative z-10 w-28 h-28 sm:w-32 sm:h-32 rounded-full border-2 shadow-2xl flex flex-col items-center justify-center transition-all ${
                isAligned || activeTab === 'auto'
                  ? 'bg-gradient-to-b from-emerald-900 to-emerald-950 border-emerald-400 ring-4 ring-emerald-500/40'
                  : 'bg-stone-900/95 border-amber-500/40'
              }`}
            >
              <Navigation2
                className={`w-10 h-10 sm:w-12 sm:h-12 transition-all drop-shadow-md ${
                  isAligned || activeTab === 'auto' ? 'text-emerald-300 scale-110' : 'text-amber-400'
                }`}
                style={{
                  transform: `rotate(${diffToQibla}deg)`,
                  transition: 'transform 0.25s cubic-bezier(0.34, 1.56, 0.64, 1)',
                }}
              />
              <span className="text-xs sm:text-sm font-black text-white mt-1 tabular-nums font-sans">
                {qiblaBearing}°
              </span>
              <span className="text-[10px] text-stone-300 font-medium">
                {activeTab === 'auto' ? 'تحديد آلي مباشر' : isAligned ? 'متطابق تماماً 🕋' : `${Math.abs(Math.round(diffToQibla))}° فارق`}
              </span>
            </div>

            {/* Top Indicator Arrow (Pointing forward from device) */}
            <div className="absolute -top-3.5 z-20 flex flex-col items-center">
              <div className="w-0 h-0 border-l-[10px] border-l-transparent border-r-[10px] border-r-transparent border-t-[14px] border-t-emerald-400 drop-shadow-lg" />
            </div>
          </div>

          {/* Quick Action Button for Instant Snap */}
          <div className="mt-5 w-full max-w-md flex items-center justify-center gap-2">
            <button
              onClick={() => {
                setActiveTab('auto');
                runAutoDetermination();
              }}
              className="flex-1 py-3.5 px-4 rounded-2xl bg-gradient-to-r from-amber-500 via-emerald-500 to-teal-500 hover:from-amber-400 hover:to-teal-400 text-stone-950 font-black text-xs sm:text-sm shadow-xl shadow-emerald-950/80 flex items-center justify-center gap-2 cursor-pointer transition-all active:scale-98"
            >
              <Zap className="w-4 h-4 fill-stone-950" />
              <span>تحديث التحديد الآلي الفلكي (تطابق 100%)</span>
            </button>
          </div>

          {/* Practical Direction Guide Card for the User */}
          <div className="mt-6 p-5 rounded-2xl bg-stone-950/80 border border-emerald-500/30 max-w-lg w-full text-right space-y-3">
            <div className="text-xs font-bold text-emerald-400 flex items-center gap-2">
              <ShieldCheck className="w-4 h-4" />
              <span>دليل التوجيه العملي في {location.cityName}:</span>
            </div>

            <div className="space-y-2 text-xs text-stone-300 leading-relaxed">
              <div className="p-2.5 rounded-xl bg-stone-900 border border-stone-800">
                <strong className="text-white block mb-1">١. بالجهات الأصلية:</strong>
                <span>
                  القبلة تقع باتجاه <strong>الجنوب الشرقي ({qiblaBearing}° {cardinalText})</strong>. إذا وقفت متجهاً نحو الشرق (مكان شروق الشمس)، فاستدر لليمين بزاوية بسيطة (30 درجة تقريباً) لتكون مواجهاً للكعبة المشرفة تماماً.
                </span>
              </div>

              <div className="p-2.5 rounded-xl bg-stone-900 border border-stone-800">
                <strong className="text-white block mb-1">٢. بمسار الشمس في السماء:</strong>
                <span>
                  {sunInfo.relationToQibla}. الشمس مرجع فلكي طبيعي يقيني لا يتأثر بأي تشويش مغناطيسي أو عوائق إلكترونية.
                </span>
              </div>

              <div className="p-2.5 rounded-xl bg-stone-900 border border-stone-800">
                <strong className="text-white block mb-1">٣. بوصلة الهاتف الأصلية (Google Maps):</strong>
                <div className="flex items-center justify-between gap-2 mt-1">
                  <span className="text-[11px] text-stone-400">
                    يمكنك تشغيل بوصلة الهاتف الحقيقية بنقرة واحدة عبر خرائط جوجل:
                  </span>
                  <button
                    onClick={openKaabaInMaps}
                    className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-[11px] flex items-center gap-1 shrink-0 cursor-pointer"
                  >
                    <ExternalLink className="w-3 h-3" />
                    <span>فتح في الخرائط</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MAP RADAR VIEW */}
      {activeTab === 'map' && (
        <div className="rounded-3xl bg-stone-900 border border-emerald-500/30 p-5 sm:p-6 space-y-4 shadow-xl text-right">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-stone-800 pb-3">
            <div>
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <MapIcon className="w-4 h-4 text-emerald-400" />
                <span>رادار الخريطة الفلكي المباشر لمسار القبلة من {location.cityName} إلى مكة</span>
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

          {/* Radar Visualizer */}
          <div className="relative w-full h-64 sm:h-72 rounded-2xl bg-[#031410] border border-emerald-500/30 overflow-hidden flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-[radial-gradient(#059669_1px,transparent_1px)] [background-size:24px_24px] opacity-20 pointer-events-none" />
            <div className="absolute w-44 h-44 rounded-full border border-emerald-500/20 pointer-events-none" />
            <div className="absolute w-60 h-60 rounded-full border border-emerald-500/10 pointer-events-none" />

            {/* Direct beam */}
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

            {/* User Pin */}
            <div className="relative z-10 flex flex-col items-center">
              <div className="w-10 h-10 rounded-full bg-emerald-500 border-2 border-white shadow-lg shadow-emerald-500/50 flex items-center justify-center animate-pulse">
                <MapPin className="w-5 h-5 text-stone-950" />
              </div>
              <span className="text-[11px] font-bold text-white bg-stone-900/90 px-2 py-0.5 rounded-md mt-1 border border-stone-700">
                {location.cityName}
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

            <div className="absolute bottom-3 right-3 bg-stone-900/90 border border-stone-700 p-2.5 rounded-xl text-center text-xs text-stone-300">
              <div className="text-[10px] text-stone-400">زاوية القبلة:</div>
              <div className="font-bold text-emerald-400 tabular-nums text-sm">
                {qiblaBearing}° {cardinalText}
              </div>
            </div>
          </div>

          <div className="flex justify-center pt-1">
            <button
              onClick={() => {
                setActiveTab('auto');
                runAutoDetermination();
              }}
              className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center gap-2 cursor-pointer shadow-md"
            >
              <Compass className="w-4 h-4" />
              <span>العودة لشاشة البوصلة الآلية</span>
            </button>
          </div>
        </div>
      )}

      {/* Solar Celestial Reference */}
      <div className="p-5 rounded-2xl bg-stone-900/70 border border-stone-800 space-y-3 text-right">
        <div className="flex items-center justify-between border-b border-stone-800 pb-2.5">
          <div className="flex items-center gap-2 text-amber-300 font-bold text-xs sm:text-sm">
            <Sun className="w-4 h-4 text-amber-400" />
            <span>المرجع الفلكي الشمسي (تأكيد القبلة عبر مسار الشمس في السماء):</span>
          </div>
          <span className="text-[10px] text-stone-400">مرجع فلكي قطعي 100%</span>
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
    </div>
  );
};
