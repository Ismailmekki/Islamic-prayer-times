import React, { useState, useEffect, useRef } from 'react';
import {
  BookOpen,
  Play,
  Pause,
  RotateCcw,
  Repeat,
  Volume2,
  VolumeX,
  Eye,
  EyeOff,
  CheckCircle,
  Sparkles,
  HelpCircle,
  GraduationCap,
  ChevronLeft,
  ChevronRight,
  Clock,
  Award,
  Layers,
} from 'lucide-react';
import { ALL_SURAHS, SurahMeta } from '../data/quranData';

interface AyahItem {
  id: number;
  verseKey: string; // e.g. "1:1"
  ayahNumber: number;
  text: string;
  isMemorized?: boolean;
}

interface MemorizerReciter {
  id: string;
  name: string;
  folder: string;
}

const MEMORIZER_RECITERS: MemorizerReciter[] = [
  {
    id: 'husary_muallim',
    name: 'الشيخ محمود خليل الحصري (المصحف المعلم)',
    folder: 'Husary_Muallim_128kbps',
  },
  {
    id: 'minshawi_teacher',
    name: 'الشيخ محمد صديق المنشاوي (المعلم وترديد الأطفال)',
    folder: 'Minshawy_Teacher_128kbps',
  },
  {
    id: 'alafasy',
    name: 'الشيخ مشاري راشد العفاسي',
    folder: 'Alafasy_128kbps',
  },
  {
    id: 'abdulbasit',
    name: 'الشيخ عبد الباسط عبد الصمد (المجود)',
    folder: 'Abdul_Basit_Mujawwad_128kbps',
  },
];

export const QuranMemorizer: React.FC = () => {
  const [selectedSurah, setSelectedSurah] = useState<SurahMeta>(ALL_SURAHS[0]);
  const [selectedReciter, setSelectedReciter] = useState<MemorizerReciter>(MEMORIZER_RECITERS[0]);

  // Ayahs list for selected surah
  const [ayahs, setAyahs] = useState<AyahItem[]>([]);
  const [isLoadingAyahs, setIsLoadingAyahs] = useState<boolean>(true);

  // Range selection
  const [fromAyah, setFromAyah] = useState<number>(1);
  const [toAyah, setToAyah] = useState<number>(7);

  // Active playing ayah
  const [currentAyahIndex, setCurrentAyahIndex] = useState<number>(0);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);

  // Repetition settings
  const [repeatCountPerAyah, setRepeatCountPerAyah] = useState<number>(3); // Repeat 3 times default
  const [currentRepeatIteration, setCurrentRepeatIteration] = useState<number>(1);
  const [pauseDurationSeconds, setPauseDurationSeconds] = useState<number>(3); // 3 seconds pause for user to recite

  // Self-testing Mode (Hiding text to test memory)
  const [testMode, setTestMode] = useState<'visible' | 'masked' | 'hidden'>('visible');
  const [revealedAyahs, setRevealedAyahs] = useState<Set<number>>(new Set());

  // Memorized Ayahs tracker
  const [memorizedKeys, setMemorizedKeys] = useState<Set<string>>(() => {
    try {
      const saved = localStorage.getItem('salati_memorized_ayahs');
      if (saved) return new Set(JSON.parse(saved));
    } catch {}
    return new Set<string>();
  });

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const pauseTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Load verses when Surah changes
  useEffect(() => {
    let isCancelled = false;
    setIsLoadingAyahs(true);
    setRevealedAyahs(new Set());
    setFromAyah(1);
    setToAyah(Math.min(selectedSurah.numberOfAyahs, 10)); // Default to first 10 verses
    setCurrentAyahIndex(0);
    setCurrentRepeatIteration(1);
    setIsPlaying(false);

    if (audioRef.current) {
      audioRef.current.pause();
    }

    fetch(`https://api.quran.com/api/v4/quran/verses/uthmani?chapter_number=${selectedSurah.number}`)
      .then((res) => res.json())
      .then((data) => {
        if (!isCancelled && data.verses) {
          const list: AyahItem[] = data.verses.map((v: any, index: number) => ({
            id: v.id,
            verseKey: v.verse_key,
            ayahNumber: index + 1,
            text: v.text_uthmani,
          }));
          setAyahs(list);
          setIsLoadingAyahs(false);
        }
      })
      .catch((err) => {
        console.error('Failed to load verses for memorizer', err);
        if (!isCancelled) setIsLoadingAyahs(false);
      });

    return () => {
      isCancelled = true;
      if (pauseTimerRef.current) clearTimeout(pauseTimerRef.current);
      if (audioRef.current) {
        audioRef.current.pause();
      }
    };
  }, [selectedSurah]);

  // Save memorized keys
  const toggleMemorized = (verseKey: string) => {
    setMemorizedKeys((prev) => {
      const next = new Set(prev);
      if (next.has(verseKey)) {
        next.delete(verseKey);
      } else {
        next.add(verseKey);
      }
      try {
        localStorage.setItem('salati_memorized_ayahs', JSON.stringify(Array.from(next)));
      } catch {}
      return next;
    });
  };

  // Build audio URL for EveryAyah
  const getAyahAudioUrl = (surahNum: number, ayahNum: number, reciter: MemorizerReciter) => {
    const sPadded = surahNum.toString().padStart(3, '0');
    const aPadded = ayahNum.toString().padStart(3, '0');
    return `https://everyayah.com/data/${reciter.folder}/${sPadded}${aPadded}.mp3`;
  };

  // Playback control
  const startPlaying = (index = currentAyahIndex) => {
    if (ayahs.length === 0) return;
    const targetAyah = ayahs[index];
    if (!targetAyah) return;

    setCurrentAyahIndex(index);
    setIsPlaying(true);

    const url = getAyahAudioUrl(selectedSurah.number, targetAyah.ayahNumber, selectedReciter);
    if (!audioRef.current) {
      audioRef.current = new Audio(url);
    } else {
      audioRef.current.src = url;
    }

    audioRef.current
      .play()
      .then(() => {
        setIsPlaying(true);
      })
      .catch(() => {
        setIsPlaying(false);
      });

    audioRef.current.onended = () => {
      handleAyahEnded(index);
    };
  };

  const handleAyahEnded = (index: number) => {
    // If repetition needed for this ayah
    if (currentRepeatIteration < repeatCountPerAyah) {
      setCurrentRepeatIteration((prev) => prev + 1);

      // Pause interval for student recitation
      if (pauseDurationSeconds > 0) {
        pauseTimerRef.current = setTimeout(() => {
          startPlaying(index);
        }, pauseDurationSeconds * 1000);
      } else {
        startPlaying(index);
      }
    } else {
      // Done repeats for this ayah; move to next within selected range
      setCurrentRepeatIteration(1);
      const nextIndex = index + 1;
      const targetMaxIndex = Math.min(toAyah - 1, ayahs.length - 1);

      if (nextIndex <= targetMaxIndex) {
        if (pauseDurationSeconds > 0) {
          pauseTimerRef.current = setTimeout(() => {
            startPlaying(nextIndex);
          }, pauseDurationSeconds * 1000);
        } else {
          startPlaying(nextIndex);
        }
      } else {
        // Reached end of selected range
        setIsPlaying(false);
      }
    }
  };

  const stopPlaying = () => {
    if (pauseTimerRef.current) clearTimeout(pauseTimerRef.current);
    if (audioRef.current) audioRef.current.pause();
    setIsPlaying(false);
  };

  // Active subset of ayahs based on range
  const filteredAyahs = ayahs.filter(
    (a) => a.ayahNumber >= fromAyah && a.ayahNumber <= toAyah
  );

  return (
    <div className="space-y-6 text-right">
      {/* Educational Banner */}
      <div className="rounded-3xl bg-gradient-to-r from-stone-900 via-emerald-950/80 to-stone-900 border border-emerald-500/30 p-5 sm:p-6 shadow-xl space-y-3">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-xs font-bold text-emerald-400">
              <GraduationCap className="w-4 h-4 text-emerald-400" />
              <span>المعلم القرآني التفاعلي · تحفيظ وتثبيت القرآن الكريم</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-bold text-white font-quran">
              المعلم التعليمي للحفظ والتثبيت والتسميع
            </h2>
            <p className="text-xs text-stone-300">
              اختر السورة والآيات، وحدد عدد تكرار كل آية، مع إمكانية إخفاء الكلمات لاختبار الحفظ والتسميع الذاتي، والاستماع لكبار شيوخ التحفيظ.
            </p>
          </div>

          {/* Quick Stats Pill */}
          <div className="flex items-center gap-3 bg-stone-950/80 border border-stone-800 p-2.5 rounded-2xl shrink-0">
            <div className="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400">
              <Award className="w-5 h-5" />
            </div>
            <div className="text-right">
              <div className="text-[11px] text-stone-400">الآيات المحفوظة لديك</div>
              <div className="text-base font-bold text-amber-300 font-mono">
                {memorizedKeys.size} آية
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Control Configuration Bar */}
      <div className="p-4 rounded-3xl bg-stone-900/90 border border-stone-800 shadow-md space-y-4">
        {/* Row 1: Surah & Reciter Selector */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {/* Surah Selection */}
          <div className="flex flex-col gap-1 text-right">
            <label className="text-xs text-stone-400 font-semibold">السورة المراد حفظها:</label>
            <select
              value={selectedSurah.number}
              onChange={(e) => {
                const s = ALL_SURAHS.find((item) => item.number === parseInt(e.target.value, 10));
                if (s) setSelectedSurah(s);
              }}
              className="w-full bg-stone-950 border border-stone-800 rounded-xl px-3 py-2 text-xs font-bold text-emerald-400 outline-none cursor-pointer"
            >
              {ALL_SURAHS.map((s) => (
                <option key={s.number} value={s.number} className="bg-stone-900 text-stone-100">
                  {s.number}. سورة {s.name} ({s.numberOfAyahs} آية)
                </option>
              ))}
            </select>
          </div>

          {/* Reciter Selection */}
          <div className="flex flex-col gap-1 text-right">
            <label className="text-xs text-stone-400 font-semibold">القارئ المعلم:</label>
            <select
              value={selectedReciter.id}
              onChange={(e) => {
                const r = MEMORIZER_RECITERS.find((item) => item.id === e.target.value);
                if (r) setSelectedReciter(r);
              }}
              className="w-full bg-stone-950 border border-stone-800 rounded-xl px-3 py-2 text-xs font-bold text-amber-300 outline-none cursor-pointer"
            >
              {MEMORIZER_RECITERS.map((r) => (
                <option key={r.id} value={r.id} className="bg-stone-900 text-stone-100">
                  {r.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Row 2: Range & Repetitions & Pause */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-stone-800/80">
          {/* Range: From Ayah to Ayah */}
          <div className="flex items-center gap-2 text-xs">
            <span className="text-stone-400 font-semibold">المقطع:</span>
            <div className="flex items-center gap-1 bg-stone-950 border border-stone-800 rounded-xl px-2 py-1">
              <span>من آية:</span>
              <input
                type="number"
                min="1"
                max={toAyah}
                value={fromAyah}
                onChange={(e) => setFromAyah(Math.max(1, parseInt(e.target.value, 10) || 1))}
                className="w-10 bg-transparent text-center font-mono font-bold text-emerald-400 outline-none"
              />
            </div>
            <div className="flex items-center gap-1 bg-stone-950 border border-stone-800 rounded-xl px-2 py-1">
              <span>إلى آية:</span>
              <input
                type="number"
                min={fromAyah}
                max={selectedSurah.numberOfAyahs}
                value={toAyah}
                onChange={(e) =>
                  setToAyah(
                    Math.min(
                      selectedSurah.numberOfAyahs,
                      Math.max(fromAyah, parseInt(e.target.value, 10) || fromAyah)
                    )
                  )
                }
                className="w-10 bg-transparent text-center font-mono font-bold text-emerald-400 outline-none"
              />
            </div>
          </div>

          {/* Repetitions per Ayah */}
          <div className="flex items-center gap-1.5 text-xs">
            <Repeat className="w-3.5 h-3.5 text-amber-400" />
            <span className="text-stone-400 font-semibold">تكرار الآية:</span>
            <div className="inline-flex items-center p-1 rounded-xl bg-stone-950 border border-stone-800 gap-1 text-[11px]">
              {[1, 3, 5, 7, 10].map((count) => (
                <button
                  key={count}
                  onClick={() => setRepeatCountPerAyah(count)}
                  className={`px-2.5 py-0.5 rounded-lg font-bold transition-all cursor-pointer ${
                    repeatCountPerAyah === count
                      ? 'bg-amber-500 text-stone-950 font-black shadow-xs'
                      : 'text-stone-400 hover:text-white'
                  }`}
                >
                  {count}×
                </button>
              ))}
            </div>
          </div>

          {/* Pause for Student Recitation */}
          <div className="flex items-center gap-1.5 text-xs">
            <Clock className="w-3.5 h-3.5 text-emerald-400" />
            <span className="text-stone-400 font-semibold">فترة الترديد:</span>
            <select
              value={pauseDurationSeconds}
              onChange={(e) => setPauseDurationSeconds(parseInt(e.target.value, 10))}
              className="bg-stone-950 border border-stone-800 rounded-xl px-2 py-1 text-xs text-stone-200 outline-none cursor-pointer"
            >
              <option value="0">بدون توقف</option>
              <option value="2">2 ثانية</option>
              <option value="4">4 ثوانٍ</option>
              <option value="6">6 ثوانٍ</option>
              <option value="10">10 ثوانٍ (للترديد المتأني)</option>
            </select>
          </div>

          {/* Test / Masking Mode Buttons */}
          <div className="flex items-center gap-1 bg-stone-950 border border-stone-800 rounded-xl p-1 text-xs">
            <button
              onClick={() => setTestMode('visible')}
              className={`px-2.5 py-1 rounded-lg font-bold transition-all cursor-pointer flex items-center gap-1 ${
                testMode === 'visible'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'text-stone-400 hover:text-white'
              }`}
              title="عرض النص القرآني كاملاً"
            >
              <Eye className="w-3.5 h-3.5" />
              <span>إظهار الكل</span>
            </button>

            <button
              onClick={() => setTestMode('masked')}
              className={`px-2.5 py-1 rounded-lg font-bold transition-all cursor-pointer flex items-center gap-1 ${
                testMode === 'masked'
                  ? 'bg-amber-500 text-stone-950 shadow-xs'
                  : 'text-stone-400 hover:text-white'
              }`}
              title="إخفاء بعض الكلمات لاختبار التذكر"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>إخفاء جزئي</span>
            </button>

            <button
              onClick={() => setTestMode('hidden')}
              className={`px-2.5 py-1 rounded-lg font-bold transition-all cursor-pointer flex items-center gap-1 ${
                testMode === 'hidden'
                  ? 'bg-red-700 text-white shadow-xs'
                  : 'text-stone-400 hover:text-white'
              }`}
              title="إخفاء الآيات كاملة للتسميع غيباً (انقر على الآية لكشفها)"
            >
              <EyeOff className="w-3.5 h-3.5" />
              <span>تسميع غيب</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Playback Bar */}
      <div className="p-4 rounded-3xl bg-emerald-950/70 border border-emerald-500/40 flex flex-wrap items-center justify-between gap-4 shadow-xl">
        <div className="flex items-center gap-3">
          <button
            onClick={() => (isPlaying ? stopPlaying() : startPlaying(fromAyah - 1))}
            className="w-12 h-12 rounded-2xl bg-emerald-500 hover:bg-emerald-400 text-stone-950 flex items-center justify-center font-bold shadow-lg shadow-emerald-500/30 transition-all active:scale-95 cursor-pointer"
            title={isPlaying ? 'إيقاف مؤقت' : 'بدء التكرار والتحفيظ'}
          >
            {isPlaying ? <Pause className="w-6 h-6 fill-current" /> : <Play className="w-6 h-6 fill-current mr-0.5" />}
          </button>

          <div>
            <div className="text-xs text-emerald-300 font-semibold">
              {isPlaying ? 'جاري تكرار المقطع التعليمي:' : 'جاهز لبدء التحفيظ والتكرار:'}
            </div>
            <div className="text-sm font-bold text-white font-quran">
              سورة {selectedSurah.name} · الآيات ({fromAyah} إلى {toAyah})
            </div>
          </div>
        </div>

        {/* Current Iteration Badge */}
        {isPlaying && (
          <div className="flex items-center gap-2 bg-stone-950/80 px-3.5 py-1.5 rounded-2xl border border-emerald-500/30">
            <span className="text-xs text-stone-400">التكرار الحالي للآية:</span>
            <span className="text-sm font-bold text-amber-400 font-mono">
              {currentRepeatIteration} / {repeatCountPerAyah}
            </span>
          </div>
        )}
      </div>

      {/* Verses Display Canvas */}
      {isLoadingAyahs ? (
        <div className="p-12 text-center text-stone-400 space-y-3">
          <div className="w-10 h-10 border-3 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="text-xs font-quran">جاري تحميل الآيات بالرسم العثماني...</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredAyahs.map((ayah, idx) => {
            const isCurrentActive = isPlaying && currentAyahIndex === ayah.ayahNumber - 1;
            const isMemorized = memorizedKeys.has(ayah.verseKey);
            const isRevealed = revealedAyahs.has(ayah.ayahNumber);

            return (
              <div
                key={ayah.id}
                className={`p-4 sm:p-5 rounded-3xl border transition-all duration-300 ${
                  isCurrentActive
                    ? 'bg-emerald-950/90 border-emerald-400 shadow-xl shadow-emerald-950/60 ring-2 ring-emerald-500/40'
                    : isMemorized
                    ? 'bg-stone-900/90 border-emerald-800/60'
                    : 'bg-stone-900/60 border-stone-800 hover:border-stone-700'
                }`}
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-2">
                  <div className="flex items-center gap-2">
                    <span className="w-7 h-7 rounded-xl bg-stone-950 border border-stone-800 text-xs font-mono font-bold text-amber-400 flex items-center justify-center">
                      {ayah.ayahNumber}
                    </span>
                    <span className="text-xs text-stone-400">
                      الآية {ayah.ayahNumber} من سورة {selectedSurah.name}
                    </span>

                    {isCurrentActive && (
                      <span className="px-2 py-0.5 rounded-full bg-emerald-500 text-stone-950 text-[10px] font-black animate-pulse">
                        تتلى الآن ({currentRepeatIteration} / {repeatCountPerAyah})
                      </span>
                    )}
                  </div>

                  {/* Actions for this verse */}
                  <div className="flex items-center gap-1.5 self-end sm:self-auto">
                    {/* Play single ayah */}
                    <button
                      onClick={() => startPlaying(ayah.ayahNumber - 1)}
                      className="p-1.5 rounded-xl bg-stone-950 hover:bg-stone-800 text-emerald-400 border border-stone-800 cursor-pointer"
                      title="استماع لهذه الآية وتكرارها"
                    >
                      <Play className="w-3.5 h-3.5 fill-current" />
                    </button>

                    {/* Mark as Memorized */}
                    <button
                      onClick={() => toggleMemorized(ayah.verseKey)}
                      className={`px-2.5 py-1 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1 ${
                        isMemorized
                          ? 'bg-emerald-600 text-white shadow-xs'
                          : 'bg-stone-950 text-stone-400 hover:text-white border border-stone-800'
                      }`}
                      title={isMemorized ? 'إلغاء التحديد' : 'تحديد كـ محفوظة'}
                    >
                      <CheckCircle className="w-3.5 h-3.5" />
                      <span>{isMemorized ? 'تم الحفظ' : 'احفظ'}</span>
                    </button>
                  </div>
                </div>

                {/* The Verse Text according to testMode */}
                <div
                  onClick={() => {
                    if (testMode !== 'visible') {
                      setRevealedAyahs((prev) => {
                        const next = new Set(prev);
                        if (next.has(ayah.ayahNumber)) next.delete(ayah.ayahNumber);
                        else next.add(ayah.ayahNumber);
                        return next;
                      });
                    }
                  }}
                  className={`text-lg sm:text-xl md:text-2xl leading-loose font-quran text-right p-3 rounded-2xl transition-all cursor-pointer ${
                    testMode !== 'visible' ? 'hover:bg-stone-950/40' : ''
                  }`}
                >
                  {testMode === 'visible' || isRevealed ? (
                    <span className="text-white">{ayah.text}</span>
                  ) : testMode === 'masked' ? (
                    // Masking some words (e.g. alternate words)
                    <span className="text-stone-300">
                      {ayah.text.split(' ').map((word, wIdx) => {
                        const isMasked = wIdx % 2 === 1;
                        return isMasked ? (
                          <span
                            key={wIdx}
                            className="bg-amber-950/80 text-amber-500/30 px-2 py-0.5 rounded-md mx-1 border border-dashed border-amber-600/40 select-none"
                            title="انقر على الآية لكشف الكلمة"
                          >
                            [ ... ]
                          </span>
                        ) : (
                          <span key={wIdx}> {word} </span>
                        );
                      })}
                    </span>
                  ) : (
                    // Completely hidden for self recitation
                    <div className="py-4 text-center text-xs font-sans text-stone-400 border border-dashed border-stone-700 rounded-xl bg-stone-950/50">
                      🔒 الآية مخفية للتسميع غيباً — انقر هنا لكشفها والتأكد من حفظك
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
