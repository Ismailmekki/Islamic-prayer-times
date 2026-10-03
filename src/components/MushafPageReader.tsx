import React, { useState, useEffect, useRef } from 'react';
import {
  Bookmark,
  BookmarkCheck,
  Maximize2,
  Minimize2,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  Search,
  BookOpen,
  Volume2,
  VolumeX,
  Play,
  Pause,
  Sun,
  Moon,
  Sparkles,
  Share2,
  HelpCircle,
  ExternalLink,
  Layers,
  Compass,
  X,
  FileText,
  GraduationCap,
  Server,
  Download,
  CheckCircle2,
  RefreshCw,
} from 'lucide-react';
import { TafsirSection } from './TafsirSection';
import { EducationalTafsirModal } from './EducationalTafsirModal';
import { tafsirService } from '../services/tafsirService';
import {
  SURAH_STARTING_PAGES,
  JUZ_STARTING_PAGES,
  MUSHAF_SERVERS,
  getServerPageImageUrl,
  QURAN_DOWNLOAD_RESOURCES,
  getJuzForPage,
  getSurahForPage,
} from '../data/mushafPagesData';
import { ALL_SURAHS, QURAN_RECITERS, getSurahAudioUrl, QuranReciter } from '../data/quranData';

interface MushafPageReaderProps {
  initialPage?: number;
  onSelectSurahAudio?: (surahNumber: number) => void;
}

export const MushafPageReader: React.FC<MushafPageReaderProps> = ({
  initialPage = 1,
  onSelectSurahAudio,
}) => {
  // Page state (1 to 604)
  const [currentPage, setCurrentPage] = useState<number>(() => {
    try {
      const saved = localStorage.getItem('salati_mushaf_current_page');
      if (saved) {
        const p = parseInt(saved, 10);
        if (p >= 1 && p <= 604) return p;
      }
    } catch {}
    return initialPage;
  });

  // Bookmark state
  const [bookmarkPage, setBookmarkPage] = useState<number | null>(() => {
    try {
      const saved = localStorage.getItem('salati_mushaf_bookmark');
      if (saved) {
        const p = parseInt(saved, 10);
        if (p >= 1 && p <= 604) return p;
      }
    } catch {}
    return null;
  });

  // Multi-server CDN state & active mirror
  const [activeServerIndex, setActiveServerIndex] = useState<number>(() => {
    try {
      const saved = localStorage.getItem('salati_mushaf_server_index');
      if (saved !== null) {
        const idx = parseInt(saved, 10);
        if (idx >= 0 && idx < MUSHAF_SERVERS.length) return idx;
      }
    } catch {}
    return 0; // Default to Server 1: King Saud University (Official & Highly Reliable)
  });

  const [isLoadingImage, setIsLoadingImage] = useState<boolean>(true);
  const [imageError, setImageError] = useState<boolean>(false);
  const [isDownloadModalOpen, setIsDownloadModalOpen] = useState<boolean>(false);
  const imgRef = useRef<HTMLImageElement | null>(null);
  const watchdogTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Zoom & View controls
  const [zoomLevel, setZoomLevel] = useState<number>(100);
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);
  const [pageTheme, setPageTheme] = useState<'classic' | 'dark' | 'white'>('classic');
  const [isTafsirModalOpen, setIsTafsirModalOpen] = useState<boolean>(false);

  // Interactive Educational Tafsir state
  const [pageVerses, setPageVerses] = useState<
    Array<{ verseKey: string; ayahNumber: number; text: string; surahNumber: number }>
  >([]);
  const [isLoadingPageVerses, setIsLoadingPageVerses] = useState<boolean>(false);
  const [showInteractiveVerses, setShowInteractiveVerses] = useState<boolean>(true);
  const [educationalModalVerseKey, setEducationalModalVerseKey] = useState<string | null>(null);
  const [educationalModalVerseText, setEducationalModalVerseText] = useState<string | undefined>(undefined);

  // Input jump state
  const [inputPage, setInputPage] = useState<string>(currentPage.toString());
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Optional synchronous audio recitation
  const [isAudioPlaying, setIsAudioPlaying] = useState<boolean>(false);
  const [selectedReciter, setSelectedReciter] = useState<QuranReciter>(QURAN_RECITERS[0]);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  // Fluid touch & mouse drag swipe state for natural page turning
  const [touchStartX, setTouchStartX] = useState<number | null>(null);
  const [touchStartY, setTouchStartY] = useState<number | null>(null);
  const [touchCurrentX, setTouchCurrentX] = useState<number | null>(null);
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [dragOffset, setDragOffset] = useState<number>(0);

  // Current metadata
  const currentSurah = getSurahForPage(currentPage);
  const currentJuz = getJuzForPage(currentPage);

  // Advance to next server automatically or manually
  const advanceToNextServer = (notify = true) => {
    setActiveServerIndex((prev) => {
      const nextIndex = (prev + 1) % MUSHAF_SERVERS.length;
      try {
        localStorage.setItem('salati_mushaf_server_index', nextIndex.toString());
      } catch {}
      if (notify) {
        showToast(`جارٍ المحاولة عبر: ${MUSHAF_SERVERS[nextIndex].shortName}`);
      }
      return nextIndex;
    });
    setIsLoadingImage(true);
    setImageError(false);
  };

  // Save current page and load its verses + handle image loading watchdog
  useEffect(() => {
    try {
      localStorage.setItem('salati_mushaf_current_page', currentPage.toString());
    } catch {}
    setInputPage(currentPage.toString());
    setIsLoadingImage(true);
    setImageError(false);

    // Watchdog timer: If loading takes > 4.5 seconds on current server, auto-switch to next server!
    if (watchdogTimerRef.current) {
      clearTimeout(watchdogTimerRef.current);
    }
    watchdogTimerRef.current = setTimeout(() => {
      if (imgRef.current && (!imgRef.current.complete || imgRef.current.naturalWidth === 0)) {
        console.warn(`Server ${activeServerIndex} timed out on page ${currentPage}, auto-switching server.`);
        advanceToNextServer(true);
      }
    }, 4500);

    // If image is already loaded in cache synchronously
    if (imgRef.current && imgRef.current.complete && imgRef.current.naturalWidth > 0) {
      setIsLoadingImage(false);
    }

    let isCancelled = false;
    setIsLoadingPageVerses(true);
    tafsirService.getVersesForPage(currentPage).then((verses) => {
      if (!isCancelled) {
        setPageVerses(verses);
        setIsLoadingPageVerses(false);
      }
    });

    return () => {
      isCancelled = true;
      if (watchdogTimerRef.current) {
        clearTimeout(watchdogTimerRef.current);
      }
    };
  }, [currentPage, activeServerIndex]);

  // Preload adjacent pages using active server for instant flipping
  useEffect(() => {
    if (currentPage > 1) {
      const prevImg = new Image();
      prevImg.src = getServerPageImageUrl(currentPage - 1, activeServerIndex);
    }
    if (currentPage < 604) {
      const nextImg = new Image();
      nextImg.src = getServerPageImageUrl(currentPage + 1, activeServerIndex);
    }
  }, [currentPage, activeServerIndex]);

  // Keyboard navigation (Arrow keys)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't trigger if user is typing in an input
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return;
      }

    // In Arabic reading (Right to Left):
    // Right Arrow = Next page (advance forward in Quran: e.g. 293 -> 294 to continue Surah Al-Kahf)
    // Left Arrow = Previous page (go back: e.g. 293 -> 292)
    if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
      goToNextPage();
    } else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
      goToPrevPage();
    }
  };

  window.addEventListener('keydown', handleKeyDown);
  return () => window.removeEventListener('keydown', handleKeyDown);
}, [currentPage]);

// Cleanup audio on unmount
useEffect(() => {
  return () => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.src = '';
    }
  };
}, []);

const showToast = (msg: string) => {
  setToastMessage(msg);
  setTimeout(() => {
    setToastMessage(null);
  }, 2800);
};

const goToPage = (page: number) => {
  const validPage = Math.max(1, Math.min(604, page));
  setCurrentPage(validPage);
};

// Next page (advances page count: e.g. 293 -> 294 to continue the Surah)
const goToNextPage = () => {
  if (currentPage < 604) {
    if (navigator.vibrate) {
      try { navigator.vibrate(10); } catch {}
    }
    setDragOffset(70);
    setTimeout(() => {
      goToPage(currentPage + 1);
      setDragOffset(-50);
      requestAnimationFrame(() => {
        setTimeout(() => setDragOffset(0), 40);
      });
    }, 100);
  } else {
    setDragOffset(0);
    showToast('أنت الآن في الصفحة الأخيرة (ختام المصحف الشريف)');
  }
};

// Previous page (returns to previous page: e.g. 293 -> 292)
const goToPrevPage = () => {
  if (currentPage > 1) {
    if (navigator.vibrate) {
      try { navigator.vibrate(10); } catch {}
    }
    setDragOffset(-70);
    setTimeout(() => {
      goToPage(currentPage - 1);
      setDragOffset(50);
      requestAnimationFrame(() => {
        setTimeout(() => setDragOffset(0), 40);
      });
    }, 100);
  } else {
    setDragOffset(0);
    showToast('أنت الآن في الصفحة الأولى (فاتحة الكتاب)');
  }
};

// Touch Handlers for mobile & tablet (Smooth horizontal swipe)
const handleTouchStart = (e: React.TouchEvent) => {
  if (e.touches.length !== 1) return;
  setTouchStartX(e.touches[0].clientX);
  setTouchStartY(e.touches[0].clientY);
  setTouchCurrentX(e.touches[0].clientX);
  setIsDragging(true);
  setDragOffset(0);
};

const handleTouchMove = (e: React.TouchEvent) => {
  if (!isDragging || touchStartX === null || touchStartY === null) return;
  const currentX = e.touches[0].clientX;
  const currentY = e.touches[0].clientY;
  const deltaX = currentX - touchStartX;
  const deltaY = currentY - touchStartY;

  // Detect horizontal swipe intent (prevent drag when user simply scrolls vertically)
  if (Math.abs(deltaX) > Math.abs(deltaY) && Math.abs(deltaX) > 8) {
    setTouchCurrentX(currentX);
    setDragOffset(deltaX * 0.75);
  }
};

const handleTouchEnd = () => {
  if (!isDragging || touchStartX === null || touchCurrentX === null) {
    setIsDragging(false);
    setDragOffset(0);
    return;
  }

  const deltaX = touchCurrentX - touchStartX;
  const minSwipeDistance = 35; // Easy and responsive to trigger

  // In Arabic Mushaf flipping:
  // Swiping Rightwards (deltaX > 0): Flip to NEXT PAGE (e.g. 293 -> 294, continuing Surah Al-Kahf)
  // Swiping Leftwards (deltaX < 0): Flip to PREVIOUS PAGE (e.g. 293 -> 292, returning to Surah Al-Isra')
  if (deltaX > minSwipeDistance) {
    goToNextPage();
  } else if (deltaX < -minSwipeDistance) {
    goToPrevPage();
  } else {
    setDragOffset(0);
  }

    setIsDragging(false);
    setTouchStartX(null);
    setTouchStartY(null);
    setTouchCurrentX(null);
  };

  // Mouse drag handlers for desktop / trackpad
  const handleMouseDown = (e: React.MouseEvent) => {
    if (e.button !== 0) return;
    setTouchStartX(e.clientX);
    setTouchStartY(e.clientY);
    setTouchCurrentX(e.clientX);
    setIsDragging(true);
    setDragOffset(0);
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging || touchStartX === null) return;
    const currentX = e.clientX;
    const currentY = e.clientY;
    const deltaX = currentX - touchStartX;
    const deltaY = currentY - (touchStartY || 0);

    if (Math.abs(deltaX) > Math.abs(deltaY) && Math.abs(deltaX) > 6) {
      setTouchCurrentX(currentX);
      setDragOffset(deltaX * 0.75);
    }
  };

  const handleMouseUp = () => {
    if (isDragging) {
      handleTouchEnd();
    }
  };

  const handleMouseLeave = () => {
    if (isDragging) {
      handleTouchEnd();
    }
  };

  // Toggle bookmark on current page
  const toggleBookmark = () => {
    if (bookmarkPage === currentPage) {
      setBookmarkPage(null);
      try {
        localStorage.removeItem('salati_mushaf_bookmark');
      } catch {}
      showToast('تمت إزالة علامة القراءة');
    } else {
      setBookmarkPage(currentPage);
      try {
        localStorage.setItem('salati_mushaf_bookmark', currentPage.toString());
      } catch {}
      showToast(`تم حفظ علامة القراءة في الصفحة ${currentPage} (${currentSurah.name})`);
    }
  };

  // Toggle audio recitation of the current surah
  const toggleAudio = () => {
    if (isAudioPlaying) {
      if (audioRef.current) audioRef.current.pause();
      setIsAudioPlaying(false);
    } else {
      const url = getSurahAudioUrl(currentSurah.number, selectedReciter);
      if (!audioRef.current) {
        audioRef.current = new Audio(url);
        audioRef.current.onended = () => setIsAudioPlaying(false);
      } else {
        audioRef.current.src = url;
      }

      audioRef.current
        .play()
        .then(() => {
          setIsAudioPlaying(true);
          showToast(`تلاوة سورة ${currentSurah.name} بصوت ${selectedReciter.nameArabic}`);
        })
        .catch(() => {
          setIsAudioPlaying(false);
          showToast('تعذر تشغيل التلاوة تلقائياً');
        });
    }
  };

  // Fullscreen toggle
  const toggleFullscreen = () => {
    if (!containerRef.current) return;
    if (!document.fullscreenElement) {
      containerRef.current.requestFullscreen?.().catch(() => {});
      setIsFullscreen(true);
    } else {
      document.exitFullscreen?.().catch(() => {});
      setIsFullscreen(false);
    }
  };

  // Current image source computed from activeServerIndex
  const currentImageUrl = getServerPageImageUrl(currentPage, activeServerIndex);

  return (
    <div
      ref={containerRef}
      className={`space-y-4 text-right transition-colors duration-300 ${
        isFullscreen ? 'p-4 bg-stone-950 min-h-screen overflow-y-auto' : ''
      }`}
    >
      {/* Toast notification */}
      {toastMessage && (
        <div className="fixed top-20 left-1/2 -translate-x-1/2 z-50 bg-emerald-700 text-white px-5 py-2.5 rounded-full text-xs font-bold shadow-xl border border-emerald-400 animate-bounce">
          {toastMessage}
        </div>
      )}

      {/* Header Info & Quick Shortcuts */}
      <div className="rounded-3xl bg-gradient-to-r from-stone-900 via-stone-900 to-emerald-950/80 border border-emerald-500/30 p-4 sm:p-5 shadow-lg">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-xs font-bold text-emerald-400">
              <BookOpen className="w-4 h-4 text-emerald-400" />
              <span>مصحف المدينة المنورة النبوي الشريف (طبعة مجمع الملك فهد)</span>
              <span className="bg-emerald-950 text-emerald-300 px-2 py-0.5 rounded-full text-[10px] border border-emerald-500/30">
                عالي الدقة
              </span>
            </div>
            <h3 className="text-xl sm:text-2xl font-bold text-white font-quran">
              سُورَةُ {currentSurah.name} · الجزء {currentJuz}
            </h3>
            <p className="text-xs text-stone-300">
              تصفح المصحف كاملاً (604 صفحات) برسم عثماني أصيل فائق السرعة، مع حفظ العلامة، ومؤشر الأجزاء والسور.
            </p>
          </div>

          {/* Special Shortcuts Pill Bar (Includes Chapter 5 and Page 5) */}
          <div className="flex flex-wrap items-center gap-1.5 text-xs">
            <span className="text-[11px] text-stone-400 ml-1">روابط سريعة:</span>
            
            {/* The exact chapter 5 / Page 5 requested by user */}
            <button
              onClick={() => goToPage(5)}
              className={`px-3 py-1 rounded-xl font-bold transition-all cursor-pointer ${
                currentPage === 5
                  ? 'bg-amber-500 text-stone-950 font-black shadow-md ring-2 ring-amber-400/50'
                  : 'bg-amber-950/60 hover:bg-amber-900/80 text-amber-300 border border-amber-600/40'
              }`}
              title="الصفحة 5 من المصحف (سورة البقرة آية 25)"
            >
              📄 الصفحة 5
            </button>

            <button
              onClick={() => goToPage(106)}
              className={`px-3 py-1 rounded-xl font-bold transition-all cursor-pointer ${
                currentPage === 106
                  ? 'bg-amber-500 text-stone-950 font-black shadow-md ring-2 ring-amber-400/50'
                  : 'bg-amber-950/60 hover:bg-amber-900/80 text-amber-300 border border-amber-600/40'
              }`}
              title="سورة المائدة - السورة الخامسة في ترتيب القرآن (صفحة 106)"
            >
              📖 سورة المائدة (السورة 5)
            </button>

            <button
              onClick={() => goToPage(1)}
              className={`px-2.5 py-1 rounded-xl font-medium transition-all cursor-pointer ${
                currentPage === 1 ? 'bg-emerald-600 text-white font-bold' : 'bg-stone-800 text-stone-300 hover:text-white'
              }`}
            >
              الفاتحة (1)
            </button>

            <button
              onClick={() => goToPage(2)}
              className={`px-2.5 py-1 rounded-xl font-medium transition-all cursor-pointer ${
                currentPage === 2 ? 'bg-emerald-600 text-white font-bold' : 'bg-stone-800 text-stone-300 hover:text-white'
              }`}
            >
              البقرة (2)
            </button>

            <button
              onClick={() => goToPage(293)}
              className={`px-2.5 py-1 rounded-xl font-medium transition-all cursor-pointer ${
                currentPage === 293 ? 'bg-emerald-600 text-white font-bold' : 'bg-stone-800 text-stone-300 hover:text-white'
              }`}
            >
              الكهف (293)
            </button>

            <button
              onClick={() => goToPage(440)}
              className={`px-2.5 py-1 rounded-xl font-medium transition-all cursor-pointer ${
                currentPage === 440 ? 'bg-emerald-600 text-white font-bold' : 'bg-stone-800 text-stone-300 hover:text-white'
              }`}
            >
              يس (440)
            </button>

            <button
              onClick={() => goToPage(562)}
              className={`px-2.5 py-1 rounded-xl font-medium transition-all cursor-pointer ${
                currentPage === 562 ? 'bg-emerald-600 text-white font-bold' : 'bg-stone-800 text-stone-300 hover:text-white'
              }`}
            >
              الملك (562)
            </button>

            <button
              onClick={() => goToPage(582)}
              className={`px-2.5 py-1 rounded-xl font-medium transition-all cursor-pointer ${
                currentPage === 582 ? 'bg-emerald-600 text-white font-bold' : 'bg-stone-800 text-stone-300 hover:text-white'
              }`}
            >
              جزء عم (582)
            </button>

            {bookmarkPage && (
              <button
                onClick={() => goToPage(bookmarkPage)}
                className="px-3 py-1 rounded-xl bg-emerald-700/80 hover:bg-emerald-600 text-white font-bold transition-all flex items-center gap-1 border border-emerald-400/40 cursor-pointer"
                title={`العودة للعلامة المحفوظة: صفحة ${bookmarkPage}`}
              >
                <BookmarkCheck className="w-3.5 h-3.5 text-amber-300" />
                <span>العلامة (ص {bookmarkPage})</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Navigation & Controls Toolbar */}
      <div className="p-3.5 rounded-2xl bg-stone-900/90 border border-stone-800 flex flex-wrap items-center justify-between gap-3 shadow-md">
        {/* Left: Dropdowns for Surah & Juz */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Surah Selector */}
          <div className="flex items-center gap-1.5 bg-stone-950 border border-stone-800 rounded-xl px-2.5 py-1.5">
            <span className="text-xs text-stone-400 font-semibold">السورة:</span>
            <select
              value={currentSurah.number}
              onChange={(e) => {
                const sNum = parseInt(e.target.value, 10);
                const info = SURAH_STARTING_PAGES.find((s) => s.number === sNum);
                if (info) goToPage(info.startPage);
              }}
              className="bg-transparent text-xs text-emerald-400 font-bold outline-none cursor-pointer"
            >
              {SURAH_STARTING_PAGES.map((s) => (
                <option key={s.number} value={s.number} className="bg-stone-900 text-stone-100">
                  {s.number}. سورة {s.name} (ص {s.startPage})
                </option>
              ))}
            </select>
          </div>

          {/* Juz Selector */}
          <div className="flex items-center gap-1.5 bg-stone-950 border border-stone-800 rounded-xl px-2.5 py-1.5">
            <span className="text-xs text-stone-400 font-semibold">الجزء:</span>
            <select
              value={currentJuz}
              onChange={(e) => {
                const jNum = parseInt(e.target.value, 10);
                const info = JUZ_STARTING_PAGES.find((j) => j.juzNumber === jNum);
                if (info) goToPage(info.startPage);
              }}
              className="bg-transparent text-xs text-emerald-400 font-bold outline-none cursor-pointer"
            >
              {JUZ_STARTING_PAGES.map((j) => (
                <option key={j.juzNumber} value={j.juzNumber} className="bg-stone-900 text-stone-100">
                  {j.name} (ص {j.startPage})
                </option>
              ))}
            </select>
          </div>

          {/* Quick Page Jump input */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              const p = parseInt(inputPage, 10);
              if (!isNaN(p)) goToPage(p);
            }}
            className="flex items-center gap-1 bg-stone-950 border border-stone-800 rounded-xl px-2 py-1"
          >
            <span className="text-[11px] text-stone-400">ص:</span>
            <input
              type="number"
              min="1"
              max="604"
              value={inputPage}
              onChange={(e) => setInputPage(e.target.value)}
              className="w-12 bg-transparent text-center text-xs font-mono font-bold text-white outline-none"
            />
            <button
              type="submit"
              className="px-2 py-0.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-[11px] font-bold cursor-pointer"
            >
              انتقال
            </button>
          </form>

          {/* Server Selector for Maximum Reliability */}
          <div className="flex items-center gap-1.5 bg-stone-950 border border-stone-800 rounded-xl px-2.5 py-1.5" title="خادم تحميل صفحات المصحف الشريف">
            <Server className="w-3.5 h-3.5 text-emerald-400" />
            <span className="text-[11px] text-stone-400 font-semibold hidden md:inline">الخادم:</span>
            <select
              value={activeServerIndex}
              onChange={(e) => {
                const idx = parseInt(e.target.value, 10);
                setActiveServerIndex(idx);
                try {
                  localStorage.setItem('salati_mushaf_server_index', idx.toString());
                } catch {}
                showToast(`تم التبديل إلى: ${MUSHAF_SERVERS[idx].shortName}`);
              }}
              className="bg-transparent text-xs text-stone-200 font-semibold outline-none cursor-pointer"
            >
              {MUSHAF_SERVERS.map((server, sIdx) => (
                <option key={server.id} value={sIdx} className="bg-stone-900 text-stone-100">
                  {server.shortName}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Right: Display & Tool Buttons */}
        <div className="flex items-center gap-1.5 flex-wrap">
          {/* Download Quran PDF Button */}
          <button
            onClick={() => setIsDownloadModalOpen(true)}
            className="p-2 rounded-xl bg-gradient-to-r from-emerald-800 to-teal-800 hover:from-emerald-700 hover:to-teal-700 text-white font-bold border border-emerald-400/40 text-xs transition-all cursor-pointer flex items-center gap-1.5 shadow-md shadow-emerald-950/50"
            title="تحميل المصحف الشريف كاملاً (PDF) للقراءة بدون إنترنت"
          >
            <Download className="w-4 h-4 text-emerald-300" />
            <span className="hidden sm:inline">تحميل المصحف (PDF)</span>
          </button>

          {/* Educational Tafsir Button */}
          <button
            onClick={() => {
              if (pageVerses.length > 0) {
                setEducationalModalVerseKey(pageVerses[0].verseKey);
                setEducationalModalVerseText(pageVerses[0].text);
              } else {
                setEducationalModalVerseKey(`${currentSurah.number}:1`);
              }
            }}
            className="p-2 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-stone-950 font-black text-xs transition-all cursor-pointer flex items-center gap-1.5 shadow-md shadow-amber-500/20 active:scale-95"
            title="التفسير التعليمي والفوائد التدبرية الموثوقة لآيات الصفحة"
          >
            <GraduationCap className="w-4 h-4" />
            <span>التفسير التعليمي والتدبر</span>
          </button>

          {/* Tafsir Page Button */}
          <button
            onClick={() => setIsTafsirModalOpen(true)}
            className="p-2 rounded-xl bg-emerald-950/80 hover:bg-emerald-900 text-emerald-300 border border-emerald-500/40 text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5"
            title="عرض تفسير آيات هذه الصفحة (التفسير الميسر، السعدي، ابن كثير)"
          >
            <BookOpen className="w-4 h-4 text-emerald-400" />
            <span>تفسير الصفحة</span>
          </button>

          {/* Bookmark Button */}
          <button
            onClick={toggleBookmark}
            className={`p-2 rounded-xl border transition-all cursor-pointer flex items-center gap-1 text-xs ${
              bookmarkPage === currentPage
                ? 'bg-amber-500 text-stone-950 border-amber-400 font-bold shadow-md shadow-amber-950/60'
                : 'bg-stone-950 hover:bg-stone-800 text-stone-300 border-stone-800'
            }`}
            title={bookmarkPage === currentPage ? 'إلغاء العلامة' : 'حفظ علامة القراءة هنا'}
          >
            {bookmarkPage === currentPage ? (
              <>
                <BookmarkCheck className="w-4 h-4 fill-stone-950" />
                <span className="hidden sm:inline">محفوظة</span>
              </>
            ) : (
              <>
                <Bookmark className="w-4 h-4" />
                <span className="hidden sm:inline">علامة</span>
              </>
            )}
          </button>

          {/* Audio Recitation Toggle */}
          <button
            onClick={toggleAudio}
            className={`p-2 rounded-xl border transition-all cursor-pointer flex items-center gap-1 text-xs ${
              isAudioPlaying
                ? 'bg-emerald-600 text-white border-emerald-400 font-bold animate-pulse'
                : 'bg-stone-950 hover:bg-stone-800 text-stone-300 border-stone-800'
            }`}
            title="الاستماع لتلاوة السورة الحالية"
          >
            {isAudioPlaying ? <Pause className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
            <span className="hidden sm:inline">{isAudioPlaying ? 'إيقاف' : 'تلاوة السورة'}</span>
          </button>

          {/* Paper Theme Selector */}
          <div className="flex items-center bg-stone-950 border border-stone-800 rounded-xl p-1 gap-1">
            <button
              onClick={() => setPageTheme('classic')}
              className={`px-2 py-1 rounded-lg text-[11px] font-bold transition-all ${
                pageTheme === 'classic'
                  ? 'bg-amber-100 text-stone-900 shadow-xs'
                  : 'text-stone-400 hover:text-white'
              }`}
              title="ورق المصحف الأصلي الكلاسيكي"
            >
              أصلي
            </button>
            <button
              onClick={() => setPageTheme('dark')}
              className={`px-2 py-1 rounded-lg text-[11px] font-bold transition-all ${
                pageTheme === 'dark'
                  ? 'bg-stone-800 text-emerald-400 shadow-xs'
                  : 'text-stone-400 hover:text-white'
              }`}
              title="الوضع الليلي المريح للعين"
            >
              ليلي
            </button>
            <button
              onClick={() => setPageTheme('white')}
              className={`px-2 py-1 rounded-lg text-[11px] font-bold transition-all ${
                pageTheme === 'white'
                  ? 'bg-white text-stone-900 shadow-xs'
                  : 'text-stone-400 hover:text-white'
              }`}
              title="أبيض ناصع"
            >
              أبيض
            </button>
          </div>

          {/* Zoom controls */}
          <div className="flex items-center bg-stone-950 border border-stone-800 rounded-xl p-1 gap-0.5">
            <button
              onClick={() => setZoomLevel((z) => Math.min(160, z + 10))}
              className="p-1 rounded-lg hover:bg-stone-800 text-stone-300 hover:text-white cursor-pointer"
              title="تكبير"
            >
              <ZoomIn className="w-3.5 h-3.5" />
            </button>
            <span className="text-[10px] font-mono px-1 text-stone-400">{zoomLevel}%</span>
            <button
              onClick={() => setZoomLevel((z) => Math.max(70, z - 10))}
              className="p-1 rounded-lg hover:bg-stone-800 text-stone-300 hover:text-white cursor-pointer"
              title="تصغير"
            >
              <ZoomOut className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => setZoomLevel(100)}
              className="p-1 rounded-lg hover:bg-stone-800 text-stone-400 hover:text-white cursor-pointer"
              title="إعادة ضبط الحجم"
            >
              <RotateCcw className="w-3 h-3" />
            </button>
          </div>

          {/* Fullscreen Button */}
          <button
            onClick={toggleFullscreen}
            className="p-2 rounded-xl bg-stone-950 hover:bg-stone-800 text-stone-300 hover:text-white border border-stone-800 cursor-pointer transition-colors"
            title={isFullscreen ? 'إنهاء وضع ملء الشاشة' : 'تصفح بملء الشاشة'}
          >
            {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Main Mushaf Viewing Canvas (No top buttons covering text, full smooth touch swipe) */}
      <div className="relative flex flex-col items-center">
        {/* The Mushaf Page Container with Fluid Touch Gestures */}
        <div
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
          onTouchCancel={handleTouchEnd}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseLeave}
          className={`relative max-w-3xl w-full rounded-2xl shadow-2xl overflow-hidden border touch-pan-y select-none transition-shadow ${
            isDragging ? 'cursor-grabbing' : 'cursor-grab'
          } ${
            pageTheme === 'classic'
              ? 'bg-[#fbf8ef] border-[#e2d8bd] shadow-emerald-950/40'
              : pageTheme === 'dark'
              ? 'bg-stone-950 border-stone-800 shadow-black'
              : 'bg-white border-stone-200 shadow-stone-400/20'
          }`}
          style={{
            transform: `scale(${zoomLevel / 100}) translateX(${dragOffset}px)`,
            transformOrigin: 'top center',
            transition: isDragging
              ? 'none'
              : 'transform 0.25s cubic-bezier(0.2, 0.8, 0.2, 1), opacity 0.25s ease',
            opacity: isDragging ? Math.max(0.7, 1 - Math.abs(dragOffset) / 500) : 1,
          }}
        >
          {/* Real-time Visual Feedback on Drag / Swipe (Arabic Quran Direction) */}
          {dragOffset > 25 && (
            <div className="absolute top-1/2 right-4 -translate-y-1/2 z-30 bg-emerald-600/95 text-white px-4 py-2 rounded-full text-xs font-bold shadow-2xl border border-emerald-400/50 animate-pulse pointer-events-none flex items-center gap-1.5">
              <span>الصفحة التالية ({currentPage < 604 ? currentPage + 1 : 604})</span>
              <span>«</span>
            </div>
          )}
          {dragOffset < -25 && (
            <div className="absolute top-1/2 left-4 -translate-y-1/2 z-30 bg-emerald-600/95 text-white px-4 py-2 rounded-full text-xs font-bold shadow-2xl border border-emerald-400/50 animate-pulse pointer-events-none flex items-center gap-1.5">
              <span>»</span>
              <span>الصفحة السابقة ({currentPage > 1 ? currentPage - 1 : 1})</span>
            </div>
          )}

          {/* Header on page: Surah & Juz watermark ribbon */}
          <div
            className={`flex items-center justify-between px-6 py-2 border-b text-xs font-bold font-quran ${
              pageTheme === 'classic'
                ? 'bg-[#f4eedb] border-[#e5dcc4] text-[#4a3f2b]'
                : pageTheme === 'dark'
                ? 'bg-stone-900 border-stone-800 text-emerald-400'
                : 'bg-stone-100 border-stone-200 text-stone-700'
            }`}
          >
            <span>سورة {currentSurah.name}</span>
            <span className="text-[11px] font-mono opacity-80">
              {currentPage % 2 === 0 ? 'صفحة يمنى' : 'صفحة يسرى'}
            </span>
            <span>الجزء {currentJuz}</span>
          </div>

          {/* Subtle Non-Blocking Loading Spinner Indicator */}
          {isLoadingImage && (
            <div className="absolute top-12 left-1/2 -translate-x-1/2 z-30 flex items-center gap-2 bg-stone-900/95 text-emerald-400 border border-emerald-500/40 px-4 py-1.5 rounded-full text-xs font-bold shadow-xl animate-pulse">
              <div className="w-3.5 h-3.5 border-2 border-emerald-400 border-t-transparent rounded-full animate-spin"></div>
              <span>جاري استحضار الصفحة {currentPage}... ({MUSHAF_SERVERS[activeServerIndex].shortName})</span>
            </div>
          )}

          {/* Page Image */}
          <div className="relative min-h-[500px] sm:min-h-[700px] flex items-center justify-center p-2 sm:p-4">
            <img
              ref={imgRef}
              key={`mushaf_page_${currentPage}_server_${activeServerIndex}`}
              src={currentImageUrl}
              alt={`مصحف المدينة المنورة - صفحة ${currentPage}`}
              draggable={false}
              onDragStart={(e) => e.preventDefault()}
              className={`max-w-full h-auto object-contain select-none pointer-events-none transition-all duration-300 ${
                pageTheme === 'dark'
                  ? 'invert hue-rotate-180 brightness-90 contrast-125'
                  : 'contrast-105'
              }`}
              style={{
                maxHeight: isFullscreen ? '85vh' : '780px',
              }}
              onLoad={() => {
                if (watchdogTimerRef.current) {
                  clearTimeout(watchdogTimerRef.current);
                }
                setIsLoadingImage(false);
                setImageError(false);
              }}
              onError={() => {
                if (watchdogTimerRef.current) {
                  clearTimeout(watchdogTimerRef.current);
                }
                console.warn(
                  `Server ${activeServerIndex} failed for page ${currentPage}. Auto-switching server.`
                );
                // Try next server in sequence
                const nextIdx = (activeServerIndex + 1) % MUSHAF_SERVERS.length;
                if (nextIdx !== 0) {
                  advanceToNextServer(true);
                } else {
                  setIsLoadingImage(false);
                  setImageError(true);
                }
              }}
            />

            {/* Error Message if all Servers fail */}
            {imageError && (
              <div className="p-6 text-center space-y-4 bg-stone-900/95 border border-red-500/40 rounded-2xl max-w-md mx-auto my-12 text-white shadow-2xl">
                <div className="w-12 h-12 rounded-full bg-red-950/80 text-red-400 mx-auto flex items-center justify-center border border-red-500/40">
                  <RefreshCw className="w-6 h-6 animate-pulse" />
                </div>
                <div className="space-y-1">
                  <p className="text-base font-bold">تعذر استحضار صفحة المصحف ({currentPage})</p>
                  <p className="text-xs text-stone-300 leading-relaxed">
                    قد يكون ذلك بسبب بطء الاتصال أو حظر بعض خوادم التوزيع على شبكتك.
                    يمكنك التبديل إلى خادم آخر، أو تحميل المصحف الشريف كاملاً (PDF).
                  </p>
                </div>
                <div className="flex flex-wrap items-center justify-center gap-2 pt-2">
                  <button
                    onClick={() => advanceToNextServer(true)}
                    className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold cursor-pointer flex items-center gap-1.5 shadow-md shadow-emerald-700/30"
                  >
                    <Server className="w-3.5 h-3.5" />
                    <span>تجربة الخادم التالي ({MUSHAF_SERVERS[(activeServerIndex + 1) % MUSHAF_SERVERS.length].shortName})</span>
                  </button>
                  <button
                    onClick={() => setIsDownloadModalOpen(true)}
                    className="px-3.5 py-2 rounded-xl bg-stone-800 hover:bg-stone-750 text-stone-200 border border-stone-700 text-xs font-semibold cursor-pointer flex items-center gap-1.5"
                  >
                    <Download className="w-3.5 h-3.5 text-emerald-400" />
                    <span>تحميل المصحف PDF</span>
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Bottom Page Number Badge */}
          <div
            className={`flex items-center justify-between px-6 py-2 border-t text-xs font-bold ${
              pageTheme === 'classic'
                ? 'bg-[#f4eedb] border-[#e5dcc4] text-[#4a3f2b]'
                : pageTheme === 'dark'
                ? 'bg-stone-900 border-stone-800 text-stone-400'
                : 'bg-stone-100 border-stone-200 text-stone-600'
            }`}
          >
            <span className="text-[11px]">مجمع الملك فهد لطباعة المصحف الشريف</span>
            <span className="font-mono text-sm px-3 py-0.5 rounded-full bg-black/10 font-black">
              {currentPage}
            </span>
            <span className="text-[11px] font-mono">حفص عن عاصم</span>
          </div>
        </div>

        {/* Fast Page Scrubber Slider */}
        <div className="w-full max-w-3xl mt-4 px-4 py-2.5 rounded-2xl bg-stone-900/90 border border-stone-800 space-y-1.5" dir="rtl">
          <div className="flex items-center justify-between text-xs text-stone-400 font-semibold">
            <span className="text-emerald-400 font-bold">الفاتحة (1)</span>
            <span className="text-white bg-stone-950 px-3 py-0.5 rounded-xl border border-stone-800">
              الصفحة الحالية: <span className="font-mono text-emerald-400 font-black">{currentPage}</span> / 604
            </span>
            <span className="text-emerald-400 font-bold">الناس (604)</span>
          </div>
          <input
            type="range"
            min="1"
            max="604"
            dir="rtl"
            value={currentPage}
            onChange={(e) => goToPage(parseInt(e.target.value, 10))}
            className="w-full accent-emerald-500 cursor-pointer h-2 bg-stone-950 rounded-lg"
          />
        </div>

        {/* Helpful Swipe & Flip Tip */}
        <p className="text-[11px] text-stone-400 mt-2 text-center flex items-center justify-center gap-1.5 flex-wrap">
          <span className="text-emerald-400 font-bold">✨ ترتيب تقليب المصحف الشريف:</span>
          <span>اسحب لليمين (👉) للمتابعة إلى الصفحة التالية (مثل تكملة سورة الكهف)، واسحب لليسار (👈) للرجوع للصفحة السابقة.</span>
        </p>

        {/* Interactive Verses Panel with One-Click Educational Tafsir */}
        <div className="w-full max-w-4xl mt-6 p-4 sm:p-5 rounded-3xl bg-stone-900/90 border border-emerald-500/30 text-right space-y-4 shadow-xl">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-stone-800 pb-3">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="p-1.5 rounded-xl bg-emerald-500/20 text-emerald-400">
                  <GraduationCap className="w-4 h-4" />
                </span>
                <h4 className="font-bold text-sm text-white font-quran">
                  آيات الصفحة {currentPage} والتفسير التعليمي والتدبر
                </h4>
                <span className="text-[10px] bg-amber-500/20 text-amber-300 border border-amber-500/30 px-2 py-0.5 rounded-full font-sans font-bold">
                  انقر على أي آية لعرض تفسيرها
                </span>
              </div>
              <p className="text-[11px] text-stone-400">
                اضغط على أي آية مباركة أدناه لفتح نافذة التفسير الميسر والوقفات التدبرية والعمل بالآية المستمدة من مصادر موثوقة.
              </p>
            </div>

            <button
              onClick={() => setShowInteractiveVerses(!showInteractiveVerses)}
              className="px-3 py-1.5 rounded-xl bg-stone-800 hover:bg-stone-750 text-stone-300 text-xs font-semibold border border-stone-700 transition cursor-pointer self-start sm:self-auto"
            >
              {showInteractiveVerses ? 'طي القائمة' : 'عرض الآيات'}
            </button>
          </div>

          {showInteractiveVerses && (
            <div className="space-y-2.5">
              {isLoadingPageVerses ? (
                <div className="p-6 text-center text-xs text-stone-400 flex items-center justify-center gap-2">
                  <Sparkles className="w-4 h-4 text-emerald-400 animate-spin" />
                  <span>جارٍ تحضير آيات الصفحة للتفسير التعليمي...</span>
                </div>
              ) : pageVerses.length > 0 ? (
                <div className="space-y-3">
                  {/* Quick Ayah Jump Chips */}
                  <div className="flex items-center gap-1.5 overflow-x-auto pb-1.5 no-scrollbar">
                    <span className="text-[11px] text-stone-400 font-semibold whitespace-nowrap ml-1 flex items-center gap-1">
                      <GraduationCap className="w-3.5 h-3.5 text-emerald-400" />
                      <span>انقر للتفسير:</span>
                    </span>
                    {pageVerses.map((v) => (
                      <button
                        key={v.verseKey}
                        onClick={() => {
                          setEducationalModalVerseKey(v.verseKey);
                          setEducationalModalVerseText(v.text);
                        }}
                        className="px-2.5 py-1 rounded-xl bg-stone-950 hover:bg-emerald-950 text-stone-300 hover:text-emerald-300 border border-stone-800 hover:border-emerald-500/50 text-[11px] font-mono font-bold transition-all cursor-pointer whitespace-nowrap shadow-2xs"
                        title={`تفسير الآية ${v.ayahNumber}`}
                      >
                        آية {v.ayahNumber}
                      </button>
                    ))}
                  </div>

                  <div className="space-y-2">
                    {pageVerses.map((ayah) => {
                    const surahObj = ALL_SURAHS.find((s) => s.number === ayah.surahNumber) || currentSurah;
                    return (
                      <div
                        key={ayah.verseKey}
                        onClick={() => {
                          setEducationalModalVerseKey(ayah.verseKey);
                          setEducationalModalVerseText(ayah.text);
                        }}
                        className="group p-3 sm:p-4 rounded-2xl bg-stone-950/70 hover:bg-stone-850/90 border border-stone-800 hover:border-emerald-500/50 transition-all duration-200 cursor-pointer flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-right shadow-sm hover:shadow-emerald-950/40"
                      >
                        <div className="space-y-1.5 flex-1">
                          <div className="flex items-center gap-2 text-[11px] text-stone-400">
                            <span className="font-bold text-emerald-400 font-quran">سورة {surahObj.name}</span>
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
                    );
                  })}
                  </div>
                </div>
              ) : (
                <div className="p-4 text-center text-xs text-stone-400">
                  انقر على زر "تفسير الصفحة" أو "التفسير التعليمي والتدبر" بالأعلى للاطلاع على تفسير هذه الصفحة.
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Tafsir Modal for Current Page */}
      {isTafsirModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm animate-fade-in overflow-y-auto">
          <div className="relative w-full max-w-4xl bg-stone-900 border border-emerald-500/40 rounded-3xl p-5 sm:p-6 shadow-2xl space-y-4 text-right my-8 max-h-[88vh] overflow-y-auto">
            <button
              onClick={() => setIsTafsirModalOpen(false)}
              className="absolute top-4 left-4 p-2 text-stone-400 hover:text-white rounded-xl bg-stone-800 hover:bg-stone-700 cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <TafsirSection initialPage={currentPage} />
          </div>
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
            const found = pageVerses.find((v) => v.verseKey === newKey);
            setEducationalModalVerseText(found?.text);
          }}
        />
      )}

      {/* Download Holy Quran (PDF) Modal */}
      {isDownloadModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fade-in overflow-y-auto">
          <div className="relative w-full max-w-2xl bg-stone-900 border border-emerald-500/40 rounded-3xl p-6 sm:p-7 shadow-2xl space-y-5 text-right my-8">
            <button
              onClick={() => setIsDownloadModalOpen(false)}
              className="absolute top-5 left-5 p-2 text-stone-400 hover:text-white rounded-xl bg-stone-800 hover:bg-stone-700 cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="space-y-1">
              <div className="flex items-center gap-2 text-emerald-400 font-bold text-xs">
                <Download className="w-4 h-4" />
                <span>تحميل المصحف الشريف للقراءة دون اتصال (Offline)</span>
              </div>
              <h3 className="text-xl font-bold text-white font-quran">
                تحميل مصحف المدينة المنورة النبوي (PDF)
              </h3>
              <p className="text-xs text-stone-300 leading-relaxed">
                طبعة مجمع الملك فهد لطباعة المصحف الشريف بالمدينة المنورة برواية حفص عن عاصم، جاهزة للتحميل المباشر بصيغة PDF للقراءة على الهاتف أو الحاسوب أو الطباعة:
              </p>
            </div>

            <div className="space-y-3 pt-1">
              {QURAN_DOWNLOAD_RESOURCES.map((res, rIdx) => (
                <div
                  key={rIdx}
                  className="p-4 rounded-2xl bg-stone-950/80 border border-stone-800 hover:border-emerald-500/50 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-md"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-bold text-white font-quran">{res.title}</span>
                      <span className="px-2 py-0.5 rounded-full bg-emerald-950 text-emerald-300 border border-emerald-500/30 text-[10px] font-mono font-bold">
                        {res.size}
                      </span>
                    </div>
                    <p className="text-xs text-stone-400">{res.description}</p>
                  </div>

                  <a
                    href={res.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="shrink-0 px-4 py-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-bold transition-all shadow-md shadow-emerald-950/60 flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <Download className="w-4 h-4" />
                    <span>تحميل مباشر</span>
                  </a>
                </div>
              ))}
            </div>

            <div className="p-3.5 rounded-2xl bg-stone-950 border border-stone-800 text-[11px] text-stone-400 space-y-1">
              <div className="flex items-center gap-1.5 font-bold text-emerald-400">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>نصيحة للتصفح السريع بدون إنترنت:</span>
              </div>
              <p>
                التطبيق يحفظ الصفحات التي تفتحها تلقائياً في ذاكرة الهاتف المؤقتة، كما يمكنك تثبيت التطبيق كتطبيق PWA ليعمل بسلاسة حتى في وضع عدم الاتصال.
              </p>
            </div>

            <div className="flex justify-end pt-2">
              <button
                onClick={() => setIsDownloadModalOpen(false)}
                className="px-5 py-2 rounded-xl bg-stone-800 hover:bg-stone-700 text-stone-200 text-xs font-bold cursor-pointer"
              >
                إغلاق
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
