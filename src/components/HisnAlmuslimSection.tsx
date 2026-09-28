import React, { useState, useEffect, useMemo } from 'react';
import {
  Shield,
  Search,
  Heart,
  BookOpen,
  Copy,
  Check,
  RotateCcw,
  Sparkles,
  Share2,
  Bookmark,
  Sun,
  Moon,
  Clock,
  Home,
  ShieldAlert,
  Compass,
  Coffee,
  HeartPulse,
  Send,
  X,
  Volume2,
} from 'lucide-react';
import {
  HISN_ALMUSLIM_ITEMS,
  HISN_CATEGORIES,
  HisnDhikr,
} from '../data/hisnMuslimData';
import { soundService } from '../utils/soundService';

interface HisnAlmuslimSectionProps {
  onSendToMasbaha?: (text: string, count: number) => void;
}

const FAVORITES_STORAGE_KEY = 'salati_hisn_favorites_v1';

export const HisnAlmuslimSection: React.FC<HisnAlmuslimSectionProps> = ({
  onSendToMasbaha,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [counters, setCounters] = useState<Record<string, number>>({});
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [sharedToast, setSharedToast] = useState<string | null>(null);

  // Favorites state persisted in localStorage
  const [favorites, setFavorites] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem(FAVORITES_STORAGE_KEY);
      return saved ? JSON.parse(saved) : ['hisn_sayyid_istighfar', 'hisn_ayat_kursi', 'hisn_karb_dua'];
    } catch {
      return ['hisn_sayyid_istighfar', 'hisn_ayat_kursi', 'hisn_karb_dua'];
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem(FAVORITES_STORAGE_KEY, JSON.stringify(favorites));
    } catch {
      // ignore
    }
  }, [favorites]);

  const toggleFavorite = (id: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    soundService.playTasbeehClick();
    setFavorites((prev) => {
      const exists = prev.includes(id);
      const updated = exists ? prev.filter((item) => item !== id) : [...prev, id];
      setSharedToast(exists ? 'تمت الإزالة من المفضلة' : 'تمت الإضافة إلى أذكارك المفضلة ⭐');
      setTimeout(() => setSharedToast(null), 2500);
      return updated;
    });
  };

  const handleIncrement = (item: HisnDhikr, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    soundService.playTasbeehClick();
    const current = counters[item.id] || 0;
    const nextVal = current + 1;
    setCounters((prev) => ({
      ...prev,
      [item.id]: nextVal,
    }));

    if (nextVal === item.count) {
      soundService.playGoalCelebration();
    }
  };

  const handleResetCounter = (id: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    soundService.playTasbeehClick();
    setCounters((prev) => ({
      ...prev,
      [id]: 0,
    }));
  };

  const handleCopy = (item: HisnDhikr, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    const formatted = `📜 من حصن المسلم: ${item.title}\n\n«${item.arabicText}»\n\n📌 المرجع: ${item.reference}${item.virtue ? `\n✨ الفضل: ${item.virtue}` : ''}\n\nتطبيق صلاتي`;
    navigator.clipboard.writeText(formatted);
    setCopiedId(item.id);
    setSharedToast('تم نسخ الذكر مع التخريج إلى الحافظة');
    setTimeout(() => {
      setCopiedId(null);
      setSharedToast(null);
    }, 2500);
  };

  const handleShare = async (item: HisnDhikr, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    const text = `📜 ${item.title} (حصن المسلم):\n\n«${item.arabicText}»\n\n📌 ${item.reference}\n\nتطبيق صلاتي`;
    if (navigator.share) {
      try {
        await navigator.share({
          title: `حصن المسلم: ${item.title}`,
          text: text,
        });
      } catch {
        // Fallback to copy
        handleCopy(item);
      }
    } else {
      handleCopy(item);
    }
  };

  // Filter items based on category, search, and favorites
  const filteredItems = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return HISN_ALMUSLIM_ITEMS.filter((item) => {
      // Category filter
      if (selectedCategory === 'favorites') {
        if (!favorites.includes(item.id)) return false;
      } else if (selectedCategory !== 'all') {
        if (item.category !== selectedCategory) return false;
      }

      // Search filter
      if (!q) return true;
      return (
        item.title.toLowerCase().includes(q) ||
        item.arabicText.toLowerCase().includes(q) ||
        item.chapterTitle.toLowerCase().includes(q) ||
        item.reference.toLowerCase().includes(q) ||
        (item.virtue && item.virtue.toLowerCase().includes(q))
      );
    });
  }, [searchQuery, selectedCategory, favorites]);

  // Statistics
  const completedInSessionCount = useMemo(() => {
    return Object.entries(counters).filter(([id, count]) => {
      const item = HISN_ALMUSLIM_ITEMS.find((d) => d.id === id);
      return item && count >= item.count;
    }).length;
  }, [counters]);

  const getCategoryIcon = (iconName: string) => {
    switch (iconName) {
      case 'Sun':
        return <Sun className="w-3.5 h-3.5 text-amber-400" />;
      case 'Moon':
        return <Moon className="w-3.5 h-3.5 text-indigo-400" />;
      case 'Clock':
        return <Clock className="w-3.5 h-3.5 text-emerald-400" />;
      case 'Home':
        return <Home className="w-3.5 h-3.5 text-blue-400" />;
      case 'ShieldAlert':
        return <ShieldAlert className="w-3.5 h-3.5 text-rose-400" />;
      case 'Compass':
        return <Compass className="w-3.5 h-3.5 text-teal-400" />;
      case 'Coffee':
        return <Coffee className="w-3.5 h-3.5 text-orange-400" />;
      case 'HeartPulse':
        return <HeartPulse className="w-3.5 h-3.5 text-red-400" />;
      case 'Sparkles':
        return <Sparkles className="w-3.5 h-3.5 text-yellow-400" />;
      case 'Heart':
        return <Heart className="w-3.5 h-3.5 text-rose-500 fill-rose-500" />;
      default:
        return <BookOpen className="w-3.5 h-3.5 text-emerald-400" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Hero Card for Hisn Al-Muslim */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-emerald-950 via-stone-900 to-stone-900 border border-emerald-500/30 p-6 sm:p-8 shadow-xl text-right">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-900/60 border border-emerald-500/40 text-emerald-300 text-xs font-semibold">
              <Shield className="w-4 h-4 text-emerald-400" />
              <span>موسوعة حصن المسلم من أذكار الكتاب والسنة</span>
            </div>
            <h3 className="text-xl sm:text-2xl font-bold font-quran text-white tracking-wide">
              أذكار اليوم والليلة والأحوال اليومية المباركة
            </h3>
            <p className="text-xs sm:text-sm text-stone-300 max-w-2xl leading-relaxed">
              جمعٌ محقق للأدعية والأذكار النبوية المأثورة الصحيحة من كتاب «حصن المسلم» للشيخ سعيد بن وهف القحطاني رحمه الله، مع ميزة التفضيل، البحث الفوري، وعداد التكرار.
            </p>
          </div>

          {/* Quick Metrics Bar */}
          <div className="flex items-center gap-3 shrink-0 self-start md:self-center">
            <div className="px-4 py-3 rounded-2xl bg-black/40 border border-stone-800 text-center">
              <span className="block text-xl font-bold text-amber-400 font-mono">
                {favorites.length}
              </span>
              <span className="text-[11px] text-stone-400">في المفضلة</span>
            </div>
            <div className="px-4 py-3 rounded-2xl bg-black/40 border border-stone-800 text-center">
              <span className="block text-xl font-bold text-emerald-400 font-mono">
                {HISN_ALMUSLIM_ITEMS.length}
              </span>
              <span className="text-[11px] text-stone-400">ذكراً مبوباً</span>
            </div>
            {completedInSessionCount > 0 && (
              <div className="px-4 py-3 rounded-2xl bg-emerald-950/80 border border-emerald-500/40 text-center animate-pulse">
                <span className="block text-xl font-bold text-emerald-300 font-mono">
                  {completedInSessionCount}
                </span>
                <span className="text-[11px] text-emerald-400">مكتمل بجلسة اليوم</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Search & Filter Toolbar */}
      <div className="p-4 sm:p-5 rounded-3xl bg-stone-900/90 border border-stone-800 space-y-4 shadow-lg text-right">
        {/* Search input with quick clear */}
        <div className="relative">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="ابحث في حصن المسلم بالكلمة (مثال: الاستيقاظ، الكرب، السوق، الوضوء، المطر، السفر...)..."
            className="w-full bg-stone-950 border border-stone-800 rounded-2xl pr-11 pl-10 py-3 text-xs sm:text-sm text-white placeholder-stone-500 focus:outline-none focus:border-emerald-500 transition-colors shadow-inner"
          />
          <Search className="w-5 h-5 text-stone-400 absolute right-3.5 top-3.5 pointer-events-none" />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute left-3.5 top-3.5 text-stone-400 hover:text-white cursor-pointer"
              title="مسح البحث"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Category Pills & Favorites Quick Switcher */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar text-right">
          {HISN_CATEGORIES.map((cat) => {
            const isSelected = selectedCategory === cat.id;
            const isFav = cat.id === 'favorites';
            return (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                className={`px-3.5 py-2 rounded-xl text-xs font-semibold whitespace-nowrap border transition-all cursor-pointer flex items-center gap-1.5 ${
                  isSelected
                    ? isFav
                      ? 'bg-rose-600 text-white border-rose-500 shadow-md shadow-rose-900/40 font-bold'
                      : 'bg-emerald-600 text-white border-emerald-500 shadow-md shadow-emerald-950/60 font-bold'
                    : isFav
                    ? 'bg-stone-950 border-stone-800 text-rose-300 hover:bg-rose-950/40 hover:border-rose-500/50'
                    : 'bg-stone-950/80 border-stone-800 text-stone-300 hover:bg-stone-800 hover:text-white'
                }`}
              >
                {getCategoryIcon(cat.iconName)}
                <span>{cat.name}</span>
                {isFav && favorites.length > 0 && (
                  <span className="text-[10px] bg-black/40 px-1.5 py-0.2 rounded-full font-mono font-bold">
                    {favorites.length}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Results Header */}
      <div className="flex items-center justify-between px-2 text-xs text-stone-400">
        <span>
          عرض {filteredItems.length} ذكر{' '}
          {selectedCategory === 'favorites' && 'في قائمتك المفضلة'}
          {searchQuery && `مطابق للبحث "${searchQuery}"`}
        </span>
        {searchQuery && (
          <button
            onClick={() => setSearchQuery('')}
            className="text-emerald-400 hover:underline cursor-pointer"
          >
            إلغاء تصفية البحث
          </button>
        )}
      </div>

      {/* Grid of Dhikr Cards */}
      {filteredItems.length === 0 ? (
        <div className="p-12 text-center rounded-3xl bg-stone-900/50 border border-stone-800 space-y-4">
          <div className="w-16 h-16 rounded-full bg-stone-800/80 mx-auto flex items-center justify-center text-stone-500">
            {selectedCategory === 'favorites' ? (
              <Heart className="w-8 h-8 text-rose-500/40" />
            ) : (
              <Search className="w-8 h-8" />
            )}
          </div>
          <h4 className="text-base font-bold text-white">
            {selectedCategory === 'favorites'
              ? 'لم تقم بإضافة أذكار إلى المفضلة بعد'
              : 'لم نجد أذكاراً تطابق هذا البحث'}
          </h4>
          <p className="text-xs text-stone-400 max-w-md mx-auto leading-relaxed">
            {selectedCategory === 'favorites'
              ? 'اضغط على رمز القلب (المفضلة) الموجود أعلى أي بطاقة ذكر لإضافتها هنا والوصول إليها سريعاً في أي وقت.'
              : 'جرّب البحث بكلمة أخرى، أو تصفّح جميع أبواب حصن المسلم من الأزرار بالأعلى.'}
          </p>
          {selectedCategory === 'favorites' && (
            <button
              onClick={() => setSelectedCategory('all')}
              className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition-colors cursor-pointer"
            >
              استعراض جميع الأذكار
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredItems.map((item) => {
            const isFav = favorites.includes(item.id);
            const currentCount = counters[item.id] || 0;
            const isCompleted = currentCount >= item.count;

            return (
              <div
                key={item.id}
                className={`p-5 sm:p-6 rounded-2xl border transition-all text-right space-y-4 flex flex-col justify-between ${
                  isCompleted
                    ? 'bg-gradient-to-l from-emerald-950/70 via-stone-900 to-stone-900 border-emerald-500/80 shadow-lg ring-1 ring-emerald-500/20'
                    : 'bg-stone-900/80 border-stone-800 hover:border-emerald-500/40 hover:bg-stone-900 shadow-md'
                }`}
              >
                {/* Header: Chapter badge + Title + Favorite Button */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-lg bg-emerald-950/90 text-emerald-300 border border-emerald-600/30">
                      باب {item.chapterNumber}: {item.chapterTitle}
                    </span>

                    {/* Bookmark / Favorite Action */}
                    <button
                      onClick={(e) => toggleFavorite(item.id, e)}
                      className={`p-1.5 rounded-lg border transition-all cursor-pointer ${
                        isFav
                          ? 'bg-rose-950/80 border-rose-500 text-rose-400 hover:bg-rose-900'
                          : 'bg-stone-950/60 border-stone-800 text-stone-400 hover:text-rose-400 hover:border-stone-700'
                      }`}
                      title={isFav ? 'إزالة من المفضلة' : 'إضافة إلى المفضلة'}
                    >
                      <Heart
                        className={`w-4 h-4 ${
                          isFav ? 'fill-rose-500 text-rose-500' : ''
                        }`}
                      />
                    </button>
                  </div>

                  <h4 className="text-base sm:text-lg font-bold text-white font-quran">
                    {item.title}
                  </h4>
                </div>

                {/* Main Arabic Text */}
                <div className="p-4 rounded-xl bg-stone-950/80 border border-stone-800/80">
                  <p className="text-base sm:text-lg font-quran leading-loose text-emerald-50 select-text">
                    «{item.arabicText}»
                  </p>
                </div>

                {/* Virtue and Reference Details */}
                <div className="space-y-2 text-xs">
                  {item.virtue && (
                    <div className="p-2.5 rounded-xl bg-amber-950/30 border border-amber-600/30 text-amber-200/90 flex items-start gap-2">
                      <Sparkles className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                      <span className="leading-relaxed">
                        <strong className="text-amber-300">الفضل:</strong> {item.virtue}
                      </span>
                    </div>
                  )}

                  <div className="text-[11px] text-stone-400 flex items-center justify-between border-t border-stone-800/80 pt-2">
                    <span className="truncate max-w-[280px]">
                      📌 <strong className="text-stone-300">التخريج:</strong> {item.reference}
                    </span>
                    <span className="font-mono text-emerald-400 text-xs font-bold">
                      التكرار: {item.count}×
                    </span>
                  </div>
                </div>

                {/* Bottom Actions Bar */}
                <div className="flex items-center justify-between gap-2 pt-2 border-t border-stone-800/60">
                  {/* Left: Quick Utilities (Copy, Share, Send to Masbaha) */}
                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={(e) => handleCopy(item, e)}
                      className="p-2 rounded-xl bg-stone-950 hover:bg-stone-800 border border-stone-800 text-stone-300 hover:text-white transition-colors cursor-pointer"
                      title="نسخ الذكر كاملاً"
                    >
                      {copiedId === item.id ? (
                        <Check className="w-4 h-4 text-emerald-400" />
                      ) : (
                        <Copy className="w-4 h-4" />
                      )}
                    </button>

                    <button
                      onClick={(e) => handleShare(item, e)}
                      className="p-2 rounded-xl bg-stone-950 hover:bg-stone-800 border border-stone-800 text-stone-300 hover:text-white transition-colors cursor-pointer"
                      title="مشاركة الذكر"
                    >
                      <Share2 className="w-4 h-4" />
                    </button>

                    {onSendToMasbaha && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onSendToMasbaha(item.arabicText, item.count);
                          setSharedToast('تم إرسال الذكر إلى المسبحة الإلكترونية');
                          setTimeout(() => setSharedToast(null), 2500);
                        }}
                        className="px-2.5 py-1.5 rounded-xl bg-stone-950 hover:bg-emerald-950/80 border border-stone-800 hover:border-emerald-600/40 text-[11px] font-semibold text-emerald-400 transition-colors cursor-pointer flex items-center gap-1"
                        title="إرسال إلى المسبحة الإلكترونية للتسبيح"
                      >
                        <Send className="w-3.5 h-3.5" />
                        <span className="hidden sm:inline">للمسبحة</span>
                      </button>
                    )}
                  </div>

                  {/* Right: Interactive Repetition Counter */}
                  <div className="flex items-center gap-2">
                    {currentCount > 0 && (
                      <button
                        onClick={(e) => handleResetCounter(item.id, e)}
                        className="p-2 rounded-xl bg-stone-950 hover:bg-stone-800 text-stone-400 hover:text-white transition-colors cursor-pointer"
                        title="إعادة تصفير العداد"
                      >
                        <RotateCcw className="w-3.5 h-3.5" />
                      </button>
                    )}

                    <button
                      onClick={(e) => handleIncrement(item, e)}
                      className={`px-4 py-2 rounded-xl font-bold text-xs flex items-center gap-1.5 transition-all active:scale-95 cursor-pointer shadow-md ${
                        isCompleted
                          ? 'bg-emerald-600 text-white shadow-emerald-950/60 ring-2 ring-emerald-400/50'
                          : 'bg-stone-800 hover:bg-emerald-600 text-stone-200 hover:text-white border border-stone-700 hover:border-emerald-500'
                      }`}
                    >
                      {isCompleted ? (
                        <>
                          <Check className="w-4 h-4 text-emerald-200" />
                          <span>اكتمل ({currentCount}/{item.count})</span>
                        </>
                      ) : (
                        <>
                          <span className="font-mono text-sm">{currentCount}</span>
                          <span className="text-stone-400">/</span>
                          <span className="font-mono text-stone-300">{item.count}</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Floating Action Toast */}
      {sharedToast && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 bg-stone-900/95 border border-emerald-500 text-white text-xs sm:text-sm px-5 py-3 rounded-2xl shadow-2xl backdrop-blur-md flex items-center gap-2.5 animate-bounce max-w-[90vw] text-right">
          <Check className="w-4 h-4 text-emerald-400 shrink-0" />
          <span className="font-semibold">{sharedToast}</span>
        </div>
      )}
    </div>
  );
};
