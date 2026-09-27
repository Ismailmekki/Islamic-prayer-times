import React, { useState, useEffect, useRef } from 'react';
import {
  Volume2,
  VolumeX,
  Play,
  Pause,
  RotateCcw,
  RotateCw,
  SkipBack,
  SkipForward,
  Repeat,
  Search,
  Radio,
  Sparkles,
  Shield,
  Heart,
  Check,
  Disc,
  Sun,
  Moon,
  BookOpen,
  ChevronDown,
  ChevronUp,
  Headphones,
} from 'lucide-react';
import {
  ALL_SURAHS,
  QURAN_RECITERS,
  ROQYAH_TRACKS,
  QuranReciter,
  RoqyahTrack,
  SurahMeta,
  getSurahAudioUrl,
} from '../data/quranData';

export type ReadingTheme = 'light' | 'dark' | 'sepia';

export const QuranReader: React.FC = () => {
  // Mode: Quran vs Roqyah (Both listening only)
  const [activeMode, setActiveMode] = useState<'quran' | 'roqyah'>('quran');

  // Background Theme: Day (light) vs Night (dark) vs Sepia
  const [readingTheme, setReadingTheme] = useState<ReadingTheme>(() => {
    try {
      const saved = localStorage.getItem('salati_quran_theme');
      return (saved as ReadingTheme) || 'dark';
    } catch {
      return 'dark';
    }
  });

  // Reciter State with persistent storage
  const [selectedReciter, setSelectedReciter] = useState<QuranReciter>(() => {
    try {
      const savedId = localStorage.getItem('salati_selected_reciter_id');
      if (savedId) {
        const found = QURAN_RECITERS.find((r) => r.id === savedId);
        if (found) return found;
      }
    } catch {}
    return QURAN_RECITERS[0];
  });

  // Surah & Roqyah State (Listening only)
  const [currentSurah, setCurrentSurah] = useState<SurahMeta>(ALL_SURAHS[0]);
  const [currentRoqyah, setCurrentRoqyah] = useState<RoqyahTrack>(ROQYAH_TRACKS[0]);

  // Audio Playback State
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [currentTime, setCurrentTime] = useState<number>(0);
  const [duration, setDuration] = useState<number>(0);
  const [volume, setVolume] = useState<number>(0.9);
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [playbackSpeed, setPlaybackSpeed] = useState<number>(1);
  const [isLooping, setIsLooping] = useState<boolean>(false);
  const [isLoadingAudio, setIsLoadingAudio] = useState<boolean>(false);

  // Search and Category Filter for Surahs (making all 114 Surahs selectable)
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [surahCategory, setSurahCategory] = useState<'all' | 'popular' | 'juz30' | 'meccan' | 'medinan'>('all');

  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Persist theme
  useEffect(() => {
    try {
      localStorage.setItem('salati_quran_theme', readingTheme);
    } catch {}
  }, [readingTheme]);

  // Persist reciter
  useEffect(() => {
    try {
      localStorage.setItem('salati_selected_reciter_id', selectedReciter.id);
    } catch {}
  }, [selectedReciter]);

  // Filter Surahs by search and category
  const filteredSurahs = ALL_SURAHS.filter((s) => {
    const q = searchQuery.trim().toLowerCase();
    const matchesSearch =
      !q ||
      s.name.includes(q) ||
      s.englishName.toLowerCase().includes(q) ||
      s.number.toString() === q;

    let matchesCategory = true;
    if (surahCategory === 'meccan') {
      matchesCategory = s.revelationType === 'Meccan';
    } else if (surahCategory === 'medinan') {
      matchesCategory = s.revelationType === 'Medinan';
    } else if (surahCategory === 'juz30') {
      matchesCategory = s.number >= 78;
    } else if (surahCategory === 'popular') {
      matchesCategory = [1, 2, 18, 36, 44, 55, 56, 67, 112, 113, 114].includes(s.number);
    }

    return matchesSearch && matchesCategory;
  });

  // Current playing track info
  const currentTitle =
    activeMode === 'quran'
      ? `سورة ${currentSurah.name}`
      : currentRoqyah.titleArabic;

  const currentSubtitle =
    activeMode === 'quran'
      ? `${selectedReciter.nameArabic} · ${currentSurah.revelationType === 'Meccan' ? 'مكية' : 'مدنية'} (${currentSurah.numberOfAyahs} آية)`
      : `${currentRoqyah.reciterArabic} · ${currentRoqyah.badgeArabic}`;

  const currentAudioUrl =
    activeMode === 'quran'
      ? getSurahAudioUrl(currentSurah.number, selectedReciter)
      : currentRoqyah.audioUrl;

  // Initialize or change audio track
  const playTrack = (url: string) => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }

    setIsLoadingAudio(true);
    const audio = new Audio(url);
    audio.crossOrigin = 'anonymous';
    audio.volume = isMuted ? 0 : volume;
    audio.playbackRate = playbackSpeed;
    audio.loop = isLooping;

    audio.onloadedmetadata = () => {
      setDuration(audio.duration || 0);
      setIsLoadingAudio(false);
    };

    audio.ontimeupdate = () => {
      setCurrentTime(audio.currentTime);
      if (audio.duration && !isNaN(audio.duration)) {
        setDuration(audio.duration);
      }
    };

    audio.onended = () => {
      if (!isLooping) {
        if (activeMode === 'quran') {
          handleNextSurah();
        } else {
          setIsPlaying(false);
        }
      }
    };

    audio.onerror = () => {
      setIsLoadingAudio(false);
      setIsPlaying(false);
    };

    audio
      .play()
      .then(() => {
        setIsPlaying(true);
        setIsLoadingAudio(false);
      })
      .catch(() => {
        setIsLoadingAudio(false);
        setIsPlaying(false);
      });

    audioRef.current = audio;
  };

  const handleTogglePlay = () => {
    if (!audioRef.current) {
      playTrack(currentAudioUrl);
      return;
    }

    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      audioRef.current
        .play()
        .then(() => setIsPlaying(true))
        .catch(() => setIsPlaying(false));
    }
  };

  const handleSelectSurah = (surah: SurahMeta) => {
    setCurrentSurah(surah);
    setActiveMode('quran');
    const url = getSurahAudioUrl(surah.number, selectedReciter);
    playTrack(url);
  };

  const handleSelectRoqyah = (track: RoqyahTrack) => {
    setCurrentRoqyah(track);
    setActiveMode('roqyah');
    playTrack(track.audioUrl);
  };

  const handleNextSurah = () => {
    const nextNum = currentSurah.number >= 114 ? 1 : currentSurah.number + 1;
    const next = ALL_SURAHS.find((s) => s.number === nextNum) || ALL_SURAHS[0];
    handleSelectSurah(next);
  };

  const handlePrevSurah = () => {
    const prevNum = currentSurah.number <= 1 ? 114 : currentSurah.number - 1;
    const prev = ALL_SURAHS.find((s) => s.number === prevNum) || ALL_SURAHS[113];
    handleSelectSurah(prev);
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const time = parseFloat(e.target.value);
    setCurrentTime(time);
    if (audioRef.current) {
      audioRef.current.currentTime = time;
    }
  };

  const handleSkip = (seconds: number) => {
    if (audioRef.current) {
      audioRef.current.currentTime = Math.max(
        0,
        Math.min(duration, audioRef.current.currentTime + seconds)
      );
    }
  };

  const handleSpeedChange = (speed: number) => {
    setPlaybackSpeed(speed);
    if (audioRef.current) {
      audioRef.current.playbackRate = speed;
    }
  };

  const handleToggleLoop = () => {
    const next = !isLooping;
    setIsLooping(next);
    if (audioRef.current) {
      audioRef.current.loop = next;
    }
  };

  const handleToggleMute = () => {
    const next = !isMuted;
    setIsMuted(next);
    if (audioRef.current) {
      audioRef.current.volume = next ? 0 : volume;
    }
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseFloat(e.target.value);
    setVolume(val);
    setIsMuted(val === 0);
    if (audioRef.current) {
      audioRef.current.volume = val;
    }
  };

  const formatTime = (sec: number) => {
    if (isNaN(sec) || sec <= 0) return '00:00';
    const hrs = Math.floor(sec / 3600);
    const mins = Math.floor((sec % 3600) / 60);
    const secs = Math.floor(sec % 60);

    const m = mins.toString().padStart(2, '0');
    const s = secs.toString().padStart(2, '0');
    if (hrs > 0) {
      return `${hrs}:${m}:${s}`;
    }
    return `${m}:${s}`;
  };

  useEffect(() => {
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
    };
  }, []);

  // Theme container classes
  const getThemeClass = () => {
    switch (readingTheme) {
      case 'light':
        return 'bg-[#fcfaf5] text-stone-900 border-[#e3dac1]';
      case 'sepia':
        return 'bg-[#f5ede0] text-[#3e2c1c] border-[#d8c8ab]';
      case 'dark':
      default:
        return 'bg-stone-900 text-stone-100 border-stone-800';
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner: Listening Only Badge */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-emerald-950 via-stone-900 to-stone-900 border border-emerald-500/30 p-6 sm:p-8">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2 text-right">
            <div className="flex items-center gap-2 text-emerald-400 text-xs font-semibold">
              <Headphones className="w-4 h-4 animate-pulse" />
              <span>استماع فقط · القرآن الكريم كاملاً والرقية الشرعية</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-bold text-white font-quran">
              مشغّل تلاوة القرآن الكريم (استماع فقط)
            </h2>
            <p className="text-xs sm:text-sm text-stone-300 max-w-2xl leading-relaxed">
              استماع نقي لجميع سور القرآن الكريم الـ 114 بأصوات 24 من نخبة كبار القراء، مع تسجيلات الرقية الشرعية المطولة الشاملة بدون إعلانات أو نصوص مشتتة.
            </p>
          </div>

          {/* Mode Switcher Tabs */}
          <div className="flex items-center gap-2 p-1.5 bg-stone-950/80 rounded-2xl border border-stone-800 self-start md:self-auto shrink-0">
            <button
              onClick={() => setActiveMode('quran')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-colors cursor-pointer flex items-center gap-1.5 ${
                activeMode === 'quran'
                  ? 'bg-emerald-600 text-white shadow-md shadow-emerald-700/40'
                  : 'text-stone-400 hover:text-white'
              }`}
            >
              <Disc className="w-3.5 h-3.5" />
              <span>القرآن (114 سورة - استماع)</span>
            </button>
            <button
              onClick={() => setActiveMode('roqyah')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-colors cursor-pointer flex items-center gap-1.5 ${
                activeMode === 'roqyah'
                  ? 'bg-emerald-600 text-white shadow-md shadow-emerald-700/40'
                  : 'text-stone-400 hover:text-white'
              }`}
            >
              <Shield className="w-3.5 h-3.5" />
              <span>الرقية الشرعية (استماع)</span>
            </button>
          </div>
        </div>
      </div>

      {/* Lighting / Background Mode Switcher (Day vs Night vs Warm Sepia) */}
      <div className="p-3.5 rounded-2xl bg-stone-900/90 border border-stone-800 flex flex-wrap items-center justify-between gap-3 text-right">
        <div className="flex items-center gap-2 text-xs font-semibold text-stone-300">
          <span>وضع الإضاءة للمشغل:</span>
          <div className="inline-flex items-center p-1 rounded-xl bg-stone-950 border border-stone-800 gap-1">
            <button
              onClick={() => setReadingTheme('light')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer ${
                readingTheme === 'light'
                  ? 'bg-amber-100 text-stone-900 shadow-sm border border-amber-300'
                  : 'text-stone-400 hover:text-white'
              }`}
              title="الوضع النهاري"
            >
              <Sun className="w-3.5 h-3.5 text-amber-500" />
              <span>نهاري</span>
            </button>

            <button
              onClick={() => setReadingTheme('dark')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer ${
                readingTheme === 'dark'
                  ? 'bg-emerald-950 text-emerald-300 border border-emerald-500/50 shadow-sm'
                  : 'text-stone-400 hover:text-white'
              }`}
              title="الوضع الليلي"
            >
              <Moon className="w-3.5 h-3.5 text-emerald-400" />
              <span>ليلي</span>
            </button>

            <button
              onClick={() => setReadingTheme('sepia')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer ${
                readingTheme === 'sepia'
                  ? 'bg-[#e8d8b4] text-[#4d3319] border border-[#c4aa79] shadow-sm'
                  : 'text-stone-400 hover:text-white'
              }`}
              title="وضع الورق الدافئ"
            >
              <BookOpen className="w-3.5 h-3.5 text-amber-700" />
              <span>ورقي دافئ</span>
            </button>
          </div>
        </div>

        <div className="text-xs text-stone-400 font-sans flex items-center gap-2">
          <span>السورة الحالية للاستماع: </span>
          <strong className="text-emerald-400 font-bold">{currentTitle}</strong>
        </div>
      </div>

      {/* Reciter Selector Section (قائمة اختيار القراء مع زيادة القراء 24 مقرئ) */}
      {activeMode === 'quran' && (
        <div className="p-4 sm:p-5 rounded-3xl bg-stone-900/90 border border-stone-800 space-y-3.5 text-right">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-stone-800/80 pb-3">
            <div className="space-y-1">
              <h4 className="text-sm font-bold text-white flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-emerald-400" />
                <span>اختر المقرئ المفضل للاستماع:</span>
                <span className="text-[10px] bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 px-2 py-0.5 rounded-full font-sans">
                  {QURAN_RECITERS.length} مقرئ متاح
                </span>
              </h4>
              <p className="text-[11px] text-stone-400">
                المقرئ النشط حالياً:{' '}
                <strong className="text-emerald-400 font-bold">{selectedReciter.nameArabic}</strong>{' '}
                <span className="text-stone-500">({selectedReciter.styleArabic})</span>
              </p>
            </div>

            {/* Direct Reciter Select Dropdown */}
            <div className="flex items-center gap-2 self-start sm:self-auto">
              <span className="text-xs font-bold text-stone-300 whitespace-nowrap">المقرئ:</span>
              <div className="relative">
                <select
                  value={selectedReciter.id}
                  onChange={(e) => {
                    const found = QURAN_RECITERS.find((r) => r.id === e.target.value);
                    if (found) {
                      setSelectedReciter(found);
                      if (isPlaying) {
                        playTrack(getSurahAudioUrl(currentSurah.number, found));
                      }
                    }
                  }}
                  className="bg-stone-950 border border-stone-700 hover:border-emerald-500 text-stone-200 text-xs rounded-xl px-3 py-2 pr-8 appearance-none cursor-pointer focus:outline-none focus:border-emerald-500 transition-colors w-60 sm:w-72"
                >
                  {QURAN_RECITERS.map((r) => (
                    <option key={r.id} value={r.id} className="bg-stone-900 text-white">
                      {r.nameArabic} - {r.styleArabic}
                    </option>
                  ))}
                </select>
                <ChevronDown className="w-3.5 h-3.5 text-stone-400 absolute left-2.5 top-3 pointer-events-none" />
              </div>
            </div>
          </div>

          {/* Quick Choice Pills of Popular Reciters */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar">
            <span className="text-[11px] text-stone-400 whitespace-nowrap ml-1 font-semibold">
              شائع:
            </span>
            {QURAN_RECITERS.slice(0, 8).map((r) => {
              const isSelected = selectedReciter.id === r.id;
              return (
                <button
                  key={r.id}
                  onClick={() => {
                    setSelectedReciter(r);
                    if (isPlaying) {
                      playTrack(getSurahAudioUrl(currentSurah.number, r));
                    }
                  }}
                  className={`px-2.5 py-1 rounded-xl text-[11px] font-medium whitespace-nowrap border transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-emerald-600 text-white border-emerald-500 font-bold shadow-xs'
                      : 'bg-stone-950/70 border-stone-800 text-stone-300 hover:bg-stone-800 hover:text-white'
                  }`}
                >
                  {r.nameArabic.replace('الشيخ ', '')}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Primary Audio Player Deck */}
      <div className={`rounded-3xl border transition-colors duration-300 p-5 sm:p-7 shadow-2xl space-y-5 text-right ${getThemeClass()}`}>
        {/* Track Title and Reciter Info */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-current/10 pb-4">
          <div className="flex items-center gap-4">
            {/* Audio Disc Graphic */}
            <div
              className={`w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 border ${
                isPlaying
                  ? 'bg-emerald-600/30 border-emerald-400 text-emerald-400 animate-spin'
                  : 'bg-black/10 border-current/20 opacity-80'
              }`}
              style={{ animationDuration: '8s' }}
            >
              <Disc className="w-7 h-7" />
            </div>

            <div>
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-bold px-2 py-0.5 rounded-md bg-emerald-950 text-emerald-300 border border-emerald-500/30">
                  {activeMode === 'quran' ? 'استماع القرآن الكريم' : 'استماع الرقية الشرعية'}
                </span>
                {isPlaying && (
                  <span className="text-[10px] text-amber-400 flex items-center gap-1 animate-pulse font-medium">
                    <span className="w-2 h-2 rounded-full bg-amber-400" />
                    جارٍ الاستماع...
                  </span>
                )}
              </div>
              <h3 className="text-xl sm:text-2xl font-bold font-quran mt-1">
                {currentTitle}
              </h3>
              <p className="text-xs opacity-75 mt-0.5">{currentSubtitle}</p>
            </div>
          </div>

          {/* Sound waves visualizer */}
          {isPlaying && (
            <div className="flex items-center gap-1 sm:self-center">
              {[30, 80, 50, 95, 65, 100, 75, 45, 90, 60, 85, 40].map((h, i) => (
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

        {/* Seekable Progress Bar */}
        <div className="space-y-1.5">
          <input
            type="range"
            min="0"
            max={duration || 100}
            step="0.5"
            value={currentTime}
            onChange={handleSeek}
            className="w-full accent-emerald-500 cursor-pointer h-2 rounded-lg bg-black/10 appearance-none"
          />
          <div className="flex items-center justify-between text-[11px] font-mono opacity-70">
            <span>{formatTime(currentTime)}</span>
            <span>{formatTime(duration)}</span>
          </div>
        </div>

        {/* Player Controls Deck */}
        <div className="flex flex-wrap items-center justify-between gap-4 pt-2">
          {/* Left: Quick speed & loop */}
          <div className="flex items-center gap-1.5">
            <button
              onClick={handleToggleLoop}
              className={`p-2 rounded-xl border text-xs font-semibold flex items-center gap-1 transition-colors cursor-pointer ${
                isLooping
                  ? 'bg-emerald-600 text-white border-emerald-500 shadow-sm'
                  : 'bg-black/5 hover:bg-black/10 border-current/20 opacity-80'
              }`}
              title={isLooping ? 'إلغاء التكرار' : 'تكرار السورة تلقائياً'}
            >
              <Repeat className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">تكرار</span>
            </button>

            {/* Playback Speed selector */}
            <div className="flex items-center bg-black/5 rounded-xl border border-current/20 p-0.5 text-[11px] font-mono">
              {[1, 1.25, 1.5].map((spd) => (
                <button
                  key={spd}
                  onClick={() => handleSpeedChange(spd)}
                  className={`px-2 py-1 rounded-lg transition-colors cursor-pointer ${
                    playbackSpeed === spd
                      ? 'bg-emerald-600 text-white font-bold'
                      : 'opacity-70 hover:opacity-100'
                  }`}
                >
                  {spd}x
                </button>
              ))}
            </div>
          </div>

          {/* Center: Main Transport Buttons */}
          <div className="flex items-center gap-3">
            {activeMode === 'quran' && (
              <button
                onClick={handlePrevSurah}
                className="p-2.5 rounded-xl bg-black/5 hover:bg-black/10 border border-current/20 transition-colors cursor-pointer"
                title="السورة السابقة"
              >
                <SkipBack className="w-4 h-4" />
              </button>
            )}

            <button
              onClick={() => handleSkip(-10)}
              className="p-2 rounded-xl bg-black/5 hover:bg-black/10 border border-current/20 transition-colors cursor-pointer"
              title="ترجيع 10 ثوانٍ"
            >
              <RotateCcw className="w-4 h-4" />
            </button>

            <button
              onClick={handleTogglePlay}
              disabled={isLoadingAudio}
              className="w-14 h-14 rounded-full bg-emerald-600 hover:bg-emerald-500 text-white flex items-center justify-center shadow-lg shadow-emerald-700/40 transition-transform active:scale-95 cursor-pointer"
              title={isPlaying ? 'إيقاف مؤقت' : 'تشغيل التلاوة'}
            >
              {isLoadingAudio ? (
                <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : isPlaying ? (
                <Pause className="w-6 h-6 fill-current" />
              ) : (
                <Play className="w-6 h-6 fill-current mr-0.5" />
              )}
            </button>

            <button
              onClick={() => handleSkip(10)}
              className="p-2 rounded-xl bg-black/5 hover:bg-black/10 border border-current/20 transition-colors cursor-pointer"
              title="تقديم 10 ثوانٍ"
            >
              <RotateCw className="w-4 h-4" />
            </button>

            {activeMode === 'quran' && (
              <button
                onClick={handleNextSurah}
                className="p-2.5 rounded-xl bg-black/5 hover:bg-black/10 border border-current/20 transition-colors cursor-pointer"
                title="السورة التالية"
              >
                <SkipForward className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Right: Volume Slider */}
          <div className="flex items-center gap-2 bg-black/5 px-3 py-1.5 rounded-xl border border-current/20">
            <button
              onClick={handleToggleMute}
              className="opacity-70 hover:opacity-100 transition-colors cursor-pointer"
            >
              {isMuted || volume === 0 ? (
                <VolumeX className="w-4 h-4" />
              ) : (
                <Volume2 className="w-4 h-4 text-emerald-500" />
              )}
            </button>
            <input
              type="range"
              min="0"
              max="1"
              step="0.05"
              value={isMuted ? 0 : volume}
              onChange={handleVolumeChange}
              className="w-16 sm:w-20 accent-emerald-500 h-1.5 cursor-pointer"
            />
          </div>
        </div>
      </div>

      {/* ========================================================= */}
      {/* 114 Surahs Audio Catalog (جميع السور اختيارية - استماع)    */}
      {/* ========================================================= */}
      {activeMode === 'quran' && (
        <div className="space-y-4 text-right">
          {/* Header & Direct Surah Dropdown Selector Panel */}
          <div className="p-4 sm:p-5 rounded-3xl bg-stone-900/90 border border-stone-800 space-y-3.5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-stone-800/80 pb-3">
              <div className="space-y-0.5">
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <Disc className="w-4 h-4 text-emerald-400" />
                  <span>قائمة سور القرآن الكريم (114 سورة اختيارية - استماع كامل)</span>
                </h3>
                <p className="text-xs text-stone-400">
                  السورة المختارة حالياً:{' '}
                  <strong className="text-emerald-400 font-bold">سورة {currentSurah.name}</strong>{' '}
                  <span className="text-stone-500">
                    ({currentSurah.numberOfAyahs} آية · {currentSurah.revelationType === 'Meccan' ? 'مكية' : 'مدنية'})
                  </span>
                </p>
              </div>

              {/* Direct Surah Select Dropdown (اجعل كل السور اختيارية) */}
              <div className="flex items-center gap-2 self-start sm:self-auto">
                <span className="text-xs font-bold text-stone-300 whitespace-nowrap">اختر السورة:</span>
                <div className="relative">
                  <select
                    value={currentSurah.number}
                    onChange={(e) => {
                      const num = parseInt(e.target.value, 10);
                      const found = ALL_SURAHS.find((s) => s.number === num);
                      if (found) {
                        handleSelectSurah(found);
                      }
                    }}
                    className="bg-stone-950 border border-stone-700 hover:border-emerald-500 text-stone-200 text-xs rounded-xl px-3 py-2 pr-8 appearance-none cursor-pointer focus:outline-none focus:border-emerald-500 transition-colors w-56 sm:w-64"
                  >
                    {ALL_SURAHS.map((s) => (
                      <option key={s.number} value={s.number} className="bg-stone-900 text-white">
                        {s.number.toString().padStart(3, '0')} - سورة {s.name} ({s.numberOfAyahs} آية - {s.revelationType === 'Meccan' ? 'مكية' : 'مدنية'})
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="w-3.5 h-3.5 text-stone-400 absolute left-2.5 top-3 pointer-events-none" />
                </div>
              </div>
            </div>

            {/* Quick Choice Buttons for Common / Most Popular Surahs */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1.5 no-scrollbar">
              <span className="text-[11px] text-stone-400 whitespace-nowrap ml-1 font-semibold">
                اختيار سريع:
              </span>
              {[
                { number: 1, name: 'الفاتحة' },
                { number: 2, name: 'البقرة' },
                { number: 18, name: 'الكهف' },
                { number: 36, name: 'يس' },
                { number: 55, name: 'الرحمن' },
                { number: 56, name: 'الواقعة' },
                { number: 67, name: 'الملك' },
                { number: 112, name: 'الإخلاص' },
                { number: 113, name: 'الفلق' },
                { number: 114, name: 'الناس' },
              ].map((item) => {
                const isSelected = currentSurah.number === item.number;
                return (
                  <button
                    key={item.number}
                    onClick={() => {
                      const found = ALL_SURAHS.find((s) => s.number === item.number);
                      if (found) handleSelectSurah(found);
                    }}
                    className={`px-2.5 py-1 rounded-xl text-[11px] font-medium whitespace-nowrap border transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-emerald-600 text-white border-emerald-500 font-bold shadow-xs'
                        : 'bg-stone-950/70 border-stone-800 text-stone-300 hover:bg-stone-800 hover:text-white'
                    }`}
                  >
                    سورة {item.name}
                  </button>
                );
              })}
            </div>

            {/* Filter Categories & Search Bar */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1">
              {/* Category Pills */}
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar">
                {[
                  { id: 'all', label: 'جميع السور (114)' },
                  { id: 'popular', label: 'الأكثر استماعاً' },
                  { id: 'juz30', label: 'قصار السور (جزء عم)' },
                  { id: 'meccan', label: 'مكية (86)' },
                  { id: 'medinan', label: 'مدنية (28)' },
                ].map((cat) => (
                  <button
                    key={cat.id}
                    onClick={() => setSurahCategory(cat.id as any)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors cursor-pointer border ${
                      surahCategory === cat.id
                        ? 'bg-emerald-700 text-white border-emerald-500 font-bold shadow-xs'
                        : 'bg-stone-950 text-stone-400 border-stone-800 hover:text-white'
                    }`}
                  >
                    {cat.label}
                  </button>
                ))}
              </div>

              {/* Search Bar */}
              <div className="relative w-full sm:w-72">
                <Search className="w-3.5 h-3.5 text-stone-400 absolute right-3 top-2.5" />
                <input
                  type="text"
                  placeholder="ابحث باسم السورة أو رقمها..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-3 pr-9 py-2 rounded-xl bg-stone-950 border border-stone-700 text-xs text-white placeholder-stone-400 focus:outline-none focus:border-emerald-500"
                />
              </div>
            </div>
          </div>

          {/* 114 Surahs Selectable Cards Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
            {filteredSurahs.map((surah) => {
              const isSelected = currentSurah.number === surah.number && activeMode === 'quran';
              const isCurrentlyPlaying = isSelected && isPlaying;

              return (
                <button
                  key={surah.number}
                  onClick={() => handleSelectSurah(surah)}
                  className={`p-3.5 rounded-2xl border text-right flex items-center justify-between transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-emerald-950/80 border-emerald-500 text-emerald-300 shadow-md shadow-emerald-950/40 ring-1 ring-emerald-500/50'
                      : 'bg-stone-900/60 hover:bg-stone-800/80 border-stone-800 hover:border-emerald-500/40 text-stone-200'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-10 h-10 rounded-xl flex items-center justify-center text-xs font-bold tabular-nums shrink-0 border ${
                        isCurrentlyPlaying
                          ? 'bg-emerald-600 text-white border-emerald-400 animate-pulse'
                          : isSelected
                          ? 'bg-emerald-900 text-emerald-300 border-emerald-500/50'
                          : 'bg-stone-950 text-emerald-400 border-stone-800'
                      }`}
                    >
                      {isCurrentlyPlaying ? (
                        <Volume2 className="w-4 h-4 animate-bounce" />
                      ) : (
                        surah.number
                      )}
                    </div>

                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className="font-bold text-sm font-quran text-white">
                          سورة {surah.name}
                        </span>
                        {isSelected && (
                          <span className="text-[10px] text-emerald-300 bg-emerald-500/20 px-1.5 py-0.2 rounded border border-emerald-500/30">
                            مختارة
                          </span>
                        )}
                      </div>
                      <div className="text-[11px] text-stone-400">
                        {surah.englishName} · {surah.numberOfAyahs} آية
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="text-[10px] px-2 py-0.5 rounded-md bg-stone-800/80 text-stone-300 font-medium">
                      {surah.revelationType === 'Meccan' ? 'مكية' : 'مدنية'}
                    </span>
                    <div className="p-1.5 rounded-lg bg-stone-800/80 text-emerald-400">
                      {isCurrentlyPlaying ? (
                        <Pause className="w-3.5 h-3.5 fill-current" />
                      ) : (
                        <Play className="w-3.5 h-3.5 fill-current" />
                      )}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* Roqyah Shariah Mode (استماع الرقية الشرعية)                */}
      {/* ========================================================= */}
      {activeMode === 'roqyah' && (
        <div className="space-y-4 text-right">
          <div className="p-5 rounded-2xl bg-emerald-950/30 border border-emerald-500/30 text-xs text-stone-300 leading-relaxed flex items-start gap-3">
            <Shield className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
            <div>
              <strong className="text-emerald-300 font-bold block mb-1">
                فضل وأهمية الرقية الشرعية من الكتاب والسنة (استماع كامل):
              </strong>
              قال تعالى: ﴿وَنُنَزِّلُ مِنَ الْقُرْآنِ مَا هُوَ شِفَاءٌ وَرَحْمَةٌ لِّلْمُؤْمِنِينَ﴾. الرقية الشرعية سبب مشروع للشفاء وطرد وساوس الشياطين وجلب الطمأنينة والسكينة للمؤمن وأهل بيته.
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {ROQYAH_TRACKS.map((track) => {
              const isSelected = currentRoqyah.id === track.id && activeMode === 'roqyah';
              const isCurrentlyPlaying = isSelected && isPlaying;

              return (
                <div
                  key={track.id}
                  onClick={() => handleSelectRoqyah(track)}
                  className={`p-5 rounded-2xl border transition-all text-right cursor-pointer space-y-3 ${
                    isSelected
                      ? 'bg-gradient-to-l from-emerald-950/80 to-stone-900 border-emerald-500 shadow-xl'
                      : 'bg-stone-900/60 border-stone-800 hover:bg-stone-800/80 hover:border-emerald-500/40'
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 border ${
                          isCurrentlyPlaying
                            ? 'bg-emerald-600 text-white border-emerald-400 animate-pulse'
                            : 'bg-stone-800 text-emerald-400 border-stone-700'
                        }`}
                      >
                        {isCurrentlyPlaying ? (
                          <Volume2 className="w-6 h-6 animate-bounce" />
                        ) : (
                          <Shield className="w-6 h-6" />
                        )}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="font-bold text-base text-white">{track.titleArabic}</h4>
                          <span className="text-[10px] bg-amber-950 text-amber-300 border border-amber-600/40 px-1.5 py-0.5 rounded-md">
                            {track.badgeArabic}
                          </span>
                        </div>
                        <div className="text-xs text-stone-400 mt-0.5">
                          بصوت: <strong className="text-emerald-400">{track.reciterArabic}</strong> · المدة:{' '}
                          <span className="font-mono tabular-nums">{track.durationFormatted}</span>
                        </div>
                      </div>
                    </div>

                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleSelectRoqyah(track);
                      }}
                      className={`p-3 rounded-xl transition-transform active:scale-95 shadow-md ${
                        isCurrentlyPlaying
                          ? 'bg-amber-600 text-white'
                          : 'bg-emerald-600 hover:bg-emerald-500 text-white'
                      }`}
                    >
                      {isCurrentlyPlaying ? (
                        <Pause className="w-4 h-4 fill-current" />
                      ) : (
                        <Play className="w-4 h-4 fill-current mr-0.5" />
                      )}
                    </button>
                  </div>

                  <p className="text-xs text-stone-300 leading-relaxed border-t border-stone-800/80 pt-2.5">
                    {track.descriptionArabic}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
