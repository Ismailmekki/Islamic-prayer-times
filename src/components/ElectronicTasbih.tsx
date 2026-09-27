import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  RotateCcw,
  Sparkles,
  Volume2,
  VolumeX,
  Vibrate,
  VibrateOff,
  Check,
  Plus,
  Trash2,
  Trophy,
  History,
  Palette,
  ChevronDown,
  Info,
  Layers,
  Sliders,
  Smartphone,
} from 'lucide-react';
import { soundService } from '../utils/soundService';
import { hapticService, HapticIntensity } from '../utils/hapticService';

interface PresetDhikr {
  id: string;
  arabicText: string;
  meaning: string;
  defaultGoal: number;
  virtue?: string;
}

const PRESET_ADHKAR: PresetDhikr[] = [
  {
    id: 'subhanallah',
    arabicText: 'سُبْحَانَ اللهِ',
    meaning: 'تنزيه الله تعالى عن كل نقص وعيب',
    defaultGoal: 33,
    virtue: 'غرست له بها نخلة في الجنة',
  },
  {
    id: 'alhamdulillah',
    arabicText: 'الْحَمْدُ لِلَّهِ',
    meaning: 'الثناء والحمد لله على نعمه التي لا تُحصى',
    defaultGoal: 33,
    virtue: 'تملأ الميزان بالخير والبركة',
  },
  {
    id: 'allahuakbar',
    arabicText: 'اللَّهُ أَكْبَرُ',
    meaning: 'الله أجل وأعظم من كل شيء',
    defaultGoal: 33,
    virtue: 'من أحب الكلام إلى الله عز وجل',
  },
  {
    id: 'lailahaillallah',
    arabicText: 'لَا إِلَهَ إِلَّا اللَّهُ',
    meaning: 'أعظم كلمة توحيد وإخلاص',
    defaultGoal: 100,
    virtue: 'خير ما قلت أنا والنبيون من قبلي',
  },
  {
    id: 'astaghfirullah',
    arabicText: 'أَسْتَغْفِرُ اللَّهَ وَأَتُوبُ إِلَيْهِ',
    meaning: 'طلب المغفرة والصفح من رب العالمين',
    defaultGoal: 100,
    virtue: 'من لزم الاستغفار جعل الله له من كل هم فرجاً',
  },
  {
    id: 'subhan_wa_bihamdihi',
    arabicText: 'سُبْحَانَ اللَّهِ وَبِحَمْدِهِ ، سُبْحَانَ اللَّهِ الْعَظِيمِ',
    meaning: 'كلمتان خفيفتان على اللسان ثقيلتان في الميزان',
    defaultGoal: 100,
    virtue: 'حبيبتان إلى الرحمن، ثقيلتان في الميزان',
  },
  {
    id: 'hawqalah',
    arabicText: 'لَا حَوْلَ وَلَا قُوَّةَ إِلَّا بِاللَّهِ',
    meaning: 'التبرؤ من الحول والقوة إلا بحول الله',
    defaultGoal: 33,
    virtue: 'كنز من كنوز الجنة ودواء لتسعة وتسعين داء',
  },
  {
    id: 'salawat',
    arabicText: 'اللَّهُمَّ صَلِّ وَسَلِّمْ عَلَى نَبِيِّنَا مُحَمَّدٍ',
    meaning: 'الصلاة والتسليم على رسول الله ﷺ',
    defaultGoal: 100,
    virtue: 'من صلى عليّ صلاة صلى الله عليه بها عشراً',
  },
  {
    id: 'hasbunallah',
    arabicText: 'حَسْبُنَا اللَّهُ وَنِعْمَ الْوَكِيلُ',
    meaning: 'التوكل التام والتفويض لله سبحانه',
    defaultGoal: 33,
    virtue: 'قالها إبراهيم عليه السلام حين أُلقي في النار',
  },
  {
    id: 'yunus_dua',
    arabicText: 'لَا إِلَهَ إِلَّا أَنْتَ سُبْحَانَكَ إِنِّي كُنْتُ مِنَ الظَّالِمِينَ',
    meaning: 'دعوة ذي النون في بطن الحوت',
    defaultGoal: 33,
    virtue: 'لم يدعُ بها رجل مسلم في شيء قط إلا استجاب الله له',
  },
];

type ThemeKey = 'emerald' | 'obsidian' | 'amber' | 'sapphire';

interface ThemeConfig {
  name: string;
  cardBg: string;
  buttonGrad: string;
  buttonBorder: string;
  glowColor: string;
  ringStroke: string;
  textColor: string;
  accentBg: string;
}

const THEMES: Record<ThemeKey, ThemeConfig> = {
  emerald: {
    name: 'زمردي إسلامي',
    cardBg: 'from-emerald-950/70 via-stone-900 to-stone-900 border-emerald-500/30',
    buttonGrad: 'from-emerald-600 via-emerald-700 to-teal-800',
    buttonBorder: 'border-emerald-400/50',
    glowColor: 'shadow-emerald-700/50',
    ringStroke: '#10b981',
    textColor: 'text-emerald-400',
    accentBg: 'bg-emerald-600',
  },
  obsidian: {
    name: 'ليلي مذهب',
    cardBg: 'from-stone-950 via-stone-900 to-stone-950 border-amber-500/30',
    buttonGrad: 'from-stone-900 via-stone-800 to-stone-950',
    buttonBorder: 'border-amber-400/50',
    glowColor: 'shadow-amber-500/20',
    ringStroke: '#f59e0b',
    textColor: 'text-amber-400',
    accentBg: 'bg-amber-600',
  },
  amber: {
    name: 'عنبري دافئ',
    cardBg: 'from-amber-950/60 via-stone-900 to-stone-900 border-amber-600/40',
    buttonGrad: 'from-amber-600 via-amber-700 to-yellow-800',
    buttonBorder: 'border-amber-400/50',
    glowColor: 'shadow-amber-700/40',
    ringStroke: '#d97706',
    textColor: 'text-amber-300',
    accentBg: 'bg-amber-600',
  },
  sapphire: {
    name: 'ياقوتي هادئ',
    cardBg: 'from-cyan-950/60 via-stone-900 to-stone-900 border-cyan-500/30',
    buttonGrad: 'from-cyan-700 via-teal-800 to-slate-900',
    buttonBorder: 'border-cyan-400/50',
    glowColor: 'shadow-cyan-700/40',
    ringStroke: '#06b6d4',
    textColor: 'text-cyan-400',
    accentBg: 'bg-cyan-600',
  },
};

export const ElectronicTasbih: React.FC = () => {
  // Custom User Adhkar (loaded first to support restoring active custom dhikr)
  const [customAdhkar, setCustomAdhkar] = useState<PresetDhikr[]>(() => {
    try {
      const saved = localStorage.getItem('tasbih_custom_adhkar');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  // Current Dhikr with restoration of user's last active selection
  const [currentDhikr, setCurrentDhikr] = useState<PresetDhikr>(() => {
    try {
      const savedId = localStorage.getItem('tasbih_active_dhikr_id');
      if (savedId) {
        const customSaved = localStorage.getItem('tasbih_custom_adhkar');
        const customList: PresetDhikr[] = customSaved ? JSON.parse(customSaved) : [];
        const all = [...customList, ...PRESET_ADHKAR];
        const found = all.find((d) => d.id === savedId);
        if (found) return found;
      }
    } catch {
      // fallback to default
    }
    return PRESET_ADHKAR[0];
  });

  // Per-dhikr counts record to preserve individual counters when switching between adhkar
  const [dhikrCounts, setDhikrCounts] = useState<Record<string, number>>(() => {
    try {
      const saved = localStorage.getItem('tasbih_dhikr_counts');
      return saved ? JSON.parse(saved) : {};
    } catch {
      return {};
    }
  });

  // Saved count in localStorage (never lost on reload or closing the browser/app)
  const [count, setCount] = useState<number>(() => {
    try {
      const saved = localStorage.getItem('tasbih_current_count');
      if (saved !== null) {
        const parsed = parseInt(saved, 10);
        if (!isNaN(parsed) && parsed >= 0) {
          return parsed;
        }
      }
      // Fallback to per-dhikr count if current_count was not set
      const savedId = localStorage.getItem('tasbih_active_dhikr_id') || PRESET_ADHKAR[0].id;
      const countsRaw = localStorage.getItem('tasbih_dhikr_counts');
      if (countsRaw) {
        const parsedCounts = JSON.parse(countsRaw);
        if (typeof parsedCounts[savedId] === 'number') {
          return parsedCounts[savedId];
        }
      }
    } catch {
      return 0;
    }
    return 0;
  });

  // Ref to guarantee synchronous accessibility during pagehide/beforeunload events
  const countRef = useRef<number>(count);
  const currentDhikrRef = useRef<PresetDhikr>(currentDhikr);

  useEffect(() => {
    countRef.current = count;
  }, [count]);

  useEffect(() => {
    currentDhikrRef.current = currentDhikr;
  }, [currentDhikr]);

  // Target Goal (33, 99, 100, 1000, 0 = unlimited)
  const [goal, setGoal] = useState<number>(() => {
    try {
      const saved = localStorage.getItem('tasbih_goal');
      return saved ? parseInt(saved, 10) || 33 : 33;
    } catch {
      return 33;
    }
  });

  // Total Lifetime Tasbeeh Count
  const [totalLifetimeCount, setTotalLifetimeCount] = useState<number>(() => {
    try {
      const saved = localStorage.getItem('tasbih_total_lifetime');
      return saved ? parseInt(saved, 10) || 0 : 0;
    } catch {
      return 0;
    }
  });

  // Sound & Vibration Settings
  const [soundEnabled, setSoundEnabled] = useState<boolean>(() => {
    try {
      const saved = localStorage.getItem('tasbih_sound_enabled');
      return saved !== null ? saved === 'true' : true;
    } catch {
      return true;
    }
  });

  const [vibrationEnabled, setVibrationEnabled] = useState<boolean>(() => {
    try {
      const saved = localStorage.getItem('tasbih_vibrate_enabled');
      return saved !== null ? saved === 'true' : true;
    } catch {
      return true;
    }
  });

  // Haptic feedback intensity setting: light (16ms), medium (28ms), strong (50ms)
  const [vibrationIntensity, setVibrationIntensity] = useState<HapticIntensity>(() => {
    try {
      const saved = localStorage.getItem('tasbih_haptic_intensity') as HapticIntensity;
      return saved === 'light' || saved === 'strong' ? saved : 'medium';
    } catch {
      return 'medium';
    }
  });

  // Flag indicating if the current browser/device natively supports navigator.vibrate
  const isHapticSupported = hapticService.isSupported;
  const [showHapticModal, setShowHapticModal] = useState<boolean>(false);

  // Theme
  const [currentTheme, setCurrentTheme] = useState<ThemeKey>(() => {
    try {
      const saved = localStorage.getItem('tasbih_theme') as ThemeKey;
      return THEMES[saved] ? saved : 'emerald';
    } catch {
      return 'emerald';
    }
  });

  // Button Click Ripple / Pulse animation state
  const [isPressing, setIsPressing] = useState<boolean>(false);
  const [justCompletedGoal, setJustCompletedGoal] = useState<boolean>(false);

  // Reset confirmation prompt
  const [showResetConfirm, setShowResetConfirm] = useState<boolean>(false);

  // New Custom Dhikr Input Modal
  const [isCustomModalOpen, setIsCustomModalOpen] = useState<boolean>(false);
  const [customTextInput, setCustomTextInput] = useState<string>('');
  const [customGoalInput, setCustomGoalInput] = useState<number>(33);
  const [customMeaningInput, setCustomMeaningInput] = useState<string>('');

  // Persist State
  useEffect(() => {
    localStorage.setItem('tasbih_current_count', count.toString());
  }, [count]);

  useEffect(() => {
    localStorage.setItem('tasbih_goal', goal.toString());
  }, [goal]);

  useEffect(() => {
    localStorage.setItem('tasbih_total_lifetime', totalLifetimeCount.toString());
  }, [totalLifetimeCount]);

  useEffect(() => {
    localStorage.setItem('tasbih_sound_enabled', soundEnabled.toString());
  }, [soundEnabled]);

  useEffect(() => {
    localStorage.setItem('tasbih_vibrate_enabled', vibrationEnabled.toString());
  }, [vibrationEnabled]);

  useEffect(() => {
    localStorage.setItem('tasbih_haptic_intensity', vibrationIntensity);
  }, [vibrationIntensity]);

  useEffect(() => {
    localStorage.setItem('tasbih_theme', currentTheme);
  }, [currentTheme]);

  useEffect(() => {
    localStorage.setItem('tasbih_custom_adhkar', JSON.stringify(customAdhkar));
  }, [customAdhkar]);

  // Guaranteed sync to localStorage on app close, tab switch, page refresh, or backgrounding
  useEffect(() => {
    const saveSnapshot = () => {
      try {
        localStorage.setItem('tasbih_current_count', countRef.current.toString());
        localStorage.setItem('tasbih_active_dhikr_id', currentDhikrRef.current.id);
      } catch (err) {
        console.error('Error saving snapshot to localStorage:', err);
      }
    };

    window.addEventListener('beforeunload', saveSnapshot);
    window.addEventListener('pagehide', saveSnapshot);
    const handleVisibility = () => {
      if (document.visibilityState === 'hidden') {
        saveSnapshot();
      }
    };
    document.addEventListener('visibilitychange', handleVisibility);

    return () => {
      window.removeEventListener('beforeunload', saveSnapshot);
      window.removeEventListener('pagehide', saveSnapshot);
      document.removeEventListener('visibilitychange', handleVisibility);
    };
  }, []);

  // Main increment function with synchronous localStorage persistence
  const handleIncrement = useCallback(() => {
    setIsPressing(true);
    setTimeout(() => setIsPressing(false), 120);

    const nextCount = count + 1;
    setCount(nextCount);
    countRef.current = nextCount;

    // Immediately persist to localStorage synchronously so counter is never lost
    try {
      localStorage.setItem('tasbih_current_count', nextCount.toString());
      localStorage.setItem('tasbih_active_dhikr_id', currentDhikr.id);
      setDhikrCounts((prev) => {
        const updated = { ...prev, [currentDhikr.id]: nextCount };
        localStorage.setItem('tasbih_dhikr_counts', JSON.stringify(updated));
        return updated;
      });
    } catch (e) {
      console.error('Error saving tasbih count to localStorage:', e);
    }

    setTotalLifetimeCount((prev) => {
      const nextTotal = prev + 1;
      try {
        localStorage.setItem('tasbih_total_lifetime', nextTotal.toString());
      } catch {}
      return nextTotal;
    });

    // 1. Sound feedback
    if (soundEnabled) {
      soundService.playTasbeehClick();
    }

    // 2. Haptic Feedback (Physical vibration if device supports it)
    if (vibrationEnabled) {
      hapticService.triggerClick(vibrationIntensity);
    }

    // Check if goal reached
    if (goal > 0 && nextCount % goal === 0) {
      setJustCompletedGoal(true);
      setTimeout(() => setJustCompletedGoal(false), 2500);

      if (soundEnabled) {
        soundService.playGoalCelebration();
      }
      if (vibrationEnabled) {
        hapticService.triggerCelebration();
      }
    }
  }, [count, currentDhikr.id, goal, soundEnabled, vibrationEnabled, vibrationIntensity]);

  // Reset function with immediate localStorage update
  const handleReset = () => {
    setCount(0);
    countRef.current = 0;
    setShowResetConfirm(false);

    try {
      localStorage.setItem('tasbih_current_count', '0');
      setDhikrCounts((prev) => {
        const updated = { ...prev, [currentDhikr.id]: 0 };
        localStorage.setItem('tasbih_dhikr_counts', JSON.stringify(updated));
        return updated;
      });
    } catch (e) {
      console.error('Error resetting count in localStorage:', e);
    }

    if (soundEnabled) {
      soundService.playTasbeehClick();
    }
    if (vibrationEnabled) {
      hapticService.triggerReset();
    }
  };

  // Keyboard shortcut: Spacebar / Enter increments count
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't trigger if user is typing in an input
      if (
        document.activeElement?.tagName === 'INPUT' ||
        document.activeElement?.tagName === 'TEXTAREA'
      ) {
        return;
      }

      if (e.code === 'Space' || e.key === ' ' || e.key === 'Enter') {
        e.preventDefault();
        handleIncrement();
      } else if (e.key === 'r' || e.key === 'R') {
        setShowResetConfirm(true);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleIncrement]);

  // Switch Dhikr while preserving individual progress for each dhikr
  const handleSelectDhikr = (dhikr: PresetDhikr) => {
    const targetCount = dhikrCounts[dhikr.id] || 0;
    setCurrentDhikr(dhikr);
    currentDhikrRef.current = dhikr;

    if (dhikr.defaultGoal) {
      setGoal(dhikr.defaultGoal);
    }
    setCount(targetCount);
    countRef.current = targetCount;

    try {
      localStorage.setItem('tasbih_active_dhikr_id', dhikr.id);
      localStorage.setItem('tasbih_current_count', targetCount.toString());
      if (dhikr.defaultGoal) {
        localStorage.setItem('tasbih_goal', dhikr.defaultGoal.toString());
      }
    } catch (e) {
      console.error('Error saving switched dhikr to localStorage:', e);
    }

    if (soundEnabled) {
      soundService.playTasbeehClick();
    }
  };

  // Add custom dhikr
  const handleSaveCustomDhikr = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customTextInput.trim()) return;

    const newDhikr: PresetDhikr = {
      id: `custom_${Date.now()}`,
      arabicText: customTextInput.trim(),
      meaning: customMeaningInput.trim() || 'ورد مخصص مضاف',
      defaultGoal: customGoalInput > 0 ? customGoalInput : 33,
    };

    setCustomAdhkar((prev) => [newDhikr, ...prev]);
    setCurrentDhikr(newDhikr);
    setGoal(newDhikr.defaultGoal);
    setCount(0);

    setCustomTextInput('');
    setCustomMeaningInput('');
    setCustomGoalInput(33);
    setIsCustomModalOpen(false);
  };

  const handleDeleteCustomDhikr = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setCustomAdhkar((prev) => prev.filter((d) => d.id !== id));
    if (currentDhikr.id === id) {
      setCurrentDhikr(PRESET_ADHKAR[0]);
      setGoal(PRESET_ADHKAR[0].defaultGoal);
      setCount(0);
    }
  };

  const theme = THEMES[currentTheme];

  // Cycles calculation
  const completedCycles = goal > 0 ? Math.floor(count / goal) : 0;
  const currentInCycle = goal > 0 ? count % goal : count;
  const progressPercent = goal > 0 ? Math.min(100, Math.round((currentInCycle / goal) * 100)) : 100;

  // SVG Circular progress math
  const circleRadius = 130;
  const circumference = 2 * Math.PI * circleRadius;
  const strokeDashoffset =
    goal > 0
      ? circumference - (currentInCycle / goal) * circumference
      : 0;

  const allAdhkar = [...customAdhkar, ...PRESET_ADHKAR];

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Main Counter Card */}
      <div
        className={`relative p-6 sm:p-10 rounded-3xl bg-gradient-to-b ${theme.cardBg} border shadow-2xl overflow-hidden transition-all duration-300 text-center`}
      >
        {/* Decorative Islamic Background Geometric Medallion */}
        <div
          aria-hidden="true"
          className="absolute -top-24 -right-24 w-72 h-72 rounded-full border border-white/5 pointer-events-none"
        />
        <div
          aria-hidden="true"
          className="absolute -bottom-24 -left-24 w-72 h-72 rounded-full border border-white/5 pointer-events-none"
        />

        {/* Top Control Bar: Goal, Sound, Haptic & Themes */}
        <div className="relative z-10 flex flex-wrap items-center justify-between gap-3 pb-6 border-b border-stone-800/80">
          {/* Target Selector */}
          <div className="flex items-center gap-1.5 bg-stone-950/80 p-1 rounded-2xl border border-stone-800 text-xs">
            <span className="text-[11px] text-stone-400 px-2 font-medium">الهدف:</span>
            {[33, 99, 100, 1000, 0].map((g) => (
              <button
                key={g}
                onClick={() => setGoal(g)}
                className={`px-2.5 py-1 rounded-xl transition-all font-mono text-xs cursor-pointer ${
                  goal === g
                    ? `${theme.accentBg} text-white font-bold shadow-sm`
                    : 'text-stone-400 hover:text-white'
                }`}
              >
                {g === 0 ? 'مفتوح' : g}
              </button>
            ))}
          </div>

          {/* Sound, Haptic & Theme Quick Toggles */}
          <div className="flex items-center gap-1.5">
            {/* Sound Toggle */}
            <button
              onClick={() => setSoundEnabled(!soundEnabled)}
              className={`p-2 rounded-xl border transition-colors cursor-pointer ${
                soundEnabled
                  ? 'bg-stone-800 text-emerald-400 border-emerald-500/40'
                  : 'bg-stone-900/60 text-stone-500 border-stone-800'
              }`}
              title={soundEnabled ? 'كتم صوت النقرات' : 'تفعيل صوت النقرات'}
            >
              {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
            </button>

            {/* Vibration Toggle & Settings */}
            <div className="flex items-center bg-stone-950/80 p-0.5 rounded-xl border border-stone-800">
              <button
                onClick={() => {
                  const nextState = !vibrationEnabled;
                  setVibrationEnabled(nextState);
                  if (nextState) {
                    hapticService.triggerClick(vibrationIntensity);
                  }
                }}
                className={`p-2 rounded-lg transition-colors cursor-pointer flex items-center gap-1 ${
                  vibrationEnabled
                    ? 'bg-stone-800 text-emerald-400 border border-emerald-500/40'
                    : 'text-stone-500 hover:text-stone-300'
                }`}
                title={vibrationEnabled ? 'الاهتزاز مفعّل (اضغط للتعطيل)' : 'تفعيل الاهتزاز اللمسي'}
              >
                {vibrationEnabled ? <Vibrate className="w-4 h-4" /> : <VibrateOff className="w-4 h-4" />}
              </button>

              <button
                onClick={() => setShowHapticModal(true)}
                className="p-2 rounded-lg text-stone-400 hover:text-white hover:bg-stone-800/60 transition-colors"
                title="إعدادات الاهتزاز واختبار القوة"
              >
                <Sliders className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Theme Picker Dropdown */}
            <div className="flex items-center gap-1 bg-stone-950/80 p-1 rounded-xl border border-stone-800">
              {(Object.keys(THEMES) as ThemeKey[]).map((thKey) => (
                <button
                  key={thKey}
                  onClick={() => setCurrentTheme(thKey)}
                  className={`w-5 h-5 rounded-full border transition-transform ${
                    currentTheme === thKey ? 'scale-110 border-white ring-1 ring-white/50' : 'border-transparent opacity-60 hover:opacity-100'
                  }`}
                  style={{
                    backgroundColor: THEMES[thKey].ringStroke,
                  }}
                  title={THEMES[thKey].name}
                />
              ))}
            </div>
          </div>
        </div>

        {/* Current Dhikr Display Area */}
        <div className="relative z-10 pt-6 pb-4 space-y-2">
          <div className="flex items-center justify-center gap-2 text-xs text-stone-400">
            <div className="inline-flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              <span>الذكر الحالي المختار:</span>
            </div>
            <span aria-hidden="true" className="text-stone-600">·</span>
            <span
              className="inline-flex items-center gap-1 text-[11px] text-emerald-400/90 bg-emerald-950/40 px-2 py-0.5 rounded-full border border-emerald-500/20"
              title="يتم حفظ العداد تلقائياً في ذاكرة الجهاز (localStorage) ولن يضيع عند تحديث الصفحة أو إغلاق التطبيق"
            >
              <Check className="w-3 h-3 text-emerald-400" />
              <span>العداد محفوظ تلقائياً</span>
            </span>
          </div>

          <h2 className="text-2xl sm:text-3xl font-extrabold text-white font-quran leading-relaxed tracking-wide max-w-xl mx-auto drop-shadow-md">
            «{currentDhikr.arabicText}»
          </h2>

          {currentDhikr.meaning && (
            <p className="text-xs text-stone-400 max-w-md mx-auto">
              {currentDhikr.meaning}
            </p>
          )}

          {currentDhikr.virtue && (
            <div className="inline-block text-[11px] text-emerald-400/90 bg-emerald-950/50 border border-emerald-500/20 px-3 py-1 rounded-full">
              فضله: {currentDhikr.virtue}
            </div>
          )}
        </div>

        {/* Big Interactive Bead / Circular Progress Clicker Area */}
        <div className="relative z-10 my-6 flex flex-col items-center justify-center">
          {/* Circular SVG Progress Meter */}
          <div className="relative w-64 h-64 sm:w-72 sm:h-72 flex items-center justify-center select-none">
            <svg className="w-full h-full -rotate-90 transform" viewBox="0 0 300 300">
              {/* Background Ring */}
              <circle
                cx="150"
                cy="150"
                r={circleRadius}
                fill="none"
                stroke="#292524"
                strokeWidth="12"
              />
              {/* Progress Ring */}
              {goal > 0 && (
                <circle
                  cx="150"
                  cy="150"
                  r={circleRadius}
                  fill="none"
                  stroke={theme.ringStroke}
                  strokeWidth="12"
                  strokeLinecap="round"
                  strokeDasharray={circumference}
                  strokeDashoffset={strokeDashoffset}
                  className="transition-all duration-200 ease-out"
                />
              )}
            </svg>

            {/* Inner Increment Click Button */}
            <button
              onClick={handleIncrement}
              className={`absolute w-48 h-48 sm:w-56 sm:h-56 rounded-full bg-gradient-to-br ${theme.buttonGrad} ${theme.buttonBorder} border-4 text-white flex flex-col items-center justify-center shadow-2xl ${theme.glowColor} cursor-pointer transition-all duration-100 select-none ${
                isPressing ? 'scale-95 shadow-inner' : 'hover:scale-[1.02] active:scale-95'
              }`}
              style={{ touchAction: 'manipulation' }}
            >
              {/* Current Counter Number */}
              <span className="text-5xl sm:text-6xl font-black font-mono tabular-nums tracking-tight drop-shadow-lg">
                {count}
              </span>

              {/* In-cycle and Goal Subtext */}
              <span className="text-xs sm:text-sm text-stone-200 font-medium mt-1">
                {goal > 0 ? (
                  <>
                    <span>{currentInCycle}</span>
                    <span className="text-stone-300 mx-1">/</span>
                    <span>{goal}</span>
                  </>
                ) : (
                  <span>عد مفتوح</span>
                )}
              </span>

              {/* Cycles Badge */}
              {goal > 0 && (
                <span className="text-[10px] text-white/90 bg-black/30 px-2.5 py-0.5 rounded-full mt-1.5 font-bold">
                  الدورة {completedCycles + 1}
                </span>
              )}

              <span className="text-[9px] text-white/70 mt-1 uppercase tracking-wider">
                اضغط للتسبيح
              </span>
            </button>
          </div>

          {/* Goal Completed Celebration Notification */}
          {justCompletedGoal && (
            <div className="mt-3 flex items-center gap-2 px-4 py-1.5 rounded-xl bg-emerald-600/90 text-white text-xs font-bold shadow-lg animate-bounce">
              <Trophy className="w-4 h-4 text-amber-300" />
              <span>ما شاء الله! اكتملت الدورة بنجاح ({goal} تسبيحة)</span>
            </div>
          )}

          <div className="flex flex-wrap items-center justify-center gap-2.5 text-[11px] text-stone-400 mt-2">
            <span>
              يمكنك أيضاً الضغط على زر <strong className="text-stone-200">المسافة (Space)</strong>
            </span>
            <span aria-hidden="true" className="text-stone-600">·</span>
            <button
              onClick={() => setShowHapticModal(true)}
              className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-lg bg-stone-900/80 hover:bg-stone-800 text-stone-300 hover:text-emerald-400 border border-stone-800 transition-colors cursor-pointer"
            >
              <Vibrate className="w-3 h-3 text-emerald-400" />
              <span>
                الاهتزاز اللمسي: {vibrationEnabled ? (
                  vibrationIntensity === 'light' ? 'خفيف' : vibrationIntensity === 'strong' ? 'قوي' : 'متوسط'
                ) : 'معطّل'}
              </span>
            </button>
          </div>
        </div>

        {/* Counter Action Controls: Reset & Quick Add */}
        <div className="relative z-10 flex items-center justify-center gap-4 pt-4 border-t border-stone-800/80">
          {/* Reset Button (تصفير العداد) */}
          {!showResetConfirm ? (
            <button
              onClick={() => setShowResetConfirm(true)}
              className="flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-stone-900 hover:bg-stone-800 text-stone-300 hover:text-rose-400 border border-stone-800 hover:border-rose-900/50 text-xs font-bold transition-all cursor-pointer shadow-sm active:scale-95"
              title="تصفير العداد الحالي"
            >
              <RotateCcw className="w-4 h-4" />
              <span>تصفير العداد</span>
            </button>
          ) : (
            <div className="flex items-center gap-2 bg-rose-950/60 border border-rose-600/40 p-1.5 rounded-2xl animate-in fade-in">
              <span className="text-xs text-rose-200 px-2 font-medium">تأكيد التصفير؟</span>
              <button
                onClick={handleReset}
                className="px-3 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold cursor-pointer"
              >
                نعم، صفّر
              </button>
              <button
                onClick={() => setShowResetConfirm(false)}
                className="px-3 py-1.5 rounded-xl bg-stone-800 hover:bg-stone-700 text-stone-300 text-xs cursor-pointer"
              >
                إلغاء
              </button>
            </div>
          )}

          {/* Total Lifetime Counter Indicator */}
          <div className="flex items-center gap-2 px-4 py-2 rounded-2xl bg-stone-950/80 border border-stone-800 text-xs text-stone-300">
            <History className="w-3.5 h-3.5 text-amber-400" />
            <span>مجموع تسبيحاتك الكلي:</span>
            <strong className="text-white font-mono tabular-nums font-bold">
              {totalLifetimeCount}
            </strong>
          </div>
        </div>
      </div>

      {/* Selectable Dhikr List & Library */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h3 className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
              <Layers className="w-4 h-4 text-emerald-400" />
              <span>مكتبة الأذكار والأوراد للتسبيح</span>
            </h3>
            <p className="text-xs text-stone-400 mt-0.5">
              اختر الذكر الذي ترغب في ترديده، أو أضف ذكراً مخصصاً بوردك المفضل
            </p>
          </div>

          <button
            onClick={() => setIsCustomModalOpen(true)}
            className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold flex items-center gap-2 shadow-md shadow-emerald-700/30 transition-transform active:scale-95 cursor-pointer self-start sm:self-auto"
          >
            <Plus className="w-4 h-4" />
            <span>إضافة ذكر مخصص</span>
          </button>
        </div>

        {/* Grid of Dhikr Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {allAdhkar.map((item) => {
            const isSelected = currentDhikr.id === item.id;
            const isCustom = item.id.startsWith('custom_');

            return (
              <div
                key={item.id}
                onClick={() => handleSelectDhikr(item)}
                className={`p-4 rounded-2xl border text-right transition-all cursor-pointer flex flex-col justify-between gap-3 ${
                  isSelected
                    ? 'bg-emerald-950/40 border-emerald-500/60 shadow-lg shadow-emerald-950/40 ring-1 ring-emerald-500/40'
                    : 'bg-stone-900/60 border-stone-800 hover:border-stone-700 hover:bg-stone-900/90'
                }`}
              >
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] text-stone-400">
                      الهدف: <strong className="text-white font-mono">{item.defaultGoal}</strong>
                      {typeof dhikrCounts[item.id] === 'number' && dhikrCounts[item.id] > 0 && (
                        <>
                          <span aria-hidden="true" className="mx-1 text-stone-600">·</span>
                          <span>المحفوظ: <strong className="text-emerald-400 font-mono">{dhikrCounts[item.id]}</strong></span>
                        </>
                      )}
                    </span>

                    <div className="flex items-center gap-1.5">
                      {isCustom && (
                        <button
                          onClick={(e) => handleDeleteCustomDhikr(item.id, e)}
                          className="p-1 rounded-lg text-stone-500 hover:text-rose-400 hover:bg-stone-800 transition-colors"
                          title="حذف هذا الذكر المضاف"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                      {isSelected && (
                        <span className="flex items-center gap-1 text-[11px] text-emerald-400 font-bold bg-emerald-950 px-2 py-0.5 rounded-md border border-emerald-500/30">
                          <Check className="w-3 h-3" />
                          مفعّل بالسبحة
                        </span>
                      )}
                    </div>
                  </div>

                  <p className="text-base sm:text-lg font-bold font-quran text-white leading-relaxed">
                    «{item.arabicText}»
                  </p>
                </div>

                {item.virtue && (
                  <p className="text-[11px] text-emerald-400/90 border-t border-stone-800/80 pt-2 truncate">
                    {item.virtue}
                  </p>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Add Custom Dhikr Modal */}
      {isCustomModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in">
          <div className="bg-stone-900 border border-stone-800 rounded-3xl w-full max-w-md shadow-2xl overflow-hidden flex flex-col text-right">
            <div className="p-5 border-b border-stone-800 flex items-center justify-between">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-emerald-400" />
                <span>إضافة ذكر مخصص للسبحة</span>
              </h3>
              <button
                onClick={() => setIsCustomModalOpen(false)}
                className="p-1.5 rounded-lg text-stone-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveCustomDhikr} className="p-5 space-y-4">
              <div>
                <label className="block text-xs font-bold text-stone-300 mb-1">
                  نص الذكر المبارك: <span className="text-rose-400">*</span>
                </label>
                <textarea
                  required
                  rows={2}
                  placeholder="مثال: سبحان الله وبحمده عدد خلقه ورضا نفسه وزنة عرشه..."
                  value={customTextInput}
                  onChange={(e) => setCustomTextInput(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-stone-950 border border-stone-700 text-white text-xs font-quran leading-relaxed focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-stone-300 mb-1">
                  الهدف أو عدد التكرار:
                </label>
                <div className="flex items-center gap-2">
                  {[33, 99, 100, 1000].map((num) => (
                    <button
                      key={num}
                      type="button"
                      onClick={() => setCustomGoalInput(num)}
                      className={`flex-1 py-1.5 text-xs font-mono rounded-lg border transition-colors ${
                        customGoalInput === num
                          ? 'bg-emerald-600 text-white border-emerald-500 font-bold'
                          : 'bg-stone-800 text-stone-300 border-stone-700'
                      }`}
                    >
                      {num}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-stone-300 mb-1">
                  ملاحظة أو فضل الذكر (اختياري):
                </label>
                <input
                  type="text"
                  placeholder="مثال: ورد الصباح، بعد صلاة الفجر..."
                  value={customMeaningInput}
                  onChange={(e) => setCustomMeaningInput(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-stone-950 border border-stone-700 text-white text-xs focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsCustomModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs text-stone-400 hover:text-white"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-md shadow-emerald-700/30"
                >
                  حفظ وتفعيل بالسبحة
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Haptic Feedback Settings Modal */}
      {showHapticModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in">
          <div className="bg-stone-900 border border-stone-800 rounded-3xl w-full max-w-md shadow-2xl overflow-hidden flex flex-col text-right">
            {/* Header */}
            <div className="p-5 bg-gradient-to-b from-stone-800/60 to-stone-900 border-b border-stone-800 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
                  <Vibrate className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">إعدادات الاهتزاز اللمسي</h3>
                  <p className="text-[11px] text-stone-400">Haptic Feedback للهواتف والأجهزة الذكية</p>
                </div>
              </div>
              <button
                onClick={() => setShowHapticModal(false)}
                className="p-1.5 rounded-lg text-stone-400 hover:text-white hover:bg-stone-800 transition-colors"
              >
                ✕
              </button>
            </div>

            <div className="p-5 space-y-4">
              {/* Device Support Status */}
              <div
                className={`p-3 rounded-2xl border text-xs flex items-start gap-2.5 ${
                  isHapticSupported
                    ? 'bg-emerald-950/40 border-emerald-500/30 text-emerald-300'
                    : 'bg-amber-950/40 border-amber-500/30 text-amber-300'
                }`}
              >
                <Smartphone className="w-4 h-4 shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold block mb-0.5">
                    {isHapticSupported
                      ? 'جهازك ومتصفحك يدعمان محرك الاهتزاز الفعلي'
                      : 'تنبيه دعم المتصفح'}
                  </span>
                  <p className="text-[11px] opacity-90 leading-relaxed">
                    {isHapticSupported
                      ? 'سيهتز هاتفك فعلياً مع كل تسبيحة لإعطاء شعور السبحة الحقيقية.'
                      : 'متصفحك الحالي (مثل Safari على بعض الإصدارات) يفرض قيوداً على واجهة الاهتزاز، يتم دعم النقرات التفاعلية بالصوت والحركة.'}
                  </p>
                </div>
              </div>

              {/* Master Vibration Switch */}
              <div className="flex items-center justify-between p-3 rounded-2xl bg-stone-950/60 border border-stone-800">
                <div>
                  <h4 className="text-xs font-bold text-white">تفعيل الاهتزاز عند التسبيح</h4>
                  <p className="text-[11px] text-stone-400">اهتزاز خفيف مع كل ضغطة على زر السبحة</p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    const next = !vibrationEnabled;
                    setVibrationEnabled(next);
                    if (next) {
                      hapticService.testPattern(vibrationIntensity);
                    }
                  }}
                  className={`w-12 h-6 rounded-full transition-colors relative cursor-pointer ${
                    vibrationEnabled ? 'bg-emerald-600' : 'bg-stone-800'
                  }`}
                >
                  <span
                    className={`block w-5 h-5 rounded-full bg-white shadow-md transform transition-transform ${
                      vibrationEnabled ? 'translate-x-1' : 'translate-x-6'
                    }`}
                  />
                </button>
              </div>

              {/* Intensity Picker */}
              <div className="space-y-2">
                <label className="block text-xs font-bold text-stone-300">
                  درجة قوة الاهتزاز:
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {(
                    [
                      { key: 'light', label: 'خفيف', ms: '16ms', desc: 'نقرة ناعمة' },
                      { key: 'medium', label: 'متوسط', ms: '28ms', desc: 'قياسي متوازن' },
                      { key: 'strong', label: 'قوي', ms: '50ms', desc: 'ملموس وواضح' },
                    ] as const
                  ).map((lvl) => (
                    <button
                      key={lvl.key}
                      type="button"
                      onClick={() => {
                        setVibrationIntensity(lvl.key);
                        hapticService.testPattern(lvl.key);
                      }}
                      className={`p-2.5 rounded-xl border text-center transition-all cursor-pointer ${
                        vibrationIntensity === lvl.key
                          ? 'bg-emerald-600/20 border-emerald-500 text-white font-bold shadow-sm ring-1 ring-emerald-500/40'
                          : 'bg-stone-950/60 border-stone-800 text-stone-400 hover:text-white hover:border-stone-700'
                      }`}
                    >
                      <div className="text-xs">{lvl.label}</div>
                      <div className="text-[10px] text-stone-400 mt-0.5 font-mono">{lvl.ms}</div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Test Button */}
              <div className="pt-1">
                <button
                  type="button"
                  onClick={() => hapticService.testPattern(vibrationIntensity)}
                  className="w-full py-2.5 rounded-xl bg-stone-800 hover:bg-stone-700 border border-stone-700 text-stone-200 text-xs font-bold flex items-center justify-center gap-2 cursor-pointer transition-transform active:scale-95 shadow-sm"
                >
                  <Vibrate className="w-4 h-4 text-emerald-400" />
                  <span>تجربة الاهتزاز الآن (اختبار النبضة)</span>
                </button>
              </div>

              {/* Informational checklist */}
              <div className="p-3 rounded-2xl bg-stone-950/40 border border-stone-800 text-[11px] text-stone-400 space-y-1.5">
                <div className="flex items-center gap-2 text-stone-300 font-medium">
                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                  <span>نبضة مريحة مع كل تسبيحة فردية.</span>
                </div>
                <div className="flex items-center gap-2 text-stone-300 font-medium">
                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                  <span>نبضات ثلاثية احتفالية عند إتمام الدورة أو الهدف (33 أو 100).</span>
                </div>
                <div className="flex items-center gap-2 text-stone-300 font-medium">
                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                  <span>نبضة تأكيدية عند تصفير العداد.</span>
                </div>
              </div>

              {/* Close */}
              <div className="flex items-center justify-end pt-2">
                <button
                  type="button"
                  onClick={() => setShowHapticModal(false)}
                  className="w-full py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition-colors cursor-pointer"
                >
                  حفظ والإغلاق
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
