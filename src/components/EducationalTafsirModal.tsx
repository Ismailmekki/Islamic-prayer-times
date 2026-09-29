import React, { useState, useEffect, useRef } from 'react';
import {
  X,
  BookOpen,
  Volume2,
  VolumeX,
  Play,
  Pause,
  Copy,
  Check,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  Share2,
  Bookmark,
  BookmarkCheck,
  Layers,
  GraduationCap,
  Heart,
  Compass,
  RefreshCw,
  ExternalLink,
  ZoomIn,
  ZoomOut,
  Maximize2,
  HelpCircle,
} from 'lucide-react';
import {
  tafsirService,
  AVAILABLE_TAFSIR_BOOKS,
  TafsirBook,
} from '../services/tafsirService';
import {
  getEducationalTadabburForAyah,
  TadabburGem,
} from '../data/tadabburData';
import { ALL_SURAHS, SurahMeta } from '../data/quranData';

export interface EducationalTafsirModalProps {
  isOpen: boolean;
  onClose: () => void;
  verseKey: string; // e.g. "1:1", "2:255"
  initialVerseText?: string;
  onNavigateVerse?: (newVerseKey: string) => void;
}

export const EducationalTafsirModal: React.FC<EducationalTafsirModalProps> = ({
  isOpen,
  onClose,
  verseKey,
  initialVerseText,
  onNavigateVerse,
}) => {
  // Parse surah and ayah numbers from verseKey
  const [surahNum, ayahNum] = (verseKey || '1:1')
    .split(':')
    .map((n) => parseInt(n, 10) || 1);

  const currentSurah: SurahMeta =
    ALL_SURAHS.find((s) => s.number === surahNum) || ALL_SURAHS[0];

  // Active Tab: 'tafsir' | 'tadabbur' | 'vocabulary'
  const [activeTab, setActiveTab] = useState<'tafsir' | 'tadabbur' | 'vocabulary'>('tafsir');

  // Selected Tafsir Book (Default: التفسير الميسر)
  const [selectedBook, setSelectedBook] = useState<TafsirBook>(AVAILABLE_TAFSIR_BOOKS[0]);

  // Content states
  const [verseText, setVerseText] = useState<string>(initialVerseText || '');
  const [tafsirText, setTafsirText] = useState<string>('');
  const [tadabbur, setTadabbur] = useState<TadabburGem | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Audio Playback
  const [isPlayingAudio, setIsPlayingAudio] = useState<boolean>(false);
  const [audioReciter, setAudioReciter] = useState<'Alafasy' | 'Husary'>('Alafasy');
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Appearance & UX
  const [fontSize, setFontSize] = useState<number>(24);
  const [copiedToast, setCopiedToast] = useState<string | null>(null);
  const [isBookmarked, setIsBookmarked] = useState<boolean>(false);

  // Check saved bookmarks
  useEffect(() => {
    try {
      const saved = localStorage.getItem('salati_tafsir_bookmarks');
      if (saved) {
        const list: string[] = JSON.parse(saved);
        setIsBookmarked(list.includes(verseKey));
      }
    } catch {}
  }, [verseKey]);

  // Load verse text, tafsir, and tadabbur benefits
  useEffect(() => {
    if (!isOpen) return;

    let isCancelled = false;
    setIsLoading(true);

    // 1. Fetch Uthmani text if not provided
    if (!initialVerseText) {
      tafsirService.getAyahUthmaniText(verseKey).then((txt) => {
        if (!isCancelled && txt) setVerseText(txt);
      });
    } else {
      setVerseText(initialVerseText);
    }

    // 2. Fetch Tafsir from the selected book
    tafsirService
      .getAyahTafsir(verseKey, selectedBook.id)
      .then((explanation) => {
        if (!isCancelled) {
          setTafsirText(explanation);
          // 3. Compute Educational Tadabbur reflections based on the verse
          const gem = getEducationalTadabburForAyah(
            verseKey,
            surahNum,
            ayahNum,
            currentSurah.name,
            explanation
          );
          setTadabbur(gem);
          setIsLoading(false);
        }
      })
      .catch(() => {
        if (!isCancelled) {
          setTafsirText('يتطلب جلب التفسير اتصالاً نشطاً بالإنترنت.');
          setIsLoading(false);
        }
      });

    // Reset audio when verse changes
    if (audioRef.current) {
      audioRef.current.pause();
      setIsPlayingAudio(false);
    }

    return () => {
      isCancelled = true;
      if (audioRef.current) {
        audioRef.current.pause();
      }
    };
  }, [isOpen, verseKey, selectedBook, initialVerseText]);

  if (!isOpen) return null;

  // Toggle single Ayah audio playback
  const togglePlayAudio = () => {
    const audioUrl = tafsirService.getAyahAudioUrl(verseKey, audioReciter);

    if (isPlayingAudio) {
      if (audioRef.current) audioRef.current.pause();
      setIsPlayingAudio(false);
    } else {
      if (!audioRef.current) {
        audioRef.current = new Audio(audioUrl);
        audioRef.current.onended = () => setIsPlayingAudio(false);
      } else {
        audioRef.current.src = audioUrl;
      }

      audioRef.current
        .play()
        .then(() => setIsPlayingAudio(true))
        .catch(() => setIsPlayingAudio(false));
    }
  };

  // Toggle bookmark
  const toggleBookmark = () => {
    try {
      const saved = localStorage.getItem('salati_tafsir_bookmarks');
      let list: string[] = saved ? JSON.parse(saved) : [];
      if (isBookmarked) {
        list = list.filter((k) => k !== verseKey);
        setIsBookmarked(false);
        showToast('تمت إزالة الآية من المحفوظات');
      } else {
        list.push(verseKey);
        setIsBookmarked(true);
        showToast('تم حفظ الآية في الوقفات التدبرية المفضلة');
      }
      localStorage.setItem('salati_tafsir_bookmarks', JSON.stringify(list));
    } catch {}
  };

  const showToast = (msg: string) => {
    setCopiedToast(msg);
    setTimeout(() => setCopiedToast(null), 2500);
  };

  // Copy full educational tafsir text
  const handleCopyComprehensive = () => {
    const textToCopy = `﴿${verseText}﴾ [سورة ${currentSurah.name}: ${ayahNum}]\n\n📖 التفسير الميسر:\n${tafsirText.replace(/<[^>]+>/g, '')}\n\n🌿 وقفة تدبرية:\n${tadabbur?.reflection || ''}\n\n💡 العمل بالآية:\n${tadabbur?.actionItem || ''}\n\n— المصدر: تطبيق صلاتي (التفسير والتدبر التعليمي)`;
    navigator.clipboard.writeText(textToCopy);
    showToast('تم نسخ نص الآية والتفسير والفوائد التدبرية بنجاح!');
  };

  // Share via Web Share API
  const handleShare = async () => {
    const shareText = `﴿${verseText}﴾ [سورة ${currentSurah.name}: ${ayahNum}]\n\n📖 التفسير (${selectedBook.name}):\n${tafsirText.replace(/<[^>]+>/g, '').slice(0, 300)}...\n\n🌿 وقفة تدبرية:\n${tadabbur?.reflection || ''}`;
    if (navigator.share) {
      try {
        await navigator.share({
          title: `تفسير وتدبر سورة ${currentSurah.name} - آية ${ayahNum}`,
          text: shareText,
        });
      } catch {}
    } else {
      handleCopyComprehensive();
    }
  };

  // Navigate to previous or next Ayah within current surah
  const handlePrevAyah = () => {
    if (ayahNum > 1) {
      const newKey = `${surahNum}:${ayahNum - 1}`;
      if (onNavigateVerse) onNavigateVerse(newKey);
    }
  };

  const handleNextAyah = () => {
    if (ayahNum < currentSurah.numberOfAyahs) {
      const newKey = `${surahNum}:${ayahNum + 1}`;
      if (onNavigateVerse) onNavigateVerse(newKey);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/85 backdrop-blur-md animate-fade-in overflow-y-auto">
      <div className="relative w-full max-w-3xl bg-stone-900 border border-emerald-500/40 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh] text-right">
        {/* Modal Header */}
        <div className="px-5 py-4 bg-gradient-to-r from-stone-950 via-stone-900 to-emerald-950/80 border-b border-stone-800 flex items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-emerald-600/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400">
              <GraduationCap className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-white font-quran">
                  سورة {currentSurah.name}
                </h3>
                <span className="text-[11px] bg-emerald-950 text-emerald-300 border border-emerald-500/30 px-2 py-0.5 rounded-full font-sans font-bold">
                  آية {ayahNum}
                </span>
                <span className="text-[10px] text-stone-400">
                  ({currentSurah.revelationType === 'Meccan' ? 'مكية' : 'مدنية'})
                </span>
              </div>
              <p className="text-[11px] text-emerald-400 font-medium">
                التفسير التعليمي والفوائد التدبرية الموثوقة
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            {/* Font Sizer */}
            <div className="hidden sm:flex items-center gap-1 bg-stone-950/80 border border-stone-800 rounded-xl p-1 text-stone-300">
              <button
                onClick={() => setFontSize((s) => Math.max(18, s - 2))}
                className="w-6 h-6 flex items-center justify-center hover:text-white rounded cursor-pointer"
                title="تصغير الخط"
              >
                <ZoomOut className="w-3.5 h-3.5" />
              </button>
              <span className="text-[10px] font-mono px-1">A</span>
              <button
                onClick={() => setFontSize((s) => Math.min(36, s + 2))}
                className="w-6 h-6 flex items-center justify-center hover:text-white rounded cursor-pointer"
                title="تكبير الخط"
              >
                <ZoomIn className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Bookmark button */}
            <button
              onClick={toggleBookmark}
              className={`p-2 rounded-xl border transition-colors cursor-pointer ${
                isBookmarked
                  ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                  : 'bg-stone-850 hover:bg-stone-800 text-stone-300 border-stone-700'
              }`}
              title={isBookmarked ? 'محفوظة في وقفاتك' : 'حفظ الآية للتدبر'}
            >
              {isBookmarked ? <BookmarkCheck className="w-4 h-4" /> : <Bookmark className="w-4 h-4" />}
            </button>

            {/* Close Button */}
            <button
              onClick={onClose}
              className="p-2 rounded-xl bg-stone-850 hover:bg-stone-800 text-stone-300 hover:text-white border border-stone-700 cursor-pointer transition-colors"
              title="إغلاق النافذة"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Scrollable Modal Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-5 scrollbar-thin">
          {/* Toast Alert */}
          {copiedToast && (
            <div className="p-3 rounded-2xl bg-emerald-600 text-white text-xs font-bold flex items-center gap-2 shadow-lg animate-in slide-in-from-top">
              <Check className="w-4 h-4" />
              <span>{copiedToast}</span>
            </div>
          )}

          {/* 1. Holy Ayah Display Card */}
          <div className="relative p-5 sm:p-6 rounded-3xl bg-gradient-to-b from-[#1c1813] to-[#14120e] border border-amber-500/30 text-amber-100 shadow-xl space-y-4 text-center">
            <div className="text-[11px] text-amber-400/80 tracking-widest font-semibold flex items-center justify-center gap-2">
              <span>✦</span>
              <span>نَصُّ الآيَةِ الكَرِيمَةِ بِالرَّسْمِ العُثْمَانِيِّ</span>
              <span>✦</span>
            </div>

            {/* Ayah Text in Uthmani Script */}
            <div
              className="font-quran leading-loose text-amber-100 select-text px-2 py-1 tracking-wide"
              style={{ fontSize: `${fontSize}px`, lineHeight: '2.1' }}
            >
              {verseText || 'بِسْمِ ٱللَّهِ ٱلرَّحْمَـٰنِ ٱلرَّحِيمِ'}
              <span className="inline-flex items-center justify-center w-8 h-8 rounded-full border border-amber-400/40 text-amber-300 text-xs font-mono font-bold mx-2 align-middle bg-amber-950/40">
                {ayahNum}
              </span>
            </div>

            {/* Ayah Audio & Quick Actions Bar */}
            <div className="pt-3 border-t border-amber-500/20 flex flex-wrap items-center justify-between gap-3 text-xs">
              {/* Audio Listen */}
              <div className="flex items-center gap-2">
                <button
                  onClick={togglePlayAudio}
                  className={`px-3 py-1.5 rounded-xl font-bold flex items-center gap-1.5 transition-all cursor-pointer shadow-md ${
                    isPlayingAudio
                      ? 'bg-amber-500 text-stone-950 shadow-amber-500/30 animate-pulse'
                      : 'bg-stone-900 hover:bg-stone-850 text-amber-200 border border-amber-500/30'
                  }`}
                  title="استماع لتلاوة الآية"
                >
                  {isPlayingAudio ? <Pause className="w-3.5 h-3.5 fill-current" /> : <Play className="w-3.5 h-3.5 fill-current" />}
                  <span>{isPlayingAudio ? 'إيقاف التلاوة' : 'سماع الآية'}</span>
                </button>

                <select
                  value={audioReciter}
                  onChange={(e) => setAudioReciter(e.target.value as any)}
                  className="bg-stone-900 text-stone-300 text-[11px] rounded-xl px-2 py-1.5 border border-stone-800 cursor-pointer focus:outline-none"
                >
                  <option value="Alafasy">الشيخ العفاسي</option>
                  <option value="Husary">الشيخ الحصري</option>
                </select>
              </div>

              {/* Copy & Share Ayah text */}
              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(`﴿${verseText}﴾ [سورة ${currentSurah.name}: ${ayahNum}]`);
                    showToast('تم نسخ نص الآية الكريمة');
                  }}
                  className="px-2.5 py-1.5 rounded-xl bg-stone-900 hover:bg-stone-850 text-stone-300 hover:text-white border border-stone-800 flex items-center gap-1.5 cursor-pointer"
                  title="نسخ الآية فقط"
                >
                  <Copy className="w-3.5 h-3.5 text-stone-400" />
                  <span>نسخ الآية</span>
                </button>

                <button
                  onClick={handleShare}
                  className="px-2.5 py-1.5 rounded-xl bg-stone-900 hover:bg-stone-850 text-stone-300 hover:text-white border border-stone-800 flex items-center gap-1.5 cursor-pointer"
                  title="مشاركة الآية مع التفسير"
                >
                  <Share2 className="w-3.5 h-3.5 text-emerald-400" />
                  <span>مشاركة</span>
                </button>
              </div>
            </div>
          </div>

          {/* 2. Educational Tabs Bar */}
          <div className="flex items-center p-1.5 rounded-2xl bg-stone-950 border border-stone-800 gap-1.5">
            <button
              onClick={() => setActiveTab('tafsir')}
              className={`flex-1 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer ${
                activeTab === 'tafsir'
                  ? 'bg-emerald-600 text-white shadow-md shadow-emerald-700/40'
                  : 'text-stone-400 hover:text-white'
              }`}
            >
              <BookOpen className="w-4 h-4" />
              <span>التفسير الميسر والشرح المعتمد</span>
            </button>

            <button
              onClick={() => setActiveTab('tadabbur')}
              className={`flex-1 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer ${
                activeTab === 'tadabbur'
                  ? 'bg-amber-500 text-stone-950 font-black shadow-md shadow-amber-500/30'
                  : 'text-stone-400 hover:text-white'
              }`}
            >
              <Sparkles className="w-4 h-4" />
              <span>الفوائد والوقفات التدبرية</span>
              <span className="text-[10px] bg-amber-950 text-amber-200 px-1.5 py-0.2 rounded-md font-sans">
                مصادر موثوقة
              </span>
            </button>

            {tadabbur?.vocabulary && tadabbur.vocabulary.length > 0 && (
              <button
                onClick={() => setActiveTab('vocabulary')}
                className={`px-3 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                  activeTab === 'vocabulary'
                    ? 'bg-emerald-600 text-white shadow-md'
                    : 'text-stone-400 hover:text-white'
                }`}
              >
                <span>غريب الألفاظ</span>
                <span className="text-[10px] bg-stone-800 text-stone-300 px-1.5 py-0.2 rounded-full">
                  {tadabbur.vocabulary.length}
                </span>
              </button>
            )}
          </div>

          {/* 3. TAB 1: Tafsir Content */}
          {activeTab === 'tafsir' && (
            <div className="space-y-4">
              {/* Tafsir Book Switcher */}
              <div className="flex flex-wrap items-center justify-between gap-2.5 p-3 rounded-2xl bg-stone-950/70 border border-stone-800 text-xs">
                <span className="text-stone-400 font-semibold flex items-center gap-1.5">
                  <Layers className="w-3.5 h-3.5 text-emerald-400" />
                  <span>كتاب التفسير:</span>
                </span>

                <div className="flex flex-wrap items-center gap-1.5">
                  {AVAILABLE_TAFSIR_BOOKS.map((b) => {
                    const isSelected = selectedBook.id === b.id;
                    return (
                      <button
                        key={b.id}
                        onClick={() => setSelectedBook(b)}
                        className={`px-2.5 py-1 rounded-xl text-[11px] font-semibold border transition-all cursor-pointer ${
                          isSelected
                            ? 'bg-emerald-600 text-white border-emerald-500 font-bold shadow-xs'
                            : 'bg-stone-900 border-stone-800 text-stone-300 hover:bg-stone-850 hover:text-white'
                        }`}
                      >
                        {b.name}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Tafsir Explanation Box */}
              <div className="p-5 sm:p-6 rounded-3xl bg-stone-950/70 border border-stone-800 space-y-3">
                <div className="flex items-center justify-between border-b border-stone-800/80 pb-2.5">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-sm text-emerald-400">{selectedBook.name}</span>
                    <span className="text-stone-500 text-xs">({selectedBook.author})</span>
                  </div>
                  <span className="text-[11px] text-stone-400">معنى الآية {ayahNum}</span>
                </div>

                {isLoading ? (
                  <div className="p-8 text-center text-stone-400 text-xs flex items-center justify-center gap-2">
                    <RefreshCw className="w-4 h-4 animate-spin text-emerald-400" />
                    <span>جارٍ استحضار التفسير المعتمد...</span>
                  </div>
                ) : (
                  <div
                    className="text-stone-200 text-sm leading-relaxed whitespace-pre-line select-text font-sans"
                    dangerouslySetInnerHTML={{ __html: tafsirText }}
                  />
                )}
              </div>
            </div>
          )}

          {/* 4. TAB 2: Tadabbur Benefits from Authentic Sources */}
          {activeTab === 'tadabbur' && (
            <div className="space-y-4">
              {/* Introduction Banner */}
              <div className="p-4 rounded-2xl bg-gradient-to-r from-amber-950/40 via-stone-900 to-emerald-950/40 border border-amber-500/30 flex items-start gap-3">
                <Sparkles className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
                <div className="space-y-1 text-xs">
                  <strong className="text-amber-300 font-bold block text-sm">
                    فضل التدبر القرآني: ﴿أَفَلَا يَتَدَبَّرُونَ الْقُرْآنَ أَمْ عَلَىٰ قُلُوبٍ أَقْفَالُهَا﴾
                  </strong>
                  <p className="text-stone-300 leading-relaxed">
                    التدبر هو الغاية العظمى من إنزال القرآن؛ لنقل الآيات من مجرد التلاوة باللسان إلى حياة تعاش، ويقين يملأ القلب، وعمل تستقيم به الجوارح.
                  </p>
                </div>
              </div>

              {/* Tadabbur Section Cards */}
              <div className="space-y-3.5">
                {/* 1. Reflection / الوقفة التدبرية */}
                <div className="p-4 sm:p-5 rounded-2xl bg-stone-950/70 border border-amber-500/30 space-y-2">
                  <div className="flex items-center gap-2 text-amber-400 text-xs font-bold">
                    <Heart className="w-4 h-4 text-amber-400" />
                    <span>الوقفة التدبرية واللطائف الإيمانية:</span>
                  </div>
                  <p className="text-stone-200 text-xs sm:text-sm leading-relaxed select-text font-sans">
                    {tadabbur?.reflection || 'تأمل في دلالة الآية الكريمة وعظيم خطابها، واستحضر عظمة المتكلم سبحانه وتعالى بها.'}
                  </p>
                </div>

                {/* 2. Action Item / العمل بالآية */}
                <div className="p-4 sm:p-5 rounded-2xl bg-stone-950/70 border border-emerald-500/30 space-y-2">
                  <div className="flex items-center gap-2 text-emerald-400 text-xs font-bold">
                    <Check className="w-4 h-4 text-emerald-400" />
                    <span>العمل بالآية (التطبيق العملي في حياتك اليوم):</span>
                  </div>
                  <p className="text-stone-200 text-xs sm:text-sm leading-relaxed select-text font-sans">
                    {tadabbur?.actionItem || 'ترجم هذا المعنى القرآني إلى دعاء في سجودك وخلق في تعاملك وسلوك في يومك.'}
                  </p>
                </div>

                {/* 3. Guidance / الهدايات والدروس */}
                <div className="p-4 sm:p-5 rounded-2xl bg-stone-950/70 border border-stone-800 space-y-2">
                  <div className="flex items-center gap-2 text-blue-400 text-xs font-bold">
                    <Compass className="w-4 h-4 text-blue-400" />
                    <span>الهدايات والدروس المستفادة:</span>
                  </div>
                  <p className="text-stone-200 text-xs sm:text-sm leading-relaxed select-text font-sans">
                    {tadabbur?.guidance || 'القرآن كتاب هداية وبركة وتزكية للنفوس لمن أقبل عليه بقلب حاضر.'}
                  </p>
                </div>

                {/* Source Attribution */}
                <div className="p-2.5 rounded-xl bg-stone-900 border border-stone-800/80 text-[11px] text-stone-400 flex items-center justify-between">
                  <span>المصدر المعتمد:</span>
                  <span className="text-emerald-400 font-semibold">
                    {tadabbur?.source || 'تفسير السعدي والمختصر في التفسير'}
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* 5. TAB 3: Vocabulary Breakdown */}
          {activeTab === 'vocabulary' && tadabbur?.vocabulary && (
            <div className="space-y-3">
              <div className="text-xs text-stone-400">
                معاني الكلمات والمفردات اللغوية الواردة في الآية الشريفة:
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {tadabbur.vocabulary.map((voc, idx) => (
                  <div
                    key={idx}
                    className="p-3.5 rounded-2xl bg-stone-950 border border-stone-800 text-right space-y-1"
                  >
                    <span className="font-quran font-bold text-amber-300 text-sm block">
                      {voc.word}
                    </span>
                    <p className="text-stone-300 text-xs leading-relaxed">{voc.meaning}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer with Consecutive Ayah Navigation */}
        <div className="px-5 py-3.5 bg-stone-950 border-t border-stone-800 flex flex-wrap items-center justify-between gap-3 shrink-0">
          {/* Previous / Next Ayah Navigator */}
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrevAyah}
              disabled={ayahNum <= 1}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1 border transition-all cursor-pointer ${
                ayahNum <= 1
                  ? 'opacity-40 border-stone-800 text-stone-600 cursor-not-allowed'
                  : 'bg-stone-900 hover:bg-stone-850 text-stone-200 border-stone-700 hover:border-emerald-500'
              }`}
              title="الآية السابقة"
            >
              <ChevronRight className="w-4 h-4" />
              <span>الآية السابقة ({ayahNum > 1 ? ayahNum - 1 : 1})</span>
            </button>

            <button
              onClick={handleNextAyah}
              disabled={ayahNum >= currentSurah.numberOfAyahs}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1 border transition-all cursor-pointer ${
                ayahNum >= currentSurah.numberOfAyahs
                  ? 'opacity-40 border-stone-800 text-stone-600 cursor-not-allowed'
                  : 'bg-stone-900 hover:bg-stone-850 text-stone-200 border-stone-700 hover:border-emerald-500'
              }`}
              title="الآية التالية"
            >
              <span>الآية التالية ({ayahNum < currentSurah.numberOfAyahs ? ayahNum + 1 : ayahNum})</span>
              <ChevronLeft className="w-4 h-4" />
            </button>
          </div>

          {/* Copy Full Package & Close */}
          <div className="flex items-center gap-2">
            <button
              onClick={handleCopyComprehensive}
              className="px-3.5 py-1.5 rounded-xl bg-stone-850 hover:bg-stone-800 text-stone-200 border border-stone-700 text-xs font-semibold flex items-center gap-1.5 cursor-pointer"
            >
              <Copy className="w-3.5 h-3.5 text-emerald-400" />
              <span>نسخ التفسير والفوائد</span>
            </button>

            <button
              onClick={onClose}
              className="px-4 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs cursor-pointer shadow-md shadow-emerald-700/30"
            >
              إغلاق
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
