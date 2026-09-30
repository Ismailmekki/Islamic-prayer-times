import React, { useState, useMemo, useRef, useEffect } from 'react';
import {
  Search,
  X,
  Sparkles,
  Star,
  Check,
  Headphones,
  Play,
  Volume2,
  Users,
  Compass,
  BookOpen,
  Filter,
  ExternalLink,
  Flame,
  Music,
} from 'lucide-react';
import { QURAN_RECITERS, QuranReciter, ALL_SURAHS, SurahMeta } from '../data/quranData';
import { ARABIC_LETTERS } from '../data/allReciters';

interface RecitersBrowserModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedReciter: QuranReciter;
  onSelectReciter: (reciter: QuranReciter) => void;
  currentSurah?: SurahMeta;
}

// Arabic text normalizer for search
function normalizeArabic(text: string): string {
  return text
    .replace(/[\u064B-\u065F\u0670]/g, '') // Tashkeel
    .replace(/[أإآ]/g, 'ا')
    .replace(/ة/g, 'ه')
    .replace(/ى/g, 'ي')
    .replace(/[\s\-_]/g, '')
    .toLowerCase();
}

export const RecitersBrowserModal: React.FC<RecitersBrowserModalProps> = ({
  isOpen,
  onClose,
  selectedReciter,
  onSelectReciter,
  currentSurah,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedLetter, setSelectedLetter] = useState<string>('الكل');
  const [activeCategory, setActiveCategory] = useState<
    'all' | 'favorites' | 'haramain' | 'classic' | 'reverent' | 'riwayat'
  >('all');

  const lettersContainerRef = useRef<HTMLDivElement>(null);

  // Favorites stored in localStorage
  const [favorites, setFavorites] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('salati_fav_reciters');
      if (saved) return JSON.parse(saved);
    } catch {}
    return [
      'alafasy',
      'abdulbasit_murattal',
      'minshawy_murattal',
      'husary',
      'muaiqly',
      'dosari',
      'sds',
      'ajm',
      'ghamadi',
      'islam_sobhi',
      'kordi',
    ];
  });

  const toggleFavorite = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const updated = favorites.includes(id)
      ? favorites.filter((fid) => fid !== id)
      : [...favorites, id];
    setFavorites(updated);
    try {
      localStorage.setItem('salati_fav_reciters', JSON.stringify(updated));
    } catch {}
  };

  // Precompute count of reciters per letter
  const letterCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const r of QURAN_RECITERS) {
      const l = r.letter || 'أ';
      counts[l] = (counts[l] || 0) + 1;
    }
    return counts;
  }, []);

  // Filtered reciters list
  const filteredReciters = useMemo(() => {
    return QURAN_RECITERS.filter((reciter) => {
      // 1. Category filter
      if (activeCategory === 'favorites') {
        if (!favorites.includes(reciter.id)) return false;
      } else if (activeCategory !== 'all') {
        if (reciter.category !== activeCategory) return false;
      }

      // 2. Alphabetical Letter filter
      if (selectedLetter !== 'الكل') {
        if (reciter.letter !== selectedLetter) return false;
      }

      // 3. Search query filter
      if (searchQuery.trim()) {
        const queryNorm = normalizeArabic(searchQuery.trim());
        const nameNorm = normalizeArabic(reciter.nameArabic);
        const styleNorm = normalizeArabic(reciter.styleArabic);
        return nameNorm.includes(queryNorm) || styleNorm.includes(queryNorm);
      }

      return true;
    });
  }, [activeCategory, selectedLetter, searchQuery, favorites]);

  // Reset all filters
  const resetFilters = () => {
    setSearchQuery('');
    setSelectedLetter('الكل');
    setActiveCategory('all');
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-5xl h-[92vh] max-h-[900px] bg-stone-900 border border-emerald-500/30 rounded-3xl shadow-2xl flex flex-col overflow-hidden text-right">
        {/* Top Header */}
        <div className="p-4 sm:p-5 border-b border-stone-800 bg-gradient-to-r from-stone-950 via-stone-900 to-emerald-950/80 flex items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="w-8 h-8 rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center shrink-0">
                <Users className="w-4 h-4" />
              </span>
              <h2 className="text-base sm:text-xl font-black text-white font-quran">
                مكتبة قراء القرآن الكريم الشاملة ({QURAN_RECITERS.length}+ قارئ)
              </h2>
              <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/20 border border-emerald-500/40 text-[11px] font-bold text-emerald-300">
                فهرس شبكة سورة قرآن surahquran.com
              </span>
            </div>
            <p className="text-xs text-stone-300">
              استمع للمصحف المرتل والمجود بصوت جميع قراء ومشايخ العالم الإسلامي مرتبين حسب الحروف الهجائية
            </p>
          </div>

          <button
            onClick={onClose}
            className="p-2.5 rounded-full bg-stone-800/80 hover:bg-stone-700 text-stone-400 hover:text-white transition-colors cursor-pointer shrink-0"
            title="إغلاق"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Search, Categories & Alphabetical Letters Toolbar */}
        <div className="p-3 sm:p-4 border-b border-stone-800 bg-stone-950/70 space-y-3">
          {/* Search Input */}
          <div className="relative">
            <Search className="w-4 h-4 text-stone-400 absolute right-3.5 top-3.5" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="ابحث باسم القارئ (مثال: العفاسي، المنشاوي، عبد الباسط، المعيقلي، الدوسري، الطبلاوي، رعد الكردي، إسلام صبحي...)"
              className="w-full bg-stone-900 border border-stone-700 focus:border-emerald-500 rounded-2xl py-2.5 pr-10 pl-16 text-xs sm:text-sm text-white placeholder-stone-500 focus:outline-none transition-colors"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute left-3 top-2.5 px-2 py-1 rounded-lg bg-stone-800 hover:bg-stone-700 text-stone-300 text-xs cursor-pointer"
              >
                مسح
              </button>
            )}
          </div>

          {/* Category Tabs */}
          <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-1">
            {[
              { id: 'all', label: `جميع القراء (${QURAN_RECITERS.length})` },
              { id: 'favorites', label: `المفضلة ⭐ (${favorites.length})` },
              { id: 'haramain', label: 'أئمة الحرمين الشريفين 🕋' },
              { id: 'classic', label: 'كبار القراء والعمالقة 📜' },
              { id: 'reverent', label: 'تلاوات خاشعة وشجية 🌿' },
              { id: 'riwayat', label: 'الروايات (ورش، قالون، الدوري) 📖' },
            ].map((tab) => {
              const isActive = activeCategory === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => {
                    setActiveCategory(tab.id as typeof activeCategory);
                    if (tab.id === 'favorites') setSelectedLetter('الكل');
                  }}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer border shrink-0 ${
                    isActive
                      ? 'bg-emerald-600 text-white border-emerald-400 shadow-md shadow-emerald-950/60'
                      : 'bg-stone-900 text-stone-400 hover:text-stone-200 border-stone-800 hover:bg-stone-800'
                  }`}
                >
                  {tab.label}
                </button>
              );
            })}
          </div>

          {/* Alphabetical Letters Index Bar (فهرس الحروف الهجائية على غرار surahquran.com) */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-[11px] text-stone-400">
              <span className="flex items-center gap-1 font-semibold text-emerald-400">
                <BookOpen className="w-3.5 h-3.5" />
                <span>فهرس البحث بالأحرف الهجائية (surahquran.com):</span>
              </span>
              {selectedLetter !== 'الكل' && (
                <button
                  onClick={() => setSelectedLetter('الكل')}
                  className="text-amber-400 hover:underline cursor-pointer"
                >
                  إلغاء تصفية الحرف (عرض الكل)
                </button>
              )}
            </div>

            <div
              ref={lettersContainerRef}
              className="flex items-center gap-1 overflow-x-auto no-scrollbar py-1"
            >
              {ARABIC_LETTERS.map((letter) => {
                const isActive = selectedLetter === letter;
                const count = letter === 'الكل' ? QURAN_RECITERS.length : letterCounts[letter] || 0;

                // Don't show letters with zero reciters unless 'الكل'
                if (letter !== 'الكل' && !count) return null;

                return (
                  <button
                    key={letter}
                    onClick={() => setSelectedLetter(letter)}
                    className={`min-w-8 h-8 px-2 rounded-xl text-xs font-bold transition-all cursor-pointer border shrink-0 flex items-center justify-center gap-1 ${
                      isActive
                        ? 'bg-amber-500 text-stone-950 border-amber-300 font-black shadow-md scale-105'
                        : 'bg-stone-900 text-stone-300 hover:text-white border-stone-800 hover:border-stone-700 hover:bg-stone-800'
                    }`}
                    title={letter === 'الكل' ? 'جميع الأحرف' : `حرف ${letter} (${count} قارئ)`}
                  >
                    <span>{letter}</span>
                    {letter !== 'الكل' && (
                      <span className={`text-[10px] ${isActive ? 'text-stone-900' : 'text-stone-400'}`}>
                        {count}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Results Grid List */}
        <div className="flex-1 overflow-y-auto p-3 sm:p-5 space-y-3">
          {/* Status bar */}
          <div className="text-xs text-stone-400 flex items-center justify-between pb-1 px-1">
            <span className="flex items-center gap-2">
              <span>
                عرض <strong className="text-emerald-400 font-bold">{filteredReciters.length}</strong> قارئ
              </span>
              {selectedLetter !== 'الكل' && (
                <span className="px-2 py-0.5 rounded-md bg-amber-500/20 text-amber-300 border border-amber-500/30 text-[11px]">
                  حرف {selectedLetter}
                </span>
              )}
            </span>
            {currentSurah && (
              <span className="text-[11px] text-emerald-300/90 font-medium">
                السورة الحالية للاستماع: <strong className="text-white">سورة {currentSurah.name}</strong>
              </span>
            )}
          </div>

          {filteredReciters.length === 0 ? (
            <div className="py-20 text-center space-y-3">
              <p className="text-sm text-stone-400">
                لا يوجد مقرئ مطابق لبحثك أو التصنيف المحدد
              </p>
              <button
                onClick={resetFilters}
                className="px-5 py-2.5 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold cursor-pointer transition-colors shadow-lg shadow-emerald-950/80"
              >
                إعادة ضبط الفلاتر وعرض جميع القراء ({QURAN_RECITERS.length})
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2.5 sm:gap-3">
              {filteredReciters.map((reciter) => {
                const isSelected = selectedReciter.id === reciter.id;
                const isFav = favorites.includes(reciter.id);

                return (
                  <div
                    key={reciter.id}
                    onClick={() => {
                      onSelectReciter(reciter);
                      onClose();
                    }}
                    className={`p-3.5 rounded-2xl border transition-all cursor-pointer flex flex-col justify-between gap-3 text-right group ${
                      isSelected
                        ? 'bg-emerald-950/80 border-emerald-400 shadow-xl shadow-emerald-950/80 ring-1 ring-emerald-500/40'
                        : 'bg-stone-950/60 hover:bg-stone-800/80 border-stone-800 hover:border-emerald-500/40'
                    }`}
                  >
                    {/* Top Row: Icon + Name & Narration */}
                    <div className="flex items-start gap-3 min-w-0">
                      <div
                        className={`w-11 h-11 rounded-2xl flex items-center justify-center shrink-0 border transition-transform group-hover:scale-105 ${
                          isSelected
                            ? 'bg-emerald-600 text-white border-emerald-400 shadow-md shadow-emerald-900/60'
                            : 'bg-stone-900 text-emerald-400 border-stone-800 group-hover:border-emerald-500/40'
                        }`}
                      >
                        {isSelected ? (
                          <Volume2 className="w-5 h-5 animate-pulse" />
                        ) : (
                          <Headphones className="w-5 h-5" />
                        )}
                      </div>

                      <div className="min-w-0 flex-1 space-y-1">
                        <div className="flex items-center justify-between gap-1">
                          <h4 className="text-xs sm:text-sm font-bold text-white truncate group-hover:text-emerald-300 transition-colors">
                            {reciter.nameArabic}
                          </h4>
                          <span className="w-5 h-5 rounded-md bg-stone-900 border border-stone-800 text-[10px] font-bold text-stone-400 flex items-center justify-center shrink-0">
                            {reciter.letter}
                          </span>
                        </div>

                        <p className="text-[11px] text-stone-400 truncate">
                          {reciter.styleArabic}
                        </p>

                        <div className="flex items-center gap-1.5 flex-wrap pt-0.5">
                          <span className="px-1.5 py-0.5 rounded-md bg-stone-900 border border-stone-800 text-[10px] text-stone-300">
                            {reciter.surahTotal === 114 ? 'المصحف كاملاً 114 سورة' : `${reciter.surahTotal || 114} سورة`}
                          </span>

                          {reciter.category === 'haramain' && (
                            <span className="px-1.5 py-0.5 rounded-md bg-emerald-500/10 border border-emerald-500/30 text-[10px] text-emerald-300">
                              الحرمين الشريفين 🕋
                            </span>
                          )}

                          {reciter.category === 'classic' && (
                            <span className="px-1.5 py-0.5 rounded-md bg-amber-500/10 border border-amber-500/30 text-[10px] text-amber-300">
                              من كبار العمالقة 📜
                            </span>
                          )}

                          {reciter.category === 'reverent' && (
                            <span className="px-1.5 py-0.5 rounded-md bg-teal-500/10 border border-teal-500/30 text-[10px] text-teal-300">
                              تلاوة خاشعة 🌿
                            </span>
                          )}

                          {reciter.category === 'riwayat' && (
                            <span className="px-1.5 py-0.5 rounded-md bg-purple-500/10 border border-purple-500/30 text-[10px] text-purple-300">
                              رواية معتمدة 📖
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Bottom Row: Actions */}
                    <div className="pt-2 border-t border-stone-800/80 flex items-center justify-between gap-2">
                      <button
                        onClick={(e) => toggleFavorite(reciter.id, e)}
                        className={`p-1.5 rounded-xl border transition-colors cursor-pointer flex items-center gap-1 text-[11px] ${
                          isFav
                            ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                            : 'text-stone-500 hover:text-stone-300 border-stone-800/80 hover:bg-stone-900'
                        }`}
                        title={isFav ? 'إزالة من المفضلة' : 'إضافة إلى المفضلة'}
                      >
                        <Star className={`w-3.5 h-3.5 ${isFav ? 'fill-current' : ''}`} />
                        <span className="hidden sm:inline">{isFav ? 'مفضلة' : 'تفضيل'}</span>
                      </button>

                      <div className="flex items-center gap-1.5">
                        {isSelected ? (
                          <span className="px-3 py-1.5 rounded-xl bg-emerald-600 text-white text-xs font-bold flex items-center gap-1 shadow-md shadow-emerald-950/60">
                            <Check className="w-3.5 h-3.5" />
                            <span>القارئ الحالي</span>
                          </span>
                        ) : (
                          <button
                            onClick={() => {
                              onSelectReciter(reciter);
                              onClose();
                            }}
                            className="px-3 py-1.5 rounded-xl bg-stone-800 hover:bg-emerald-600 text-stone-200 hover:text-white text-xs font-bold transition-all cursor-pointer flex items-center gap-1 shadow-sm"
                          >
                            <Play className="w-3 h-3 fill-current" />
                            <span>استماع وتثبيت</span>
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer info & acknowledgment */}
        <div className="p-3 sm:p-4 bg-stone-950 border-t border-stone-800 text-xs text-stone-400 flex flex-col sm:flex-row items-center justify-between gap-2 px-4 sm:px-6">
          <div className="flex items-center gap-2 text-right">
            <span>
              القارئ النشط حالياً:{' '}
              <strong className="text-emerald-400">{selectedReciter.nameArabic}</strong>
            </span>
            <span className="text-stone-600">|</span>
            <span className="text-[11px] text-stone-400">
              المصدر: سورة قرآن (surahquran.com) & MP3Quran
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={resetFilters}
              className="px-3 py-1.5 rounded-xl bg-stone-900 hover:bg-stone-800 text-stone-300 text-xs font-medium cursor-pointer transition-colors border border-stone-800"
            >
              عرض الكل
            </button>
            <button
              onClick={onClose}
              className="px-4 py-1.5 rounded-xl bg-emerald-700 hover:bg-emerald-600 text-white text-xs font-bold cursor-pointer transition-colors shadow-md"
            >
              تم
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
