import React, { useState, useEffect, useRef } from 'react';
import {
  ChevronLeft,
  ChevronRight,
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
} from 'lucide-react';
import { TafsirSection } from './TafsirSection';
import {
  SURAH_STARTING_PAGES,
  JUZ_STARTING_PAGES,
  getJuzForPage,
  getSurahForPage,
  getPrimaryPageImageUrl,
  getFallbackPageImageUrl,
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

  // Image loading & fallback state
  const [isLoadingImage, setIsLoadingImage] = useState<boolean>(true);
  const [useFallbackServer, setUseFallbackServer] = useState<boolean>(false);
  const [imageError, setImageError] = useState<boolean>(false);

  // Zoom & View controls
  const [zoomLevel, setZoomLevel] = useState<number>(100);
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);
  const [pageTheme, setPageTheme] = useState<'classic' | 'dark' | 'white'>('classic');
  const [isTafsirModalOpen, setIsTafsirModalOpen] = useState<boolean>(false);

  // Input jump state
  const [inputPage, setInputPage] = useState<string>(currentPage.toString());
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Optional synchronous audio recitation
  const [isAudioPlaying, setIsAudioPlaying] = useState<boolean>(false);
  const [selectedReciter, setSelectedReciter] = useState<QuranReciter>(QURAN_RECITERS[0]);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  // Current metadata
  const currentSurah = getSurahForPage(currentPage);
  const currentJuz = getJuzForPage(currentPage);

  // Save current page
  useEffect(() => {
    try {
      localStorage.setItem('salati_mushaf_current_page', currentPage.toString());
    } catch {}
    setInputPage(currentPage.toString());
    setIsLoadingImage(true);
    setImageError(false);
    setUseFallbackServer(false);
  }, [currentPage]);

  // Preload adjacent pages for instant flipping
  useEffect(() => {
    if (currentPage > 1) {
      const prevImg = new Image();
      prevImg.src = getPrimaryPageImageUrl(currentPage - 1);
    }
    if (currentPage < 604) {
      const nextImg = new Image();
      nextImg.src = getPrimaryPageImageUrl(currentPage + 1);
    }
  }, [currentPage]);

  // Keyboard navigation (Arrow keys)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't trigger if user is typing in an input
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return;
      }

      // In Arabic (Right to Left):
      // Left Arrow = Next page (flipping leftwards)
      // Right Arrow = Previous page (flipping rightwards)
      if (e.key === 'ArrowLeft') {
        goToNextPage();
      } else if (e.key === 'ArrowRight') {
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

  // Next page (Arabic reading direction: advances page count)
  const goToNextPage = () => {
    if (currentPage < 604) {
      goToPage(currentPage + 1);
    } else {
      showToast('أنت الآن في الصفحة الأخيرة (ختام المصحف الشريف)');
    }
  };

  // Previous page
  const goToPrevPage = () => {
    if (currentPage > 1) {
      goToPage(currentPage - 1);
    } else {
      showToast('أنت الآن في الصفحة الأولى (فاتحة الكتاب)');
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

  // Current image source
  const currentImageUrl = useFallbackServer
    ? getFallbackPageImageUrl(currentPage)
    : getPrimaryPageImageUrl(currentPage);

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
        </div>

        {/* Right: Display & Tool Buttons */}
        <div className="flex items-center gap-1.5 flex-wrap">
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

      {/* Main Mushaf Viewing Canvas with Turn Buttons */}
      <div className="relative flex flex-col items-center">
        {/* Navigation controls top bar */}
        <div className="w-full max-w-3xl flex items-center justify-between px-2 py-1 text-xs text-stone-400 font-semibold mb-1">
          {/* Note in Arabic: Turning to page + 1 is flipping Left */}
          <button
            onClick={goToNextPage}
            disabled={currentPage >= 604}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border transition-all cursor-pointer ${
              currentPage >= 604
                ? 'opacity-40 cursor-not-allowed bg-stone-900 border-stone-800 text-stone-600'
                : 'bg-emerald-950/80 hover:bg-emerald-900 text-emerald-300 border-emerald-500/40 active:scale-95'
            }`}
          >
            <ChevronRight className="w-4 h-4" />
            <span>الصفحة التالية ({currentPage < 604 ? currentPage + 1 : 604})</span>
          </button>

          <div className="flex items-center gap-2">
            <span className="font-bold text-stone-200">
              الصفحة <span className="font-mono text-emerald-400 text-sm">{currentPage}</span> من 604
            </span>
          </div>

          <button
            onClick={goToPrevPage}
            disabled={currentPage <= 1}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border transition-all cursor-pointer ${
              currentPage <= 1
                ? 'opacity-40 cursor-not-allowed bg-stone-900 border-stone-800 text-stone-600'
                : 'bg-emerald-950/80 hover:bg-emerald-900 text-emerald-300 border-emerald-500/40 active:scale-95'
            }`}
          >
            <span>الصفحة السابقة ({currentPage > 1 ? currentPage - 1 : 1})</span>
            <ChevronLeft className="w-4 h-4" />
          </button>
        </div>

        {/* The Mushaf Page Container */}
        <div
          className={`relative max-w-3xl w-full rounded-2xl shadow-2xl transition-all duration-300 overflow-hidden border ${
            pageTheme === 'classic'
              ? 'bg-[#fbf8ef] border-[#e2d8bd] shadow-emerald-950/40'
              : pageTheme === 'dark'
              ? 'bg-stone-950 border-stone-800 shadow-black'
              : 'bg-white border-stone-200 shadow-stone-400/20'
          }`}
          style={{
            transform: `scale(${zoomLevel / 100})`,
            transformOrigin: 'top center',
          }}
        >
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

          {/* Loading Overlay */}
          {isLoadingImage && (
            <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-stone-950/40 backdrop-blur-xs text-white gap-2">
              <div className="w-10 h-10 border-3 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
              <span className="text-xs font-bold font-quran">جاري استحضار الصفحة {currentPage}...</span>
            </div>
          )}

          {/* Page Image */}
          <div className="relative min-h-[500px] sm:min-h-[700px] flex items-center justify-center p-2 sm:p-4">
            <img
              key={`mushaf_page_${currentPage}_${useFallbackServer}`}
              src={currentImageUrl}
              alt={`مصحف المدينة المنورة - صفحة ${currentPage}`}
              className={`max-w-full h-auto object-contain select-none transition-all duration-300 ${
                pageTheme === 'dark'
                  ? 'invert hue-rotate-180 brightness-90 contrast-125'
                  : 'contrast-105'
              }`}
              style={{
                maxHeight: isFullscreen ? '85vh' : '780px',
              }}
              onLoad={() => {
                setIsLoadingImage(false);
                setImageError(false);
              }}
              onError={() => {
                // If primary CDN fails, switch to QuranFlash server fallback
                if (!useFallbackServer) {
                  console.warn(`Primary page image failed for ${currentPage}, trying QuranFlash server`);
                  setUseFallbackServer(true);
                } else {
                  setIsLoadingImage(false);
                  setImageError(true);
                }
              }}
            />

            {/* Error Message if both CDNs fail */}
            {imageError && (
              <div className="p-6 text-center space-y-3 bg-red-950/80 border border-red-800 rounded-2xl max-w-md mx-auto my-12 text-white">
                <p className="text-sm font-bold">تعذر تحميل صورة الصفحة {currentPage}</p>
                <p className="text-xs text-stone-300">
                  يرجى التأكد من اتصال الإنترنت ثم إعادة المحاولة.
                </p>
                <button
                  onClick={() => {
                    setIsLoadingImage(true);
                    setImageError(false);
                    setUseFallbackServer(false);
                  }}
                  className="px-4 py-2 rounded-xl bg-red-700 hover:bg-red-600 text-xs font-bold cursor-pointer"
                >
                  إعادة المحاولة
                </button>
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
        <div className="w-full max-w-3xl mt-4 px-3 py-2 rounded-2xl bg-stone-900/80 border border-stone-800 space-y-1">
          <div className="flex items-center justify-between text-[11px] text-stone-400">
            <span>الفاتحة (1)</span>
            <span className="font-bold text-emerald-400">
              شريط التنقل السريع: صفحة {currentPage}
            </span>
            <span>الناس (604)</span>
          </div>
          <input
            type="range"
            min="1"
            max="604"
            value={currentPage}
            onChange={(e) => goToPage(parseInt(e.target.value, 10))}
            className="w-full accent-emerald-500 cursor-pointer"
          />
        </div>

        {/* Helpful Keyboard Tip */}
        <p className="text-[11px] text-stone-500 mt-2 text-center">
          💡 يمكنك استخدام مفاتيح الأسهم (← و →) في لوحة المفاتيح لتقليب الصفحات يمنة ويسرة بسهولة.
        </p>
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
    </div>
  );
};
