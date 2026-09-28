import React, { useState, useEffect } from 'react';
import {
  Sparkles,
  Check,
  RotateCcw,
  Search,
  BookOpen,
  Heart,
  Copy,
  Plus,
  Trash2,
  X,
  Target,
  Send,
  Sliders,
  Volume2,
  Pause,
  Shield,
} from 'lucide-react';
import { ADHKAR_CATEGORIES, DUAS_LIST, DhikrItem } from '../data/duasAndIbrahimiya';
import { soundService } from '../utils/soundService';
import { HisnAlmuslimSection } from './HisnAlmuslimSection';

const DEFAULT_MASBAHA_PHRASES = [
  'سُبْحَانَ اللهِ وَبِحَمْدِهِ',
  'سُبْحَانَ اللهِ العَظِيمِ',
  'الحَمْدُ للهِ رَبِّ العَالَمِينَ',
  'لَا إِلَهَ إِلَّا اللهُ',
  'اللهُ أَكْبَرُ',
  'أَسْتَغْفِرُ اللهَ وَأَتُوبُ إِلَيْهِ',
  'لَا حَوْلَ وَلَا قُوَّةَ إِلَّا بِاللهِ',
  'اللَّهُمَّ صَلِّ عَلَى نَبِيِّنَا مُحَمَّدٍ',
];

export const DuasAndAdhkar: React.FC = () => {
  // Active Section: 'hisn' (حصن المسلم للأذكار اليومية) vs 'masbaha_duas' (السبحة الذكية والأدعية)
  const [activeSubTab, setActiveSubTab] = useState<'hisn' | 'masbaha_duas'>('hisn');

  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [counters, setCounters] = useState<Record<string, number>>({});
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [isDuaAudioPlaying, setIsDuaAudioPlaying] = useState<boolean>(false);

  const handleSendFromHisnToMasbaha = (text: string, count: number) => {
    setMasbahaDhikr(text);
    setMasbahaGoal(count || 33);
    setMasbahaCount(0);
    setActiveSubTab('masbaha_duas');
    window.scrollTo({ top: 0, behavior: 'smooth' });
    soundService.playTasbeehClick();
  };

  const handleToggleDuaAudio = () => {
    if (isDuaAudioPlaying) {
      soundService.stopDuaAfterAdhan();
      setIsDuaAudioPlaying(false);
    } else {
      setIsDuaAudioPlaying(true);
      soundService.playDuaAfterAdhan(() => {
        setIsDuaAudioPlaying(false);
      });
    }
  };

  // Digital Masbaha state
  const [masbahaCount, setMasbahaCount] = useState<number>(0);
  const [masbahaDhikr, setMasbahaDhikr] = useState<string>('سُبْحَانَ اللهِ وَبِحَمْدِهِ');
  const [masbahaGoal, setMasbahaGoal] = useState<number>(33);

  // Custom User Adhkar stored in localStorage
  const [customAdhkar, setCustomAdhkar] = useState<DhikrItem[]>(() => {
    try {
      const saved = localStorage.getItem('salati_custom_adhkar');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  // Custom Masbaha phrases stored in localStorage
  const [customMasbahaPhrases, setCustomMasbahaPhrases] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('salati_custom_masbaha_phrases');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  // Modal State for adding custom Dhikr
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newArabicText, setNewArabicText] = useState('');
  const [newCount, setNewCount] = useState<number>(33);
  const [newVirtue, setNewVirtue] = useState('');
  const [setDirectToMasbaha, setSetDirectToMasbaha] = useState(true);

  // Quick phrase input for Masbaha
  const [isAddingPhrase, setIsAddingPhrase] = useState(false);
  const [newPhraseInput, setNewPhraseInput] = useState('');

  // Persist custom adhkar
  useEffect(() => {
    try {
      localStorage.setItem('salati_custom_adhkar', JSON.stringify(customAdhkar));
    } catch {
      // ignore
    }
  }, [customAdhkar]);

  // Persist custom masbaha phrases
  useEffect(() => {
    try {
      localStorage.setItem('salati_custom_masbaha_phrases', JSON.stringify(customMasbahaPhrases));
    } catch {
      // ignore
    }
  }, [customMasbahaPhrases]);

  // Combine standard and custom adhkar
  const allDuas: DhikrItem[] = [...customAdhkar, ...DUAS_LIST];

  const filteredDuas = allDuas.filter((item) => {
    let matchesCategory = true;
    if (selectedCategory === 'custom') {
      matchesCategory = !!item.isCustom;
    } else if (selectedCategory !== 'all') {
      matchesCategory = item.category === selectedCategory;
    }

    const matchesSearch =
      item.title.toLowerCase().includes(searchQuery.toLowerCase().trim()) ||
      item.arabicText.toLowerCase().includes(searchQuery.toLowerCase().trim());
    return matchesCategory && matchesSearch;
  });

  const handleIncrementDhikr = (item: DhikrItem) => {
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

  const handleResetDhikr = (id: string) => {
    setCounters((prev) => ({
      ...prev,
      [id]: 0,
    }));
  };

  const handleCopyText = (item: DhikrItem) => {
    navigator.clipboard.writeText(item.arabicText);
    setCopiedId(item.id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleMasbahaClick = () => {
    soundService.playTasbeehClick();
    const next = masbahaCount + 1;
    setMasbahaCount(next);
    if (next % masbahaGoal === 0) {
      soundService.playGoalCelebration();
    }
  };

  // Add custom Dhikr from modal
  const handleSaveNewDhikr = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim() || !newArabicText.trim()) return;

    const newDhikr: DhikrItem = {
      id: `custom_${Date.now()}`,
      category: 'custom',
      title: newTitle.trim(),
      arabicText: newArabicText.trim(),
      count: Number(newCount) > 0 ? Number(newCount) : 33,
      virtue: newVirtue.trim() || 'ذكر مضاف بواسطة المستخدم',
      isCustom: true,
    };

    setCustomAdhkar((prev) => [newDhikr, ...prev]);

    // Also add to Masbaha quick phrases
    if (!customMasbahaPhrases.includes(newArabicText.trim())) {
      setCustomMasbahaPhrases((prev) => [newArabicText.trim(), ...prev]);
    }

    if (setDirectToMasbaha) {
      setMasbahaDhikr(newArabicText.trim());
      setMasbahaGoal(Number(newCount) > 0 ? Number(newCount) : 33);
      setMasbahaCount(0);
    }

    // Reset Form
    setNewTitle('');
    setNewArabicText('');
    setNewCount(33);
    setNewVirtue('');
    setIsAddModalOpen(false);
  };

  // Delete custom Dhikr
  const handleDeleteCustomDhikr = (id: string) => {
    setCustomAdhkar((prev) => prev.filter((item) => item.id !== id));
  };

  // Send any dhikr directly to digital Masbaha
  const handleSendToMasbaha = (item: DhikrItem) => {
    setMasbahaDhikr(item.arabicText);
    setMasbahaGoal(item.count || 33);
    setMasbahaCount(0);
    window.scrollTo({ top: 0, behavior: 'smooth' });
    soundService.playTasbeehClick();
  };

  // Add quick phrase directly to Masbaha
  const handleAddQuickPhrase = (e: React.FormEvent) => {
    e.preventDefault();
    const phrase = newPhraseInput.trim();
    if (!phrase) return;

    if (!DEFAULT_MASBAHA_PHRASES.includes(phrase) && !customMasbahaPhrases.includes(phrase)) {
      setCustomMasbahaPhrases((prev) => [...prev, phrase]);
    }
    setMasbahaDhikr(phrase);
    setMasbahaCount(0);
    setNewPhraseInput('');
    setIsAddingPhrase(false);
  };

  const handleDeleteQuickPhrase = (phrase: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setCustomMasbahaPhrases((prev) => prev.filter((p) => p !== phrase));
    if (masbahaDhikr === phrase) {
      setMasbahaDhikr(DEFAULT_MASBAHA_PHRASES[0]);
    }
  };

  const allMasbahaPhrases = [...DEFAULT_MASBAHA_PHRASES, ...customMasbahaPhrases];

  return (
    <div className="space-y-6">
      {/* Primary Section Switcher: Hisn Al-Muslim vs Digital Masbaha & General Duas */}
      <div className="flex items-center justify-between flex-wrap gap-3 p-1.5 rounded-2xl bg-stone-900 border border-stone-800 text-xs font-bold">
        <div className="flex items-center gap-2 flex-1 w-full sm:w-auto">
          <button
            onClick={() => setActiveSubTab('hisn')}
            className={`flex-1 sm:flex-initial px-5 py-2.5 rounded-xl transition-all cursor-pointer flex items-center justify-center gap-2 ${
              activeSubTab === 'hisn'
                ? 'bg-emerald-600 text-white shadow-md shadow-emerald-950/60'
                : 'text-stone-400 hover:text-white hover:bg-stone-800/60'
            }`}
          >
            <Shield className="w-4 h-4 text-emerald-300" />
            <span>حصن المسلم للأذكار اليومية</span>
            <span className="text-[10px] bg-amber-400/90 text-stone-950 px-1.5 py-0.2 rounded-md font-bold">
              جديد
            </span>
          </button>

          <button
            onClick={() => setActiveSubTab('masbaha_duas')}
            className={`flex-1 sm:flex-initial px-5 py-2.5 rounded-xl transition-all cursor-pointer flex items-center justify-center gap-2 ${
              activeSubTab === 'masbaha_duas'
                ? 'bg-emerald-600 text-white shadow-md shadow-emerald-950/60'
                : 'text-stone-400 hover:text-white hover:bg-stone-800/60'
            }`}
          >
            <Sparkles className="w-4 h-4 text-amber-300" />
            <span>السبحة الإلكترونية والأدعية العامة</span>
          </button>
        </div>
      </div>

      {activeSubTab === 'hisn' ? (
        <HisnAlmuslimSection onSendToMasbaha={handleSendFromHisnToMasbaha} />
      ) : (
        <div className="space-y-6">
          {/* Top Hero: Digital Masbaha Feature */}
          <div className="p-6 sm:p-8 rounded-3xl bg-gradient-to-r from-emerald-950 via-stone-900 to-stone-900 border border-emerald-500/30 shadow-xl">
        <div className="flex flex-col lg:flex-row items-center justify-between gap-6">
          <div className="space-y-3 text-right flex-1 w-full">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-emerald-400 text-xs font-semibold">
                <Sparkles className="w-4 h-4" />
                <span>السبحة الإلكترونية الذكية والتسابيح</span>
              </div>

              {/* Goal Selector */}
              <div className="flex items-center gap-1 bg-stone-950/80 p-1 rounded-xl border border-stone-800 text-xs">
                <span className="text-[11px] text-stone-400 px-1">الهدف:</span>
                {[33, 100, 1000].map((g) => (
                  <button
                    key={g}
                    onClick={() => setMasbahaGoal(g)}
                    className={`px-2 py-0.5 rounded-lg transition-colors font-mono ${
                      masbahaGoal === g
                        ? 'bg-emerald-600 text-white font-bold'
                        : 'text-stone-400 hover:text-white'
                    }`}
                  >
                    {g}
                  </button>
                ))}
              </div>
            </div>

            {/* Current Active Masbaha Dhikr */}
            <h2 className="text-xl sm:text-2xl font-bold text-white font-quran leading-relaxed min-h-[36px]">
              {masbahaDhikr}
            </h2>

            {/* Selectable Phrases and Add Button */}
            <div className="space-y-2 pt-1">
              <div className="flex flex-wrap items-center gap-1.5 max-h-32 overflow-y-auto pr-1">
                {allMasbahaPhrases.map((phrase) => {
                  const isCustom = customMasbahaPhrases.includes(phrase);
                  const isSelected = masbahaDhikr === phrase;

                  return (
                    <div
                      key={phrase}
                      className={`inline-flex items-center rounded-xl overflow-hidden border text-xs transition-colors ${
                        isSelected
                          ? 'bg-emerald-600 border-emerald-500 text-white shadow-xs font-bold'
                          : 'bg-stone-800/90 border-stone-700/80 text-stone-300 hover:bg-stone-700'
                      }`}
                    >
                      <button
                        type="button"
                        onClick={() => {
                          setMasbahaDhikr(phrase);
                          setMasbahaCount(0);
                        }}
                        className="px-3 py-1.5 cursor-pointer"
                      >
                        {phrase}
                      </button>
                      {isCustom && (
                        <button
                          type="button"
                          onClick={(e) => handleDeleteQuickPhrase(phrase, e)}
                          className="px-1.5 py-1.5 text-stone-300 hover:text-rose-300 hover:bg-black/20 border-r border-stone-700/60 cursor-pointer"
                          title="حذف هذا الذكر"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      )}
                    </div>
                  );
                })}

                {/* Add phrase button */}
                {!isAddingPhrase ? (
                  <button
                    onClick={() => setIsAddingPhrase(true)}
                    className="px-3 py-1.5 text-xs font-semibold rounded-xl bg-emerald-950/70 border border-emerald-500/40 text-emerald-300 hover:bg-emerald-900 transition-colors flex items-center gap-1 cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>إضافة ذكر للسبحة</span>
                  </button>
                ) : (
                  <form onSubmit={handleAddQuickPhrase} className="flex items-center gap-1">
                    <input
                      type="text"
                      placeholder="اكتب ذكرك الجديد..."
                      value={newPhraseInput}
                      onChange={(e) => setNewPhraseInput(e.target.value)}
                      className="px-2.5 py-1 text-xs rounded-lg bg-stone-950 border border-emerald-500/60 text-white focus:outline-none w-44"
                      autoFocus
                    />
                    <button
                      type="submit"
                      className="p-1.5 rounded-lg bg-emerald-600 text-white hover:bg-emerald-500"
                    >
                      <Check className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => setIsAddingPhrase(false)}
                      className="p-1.5 rounded-lg bg-stone-800 text-stone-400 hover:text-white"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </form>
                )}
              </div>
            </div>
          </div>

          {/* Interactive Masbaha Bead Clicker */}
          <div className="flex items-center gap-4 shrink-0">
            <button
              onClick={handleMasbahaClick}
              className="w-32 h-32 sm:w-36 sm:h-36 rounded-full bg-gradient-to-br from-emerald-600 via-emerald-700 to-teal-800 hover:scale-105 active:scale-95 text-white flex flex-col items-center justify-center shadow-2xl shadow-emerald-700/50 border-4 border-emerald-400/40 transition-transform cursor-pointer"
            >
              <span className="text-3xl sm:text-4xl font-extrabold tabular-nums tracking-tight">
                {masbahaCount}
              </span>
              <span className="text-[11px] text-emerald-100 font-medium mt-0.5">
                دورة {Math.floor(masbahaCount / masbahaGoal) + 1} ({masbahaCount % masbahaGoal}/{masbahaGoal})
              </span>
              <span className="text-[9px] text-emerald-200/80 mt-1">اضغط للتسبيح</span>
            </button>

            <button
              onClick={() => setMasbahaCount(0)}
              className="p-3 rounded-2xl bg-stone-800 hover:bg-stone-700 text-stone-400 hover:text-rose-400 transition-colors cursor-pointer"
              title="تصفير السبحة"
            >
              <RotateCcw className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>

      {/* Duas Section Header with 'Add Custom Dhikr' Primary CTA */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h3 className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
            <BookOpen className="w-4 h-4 text-emerald-400" />
            <span>الأدعية المأثورة والأذكار (مع إمكانية إضافة أذكارك)</span>
          </h3>
          <p className="text-xs text-stone-400 mt-0.5">
            تصفح الأذكار النبوية أو أضف أدعيتك وأورادك الخاصة مع عداد تفاعلي مخصص
          </p>
        </div>

        {/* Primary CTA Button: Add Custom Dhikr */}
        <button
          onClick={() => setIsAddModalOpen(true)}
          className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-md shadow-emerald-700/30 flex items-center gap-2 transition-transform active:scale-95 cursor-pointer shrink-0 self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>إضافة ذكر أو دعاء جديد</span>
        </button>
      </div>

      {/* Search & Categories Bar */}
      <div className="space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          {/* Categories Tabs */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar flex-1">
            {ADHKAR_CATEGORIES.map((cat) => {
              const isSelected = selectedCategory === cat.id;
              const isCustomCat = cat.id === 'custom';

              return (
                <button
                  key={cat.id}
                  onClick={() => setSelectedCategory(cat.id)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-medium whitespace-nowrap transition-colors border cursor-pointer flex items-center gap-1.5 ${
                    isSelected
                      ? 'bg-emerald-950 text-emerald-300 border-emerald-500/50 shadow-xs'
                      : 'bg-stone-900/60 text-stone-400 border-stone-800 hover:text-stone-200'
                  }`}
                >
                  <span>{cat.name}</span>
                  {isCustomCat && customAdhkar.length > 0 && (
                    <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-emerald-600 text-white font-bold">
                      {customAdhkar.length}
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          {/* Search bar */}
          <div className="relative w-full sm:w-64 shrink-0">
            <Search className="w-4 h-4 text-stone-400 absolute right-3 top-2.5" />
            <input
              type="text"
              placeholder="ابحث في الأذكار..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-3 pr-9 py-1.5 rounded-xl bg-stone-900 border border-stone-800 text-xs text-white placeholder-stone-400 focus:outline-none focus:border-emerald-500"
            />
          </div>
        </div>
      </div>

      {/* Duas List */}
      <div className="space-y-4">
        {filteredDuas.map((item) => {
          const count = counters[item.id] || 0;
          const isDone = count >= item.count;

          return (
            <div
              key={item.id}
              className={`p-5 rounded-2xl border transition-all text-right space-y-3 ${
                isDone
                  ? 'bg-emerald-950/30 border-emerald-500/40'
                  : 'bg-stone-900/60 border-stone-800 hover:border-stone-700'
              }`}
            >
              {/* Header */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <h4 className="font-bold text-sm sm:text-base text-white">{item.title}</h4>
                  {item.isCustom && (
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-amber-950 text-amber-300 border border-amber-600/40">
                      مُضاف بواسطتك
                    </span>
                  )}
                  {isDone && (
                    <span className="flex items-center gap-1 text-[11px] text-emerald-400 bg-emerald-950/80 px-2 py-0.5 rounded-md border border-emerald-500/40">
                      <Check className="w-3 h-3" />
                      اكتمل
                    </span>
                  )}
                </div>

                {/* Actions */}
                <div className="flex items-center gap-1.5">
                  {/* Send to Masbaha */}
                  <button
                    onClick={() => handleSendToMasbaha(item)}
                    className="p-1.5 rounded-lg text-emerald-400 hover:bg-emerald-950/80 border border-emerald-500/20 transition-colors flex items-center gap-1 text-[11px]"
                    title="وضعه في السبحة الإلكترونية"
                  >
                    <Send className="w-3 h-3" />
                    <span className="hidden sm:inline">للسبحة</span>
                  </button>

                  {item.id === 'dua_after_adhan_prophetic' && (
                    <button
                      onClick={handleToggleDuaAudio}
                      className={`px-3 py-1 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer ${
                        isDuaAudioPlaying
                          ? 'bg-amber-600 hover:bg-amber-500 text-white shadow-sm animate-pulse'
                          : 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-sm'
                      }`}
                    >
                      {isDuaAudioPlaying ? (
                        <>
                          <Pause className="w-3.5 h-3.5 fill-current" />
                          <span>إيقاف الصوت</span>
                        </>
                      ) : (
                        <>
                          <Volume2 className="w-3.5 h-3.5" />
                          <span>استماع بالصوت الآن</span>
                        </>
                      )}
                    </button>
                  )}

                  <button
                    onClick={() => handleCopyText(item)}
                    className="p-1.5 rounded-lg text-stone-400 hover:text-white hover:bg-stone-800 transition-colors"
                    title="نسخ الذكر"
                  >
                    {copiedId === item.id ? (
                      <Check className="w-3.5 h-3.5 text-emerald-400" />
                    ) : (
                      <Copy className="w-3.5 h-3.5" />
                    )}
                  </button>

                  <button
                    onClick={() => handleResetDhikr(item.id)}
                    className="p-1.5 rounded-lg text-stone-400 hover:text-rose-400 hover:bg-stone-800 transition-colors"
                    title="تصفير العداد"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                  </button>

                  {/* Delete button if custom */}
                  {item.isCustom && (
                    <button
                      onClick={() => handleDeleteCustomDhikr(item.id)}
                      className="p-1.5 rounded-lg text-stone-500 hover:text-rose-400 hover:bg-rose-950/50 transition-colors"
                      title="حذف هذا الذكر المضاف"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>

              {/* Arabic Text */}
              <p className="text-base sm:text-lg font-quran text-stone-100 leading-[2.2] tracking-wide select-all">
                «{item.arabicText}»
              </p>

              {/* Virtue & Reference */}
              {(item.virtue || item.reference) && (
                <div className="pt-2 border-t border-stone-800/80 text-xs text-stone-400 flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                  {item.virtue && <span className="text-emerald-400/90">{item.virtue}</span>}
                  {item.reference && <span className="text-stone-500">{item.reference}</span>}
                </div>
              )}

              {/* Counter Trigger Button */}
              <div className="pt-1 flex items-center justify-between">
                <span className="text-xs text-stone-400">
                  التكرار المطلوب: <strong className="text-white tabular-nums">{item.count}</strong>
                </span>

                <button
                  onClick={() => handleIncrementDhikr(item)}
                  className={`px-4 py-2 rounded-xl text-xs font-semibold flex items-center gap-2 transition-all active:scale-95 cursor-pointer ${
                    isDone
                      ? 'bg-emerald-600 text-white shadow-sm'
                      : 'bg-emerald-950/80 hover:bg-emerald-900 text-emerald-300 border border-emerald-500/40'
                  }`}
                >
                  <span>{isDone ? 'تم الإنجاز' : 'تسبيح'}</span>
                  <span className="tabular-nums px-2 py-0.5 rounded-md bg-stone-900/60 font-bold">
                    {count} / {item.count}
                  </span>
                </button>
              </div>
            </div>
          );
        })}

        {filteredDuas.length === 0 && (
          <div className="p-8 text-center text-stone-400 text-sm bg-stone-900/40 rounded-2xl border border-stone-800 space-y-3">
            <div>لم يتم العثور على أذكار في هذا القسم.</div>
            {selectedCategory === 'custom' && (
              <button
                onClick={() => setIsAddModalOpen(true)}
                className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold inline-flex items-center gap-1.5"
              >
                <Plus className="w-4 h-4" />
                <span>أضف أول ذكر خاص بك الآن</span>
              </button>
            )}
          </div>
        )}
      </div>
        </div>
      )}

      {/* Modal: Add New Custom Dhikr */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in">
          <div className="bg-stone-900 border border-stone-800 rounded-3xl w-full max-w-lg shadow-2xl overflow-hidden flex flex-col">
            {/* Header */}
            <div className="p-5 border-b border-stone-800 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-emerald-400" />
                <h3 className="text-base font-bold text-white">إضافة ذكر أو دعاء جديد</h3>
              </div>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="p-1.5 rounded-lg text-stone-400 hover:text-white hover:bg-stone-800 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleSaveNewDhikr} className="p-5 space-y-4 text-right">
              <div>
                <label className="block text-xs font-bold text-stone-300 mb-1.5">
                  عنوان الذكر أو اسم الورد: <span className="text-rose-400">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="مثال: دعاء تيسير الأمور، استغفار الصباح، ورد الرزق..."
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-stone-950 border border-stone-700 text-white text-xs focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-stone-300 mb-1.5">
                  نص الذكر أو الدعاء المبارك: <span className="text-rose-400">*</span>
                </label>
                <textarea
                  required
                  rows={3}
                  placeholder="اكتب نص الذكر هنا بالتشكيل أو بدونه..."
                  value={newArabicText}
                  onChange={(e) => setNewArabicText(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-stone-950 border border-stone-700 text-white text-xs font-quran leading-relaxed focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-stone-300 mb-1.5">
                    العدد المطلوب (التكرار):
                  </label>
                  <input
                    type="number"
                    min={1}
                    max={10000}
                    value={newCount}
                    onChange={(e) => setNewCount(parseInt(e.target.value) || 1)}
                    className="w-full px-3.5 py-2 rounded-xl bg-stone-950 border border-stone-700 text-white text-xs font-mono tabular-nums focus:outline-none focus:border-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-stone-300 mb-1.5">
                    خيارات سريعة للعدد:
                  </label>
                  <div className="flex items-center gap-1">
                    {[3, 7, 33, 100].map((num) => (
                      <button
                        key={num}
                        type="button"
                        onClick={() => setNewCount(num)}
                        className={`flex-1 py-1.5 text-xs font-mono rounded-lg border transition-colors ${
                          newCount === num
                            ? 'bg-emerald-600 text-white border-emerald-500 font-bold'
                            : 'bg-stone-800 text-stone-300 border-stone-700 hover:bg-stone-700'
                        }`}
                      >
                        {num}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-stone-300 mb-1.5">
                  فضله أو ملاحظة خاصة (اختياري):
                </label>
                <input
                  type="text"
                  placeholder="مثال: يُقال بعد كل صلاة، أو قبل النوم..."
                  value={newVirtue}
                  onChange={(e) => setNewVirtue(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl bg-stone-950 border border-stone-700 text-white text-xs focus:outline-none focus:border-emerald-500"
                />
              </div>

              {/* Set to Masbaha toggle */}
              <div className="p-3 rounded-xl bg-stone-950/70 border border-stone-800 flex items-center justify-between">
                <span className="text-xs text-stone-300">
                  تعيين هذا الذكر فوراً للسبحة الإلكترونية عند الحفظ
                </span>
                <input
                  type="checkbox"
                  checked={setDirectToMasbaha}
                  onChange={(e) => setSetDirectToMasbaha(e.target.checked)}
                  className="w-4 h-4 accent-emerald-500 cursor-pointer"
                />
              </div>

              {/* Actions */}
              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-medium text-stone-400 hover:text-white"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-md shadow-emerald-700/30 transition-transform active:scale-95"
                >
                  حفظ وإضافة الذكر
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
