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
  Clock,
  Timer,
  AlertCircle,
  RefreshCw,
  FileText,
  UserCheck,
  Download,
  CheckCircle2,
  Server,
  GraduationCap,
  Users,
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
import { MushafPageReader } from './MushafPageReader';
import { TafsirSection } from './TafsirSection';
import { QuranMemorizer } from './QuranMemorizer';
import { KhatmahManager } from './KhatmahManager';
import { EducationalTafsirModal } from './EducationalTafsirModal';
import { QuranRadio } from './QuranRadio';
import { tafsirService } from '../services/tafsirService';

export type ReadingTheme = 'light' | 'dark' | 'sepia';
export type QuranReaderMode = 'mushaf' | 'tafsir' | 'memorize' | 'khatmah' | 'quran' | 'roqyah' | 'radio';

export const QuranReader: React.FC = () => {
  // Mode: 'mushaf' | 'tafsir' | 'memorize' | 'khatmah' | 'quran' | 'roqyah'
  const [activeMode, setActiveMode] = useState<QuranReaderMode>('mushaf');

  // Background Theme: Day (light) vs Night (dark) vs Sepia
  const [readingTheme, setReadingTheme] = useState<ReadingTheme>(() => {
    try {
      const saved = localStorage.getItem('salati_quran_theme');
      return (saved as ReadingTheme) || 'dark';
    } catch {
      return 'dark';
    }
  });

  // Reciter State with persistent storage for Quran
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

  // Surah & Roqyah State
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
  const [audioError, setAudioError] = useState<string | null>(null);

  // Sleep Timer State (minutes)
  const [sleepTimerMinutes, setSleepTimerMinutes] = useState<number | null>(null);
  const [sleepTimerRemaining, setSleepTimerRemaining] = useState<number | null>(null);

  // Search and Filter states
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [surahCategory, setSurahCategory] = useState<'all' | 'popular' | 'juz30' | 'meccan' | 'medinan'>('all');
  const [roqyahCategory, setRoqyahCategory] = useState<string>('all');
  const [roqyahSearch, setRoqyahSearch] = useState<string>('');
  const [showWrittenRuqyah, setShowWrittenRuqyah] = useState<boolean>(false);

  // Audio Engine & Download States
  const [downloadingTrackId, setDownloadingTrackId] = useState<string | null>(null);
  const [downloadToast, setDownloadToast] = useState<string | null>(null);
  const [activeMirrorIndex, setActiveMirrorIndex] = useState<number>(0);

  // Educational Tafsir Modal State
  const [educationalModalVerseKey, setEducationalModalVerseKey] = useState<string | null>(null);
  const [educationalModalVerseText, setEducationalModalVerseText] = useState<string | undefined>(undefined);

  // Surah Verses List for Interactive Reading & Educational Tafsir
  const [surahVerses, setSurahVerses] = useState<
    Array<{ verseKey: string; ayahNumber: number; text: string; surahNumber: number }>
  >([]);
  const [isLoadingSurahVerses, setIsLoadingSurahVerses] = useState<boolean>(false);
  const [showSurahVerses, setShowSurahVerses] = useState<boolean>(true);

  // Fetch Surah Verses when currentSurah changes
  useEffect(() => {
    let isCancelled = false;
    setIsLoadingSurahVerses(true);
    tafsirService.getVersesForSurah(currentSurah.number).then((verses) => {
      if (!isCancelled) {
        setSurahVerses(verses);
        setIsLoadingSurahVerses(false);
      }
    });
    return () => {
      isCancelled = true;
    };
  }, [currentSurah.number]);

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const watchdogTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Helper to retrieve all accessible mirrors for a Ruqyah track
  const getTrackMirrors = (track: RoqyahTrack): string[] => {
    const list: string[] = [track.audioUrl];
    if (track.fallbackAudioUrl) list.push(track.fallbackAudioUrl);
    if (track.alternativeMirrors) list.push(...track.alternativeMirrors);
    return Array.from(new Set(list));
  };

  // Cleanup audio & timer on unmount
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
      } else {
        setSleepTimerRemaining(remaining);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [sleepTimerMinutes]);

  // Filter Surahs
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

  // Filter Roqyah tracks
  const filteredRoqyah = ROQYAH_TRACKS.filter((t) => {
    const q = roqyahSearch.trim().toLowerCase();
    const matchesSearch =
      !q ||
      t.titleArabic.toLowerCase().includes(q) ||
      t.reciterArabic.toLowerCase().includes(q) ||
      t.descriptionArabic.toLowerCase().includes(q) ||
      t.badgeArabic.toLowerCase().includes(q);

    const matchesCategory =
      roqyahCategory === 'all' || t.categoryArabic === roqyahCategory;

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
      : (getTrackMirrors(currentRoqyah)[activeMirrorIndex] || currentRoqyah.audioUrl);

  // Next / Prev Roqyah reciter
  const handlePrevRoqyah = () => {
    const currentIndex = ROQYAH_TRACKS.findIndex((t) => t.id === currentRoqyah.id);
    const prevIndex = currentIndex <= 0 ? ROQYAH_TRACKS.length - 1 : currentIndex - 1;
    handleSelectRoqyah(ROQYAH_TRACKS[prevIndex]);
  };

  const handleNextRoqyah = () => {
    const currentIndex = ROQYAH_TRACKS.findIndex((t) => t.id === currentRoqyah.id);
    const nextIndex = currentIndex >= ROQYAH_TRACKS.length - 1 ? 0 : currentIndex + 1;
    handleSelectRoqyah(ROQYAH_TRACKS[nextIndex]);
  };

  // Next / Prev Surah
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

  // Initialize or change audio track with robust fallback, watchdog, and failover
  const playTrack = (
    url: string,
    isFallback = false,
    forcedMirrorIndex?: number,
    targetTrack?: RoqyahTrack
  ) => {
    if (watchdogTimerRef.current) {
      clearTimeout(watchdogTimerRef.current);
      watchdogTimerRef.current = null;
    }

    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.src = '';
    }

    setAudioError(null);
    setIsLoadingAudio(true);

    const trackToUse = targetTrack || currentRoqyah;
    const mirrors = getTrackMirrors(trackToUse);
    const currentMirrorIdx = forcedMirrorIndex !== undefined ? forcedMirrorIndex : activeMirrorIndex;

    const audio = new Audio();
    audio.src = url;
    audio.preload = 'auto';
    audio.volume = isMuted ? 0 : volume;
    audio.playbackRate = playbackSpeed;
    audio.loop = isLooping;

    // Safety Watchdog: If audio stalls or takes > 5.5s to start, auto-failover to next mirror
    watchdogTimerRef.current = setTimeout(() => {
      if (activeMode === 'roqyah' && audio.readyState < 2) {
        const nextIdx = (currentMirrorIdx + 1) % mirrors.length;
        if (nextIdx !== currentMirrorIdx && mirrors[nextIdx]) {
          setActiveMirrorIndex(nextIdx);
          playTrack(mirrors[nextIdx], true, nextIdx, trackToUse);
        }
      }
    }, 5500);

    audio.onloadedmetadata = () => {
      setDuration(audio.duration || 0);
      setIsLoadingAudio(false);
    };

    audio.oncanplay = () => {
      if (watchdogTimerRef.current) {
        clearTimeout(watchdogTimerRef.current);
        watchdogTimerRef.current = null;
      }
      setIsLoadingAudio(false);
      setAudioError(null);
    };

    audio.onplaying = () => {
      if (watchdogTimerRef.current) {
        clearTimeout(watchdogTimerRef.current);
        watchdogTimerRef.current = null;
      }
      setIsLoadingAudio(false);
      setIsPlaying(true);
      setAudioError(null);
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
          handleNextRoqyah();
        }
      }
    };

    audio.onerror = () => {
      if (watchdogTimerRef.current) {
        clearTimeout(watchdogTimerRef.current);
        watchdogTimerRef.current = null;
      }
      setIsLoadingAudio(false);
      setIsPlaying(false);

      // Attempt next mirror automatically if in Roqyah mode
      if (activeMode === 'roqyah') {
        const nextIdx = (currentMirrorIdx + 1) % mirrors.length;
        if (nextIdx !== currentMirrorIdx && mirrors[nextIdx]) {
          setActiveMirrorIndex(nextIdx);
          playTrack(mirrors[nextIdx], true, nextIdx, trackToUse);
          return;
        }
      }

      setAudioError(
        'تعذر تحميل البث الصوتي مؤقتاً بسبب بطء الاتصال أو قيود الشبكة. يرجى الضغط على زر إعادة المحاولة أو تبديل الخادم الصوتي.'
      );
    };

    audio
      .play()
      .then(() => {
        setIsPlaying(true);
        setIsLoadingAudio(false);
        setAudioError(null);
      })
      .catch((err) => {
        setIsLoadingAudio(false);
        if (err.name !== 'AbortError') {
          // Playback couldn't start automatically (e.g. browser autoplay policy)
          setIsPlaying(false);
        }
      });

    audioRef.current = audio;

    // MediaSession Background Integration
    if ('mediaSession' in navigator) {
      try {
        navigator.mediaSession.metadata = new MediaMetadata({
          title: activeMode === 'quran' ? `سورة ${currentSurah.name}` : trackToUse.titleArabic,
          artist: activeMode === 'quran' ? selectedReciter.nameArabic : trackToUse.reciterArabic,
          album: activeMode === 'quran' ? 'القرآن الكريم كاملاً' : 'الرقية الشرعية الشاملة',
        });
        navigator.mediaSession.setActionHandler('play', handleTogglePlay);
        navigator.mediaSession.setActionHandler('pause', handleTogglePlay);
        navigator.mediaSession.setActionHandler('previoustrack', activeMode === 'quran' ? handlePrevSurah : handlePrevRoqyah);
        navigator.mediaSession.setActionHandler('nexttrack', activeMode === 'quran' ? handleNextSurah : handleNextRoqyah);
      } catch {}
    }
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
        .then(() => {
          setIsPlaying(true);
          setAudioError(null);
        })
        .catch(() => {
          setIsPlaying(false);
          playTrack(currentAudioUrl);
        });
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
    setActiveMirrorIndex(0);
    playTrack(track.audioUrl, false, 0, track);
  };

  // Switch between audio mirrors for Ruqyah
  const handleSwitchMirror = () => {
    if (activeMode !== 'roqyah') return;
    const mirrors = getTrackMirrors(currentRoqyah);
    if (mirrors.length <= 1) return;
    const nextIdx = (activeMirrorIndex + 1) % mirrors.length;
    setActiveMirrorIndex(nextIdx);
    playTrack(mirrors[nextIdx], true, nextIdx, currentRoqyah);
    setDownloadToast(`تم التبديل إلى الخادم البديل (${nextIdx + 1}/${mirrors.length}) بنجاح`);
    setTimeout(() => setDownloadToast(null), 3000);
  };

  // Direct Ruqyah audio download with feedback
  const handleDownloadRoqyah = (track: RoqyahTrack, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    const url = track.audioUrl;
    const cleanFilename = `${track.titleArabic} - ${track.reciterArabic}.mp3`.replace(/[/\\?%*:|"<>]/g, '_');

    setDownloadingTrackId(track.id);
    setDownloadToast(`جارٍ تحضير تنزيل: ${track.reciterArabic}...`);

    try {
      const a = document.createElement('a');
      a.href = url;
      a.download = cleanFilename;
      a.target = '_blank';
      a.rel = 'noopener noreferrer';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      setDownloadToast(`تم بدء تنزيل الرقية الشرعية (${track.fileSizeFormatted || 'ملف صوتي MP3'}) بنجاح!`);
    } catch {
      window.open(url, '_blank');
      setDownloadToast(`تم فتح رابط التحميل المباشر للرقية`);
    } finally {
      setTimeout(() => setDownloadingTrackId(null), 1800);
      setTimeout(() => setDownloadToast(null), 5000);
    }
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
        Math.min(duration || 100000, audioRef.current.currentTime + seconds)
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
        audioRef.current.src = '';
      }
    };
  }, []);

  // Format theme class
  const getThemeClass = () => {
    switch (readingTheme) {
      case 'light':
        return 'bg-amber-50/95 text-stone-900 border-amber-200/80 shadow-stone-300';
      case 'sepia':
        return 'bg-[#f4ecd8] text-[#3d2b1f] border-[#d8c7a5] shadow-[#2a1d15]/10';
      case 'dark':
      default:
        return 'bg-stone-900/90 text-stone-100 border-stone-800 shadow-emerald-950/20';
    }
  };

  return (
    <div className="space-y-6 text-right">
      {/* Top Banner and Listening Mode Selector (Mushaf vs Quran Audio vs Roqyah) */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-stone-900 via-stone-900 to-emerald-950/80 border border-emerald-500/30 p-5 sm:p-6 shadow-xl">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-5">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2 text-xs font-bold text-emerald-400">
              <BookOpen className="w-4 h-4 text-emerald-400" />
              <span>مصحف المدينة المنورة والتفسير المعتمد وتحفيظ القرآن والختمات</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-bold text-white font-quran tracking-wide">
              {activeMode === 'mushaf'
                ? 'مصحف المدينة المنورة (طبعة مجمع الملك فهد)'
                : activeMode === 'tafsir'
                ? 'تفسير القرآن الكريم (الميسر، السعدي، ابن كثير)'
                : activeMode === 'memorize'
                ? 'المعلم التعليمي للحفظ والتثبيت والتسميع'
                : activeMode === 'khatmah'
                ? 'ختمات القرآن التفاعلية وتوزيع الأجزاء وبطاقات الإتمام'
                : activeMode === 'quran'
                ? 'مشغل القرآن الكريم المرتل كاملاً'
                : 'الرقية الشرعية الشاملة الكبرى بأصوات كبار القراء'}
            </h2>
            <p className="text-xs text-stone-300 leading-relaxed max-w-2xl">
              {activeMode === 'mushaf'
                ? 'تصفح صفحات المصحف الشريف الـ 604 كاملة بدقة فائقة صفحة بصفحة، مع مؤشر الأجزاء والسور، الانتقال المباشر، وحفظ علامة القراءة.'
                : activeMode === 'tafsir'
                ? 'تفسير شامل وموثوق لآيات وصفحات القرآن الكريم من أمهات كتب التفسير مع إمكانية البحث والنسخ.'
                : activeMode === 'memorize'
                ? 'أداة تعليمية ذكية لتكرار الآيات والتحفيظ مع خيارات إخفاء الكلمات للتسميع الذاتي، ومتابعة الآيات المحفوظة.'
                : activeMode === 'khatmah'
                ? 'أنشئ ختمة ووزع الأجزاء بأسماء الأهل والأصدقاء، مع توليد صور شهادات مباركة ومبهجة ومشاركتها عبر وسائل التواصل!'
                : activeMode === 'quran'
                ? 'استماع نقي لجميع سور القرآن الكريم الـ 114 بأصوات 24 من كبار القراء، مع التحكم في سرعة التلاوة وتكرار السور.'
                : `استماع للرقية الشرعية الشاملة المطولة للتحصين والشفاء من العين والحسد والسحر والمس بأصوات ${ROQYAH_TRACKS.length} من كبار القراء مع ميزة التنزيل المباشر.`}
            </p>
          </div>

          {/* Mode Switcher Tabs */}
          <div className="flex items-center p-1.5 rounded-2xl bg-stone-950/90 border border-stone-800 gap-1.5 shrink-0 self-start md:self-auto overflow-x-auto no-scrollbar max-w-full">
            <button
              onClick={() => setActiveMode('mushaf')}
              className={`px-3 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 whitespace-nowrap ${
                activeMode === 'mushaf'
                  ? 'bg-emerald-600 text-white shadow-md shadow-emerald-700/50'
                  : 'text-stone-400 hover:text-white'
              }`}
            >
              <BookOpen className="w-3.5 h-3.5" />
              <span>مصحف المدينة</span>
            </button>

            <button
              onClick={() => setActiveMode('tafsir')}
              className={`px-3 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 whitespace-nowrap ${
                activeMode === 'tafsir'
                  ? 'bg-emerald-600 text-white shadow-md shadow-emerald-700/50'
                  : 'text-stone-400 hover:text-white'
              }`}
            >
              <FileText className="w-3.5 h-3.5" />
              <span>تفسير القرآن</span>
            </button>

            <button
              onClick={() => setActiveMode('memorize')}
              className={`px-3 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 whitespace-nowrap ${
                activeMode === 'memorize'
                  ? 'bg-emerald-600 text-white shadow-md shadow-emerald-700/50'
                  : 'text-stone-400 hover:text-white'
              }`}
            >
              <GraduationCap className="w-3.5 h-3.5" />
              <span>تعليمي للحفظ</span>
            </button>

            <button
              onClick={() => setActiveMode('khatmah')}
              className={`px-3 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 whitespace-nowrap ${
                activeMode === 'khatmah'
                  ? 'bg-amber-500 text-stone-950 font-black shadow-md shadow-amber-500/40'
                  : 'text-stone-400 hover:text-white'
              }`}
            >
              <Users className="w-3.5 h-3.5" />
              <span>الختمات والمشاركة</span>
              <span className="text-[10px] bg-emerald-950 text-emerald-300 px-1.5 py-0.2 rounded-md font-bold border border-emerald-500/40">
                بطاقات مبهجة
              </span>
            </button>

            <button
              onClick={() => setActiveMode('quran')}
              className={`px-3 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 whitespace-nowrap ${
                activeMode === 'quran'
                  ? 'bg-emerald-600 text-white shadow-md shadow-emerald-700/50'
                  : 'text-stone-400 hover:text-white'
              }`}
            >
              <Radio className="w-3.5 h-3.5" />
              <span>تلاوات السور</span>
            </button>

            <button
              onClick={() => setActiveMode('roqyah')}
              className={`px-3 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 whitespace-nowrap ${
                activeMode === 'roqyah'
                  ? 'bg-emerald-600 text-white shadow-md shadow-emerald-700/50'
                  : 'text-stone-400 hover:text-white'
              }`}
            >
              <Shield className="w-3.5 h-3.5" />
              <span>الرقية الشرعية</span>
            </button>

            <button
              onClick={() => setActiveMode('radio')}
              className={`px-3 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 whitespace-nowrap ${
                activeMode === 'radio'
                  ? 'bg-rose-600 text-white shadow-md shadow-rose-700/50'
                  : 'text-stone-400 hover:text-white'
              }`}
            >
              <Radio className="w-3.5 h-3.5 text-rose-400" />
              <span>راديو القرآن 24/7</span>
              <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping" />
            </button>
          </div>
        </div>
      </div>

      {/* Render 24/7 Quran Radio */}
      {activeMode === 'radio' && <QuranRadio />}

      {/* Render Mushaf Page Reader */}
      {activeMode === 'mushaf' && (
        <MushafPageReader
          onSelectSurahAudio={(surahNum) => {
            const found = ALL_SURAHS.find((s) => s.number === surahNum);
            if (found) {
              handleSelectSurah(found);
            }
          }}
        />
      )}

      {/* Render Tafsir Section */}
      {activeMode === 'tafsir' && <TafsirSection />}

      {/* Render Quran Memorizer Tool */}
      {activeMode === 'memorize' && <QuranMemorizer />}

      {/* Render Khatmah Manager */}
      {activeMode === 'khatmah' && <KhatmahManager />}

      {/* Sleep Timer & Lighting Theme Bar (For Audio Modes: Quran Audio & Roqyah) */}
      {(activeMode === 'quran' || activeMode === 'roqyah') && (
        <div className="p-3.5 rounded-2xl bg-stone-900/90 border border-stone-800 flex flex-wrap items-center justify-between gap-3 text-right">
          {/* Sleep Timer Options */}
          <div className="flex items-center gap-2 text-xs text-stone-300">
            <Timer className="w-4 h-4 text-emerald-400" />
            <span className="font-semibold">مؤقت النوم:</span>
            <div className="inline-flex items-center p-1 rounded-xl bg-stone-950 border border-stone-800 gap-1 text-[11px]">
              {[
                { min: null, label: 'إيقاف' },
                { min: 15, label: '15 د' },
                { min: 30, label: '30 د' },
                { min: 45, label: '45 د' },
                { min: 60, label: '60 د' },
              ].map((item) => (
                <button
                  key={item.label}
                  onClick={() => setSleepTimerMinutes(item.min)}
                  className={`px-2.5 py-1 rounded-lg font-bold transition-all cursor-pointer ${
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
                <span>يتوقف بعد: {formatTime(sleepTimerRemaining)}</span>
              </span>
            )}
          </div>

          {/* Theme Mode Switcher */}
          <div className="flex items-center gap-2 text-xs font-semibold text-stone-300">
            <span>المظهر:</span>
            <div className="inline-flex items-center p-1 rounded-xl bg-stone-950 border border-stone-800 gap-1">
              <button
                onClick={() => setReadingTheme('light')}
                className={`px-2.5 py-1 rounded-lg text-xs font-bold flex items-center gap-1 transition-colors cursor-pointer ${
                  readingTheme === 'light'
                    ? 'bg-amber-100 text-stone-900 shadow-sm border border-amber-300'
                    : 'text-stone-400 hover:text-white'
                }`}
                title="الوضع النهاري"
              >
                <Sun className="w-3 h-3 text-amber-500" />
                <span>نهاري</span>
              </button>

              <button
                onClick={() => setReadingTheme('dark')}
                className={`px-2.5 py-1 rounded-lg text-xs font-bold flex items-center gap-1 transition-colors cursor-pointer ${
                  readingTheme === 'dark'
                    ? 'bg-emerald-950 text-emerald-300 border border-emerald-500/50 shadow-sm'
                    : 'text-stone-400 hover:text-white'
                }`}
                title="الوضع الليلي"
              >
                <Moon className="w-3 h-3 text-emerald-400" />
                <span>ليلي</span>
              </button>

              <button
                onClick={() => setReadingTheme('sepia')}
                className={`px-2.5 py-1 rounded-lg text-xs font-bold flex items-center gap-1 transition-colors cursor-pointer ${
                  readingTheme === 'sepia'
                    ? 'bg-[#e8d8b4] text-[#4d3319] border border-[#c4aa79] shadow-sm'
                    : 'text-stone-400 hover:text-white'
                }`}
                title="وضع الورق الدافئ"
              >
                <BookOpen className="w-3 h-3 text-amber-700" />
                <span>ورقي</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Reciter Selector Section for Quran mode */}
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

      {/* Reciter Selector Section for Roqyah mode */}
      {activeMode === 'roqyah' && (
        <div className="p-4 sm:p-5 rounded-3xl bg-stone-900/90 border border-stone-800 space-y-3.5 text-right">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-stone-800/80 pb-3">
            <div className="space-y-1">
              <h4 className="text-sm font-bold text-white flex items-center gap-2">
                <Shield className="w-4 h-4 text-emerald-400" />
                <span>اختر قارئ الرقية الشرعية المفضل:</span>
                <span className="text-[10px] bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 px-2 py-0.5 rounded-full font-sans">
                  {ROQYAH_TRACKS.length} قراء متاحين
                </span>
              </h4>
              <p className="text-[11px] text-stone-400">
                القارئ النشط حالياً:{' '}
                <strong className="text-emerald-400 font-bold">{currentRoqyah.reciterArabic}</strong> ·{' '}
                <span className="text-amber-300">{currentRoqyah.titleArabic}</span>
              </p>
            </div>

            <div className="flex items-center gap-2 self-start sm:self-auto">
              <span className="text-xs font-bold text-stone-300 whitespace-nowrap">القارئ:</span>
              <div className="relative">
                <select
                  value={currentRoqyah.id}
                  onChange={(e) => {
                    const found = ROQYAH_TRACKS.find((r) => r.id === e.target.value);
                    if (found) {
                      handleSelectRoqyah(found);
                    }
                  }}
                  className="bg-stone-950 border border-stone-700 hover:border-emerald-500 text-stone-200 text-xs rounded-xl px-3 py-2 pr-8 appearance-none cursor-pointer focus:outline-none focus:border-emerald-500 transition-colors w-60 sm:w-72"
                >
                  {ROQYAH_TRACKS.map((r) => (
                    <option key={r.id} value={r.id} className="bg-stone-900 text-white">
                      {r.reciterArabic} - {r.badgeArabic}
                    </option>
                  ))}
                </select>
                <ChevronDown className="w-3.5 h-3.5 text-stone-400 absolute left-2.5 top-3 pointer-events-none" />
              </div>
            </div>
          </div>

          {/* Quick Choice Reciter Pills */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar">
            <span className="text-[11px] text-stone-400 whitespace-nowrap ml-1 font-semibold">
              انتقال سريع:
            </span>
            {ROQYAH_TRACKS.map((r) => {
              const isSelected = currentRoqyah.id === r.id;
              return (
                <button
                  key={r.id}
                  onClick={() => handleSelectRoqyah(r)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-medium whitespace-nowrap border transition-all cursor-pointer flex items-center gap-1.5 ${
                    isSelected
                      ? 'bg-emerald-600 text-white border-emerald-500 font-bold shadow-md shadow-emerald-950/60'
                      : 'bg-stone-950/70 border-stone-800 text-stone-300 hover:bg-stone-800 hover:text-white'
                  }`}
                >
                  <UserCheck className="w-3 h-3 text-amber-300" />
                  <span>{r.reciterArabic.replace('الشيخ ', '')}</span>
                  <span className="text-[9px] opacity-75">({r.durationFormatted})</span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Primary Audio Player Deck (When in audio listening modes) */}
      {(activeMode === 'quran' || activeMode === 'roqyah') && (
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
                  {activeMode === 'quran' ? 'استماع القرآن الكريم' : 'استماع الرقية الشرعية الشاملة'}
                </span>
                {isPlaying && (
                  <span className="text-[10px] text-amber-400 flex items-center gap-1 animate-pulse font-medium">
                    <span className="w-2 h-2 rounded-full bg-amber-400" />
                    جارٍ الاستماع...
                  </span>
                )}
                {isLoadingAudio && (
                  <span className="text-[10px] text-emerald-400 flex items-center gap-1 animate-pulse font-medium">
                    <RefreshCw className="w-3 h-3 animate-spin" />
                    جارٍ جلب الصوت النقي...
                  </span>
                )}
              </div>
              <h3 className="text-xl sm:text-2xl font-bold font-quran mt-1">
                {currentTitle}
              </h3>
              <p className="text-xs opacity-75 mt-0.5">{currentSubtitle}</p>
            </div>
          </div>

          {/* Action buttons & Sound waves visualizer */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2.5 sm:self-center">
            {activeMode === 'roqyah' && (
              <div className="flex items-center gap-2 flex-wrap">
                <button
                  onClick={() => handleDownloadRoqyah(currentRoqyah)}
                  disabled={downloadingTrackId === currentRoqyah.id}
                  className="px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center gap-1.5 shadow-md shadow-emerald-950/50 transition-all active:scale-95 cursor-pointer"
                  title="تحميل الرقية الشرعية الحالية بصيغة MP3 للاستماع في أي وقت دون إنترنت"
                >
                  {downloadingTrackId === currentRoqyah.id ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      <span>جارٍ التنزيل...</span>
                    </>
                  ) : (
                    <>
                      <Download className="w-3.5 h-3.5" />
                      <span>تحميل الرقية (MP3)</span>
                      {currentRoqyah.fileSizeFormatted && (
                        <span className="text-[10px] bg-emerald-950/80 text-emerald-300 px-1.5 py-0.2 rounded font-mono">
                          {currentRoqyah.fileSizeFormatted}
                        </span>
                      )}
                    </>
                  )}
                </button>

                {getTrackMirrors(currentRoqyah).length > 1 && (
                  <button
                    onClick={handleSwitchMirror}
                    className="px-2.5 py-1.5 rounded-xl bg-black/10 hover:bg-black/20 border border-current/20 text-xs font-semibold flex items-center gap-1 cursor-pointer transition-colors"
                    title="التبديل إلى سيرفر بديل في حال بطء البث"
                  >
                    <Server className="w-3.5 h-3.5 text-amber-400" />
                    <span>خادم بديل ({activeMirrorIndex + 1}/{getTrackMirrors(currentRoqyah).length})</span>
                  </button>
                )}
              </div>
            )}

            {isPlaying && (
              <div className="flex items-center gap-1 mr-1">
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
        </div>

        {/* Audio Error Alert if network fails */}
        {audioError && (
          <div className="p-3.5 rounded-2xl bg-rose-950/80 border border-rose-500/50 text-xs text-rose-200 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
              <span>{audioError}</span>
            </div>
            <div className="flex items-center gap-2">
              {activeMode === 'roqyah' && getTrackMirrors(currentRoqyah).length > 1 && (
                <button
                  onClick={handleSwitchMirror}
                  className="px-3 py-1.5 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-bold text-xs shrink-0 cursor-pointer flex items-center gap-1"
                >
                  <Server className="w-3.5 h-3.5" />
                  <span>تجربة خادم بديل</span>
                </button>
              )}
              <button
                onClick={() => playTrack(currentAudioUrl)}
                className="px-3 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs shrink-0 cursor-pointer flex items-center gap-1"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>إعادة المحاولة</span>
              </button>
            </div>
          </div>
        )}

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
              title={isLooping ? 'إلغاء التكرار' : 'تكرار المقطع تلقائياً'}
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
            <button
              onClick={activeMode === 'quran' ? handlePrevSurah : handlePrevRoqyah}
              className="p-2.5 rounded-xl bg-black/5 hover:bg-black/10 border border-current/20 transition-colors cursor-pointer"
              title={activeMode === 'quran' ? 'السورة السابقة' : 'القارئ السابق'}
            >
              <SkipBack className="w-4 h-4" />
            </button>

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
              title={isPlaying ? 'إيقاف مؤقت' : 'تشغيل الصوت'}
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

            <button
              onClick={activeMode === 'quran' ? handleNextSurah : handleNextRoqyah}
              className="p-2.5 rounded-xl bg-black/5 hover:bg-black/10 border border-current/20 transition-colors cursor-pointer"
              title={activeMode === 'quran' ? 'السورة التالية' : 'القارئ التالي'}
            >
              <SkipForward className="w-4 h-4" />
            </button>
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
      )}

      {/* ========================================================= */}
      {/* Interactive Surah Verses with Educational Tafsir (Quran Mode) */}
      {/* ========================================================= */}
      {activeMode === 'quran' && (
        <div className="p-4 sm:p-6 rounded-3xl bg-stone-900/90 border border-emerald-500/30 text-right space-y-4 shadow-xl">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-stone-800 pb-3">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="p-1.5 rounded-xl bg-emerald-500/20 text-emerald-400">
                  <GraduationCap className="w-4 h-4" />
                </span>
                <h3 className="font-bold text-base text-white font-quran">
                  قراءة وتفسير آيات سورة {currentSurah.name} ({currentSurah.numberOfAyahs} آية)
                </h3>
                <span className="text-[10px] bg-amber-500/20 text-amber-300 border border-amber-500/30 px-2 py-0.5 rounded-full font-sans font-bold">
                  انقر على أي آية للتفسير التعليمي
                </span>
              </div>
              <p className="text-xs text-stone-400">
                انقر على أي آية لعرض نافذة منبثقة تفاعلية تحتوي على التفسير الميسر والوقفات التدبرية والعمل بالآية المستمدة من مصادر موثوقة.
              </p>
            </div>

            <div className="flex items-center gap-2 self-start sm:self-auto">
              <button
                onClick={() => setShowSurahVerses(!showSurahVerses)}
                className="px-3 py-1.5 rounded-xl bg-stone-800 hover:bg-stone-750 text-stone-200 text-xs font-semibold border border-stone-700 transition cursor-pointer"
              >
                {showSurahVerses ? 'طي نص الآيات' : 'عرض نص الآيات'}
              </button>
            </div>
          </div>

          {showSurahVerses && (
            <div className="space-y-3">
              {/* Basmalah banner if not Surah At-Tawbah (9) */}
              {currentSurah.number !== 9 && (
                <div className="py-2.5 text-center font-quran text-lg sm:text-xl text-amber-300/90 select-none bg-stone-950/40 rounded-2xl border border-stone-800/60">
                  بِسْمِ ٱللَّهِ ٱلرَّحْمَـٰنِ ٱلرَّحِيمِ
                </div>
              )}

              {isLoadingSurahVerses ? (
                <div className="p-8 text-center text-xs text-stone-400 flex items-center justify-center gap-2">
                  <Sparkles className="w-4 h-4 text-emerald-400 animate-spin" />
                  <span>جارٍ استحضار آيات سورة {currentSurah.name}...</span>
                </div>
              ) : surahVerses.length > 0 ? (
                <div className="space-y-2.5 max-h-[560px] overflow-y-auto p-1 pr-1.5 scrollbar-thin">
                  {surahVerses.map((ayah) => (
                    <div
                      key={ayah.verseKey}
                      onClick={() => {
                        setEducationalModalVerseKey(ayah.verseKey);
                        setEducationalModalVerseText(ayah.text);
                      }}
                      className="group p-3.5 sm:p-4 rounded-2xl bg-stone-950/70 hover:bg-stone-850/90 border border-stone-800/90 hover:border-emerald-500/50 transition-all duration-200 cursor-pointer flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-right shadow-xs hover:shadow-emerald-950/30"
                    >
                      <div className="space-y-1.5 flex-1">
                        <div className="flex items-center gap-2 text-[11px] text-stone-400">
                          <span className="font-bold text-emerald-400 font-quran">سورة {currentSurah.name}</span>
                          <span>·</span>
                          <span className="font-mono">آية {ayah.ayahNumber}</span>
                        </div>
                        <p className="font-quran text-base sm:text-lg text-amber-100/95 leading-relaxed group-hover:text-emerald-200 transition-colors">
                          {ayah.text}
                          <span className="inline-flex items-center justify-center w-6 h-6 rounded-full border border-amber-400/30 text-amber-300 text-[10px] font-mono font-bold mx-1.5 align-middle bg-amber-950/30">
                            {ayah.ayahNumber}
                          </span>
                        </p>
                      </div>

                      <div className="shrink-0 flex items-center gap-2 self-end sm:self-center">
                        <span className="text-[11px] px-3 py-1.5 rounded-xl bg-emerald-950/80 group-hover:bg-emerald-600 text-emerald-300 group-hover:text-white border border-emerald-500/40 font-bold transition-all flex items-center gap-1.5 shadow-xs">
                          <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                          <span>التفسير والتدبر</span>
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-6 text-center text-xs text-stone-400">
                  تعذر تحميل نص آيات السورة، يُرجى التحقق من الاتصال بالإنترنت.
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* ========================================================= */}
      {/* 114 Surahs Audio Catalog (Quran Mode)                     */}
      {/* ========================================================= */}
      {activeMode === 'quran' && (
        <div className="space-y-4 text-right">
          <div className="p-4 sm:p-5 rounded-3xl bg-stone-900/90 border border-stone-800 space-y-3.5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-stone-800/80 pb-3">
              <div className="space-y-0.5">
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <Disc className="w-4 h-4 text-emerald-400" />
                  <span>قائمة سور القرآن الكريم (114 سورة كاملة - استماع)</span>
                </h3>
                <p className="text-xs text-stone-400">
                  السورة المختارة حالياً:{' '}
                  <strong className="text-emerald-400 font-bold">سورة {currentSurah.name}</strong>{' '}
                  <span className="text-stone-500">
                    ({currentSurah.numberOfAyahs} آية · {currentSurah.revelationType === 'Meccan' ? 'مكية' : 'مدنية'})
                  </span>
                </p>
              </div>

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
          </div>

          {/* Search bar & filter pills */}
          <div className="p-4 rounded-2xl bg-stone-900/80 border border-stone-800 space-y-3">
            <div className="flex flex-col sm:flex-row items-center gap-2.5">
              <div className="relative w-full">
                <Search className="w-4 h-4 text-stone-400 absolute right-3.5 top-3" />
                <input
                  type="text"
                  placeholder="ابحث باسم السورة أو رقمها (مثال: البقرة، يوسف، 36)..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-stone-950 border border-stone-800 rounded-xl pr-10 pl-4 py-2 text-xs text-white placeholder-stone-500 focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto shrink-0 pb-1 sm:pb-0">
                {[
                  { id: 'all', label: 'الكل (114)' },
                  { id: 'popular', label: 'المشهورة' },
                  { id: 'juz30', label: 'جزء عم' },
                  { id: 'meccan', label: 'مكية' },
                  { id: 'medinan', label: 'مدنية' },
                ].map((c) => (
                  <button
                    key={c.id}
                    onClick={() => setSurahCategory(c.id as any)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-colors cursor-pointer ${
                      surahCategory === c.id
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

          {/* Grid of Surahs */}
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2 max-h-[500px] overflow-y-auto p-1 pr-1.5 scrollbar-thin">
            {filteredSurahs.map((surah) => {
              const isSelected = currentSurah.number === surah.number;
              const isCurrentlyPlaying = isSelected && isPlaying;

              return (
                <div
                  key={surah.number}
                  onClick={() => handleSelectSurah(surah)}
                  className={`p-3 rounded-2xl border transition-all text-right cursor-pointer flex flex-col justify-between gap-2 ${
                    isSelected
                      ? 'bg-gradient-to-b from-emerald-950/80 to-stone-900 border-emerald-500 shadow-md ring-1 ring-emerald-500/50'
                      : 'bg-stone-900/60 border-stone-800 hover:bg-stone-800/80 hover:border-emerald-500/30'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-mono opacity-60 bg-black/20 px-1.5 py-0.5 rounded">
                      #{surah.number}
                    </span>
                    <span className="text-[10px] opacity-60">
                      {surah.revelationType === 'Meccan' ? 'مكية' : 'مدنية'}
                    </span>
                  </div>

                  <div>
                    <h4 className="font-bold text-sm text-white font-quran">سورة {surah.name}</h4>
                    <p className="text-[10px] text-stone-400">{surah.numberOfAyahs} آية</p>
                  </div>

                  <div className="flex items-center justify-between pt-1 border-t border-current/10">
                    <span className="text-[10px] text-emerald-400 font-semibold">استماع كامل</span>
                    <div
                      className={`w-6 h-6 rounded-full flex items-center justify-center ${
                        isCurrentlyPlaying
                          ? 'bg-emerald-600 text-white'
                          : 'bg-stone-800 text-stone-300'
                      }`}
                    >
                      {isCurrentlyPlaying ? (
                        <Pause className="w-3 h-3 fill-current" />
                      ) : (
                        <Play className="w-3 h-3 fill-current mr-0.5" />
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* Roqyah Shariah Mode (10 Reciters + Audio Improvements)     */}
      {/* ========================================================= */}
      {activeMode === 'roqyah' && (
        <div className="space-y-4 text-right">
          {/* Informational Guidance Box */}
          <div className="p-5 rounded-2xl bg-gradient-to-r from-emerald-950/40 via-stone-900 to-emerald-950/40 border border-emerald-500/40 text-xs text-stone-300 leading-relaxed flex items-start gap-3 shadow-md">
            <Shield className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <strong className="text-emerald-300 font-bold block text-sm">
                فضل وأهمية الرقية الشرعية من الكتاب والسنة المطهرة:
              </strong>
              <p>
                قال تعالى: ﴿وَنُنَزِّلُ مِنَ الْقُرْآنِ مَا هُوَ شِفَاءٌ وَرَحْمَةٌ لِّلْمُؤْمِنِينَ﴾. الرقية الشرعية سبب مشروع ونافِع للشفاء من العين والحسد والسحر والمس، وطرد الشياطين وجلب السكينة والبركة للبيت والنفس.
              </p>
            </div>
          </div>

          {/* Search & Category Filter for Roqyah */}
          <div className="p-4 rounded-2xl bg-stone-900/90 border border-stone-800 space-y-3">
            <div className="flex flex-col sm:flex-row items-center gap-2.5">
              <div className="relative w-full">
                <Search className="w-4 h-4 text-stone-400 absolute right-3.5 top-3" />
                <input
                  type="text"
                  placeholder="ابحث باسم القارئ أو الغرض (مثال: العفاسي، الغامدي، العجمي، تحصين، عين)..."
                  value={roqyahSearch}
                  onChange={(e) => setRoqyahSearch(e.target.value)}
                  className="w-full bg-stone-950 border border-stone-800 rounded-xl pr-10 pl-4 py-2 text-xs text-white placeholder-stone-500 focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto shrink-0 pb-1 sm:pb-0 no-scrollbar">
                {[
                  { id: 'all', label: 'جميع التسجيلات' },
                  { id: 'شاملة', label: 'شاملة' },
                  { id: 'للعين والحسد', label: 'للعين والحسد' },
                  { id: 'تحصين المنزل', label: 'تحصين المنزل' },
                  { id: 'سكينة وطمأنينة', label: 'سكينة وطمأنينة' },
                  { id: 'آيات الشفاء', label: 'آيات الشفاء' },
                  { id: 'مطولة شاملة', label: 'مطولة' },
                ].map((c) => (
                  <button
                    key={c.id}
                    onClick={() => setRoqyahCategory(c.id)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-colors cursor-pointer ${
                      roqyahCategory === c.id
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

          {/* Toggle Button for Written Ruqyah Verses */}
          <div className="flex justify-between items-center px-1">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Volume2 className="w-4 h-4 text-emerald-400" />
              <span>تسجيلات الرقية الشرعية المتاحة ({filteredRoqyah.length} قارئ):</span>
            </h3>

            <button
              onClick={() => setShowWrittenRuqyah(!showWrittenRuqyah)}
              className="px-3 py-1.5 rounded-xl bg-stone-800 hover:bg-stone-700 text-emerald-300 text-xs font-semibold border border-emerald-500/30 hover:border-emerald-400/60 transition flex items-center gap-1.5 cursor-pointer shadow-xs"
            >
              <FileText className="w-3.5 h-3.5 text-amber-300" />
              <span>{showWrittenRuqyah ? 'إخفاء الآيات المكتوبة' : 'عرض نص آيات الرقية الشرعية للقراءة'}</span>
              {showWrittenRuqyah ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
            </button>
          </div>

          {/* Written Ruqyah Verses & Duas Accordion */}
          {showWrittenRuqyah && (
            <div className="p-6 rounded-3xl bg-stone-950/90 border border-emerald-500/30 text-stone-200 space-y-5 shadow-2xl leading-relaxed text-right">
              <div className="border-b border-stone-800 pb-3 flex items-center justify-between">
                <div>
                  <h4 className="font-bold text-base text-amber-300 font-quran">
                    آيات وأدعية الرقية الشرعية الجامعة من القرآن الكريم والسنة النبوية
                  </h4>
                  <p className="text-xs text-stone-400 mt-0.5">
                    يمكنك القراءة مع الاستماع للتلاوة لزيادة التحصين والبركة بإذن الله
                  </p>
                </div>
              </div>

              {/* 1. Al-Fatiha */}
              <div className="p-4 rounded-2xl bg-stone-900/60 border border-stone-800 space-y-2">
                <span className="text-xs font-bold text-emerald-400 block">١. سورة الفاتحة (أم الكتاب والشافية الكافية):</span>
                <p className="text-sm sm:text-base font-quran leading-loose text-white text-center">
                  ﴿بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ • الْحَمْدُ لِلَّهِ رَبِّ الْعَالَمِينَ • الرَّحْمَٰنِ الرَّحِيمِ • مَالِكِ يَوْمِ الدِّينِ • إِيَّاكَ نَعْبُدُ وَإِيَّاكَ نَسْتَعِينُ • اهْدِنَا الصِّرَاطَ الْمُسْتَقِيمَ • صِرَاطَ الَّذِينَ أَنْعَمْتَ عَلَيْهِمْ غَيْرِ الْمَغْضُوبِ عَلَيْهِمْ وَلَا الضَّالِّينَ﴾
                </p>
              </div>

              {/* 2. Ayat Al-Kursi */}
              <div className="p-4 rounded-2xl bg-stone-900/60 border border-stone-800 space-y-2">
                <span className="text-xs font-bold text-emerald-400 block">٢. آية الكرسي (أعظم آية في كتاب الله - البقرة: 255):</span>
                <p className="text-sm sm:text-base font-quran leading-loose text-white text-center">
                  ﴿اللَّهُ لَا إِلَٰهَ إِلَّا هُوَ الْحَيُّ الْقَيُّومُ ۚ لَا تَأْخُذُهُ سِنَةٌ وَلَا نَوْمٌ ۚ لَّهُ مَا فِي السَّمَاوَاتِ وَمَا فِي الْأَرْضِ ۗ مَن ذَا الَّذِي يَشْفَعُ عِندَهُ إِلَّا بِإِذْنِهِ ۚ يَعْلَمُ مَا بَيْنَ أَيْدِيهِمْ وَمَا خَلْفَهُمْ ۖ وَلَا يُحِيطُونَ بِشَيْءٍ مِّنْ عِلْمِهِ إِلَّا بِمَا شَاءَ ۚ وَسِعَ كُرْسِيُّهُ السَّمَاوَاتِ وَالْأَرْضَ ۖ وَلَا يَئُودُهُ حِفْظُهُمَا ۚ وَهُوَ الْعَلِيُّ الْعَظِيمُ﴾
                </p>
              </div>

              {/* 3. Last verses of Baqarah */}
              <div className="p-4 rounded-2xl bg-stone-900/60 border border-stone-800 space-y-2">
                <span className="text-xs font-bold text-emerald-400 block">٣. خواتيم سورة البقرة (كفتاه من كل شر - 285-286):</span>
                <p className="text-sm sm:text-base font-quran leading-loose text-white text-center">
                  ﴿آمَنَ الرَّسُولُ بِمَا أُنزِلَ إِلَيْهِ مِن رَّبِّهِ وَالْمُؤْمِنُونَ ۚ كُلٌّ آمَنَ بِاللَّهِ وَمَلَائِكَتِهِ وَكُتُبِهِ وَرُسُلِهِ لَا نُفَرِّقُ بَيْنَ أَحَدٍ مِّن رُّسُلِهِ ۚ وَقَالُوا سَمِعْنَا وَأَطَعْنَا ۖ غُفْرَانَكَ رَبَّنَا وَإِلَيْكَ الْمَصِيرُ • لَا يُكَلِّفُ اللَّهُ نَفْسًا إِلَّا وُسْعَهَا ۚ لَهَا مَا كَسَبَتْ وَعَلَيْهَا مَا اكْتَسَبَتْ ۗ رَبَّنَا لَا تُؤَاخِذْنَا إِن نَّسِينَا أَوْ أَخْطَأْنَا ۚ رَبَّنَا وَلَا تَحْمِلْ عَلَيْنَا إِصْرًا كَمَا حَمَلْتَهُ عَلَى الَّذِينَ مِن قَبْلِنَا ۚ رَبَّنَا وَلَا تُحَمِّلْنَا مَا لَا طَاقَةَ لَنَا بِهِ ۖ وَاعْفُ عَنَّا وَاغْفِرْ لَنَا وَارْحَمْنَا ۚ أَنتَ مَوْلَانَا فَانصُرْنَا عَلَى الْقَوْمِ الْكَافِرِينَ﴾
                </p>
              </div>

              {/* 4. Six Healing Verses */}
              <div className="p-4 rounded-2xl bg-stone-900/60 border border-stone-800 space-y-2">
                <span className="text-xs font-bold text-emerald-400 block">٤. آيات الشفاء الست في القرآن الكريم:</span>
                <ul className="text-sm font-quran leading-loose space-y-1.5 text-stone-200">
                  <li>• ﴿وَيَشْفِ صُدُورَ قَوْمٍ مُّؤْمِنِينَ﴾ [التوبة: 14]</li>
                  <li>• ﴿وَشِفَاءٌ لِّمَا فِي الصُّدُورِ وَهُدًى وَرَحْمَةٌ لِّلْمُؤْمِنِينَ﴾ [يونس: 57]</li>
                  <li>• ﴿يَخْرُجُ مِن بُطُونِهَا شَرَابٌ مُّخْتَلِفٌ أَلْوَانُهُ فِيهِ شِفَاءٌ لِّلنَّاسِ﴾ [النحل: 69]</li>
                  <li>• ﴿وَنُنَزِّلُ مِنَ الْقُرْآنِ مَا هُوَ شِفَاءٌ وَرَحْمَةٌ لِّلْمُؤْمِنِينَ﴾ [الإسراء: 82]</li>
                  <li>• ﴿وَإِذَا مَرِضْتُ فَهُوَ يَشْفِينِ﴾ [الشعراء: 80]</li>
                  <li>• ﴿قُلْ هُوَ لِلَّذِينَ آمَنُوا هُدًى وَشِفَاءٌ﴾ [فصلت: 44]</li>
                </ul>
              </div>

              {/* 5. Al-Ikhlas & Mu'awwidhatayn */}
              <div className="p-4 rounded-2xl bg-stone-900/60 border border-stone-800 space-y-2">
                <span className="text-xs font-bold text-emerald-400 block">٥. المعوذات (سورة الإخلاص، الفلق، الناس):</span>
                <p className="text-sm font-quran leading-loose text-white text-center">
                  ﴿قُلْ هُوَ اللَّهُ أَحَدٌ • اللَّهُ الصَّمَدُ • لَمْ يَلِدْ وَلَمْ يُولَدْ • وَلَمْ يَكُن لَّهُ كُفُوًا أَحَدٌ﴾<br />
                  ﴿قُلْ أَعُوذُ بِرَبِّ الْفَلَقِ • مِن شَرِّ مَا خَلَقَ • وَمِن شَرِّ غَاسِقٍ إِذَا وَقَبَ • وَمِن شَرِّ النَّفَّاثَاتِ فِي الْعُقَدِ • وَمِن شَرِّ حَاسِدٍ إِذَا حَسَدَ﴾<br />
                  ﴿قُلْ أَعُوذُ بِرَبِّ النَّاسِ • مَلِكِ النَّاسِ • إِلَٰهِ النَّاسِ • مِن شَرِّ الْوَسْوَاسِ الْخَنَّاسِ • الَّذِي يُوَسْوِسُ فِي صُدُورِ النَّاسِ • مِنَ الْجِنَّةِ وَالنَّاسِ﴾
                </p>
              </div>

              {/* 6. Authentic Prophetic Duas */}
              <div className="p-4 rounded-2xl bg-stone-900/60 border border-stone-800 space-y-2">
                <span className="text-xs font-bold text-amber-300 block">٦. أدعية الرقية النبوية المأثورة عن رسول الله ﷺ:</span>
                <ul className="text-xs sm:text-sm leading-relaxed space-y-2 text-stone-200">
                  <li>• «بِسْمِ اللَّهِ أَرْقِيكَ، مِنْ كُلِّ شَيْءٍ يُؤْذِيكَ، مِنْ شَرِّ كُلِّ نَفْسٍ أَوْ عَيْنِ حَاسِدٍ، اللَّهُ يَشْفِيكَ، بِسْمِ اللَّهِ أَرْقِيكَ».</li>
                  <li>• «أَعُوذُ بِكَلِمَاتِ اللَّهِ التَّامَّاتِ مِنْ شَرِّ مَا خَلَقَ».</li>
                  <li>• «اللَّهُمَّ رَبَّ النَّاسِ أَذْهِبِ البَاسَ، اشْفِهِ وَأَنْتَ الشَّافِي، لا شِفَاءَ إِلا شِفَاؤُكَ، شِفَاءً لا يُغَادِرُ سَقَمًا».</li>
                  <li>• «أَسْأَلُ اللَّهَ الْعَظِيمَ رَبَّ الْعَرْشِ الْعَظِيمِ أَنْ يَشْفِيَكَ» (سبع مرات).</li>
                  <li>• «أَعُوذُ بِكَلِمَاتِ اللَّهِ التَّامَّةِ مِنْ كُلِّ شَيْطَانٍ وَهَامَّةٍ، وَمِنْ كُلِّ عَيْنٍ لامَّةٍ».</li>
                </ul>
              </div>
            </div>
          )}

          {/* Cards Grid for 10 Reciters of Roqyah */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredRoqyah.map((track) => {
              const isSelected = currentRoqyah.id === track.id && activeMode === 'roqyah';
              const isCurrentlyPlaying = isSelected && isPlaying;

              return (
                <div
                  key={track.id}
                  onClick={() => handleSelectRoqyah(track)}
                  className={`p-5 rounded-2xl border transition-all text-right cursor-pointer space-y-3 ${
                    isSelected
                      ? 'bg-gradient-to-l from-emerald-950/90 via-stone-900 to-stone-900 border-emerald-500 shadow-xl ring-1 ring-emerald-500/40'
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
                        <div className="flex items-center gap-2 flex-wrap">
                          <h4 className="font-bold text-base text-white">{track.titleArabic}</h4>
                          <span className="text-[10px] bg-amber-950 text-amber-300 border border-amber-600/40 px-2 py-0.5 rounded-md font-bold">
                            {track.badgeArabic}
                          </span>
                        </div>
                        <div className="text-xs text-stone-300 mt-1">
                          بصوت: <strong className="text-emerald-400 font-semibold">{track.reciterArabic}</strong> · المدة:{' '}
                          <span className="font-mono tabular-nums text-amber-300 font-bold">{track.durationFormatted}</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0">
                      {/* Direct Download Button */}
                      <button
                        onClick={(e) => handleDownloadRoqyah(track, e)}
                        disabled={downloadingTrackId === track.id}
                        className="p-2.5 sm:px-3 sm:py-2.5 rounded-xl bg-stone-800 hover:bg-emerald-600 text-stone-200 hover:text-white transition-all active:scale-95 border border-stone-700 hover:border-emerald-500 cursor-pointer flex items-center gap-1"
                        title={`تحميل الرقية الشرعية MP3 بصوت ${track.reciterArabic} (${track.fileSizeFormatted || 'ملف صوتي'})`}
                      >
                        {downloadingTrackId === track.id ? (
                          <RefreshCw className="w-4 h-4 animate-spin text-emerald-400" />
                        ) : (
                          <Download className="w-4 h-4" />
                        )}
                        <span className="text-[11px] font-bold hidden sm:inline">تحميل MP3</span>
                      </button>

                      {/* Play / Pause button */}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          if (isSelected) {
                            handleTogglePlay();
                          } else {
                            handleSelectRoqyah(track);
                          }
                        }}
                        className={`p-3 rounded-xl transition-transform active:scale-95 shadow-md cursor-pointer ${
                          isCurrentlyPlaying
                            ? 'bg-amber-600 text-white'
                            : 'bg-emerald-600 hover:bg-emerald-500 text-white'
                        }`}
                        title={isCurrentlyPlaying ? 'إيقاف مؤقت' : 'تشغيل الاستماع'}
                      >
                        {isCurrentlyPlaying ? (
                          <Pause className="w-4 h-4 fill-current" />
                        ) : (
                          <Play className="w-4 h-4 fill-current mr-0.5" />
                        )}
                      </button>
                    </div>
                  </div>

                  <p className="text-xs text-stone-300 leading-relaxed border-t border-stone-800/80 pt-2.5">
                    {track.descriptionArabic}
                  </p>

                  <div className="flex items-center justify-between text-[11px] pt-1 text-stone-400">
                    <span className="px-2 py-0.5 rounded bg-stone-950 border border-stone-800">
                      التصنيف: {track.categoryArabic}
                    </span>
                    {isSelected && (
                      <span className="text-emerald-400 font-bold flex items-center gap-1">
                        <Check className="w-3.5 h-3.5" />
                        المقطع النشط حالياً
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Download / Action Notification Toast */}
          {downloadToast && (
            <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 bg-stone-900/95 border border-emerald-500 text-white text-xs sm:text-sm px-5 py-3 rounded-2xl shadow-2xl backdrop-blur-md flex items-center gap-2.5 animate-bounce max-w-[90vw] text-right">
              <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
              <span className="font-semibold">{downloadToast}</span>
            </div>
          )}
        </div>
      )}

      {/* Educational Tafsir Modal */}
      {educationalModalVerseKey && (
        <EducationalTafsirModal
          isOpen={true}
          onClose={() => setEducationalModalVerseKey(null)}
          verseKey={educationalModalVerseKey}
          initialVerseText={educationalModalVerseText}
          onNavigateVerse={(newKey) => {
            setEducationalModalVerseKey(newKey);
            const found = surahVerses.find((v) => v.verseKey === newKey);
            if (found) {
              setEducationalModalVerseText(found.text);
            }
          }}
        />
      )}
    </div>
  );
};
