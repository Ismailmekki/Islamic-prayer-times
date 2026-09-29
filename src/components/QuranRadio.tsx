import React, { useState, useEffect, useRef } from 'react';
import {
  Radio,
  Play,
  Pause,
  Volume2,
  VolumeX,
  Sparkles,
  Search,
  Star,
  Clock,
  Timer,
  AlertCircle,
  RefreshCw,
  Share2,
  Copy,
  Check,
  Headphones,
  Shield,
  Layers,
  Heart,
  ExternalLink,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { QURAN_RADIO_STATIONS, RadioStation } from '../data/quranRadioData';

export const QuranRadio: React.FC = () => {
  // Current active radio station
  const [currentStation, setCurrentStation] = useState<RadioStation>(() => {
    try {
      const savedId = localStorage.getItem('salati_active_radio_station_id');
      if (savedId) {
        const found = QURAN_RADIO_STATIONS.find((s) => s.id === savedId);
        if (found) return found;
      }
    } catch {}
    return QURAN_RADIO_STATIONS[0];
  });

  // Playback states
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [volume, setVolume] = useState<number>(0.9);
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [playbackError, setPlaybackError] = useState<string | null>(null);
  const [activeMirror, setActiveMirror] = useState<'primary' | 'fallback'>('primary');

  // Favorites state
  const [favorites, setFavorites] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('salati_radio_favorites');
      if (saved) return JSON.parse(saved);
    } catch {}
    return ['tarateel', 'mishary_alafasi', 'albaqarah', 'maher'];
  });

  // Search & Category Filters
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  // Sleep Timer (Minutes)
  const [sleepTimerMinutes, setSleepTimerMinutes] = useState<number | null>(null);
  const [sleepTimerRemaining, setSleepTimerRemaining] = useState<number | null>(null);

  // Toast alert
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const watchdogTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Save active station to localStorage
  useEffect(() => {
    try {
      localStorage.setItem('salati_active_radio_station_id', currentStation.id);
    } catch {}
  }, [currentStation]);

  // Persist favorites
  useEffect(() => {
    try {
      localStorage.setItem('salati_radio_favorites', JSON.stringify(favorites));
    } catch {}
  }, [favorites]);

  // Initialize or start radio stream
  const playStation = (station: RadioStation, mirror: 'primary' | 'fallback' = 'primary') => {
    if (watchdogTimerRef.current) {
      clearTimeout(watchdogTimerRef.current);
      watchdogTimerRef.current = null;
    }

    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.src = '';
    }

    setPlaybackError(null);
    setIsLoading(true);
    setActiveMirror(mirror);

    const streamUrl = mirror === 'primary' ? station.streamUrl : station.fallbackUrl;

    const audio = new Audio();
    audio.src = streamUrl;
    audio.preload = 'auto';
    audio.volume = isMuted ? 0 : volume;

    // Safety Watchdog: If audio stalls > 6 seconds on initial connect, failover to fallback mirror
    watchdogTimerRef.current = setTimeout(() => {
      if (audio.readyState < 2 && mirror === 'primary') {
        console.warn(`Primary stream taking too long for ${station.id}, failing over to fallback`);
        playStation(station, 'fallback');
      }
    }, 6000);

    audio.oncanplay = () => {
      if (watchdogTimerRef.current) {
        clearTimeout(watchdogTimerRef.current);
        watchdogTimerRef.current = null;
      }
      setIsLoading(false);
      setPlaybackError(null);
    };

    audio.onplaying = () => {
      setIsPlaying(true);
      setIsLoading(false);
      setPlaybackError(null);
    };

    audio.onwaiting = () => {
      setIsLoading(true);
    };

    audio.onerror = () => {
      if (watchdogTimerRef.current) {
        clearTimeout(watchdogTimerRef.current);
        watchdogTimerRef.current = null;
      }

      if (mirror === 'primary') {
        console.warn(`Primary mirror error for ${station.id}, trying fallback mirror`);
        playStation(station, 'fallback');
      } else {
        setIsLoading(false);
        setIsPlaying(false);
        setPlaybackError('تعذر الاتصال بالبث المباشر لهذه المحطة حالياً. جارٍ إعادة المحاولة تلقائياً...');
      }
    };

    audioRef.current = audio;

    audio
      .play()
      .then(() => {
        setIsPlaying(true);
        // Setup MediaSession for lock screen on mobile
        if ('mediaSession' in navigator) {
          try {
            navigator.mediaSession.metadata = new MediaMetadata({
              title: station.nameArabic,
              artist: station.reciterArabic,
              album: 'راديو القرآن الكريم 24/7 - صلاتي',
            });
            navigator.mediaSession.setActionHandler('play', () => {
              audio.play();
              setIsPlaying(true);
            });
            navigator.mediaSession.setActionHandler('pause', () => {
              audio.pause();
              setIsPlaying(false);
            });
          } catch {}
        }
      })
      .catch((err) => {
        console.warn('Audio play failed or autoplay restricted', err);
        setIsLoading(false);
      });
  };

  // Toggle Play / Pause
  const handleTogglePlay = () => {
    if (isPlaying) {
      if (audioRef.current) {
        audioRef.current.pause();
      }
      setIsPlaying(false);
      setIsLoading(false);
    } else {
      if (!audioRef.current || audioRef.current.src === '') {
        playStation(currentStation, activeMirror);
      } else {
        setIsLoading(true);
        audioRef.current
          .play()
          .then(() => {
            setIsPlaying(true);
            setIsLoading(false);
          })
          .catch(() => {
            // Reconnect fresh live stream
            playStation(currentStation, activeMirror);
          });
      }
    }
  };

  // Select a new station
  const handleSelectStation = (station: RadioStation) => {
    setCurrentStation(station);
    setActiveMirror('primary');
    playStation(station, 'primary');
  };

  // Switch mirror manually
  const handleSwitchMirrorManually = () => {
    const nextMirror = activeMirror === 'primary' ? 'fallback' : 'primary';
    playStation(currentStation, nextMirror);
    showToast(`تم التبديل إلى الخادم ${nextMirror === 'primary' ? 'الرئيسي' : 'البديل'}`);
  };

  // Toggle favorite
  const toggleFavorite = (stationId: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    if (favorites.includes(stationId)) {
      setFavorites(favorites.filter((id) => id !== stationId));
      showToast('تمت إزالة المحطة من المفضلة');
    } else {
      setFavorites([...favorites, stationId]);
      showToast('تمت إضافة المحطة إلى محطاتك المفضلة ⭐');
    }
  };

  // Sleep timer interval
  useEffect(() => {
    if (!sleepTimerMinutes) {
      setSleepTimerRemaining(null);
      return;
    }

    let remaining = sleepTimerMinutes * 60;
    setSleepTimerRemaining(remaining);

    const interval = setInterval(() => {
      remaining -= 1;
      if (remaining <= 0) {
        clearInterval(interval);
        if (audioRef.current) {
          audioRef.current.pause();
        }
        setIsPlaying(false);
        setSleepTimerMinutes(null);
        setSleepTimerRemaining(null);
        showToast('تم إيقاف الراديو تلقائياً بواسطة مؤقت النوم 💤');
      } else {
        setSleepTimerRemaining(remaining);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [sleepTimerMinutes]);

  // Volume slider handler
  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const v = parseFloat(e.target.value);
    setVolume(v);
    setIsMuted(v === 0);
    if (audioRef.current) {
      audioRef.current.volume = v;
    }
  };

  // Toggle mute
  const handleToggleMute = () => {
    if (isMuted) {
      setIsMuted(false);
      if (audioRef.current) audioRef.current.volume = volume || 0.9;
    } else {
      setIsMuted(true);
      if (audioRef.current) audioRef.current.volume = 0;
    }
  };

  // Toast notification
  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 2800);
  };

  // Share Station
  const handleShareStation = async () => {
    const shareText = `استمع الآن إلى «${currentStation.nameArabic}» (${currentStation.reciterArabic}) على مدار 24 ساعة دون توقف عبر تطبيق صلاتي: https://quran.com/radio`;
    if (navigator.share) {
      try {
        await navigator.share({
          title: currentStation.nameArabic,
          text: shareText,
        });
      } catch {}
    } else {
      navigator.clipboard.writeText(shareText);
      showToast('تم نسخ رابط وتفاصيل الإذاعة لمشاركتها بنجاح!');
    }
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (watchdogTimerRef.current) {
        clearTimeout(watchdogTimerRef.current);
        watchdogTimerRef.current = null;
      }
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.src = '';
      }
    };
  }, []);

  // Filter stations based on search and category
  const filteredStations = QURAN_RADIO_STATIONS.filter((s) => {
    const q = searchQuery.trim().toLowerCase();
    const matchesSearch =
      !q ||
      s.nameArabic.toLowerCase().includes(q) ||
      s.reciterArabic.toLowerCase().includes(q) ||
      s.descriptionArabic.toLowerCase().includes(q) ||
      s.badgeArabic.toLowerCase().includes(q);

    let matchesCategory = true;
    if (selectedCategory === 'favorites') {
      matchesCategory = favorites.includes(s.id);
    } else if (selectedCategory !== 'all') {
      matchesCategory = s.category === selectedCategory;
    }

    return matchesSearch && matchesCategory;
  });

  const formatTimerDisplay = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  return (
    <div className="space-y-6 text-right animate-fade-in w-full max-w-full min-w-0 overflow-x-hidden">
      {/* Toast Alert */}
      {toastMessage && (
        <div className="fixed bottom-24 sm:bottom-10 left-1/2 -translate-x-1/2 z-50 bg-stone-900/95 border border-emerald-500 text-white text-xs sm:text-sm px-5 py-3 rounded-2xl shadow-2xl backdrop-blur-md flex items-center gap-2.5 animate-in slide-in-from-bottom max-w-[90vw] text-right">
          <Sparkles className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Main Hero Header Banner */}
      <div className="rounded-3xl bg-gradient-to-r from-stone-950 via-stone-900 to-emerald-950/80 border border-emerald-500/30 p-5 sm:p-6 shadow-2xl space-y-4 w-full max-w-full min-w-0 overflow-x-hidden">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2">
              <span className="p-1.5 rounded-xl bg-emerald-500/20 text-emerald-400">
                <Radio className="w-5 h-5 animate-pulse" />
              </span>
              <h2 className="text-xl sm:text-2xl font-bold text-white font-quran">
                راديو القرآن الكريم (بث مباشر 24 ساعة دون توقف)
              </h2>
            </div>
            <p className="text-xs sm:text-sm text-stone-300">
              استمع على مدار الساعة لأعذب التلاوات القرآنية الخاشعة، أئمة الحرمين الشريفين، سورة البقرة، والرقية الشرعية دون انقطاع.
            </p>
          </div>

          {/* 24/7 Live Beacon Indicator */}
          <div className="flex items-center gap-2 self-start md:self-auto">
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-2xl bg-rose-950/70 border border-rose-500/40 text-rose-300 text-xs font-bold shadow-xs">
              <span className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-ping" />
              <span>بث حي ومباشر 24/7</span>
            </div>
            <span className="text-[11px] px-2.5 py-1 rounded-xl bg-emerald-950/80 text-emerald-300 border border-emerald-500/30 font-mono">
              128 kbps HD
            </span>
          </div>
        </div>

        {/* Quick Recommended Stations Ribbon */}
        <div className="pt-2 border-t border-stone-800/80 flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar w-full max-w-full min-w-0">
          <span className="text-[11px] text-stone-400 whitespace-nowrap ml-1 font-semibold flex items-center gap-1 shrink-0">
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            <span>محطات مميزة:</span>
          </span>
          {QURAN_RADIO_STATIONS.filter((s) => s.isPopular).map((st) => {
            const isSelected = currentStation.id === st.id;
            return (
              <button
                key={st.id}
                onClick={() => handleSelectStation(st)}
                className={`px-3 py-1 rounded-xl text-xs font-semibold whitespace-nowrap transition-all cursor-pointer border flex items-center gap-1.5 shrink-0 ${
                  isSelected
                    ? 'bg-emerald-600 text-white border-emerald-500 shadow-md shadow-emerald-700/40 font-bold'
                    : 'bg-stone-950/70 text-stone-300 hover:text-white border-stone-800 hover:bg-stone-800/80'
                }`}
              >
                <span>{st.nameArabic.replace('إذاعة ', '')}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Primary Radio Player Deck */}
      <div className="p-5 sm:p-7 rounded-3xl bg-gradient-to-b from-stone-900 to-stone-950 border border-emerald-500/40 shadow-2xl space-y-6 text-right w-full max-w-full min-w-0 overflow-x-hidden">
        {/* Top Info Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-stone-800 pb-5">
          <div className="flex items-start gap-3.5">
            <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-gradient-to-br from-emerald-600/30 to-amber-600/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400 shadow-lg shrink-0">
              <Radio className="w-8 h-8 text-emerald-400" />
            </div>

            <div className="space-y-1">
              <div className="flex flex-wrap items-center gap-2">
                <h3 className="text-lg sm:text-xl font-bold text-white font-quran">
                  {currentStation.nameArabic}
                </h3>
                <span className="text-[10px] px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-bold">
                  {currentStation.badgeArabic}
                </span>
              </div>
              <p className="text-xs sm:text-sm text-emerald-400 font-medium">
                {currentStation.reciterArabic}
              </p>
              <p className="text-xs text-stone-400 max-w-xl">
                {currentStation.descriptionArabic}
              </p>
            </div>
          </div>

          {/* Quick Action Buttons */}
          <div className="flex items-center gap-2 self-end sm:self-center">
            {/* Favorite button */}
            <button
              onClick={() => toggleFavorite(currentStation.id)}
              className={`p-2.5 rounded-xl border transition-all cursor-pointer ${
                favorites.includes(currentStation.id)
                  ? 'bg-amber-500/20 text-amber-300 border-amber-500/40 shadow-xs'
                  : 'bg-stone-850 hover:bg-stone-800 text-stone-400 border-stone-700'
              }`}
              title={favorites.includes(currentStation.id) ? 'إزالة من المفضلة' : 'إضافة للمفضلة'}
            >
              <Star
                className={`w-4 h-4 ${
                  favorites.includes(currentStation.id) ? 'fill-amber-400 text-amber-400' : ''
                }`}
              />
            </button>

            {/* Share button */}
            <button
              onClick={handleShareStation}
              className="p-2.5 rounded-xl bg-stone-850 hover:bg-stone-800 text-stone-300 hover:text-white border border-stone-700 cursor-pointer transition-colors"
              title="مشاركة رابط الإذاعة"
            >
              <Share2 className="w-4 h-4 text-emerald-400" />
            </button>

            {/* Switch Mirror */}
            <button
              onClick={handleSwitchMirrorManually}
              className="px-3 py-2 rounded-xl bg-stone-850 hover:bg-stone-800 text-stone-300 hover:text-white border border-stone-700 text-xs font-semibold flex items-center gap-1.5 cursor-pointer"
              title="التبديل إلى سيرفر بديل في حال ضعف الاتصال"
            >
              <RefreshCw className="w-3.5 h-3.5 text-amber-400" />
              <span>خادم {activeMirror === 'primary' ? '1' : '2'}</span>
            </button>
          </div>
        </div>

        {/* Audio Visualizer & Live Frequency Bar */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-4 rounded-2xl bg-stone-950/70 border border-stone-800">
          <div className="flex items-center gap-2 text-xs">
            {isPlaying ? (
              <span className="flex items-center gap-2 text-emerald-400 font-bold">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping" />
                <span>جاري الاستماع للبث الحي المباشر...</span>
              </span>
            ) : isLoading ? (
              <span className="flex items-center gap-2 text-amber-300">
                <RefreshCw className="w-4 h-4 animate-spin text-amber-400" />
                <span>جارٍ الاتصال بسيرفر البث المباشر...</span>
              </span>
            ) : (
              <span className="text-stone-400">
                البث المباشر متوقف مؤقتاً، اضغط زر التشغيل للبدء
              </span>
            )}
          </div>

          {/* Equalizer animation */}
          {isPlaying && (
            <div className="flex items-center gap-1">
              {[35, 80, 55, 95, 70, 100, 85, 50, 90, 65, 80, 45, 95, 60].map((h, i) => (
                <div
                  key={i}
                  className="w-1 bg-gradient-to-t from-emerald-600 to-teal-400 rounded-full animate-bounce"
                  style={{
                    height: `${(h * 0.28).toFixed(0)}px`,
                    animationDuration: `${0.4 + (i % 4) * 0.15}s`,
                    animationDelay: `${i * 0.05}s`,
                  }}
                />
              ))}
            </div>
          )}
        </div>

        {/* Playback Error Alert if stream drops */}
        {playbackError && (
          <div className="p-3.5 rounded-2xl bg-rose-950/80 border border-rose-500/50 text-xs text-rose-200 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
              <span>{playbackError}</span>
            </div>
            <button
              onClick={() => playStation(currentStation, 'fallback')}
              className="px-3 py-1.5 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-bold text-xs cursor-pointer flex items-center gap-1"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>إعادة الاتصال بالخادم البديل</span>
            </button>
          </div>
        )}

        {/* Main Controls Deck: Transport & Volume & Sleep Timer */}
        <div className="flex flex-wrap items-center justify-between gap-4 pt-1">
          {/* Main Play / Pause Button */}
          <div className="flex items-center gap-3">
            <button
              onClick={handleTogglePlay}
              disabled={isLoading}
              className="w-16 h-16 rounded-full bg-emerald-600 hover:bg-emerald-500 text-white flex items-center justify-center shadow-xl shadow-emerald-700/40 transition-transform active:scale-95 cursor-pointer"
              title={isPlaying ? 'إيقاف مؤقت' : 'تشغيل البث المباشر'}
            >
              {isLoading ? (
                <div className="w-7 h-7 border-3 border-white border-t-transparent rounded-full animate-spin" />
              ) : isPlaying ? (
                <Pause className="w-7 h-7 fill-current" />
              ) : (
                <Play className="w-7 h-7 fill-current mr-0.5" />
              )}
            </button>

            <div>
              <div className="text-xs font-bold text-white">
                {isPlaying ? 'البث المباشر قيد التشغيل' : 'انقر للتشغيل والاستماع'}
              </div>
              <div className="text-[11px] text-stone-400">
                يعمل في الخلفية وعلى قفل الشاشة
              </div>
            </div>
          </div>

          {/* Sleep Timer Selector */}
          <div className="flex items-center gap-2 bg-stone-950 px-3.5 py-2 rounded-2xl border border-stone-800 text-xs text-stone-300">
            <Timer className="w-4 h-4 text-emerald-400" />
            <span className="font-semibold hidden sm:inline">مؤقت النوم:</span>
            <div className="inline-flex items-center gap-1 text-[11px]">
              {[
                { min: null, label: 'إيقاف' },
                { min: 15, label: '15 د' },
                { min: 30, label: '30 د' },
                { min: 60, label: '60 د' },
                { min: 90, label: '90 د' },
              ].map((item) => (
                <button
                  key={item.label}
                  onClick={() => {
                    setSleepTimerMinutes(item.min);
                    if (item.min) {
                      showToast(`تم ضبط مؤقت إيقاف الراديو بعد ${item.min} دقيقة`);
                    } else {
                      showToast('تم إلغاء مؤقت النوم');
                    }
                  }}
                  className={`px-2 py-1 rounded-lg font-bold transition-all cursor-pointer ${
                    sleepTimerMinutes === item.min
                      ? 'bg-emerald-600 text-white shadow-xs'
                      : 'text-stone-400 hover:text-white'
                  }`}
                >
                  {item.label}
                </button>
              ))}
            </div>

            {sleepTimerRemaining !== null && (
              <span className="text-[11px] font-mono text-amber-300 bg-amber-950/60 border border-amber-600/40 px-2 py-0.5 rounded-lg flex items-center gap-1">
                <Clock className="w-3 h-3 text-amber-400" />
                <span>{formatTimerDisplay(sleepTimerRemaining)}</span>
              </span>
            )}
          </div>

          {/* Volume Control */}
          <div className="flex items-center gap-2 bg-stone-950 px-3 py-2 rounded-2xl border border-stone-800">
            <button
              onClick={handleToggleMute}
              className="text-stone-400 hover:text-white transition-colors cursor-pointer"
              title={isMuted ? 'إلغاء الكتم' : 'كتم الصوت'}
            >
              {isMuted || volume === 0 ? (
                <VolumeX className="w-4 h-4 text-rose-400" />
              ) : (
                <Volume2 className="w-4 h-4 text-emerald-400" />
              )}
            </button>
            <input
              type="range"
              min="0"
              max="1"
              step="0.05"
              value={isMuted ? 0 : volume}
              onChange={handleVolumeChange}
              className="w-20 sm:w-24 accent-emerald-500 h-1.5 cursor-pointer"
            />
          </div>
        </div>
      </div>

      {/* Stations Catalog Section */}
      <div className="space-y-4">
        {/* Search & Categories Bar */}
        <div className="p-4 sm:p-5 rounded-3xl bg-stone-900/90 border border-stone-800 space-y-3 w-full max-w-full min-w-0 overflow-x-hidden">
          <div className="flex flex-col sm:flex-row items-center gap-2.5 w-full max-w-full min-w-0">
            {/* Search input */}
            <div className="relative w-full min-w-0">
              <Search className="w-4 h-4 text-stone-400 absolute right-3.5 top-3" />
              <input
                type="text"
                placeholder="ابحث باسم القارئ أو الإذاعة (مثال: العفاسي، المنشاوي، عبد الباسط، المعيقلي، البقرة)..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-stone-950 border border-stone-800 rounded-xl pr-10 pl-4 py-2 text-xs text-white placeholder-stone-500 focus:outline-none focus:border-emerald-500"
              />
            </div>

            {/* Category Filter Pills */}
            <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto min-w-0 max-w-full pb-1 sm:pb-0 no-scrollbar">
              {[
                { id: 'all', label: `الكل (${QURAN_RADIO_STATIONS.length})` },
                { id: 'favorites', label: `المفضلة ⭐ (${favorites.length})` },
                { id: 'general', label: 'الإذاعات العامة' },
                { id: 'reciters', label: 'كبار القراء' },
                { id: 'haramain', label: 'أئمة الحرمين' },
                { id: 'blessing', label: 'الرقية وسورة البقرة' },
                { id: 'riwayah', label: 'ورش' },
              ].map((c) => (
                <button
                  key={c.id}
                  onClick={() => setSelectedCategory(c.id)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-colors cursor-pointer ${
                    selectedCategory === c.id
                      ? 'bg-emerald-600 text-white shadow-xs'
                      : 'bg-stone-950 text-stone-400 hover:text-white border border-stone-800'
                  }`}
                >
                  {c.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Stations Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {filteredStations.map((station) => {
            const isSelected = currentStation.id === station.id;
            const isCurrentlyPlaying = isSelected && isPlaying;
            const isFav = favorites.includes(station.id);

            return (
              <div
                key={station.id}
                onClick={() => handleSelectStation(station)}
                className={`group p-4 rounded-3xl border transition-all text-right cursor-pointer flex flex-col justify-between gap-3 shadow-md ${
                  isSelected
                    ? 'bg-gradient-to-b from-emerald-950/80 to-stone-900 border-emerald-500 ring-2 ring-emerald-500/40 shadow-emerald-950/60'
                    : 'bg-stone-900/70 border-stone-800 hover:bg-stone-850 hover:border-emerald-500/40'
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="w-9 h-9 rounded-xl bg-emerald-950 border border-emerald-500/30 text-emerald-400 flex items-center justify-center shrink-0">
                      <Radio className="w-4 h-4" />
                    </span>
                    <div>
                      <h4 className="font-bold text-sm text-white font-quran leading-snug group-hover:text-emerald-300 transition-colors">
                        {station.nameArabic}
                      </h4>
                      <p className="text-[11px] text-stone-400">{station.reciterArabic}</p>
                    </div>
                  </div>

                  <button
                    onClick={(e) => toggleFavorite(station.id, e)}
                    className="p-1.5 text-stone-500 hover:text-amber-400 transition-colors cursor-pointer"
                    title={isFav ? 'إزالة من المفضلة' : 'إضافة للمفضلة'}
                  >
                    <Star
                      className={`w-4 h-4 ${isFav ? 'fill-amber-400 text-amber-400' : ''}`}
                    />
                  </button>
                </div>

                <p className="text-xs text-stone-300 leading-relaxed line-clamp-2">
                  {station.descriptionArabic}
                </p>

                <div className="flex items-center justify-between pt-2 border-t border-stone-800/80 text-[11px]">
                  <span className="px-2 py-0.5 rounded-full bg-stone-950 text-stone-400 border border-stone-800">
                    {station.badgeArabic}
                  </span>

                  <div className="flex items-center gap-1.5">
                    {isCurrentlyPlaying ? (
                      <span className="text-emerald-400 font-bold flex items-center gap-1 text-xs">
                        <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                        <span>يعمل الآن</span>
                      </span>
                    ) : (
                      <span className="text-stone-400 group-hover:text-white transition-colors font-medium">
                        استماع للبث
                      </span>
                    )}

                    <div
                      className={`w-7 h-7 rounded-full flex items-center justify-center transition-transform group-hover:scale-105 ${
                        isCurrentlyPlaying
                          ? 'bg-emerald-600 text-white'
                          : 'bg-stone-800 text-stone-300 group-hover:bg-emerald-600 group-hover:text-white'
                      }`}
                    >
                      {isCurrentlyPlaying ? (
                        <Pause className="w-3.5 h-3.5 fill-current" />
                      ) : (
                        <Play className="w-3.5 h-3.5 fill-current mr-0.5" />
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {filteredStations.length === 0 && (
          <div className="p-12 text-center text-stone-400 bg-stone-900/60 border border-stone-800 rounded-3xl space-y-2">
            <Radio className="w-8 h-8 text-stone-500 mx-auto" />
            <p className="text-sm font-semibold">لم يتم العثور على محطات مطابقة للبحث.</p>
            <p className="text-xs text-stone-500">جرب البحث بكلمة أخرى مثل: العفاسي، المنشاوي، البقرة، الحرم المكي.</p>
          </div>
        )}
      </div>
    </div>
  );
};
