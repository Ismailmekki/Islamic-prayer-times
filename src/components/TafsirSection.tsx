import React, { useState, useEffect } from 'react';
import {
  BookOpen,
  Search,
  Copy,
  Check,
  ChevronDown,
  Layers,
  Sparkles,
  RefreshCw,
  Share2,
} from 'lucide-react';
import {
  AVAILABLE_TAFSIR_BOOKS,
  TafsirBook,
  AyahTafsirItem,
  tafsirService,
} from '../services/tafsirService';
import { ALL_SURAHS, SurahMeta } from '../data/quranData';

interface TafsirSectionProps {
  initialPage?: number;
  initialSurah?: number;
  onJumpToPage?: (page: number) => void;
}

export const TafsirSection: React.FC<TafsirSectionProps> = ({
  initialPage = 1,
  initialSurah = 1,
  onJumpToPage,
}) => {
  const [selectedBook, setSelectedBook] = useState<TafsirBook>(AVAILABLE_TAFSIR_BOOKS[0]);
  const [viewMode, setViewMode] = useState<'page' | 'surah'>('page');

  const [currentPage, setCurrentPage] = useState<number>(initialPage);
  const [selectedSurah, setSelectedSurah] = useState<SurahMeta>(
    ALL_SURAHS.find((s) => s.number === initialSurah) || ALL_SURAHS[0]
  );

  const [tafsirItems, setTafsirItems] = useState<AyahTafsirItem[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [searchFilter, setSearchFilter] = useState<string>('');
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  // Load Tafsir whenever page, surah, or book changes
  useEffect(() => {
    let isCancelled = false;
    setIsLoading(true);

    const promise =
      viewMode === 'page'
        ? tafsirService.getTafsirForPage(currentPage, selectedBook.id)
        : tafsirService.getTafsirForSurah(selectedSurah.number, selectedBook.id);

    promise.then((items) => {
      if (!isCancelled) {
        setTafsirItems(items);
        setIsLoading(false);
      }
    });

    return () => {
      isCancelled = true;
    };
  }, [viewMode, currentPage, selectedSurah, selectedBook]);

  // Copy single ayah tafsir
  const copyTafsir = (item: AyahTafsirItem) => {
    const plainText = item.text.replace(/<[^>]+>/g, '');
    const fullText = `تفسير الآية (${item.verseKey}) من ${selectedBook.name}:\n${plainText}`;
    navigator.clipboard.writeText(fullText);
    setCopiedKey(item.verseKey);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const filteredItems = tafsirItems.filter(
    (item) =>
      item.text.toLowerCase().includes(searchFilter.toLowerCase()) ||
      item.verseKey.includes(searchFilter)
  );

  return (
    <div className="space-y-6 text-right">
      {/* Header Banner */}
      <div className="rounded-3xl bg-gradient-to-r from-stone-900 via-stone-900 to-emerald-950/80 border border-emerald-500/30 p-5 sm:p-6 shadow-xl space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-xs font-bold text-emerald-400">
              <BookOpen className="w-4 h-4 text-emerald-400" />
              <span>تفسير آيات القرآن الكريم المعتمدة</span>
              <span className="bg-emerald-950 text-emerald-300 px-2 py-0.5 rounded-full text-[10px] border border-emerald-500/30">
                شرح موثوق
              </span>
            </div>
            <h2 className="text-xl sm:text-2xl font-bold text-white font-quran">
              {selectedBook.name} · {viewMode === 'page' ? `الصفحة ${currentPage}` : `سورة ${selectedSurah.name}`}
            </h2>
            <p className="text-xs text-stone-300">{selectedBook.description}</p>
          </div>

          {/* Book Selector Dropdown */}
          <div className="bg-stone-950/90 border border-stone-800 rounded-2xl p-2 shrink-0">
            <label className="text-[11px] text-stone-400 font-semibold block mb-1">
              اختر كتاب التفسير:
            </label>
            <select
              value={selectedBook.id}
              onChange={(e) => {
                const book = AVAILABLE_TAFSIR_BOOKS.find((b) => b.id === parseInt(e.target.value, 10));
                if (book) setSelectedBook(book);
              }}
              className="bg-transparent text-xs font-bold text-amber-300 outline-none cursor-pointer"
            >
              {AVAILABLE_TAFSIR_BOOKS.map((b) => (
                <option key={b.id} value={b.id} className="bg-stone-900 text-stone-100">
                  {b.name} ({b.author})
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* View Mode & Page/Surah Selectors */}
        <div className="pt-2 border-t border-stone-800 flex flex-wrap items-center justify-between gap-3 text-xs">
          {/* View Mode Toggle */}
          <div className="flex items-center p-1 rounded-xl bg-stone-950 border border-stone-800 gap-1">
            <button
              onClick={() => setViewMode('page')}
              className={`px-3 py-1 rounded-lg font-bold transition-all cursor-pointer ${
                viewMode === 'page'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'text-stone-400 hover:text-white'
              }`}
            >
              تفسير بالصفحة (1-604)
            </button>
            <button
              onClick={() => setViewMode('surah')}
              className={`px-3 py-1 rounded-lg font-bold transition-all cursor-pointer ${
                viewMode === 'surah'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'text-stone-400 hover:text-white'
              }`}
            >
              تفسير بالسورة (1-114)
            </button>
          </div>

          {/* Navigation Controls */}
          {viewMode === 'page' ? (
            <div className="flex items-center gap-2">
              <button
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage <= 1}
                className="px-2.5 py-1 rounded-lg bg-stone-950 hover:bg-stone-800 text-stone-200 border border-stone-800 disabled:opacity-40 cursor-pointer"
              >
                الصفحة السابقة
              </button>
              <div className="flex items-center gap-1 bg-stone-950 border border-stone-800 px-2 py-0.5 rounded-lg">
                <span className="text-[11px] text-stone-400">صفحة:</span>
                <input
                  type="number"
                  min="1"
                  max="604"
                  value={currentPage}
                  onChange={(e) => {
                    const p = parseInt(e.target.value, 10);
                    if (p >= 1 && p <= 604) setCurrentPage(p);
                  }}
                  className="w-12 bg-transparent text-center font-mono font-bold text-emerald-400 outline-none"
                />
              </div>
              <button
                onClick={() => setCurrentPage((p) => Math.min(604, p + 1))}
                disabled={currentPage >= 604}
                className="px-2.5 py-1 rounded-lg bg-stone-950 hover:bg-stone-800 text-stone-200 border border-stone-800 disabled:opacity-40 cursor-pointer"
              >
                الصفحة التالية
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <span className="text-stone-400 font-semibold">اختر السورة:</span>
              <select
                value={selectedSurah.number}
                onChange={(e) => {
                  const s = ALL_SURAHS.find((item) => item.number === parseInt(e.target.value, 10));
                  if (s) setSelectedSurah(s);
                }}
                className="bg-stone-950 border border-stone-800 rounded-xl px-3 py-1.5 text-xs font-bold text-emerald-400 outline-none cursor-pointer"
              >
                {ALL_SURAHS.map((s) => (
                  <option key={s.number} value={s.number} className="bg-stone-900 text-stone-100">
                    {s.number}. سورة {s.name}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Search inside tafsir */}
          <div className="relative">
            <input
              type="text"
              placeholder="بحث في كلمات التفسير..."
              value={searchFilter}
              onChange={(e) => setSearchFilter(e.target.value)}
              className="w-48 bg-stone-950 border border-stone-800 rounded-xl px-3 py-1 text-xs text-white placeholder-stone-500 outline-none focus:border-emerald-500"
            />
          </div>
        </div>
      </div>

      {/* Tafsir Verses List */}
      {isLoading ? (
        <div className="p-16 text-center text-stone-400 space-y-3">
          <div className="w-10 h-10 border-3 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="text-xs font-quran">جاري استحضار التفسير الموثوق...</p>
        </div>
      ) : filteredItems.length === 0 ? (
        <div className="p-12 text-center text-stone-400 bg-stone-900/60 border border-stone-800 rounded-3xl">
          لم يتم العثور على نتائج للبحث في هذا المقطع.
        </div>
      ) : (
        <div className="space-y-4">
          {filteredItems.map((item) => (
            <div
              key={item.verseKey}
              className="p-5 rounded-3xl bg-stone-900/80 border border-stone-800 hover:border-emerald-700/50 transition-all shadow-md space-y-2 text-right"
            >
              <div className="flex items-center justify-between border-b border-stone-800/80 pb-2">
                <div className="flex items-center gap-2">
                  <span className="w-8 h-8 rounded-xl bg-emerald-950 border border-emerald-500/40 text-xs font-mono font-bold text-emerald-400 flex items-center justify-center">
                    {item.verseKey}
                  </span>
                  <span className="text-xs font-bold text-amber-400 font-quran">
                    الآية {item.ayahNumber} (سورة {item.surahNumber})
                  </span>
                </div>

                <button
                  onClick={() => copyTafsir(item)}
                  className="px-2.5 py-1 rounded-xl bg-stone-950 hover:bg-stone-800 text-stone-300 hover:text-white border border-stone-800 text-[11px] font-bold flex items-center gap-1 cursor-pointer"
                  title="نسخ تفسير هذه الآية"
                >
                  {copiedKey === item.verseKey ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-400" />
                      <span className="text-emerald-400">تم النسخ</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      <span>نسخ التفسير</span>
                    </>
                  )}
                </button>
              </div>

              {/* Tafsir Content with Arabic typography */}
              <div
                className="text-stone-200 text-base leading-relaxed font-sans pt-1"
                dangerouslySetInnerHTML={{ __html: item.text }}
              />
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
