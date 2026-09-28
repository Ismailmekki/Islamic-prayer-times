import React, { useState } from 'react';
import {
  Award,
  BookOpen,
  Calendar,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Clock,
  Flame,
  Minus,
  PartyPopper,
  Plus,
  RotateCcw,
  Share2,
  Sparkles,
  Target,
  TrendingUp,
} from 'lucide-react';
import { Khatmah, KhatmahPart } from '../types/khatmah';
import { JUZ_STARTING_PAGES } from '../data/mushafPagesData';

interface KhatmahProgressTrackerProps {
  khatmah: Khatmah;
  onUpdateCompletedCount: (count: number) => void;
  onTogglePart: (part: KhatmahPart) => void;
  onOpenPartCard: (part: KhatmahPart) => void;
  onOpenFullKhatmahCard: () => void;
}

export const KhatmahProgressTracker: React.FC<KhatmahProgressTrackerProps> = ({
  khatmah,
  onUpdateCompletedCount,
  onTogglePart,
  onOpenPartCard,
  onOpenFullKhatmahCard,
}) => {
  // Goal plan: 30 days (1 juz/day), 15 days (2 juz/day), 10 days (3 juz/day), 7 days (~4.3 juz/day)
  const [goalDays, setGoalDays] = useState<number>(30);
  const [shareToast, setShareToast] = useState<string | null>(null);

  const completedCount = khatmah.parts.filter((p) => p.isCompleted).length;
  const progressPercent = Math.round((completedCount / 30) * 100);
  const remainingCount = 30 - completedCount;

  // Approximate pages calculation: Each Juz is ~20 pages, total 604 pages
  const approxPagesRead =
    completedCount === 30
      ? 604
      : completedCount > 0
      ? JUZ_STARTING_PAGES[Math.min(completedCount, 29)].startPage - 1
      : 0;

  // Next upcoming Juz to read
  const nextJuzToRead = khatmah.parts.find((p) => !p.isCompleted) || khatmah.parts[29];

  // Estimated days remaining based on selected goal
  const dailyRate = 30 / goalDays; // Juz per day
  const daysNeededToFinish = remainingCount > 0 ? Math.ceil(remainingCount / dailyRate) : 0;
  const estimatedFinishDate = new Date();
  estimatedFinishDate.setDate(estimatedFinishDate.getDate() + daysNeededToFinish);

  // Motivational message
  const getMotivationalMessage = () => {
    if (completedCount === 30) {
      return {
        text: '🎉 مبارك هنيئاً لك! تم ختم القرآن الكريم كاملاً بحمد الله وفضله.',
        sub: 'تقبل الله منك وجعل القرآن ربيع قلبك ونور صدرك وشفيعاً لك يوم القيامة.',
        color: 'text-amber-300',
      };
    }
    if (completedCount >= 22) {
      return {
        text: `✨ ما شاء الله! ثلاثة أرباع القرآن اكتملت، باقي ${remainingCount} أجزاء فقط على الختام.`,
        sub: 'أنت في الربع الأخير المبارك، استمر واقترب من لحظة ختم كتاب الله العظيم!',
        color: 'text-emerald-300',
      };
    }
    if (completedCount >= 15) {
      return {
        text: `🌿 هنيئاً لك! نصف القرآن الكريم اكتمل بحمد الله (${completedCount} جزءاً).`,
        sub: 'قطعت نصف الطريق العظيم، نسأل الله لك التوفيق والبركة في النصف الثاني.',
        color: 'text-emerald-300',
      };
    }
    if (completedCount >= 7) {
      return {
        text: `📖 بارك الله فيك! ربع القرآن اكتمل (${completedCount} أجزاء منجزة).`,
        sub: 'بداية مباركة وهمة عالية في تدبر وتلاوة آيات الذكر الحكيم.',
        color: 'text-emerald-300',
      };
    }
    if (completedCount > 0) {
      return {
        text: `🌸 استمر في وردك القرآني! تم إنجاز ${completedCount} جزءاً من القرآن.`,
        sub: '﴿إِنَّ الَّذِينَ يَتْلُونَ كِتَابَ اللَّهِ وَأَقَامُوا الصَّلَاةَ يَرْجُونَ تِجَارَةً لَّن تَبُورَ﴾',
        color: 'text-stone-300',
      };
    }
    return {
      text: '🌱 ابدأ رحلتك المباركة مع ختمة القرآن الكريم اليوم.',
      sub: 'حدد الأجزاء التي أنجزتها، وتابع تقدمك خطوة بخطوة حتى تصل لختام كتاب الله.',
      color: 'text-stone-300',
    };
  };

  const motivation = getMotivationalMessage();

  // Share progress text
  const handleShareProgress = () => {
    const text = `🕌 *متابعة ختمة القرآن الكريم*:\nوصلت بحمد الله إلى إنجاز *${completedCount} من 30 جزءاً* (${progressPercent}% من القرآن الكريم) ضمن (${khatmah.title}).\nنسأل الله القبول والبركة والتوفيق للجميع! 🌸\n\n_تم عبر تطبيق صلاتي_`;

    if (navigator.share) {
      navigator
        .share({
          title: `تقدم ختمة القرآن الكريم (${progressPercent}%)`,
          text: text,
        })
        .catch(() => {});
    } else {
      navigator.clipboard.writeText(text);
      setShareToast('تم نسخ تقرير تقدم الختمة للمشاركة!');
      setTimeout(() => setShareToast(null), 2500);
    }
  };

  return (
    <div className="space-y-5 text-right">
      {/* Toast */}
      {shareToast && (
        <div className="fixed top-20 left-1/2 -translate-x-1/2 z-50 bg-emerald-600 text-white px-5 py-2 rounded-full text-xs font-bold shadow-xl border border-emerald-400 animate-bounce">
          {shareToast}
        </div>
      )}

      {/* Main Tracker Hero Card */}
      <div className="rounded-3xl bg-gradient-to-br from-stone-900 via-emerald-950/80 to-stone-900 border border-emerald-500/40 p-5 sm:p-7 shadow-2xl space-y-6">
        {/* Top Header of Tracker */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-emerald-900/40 pb-5">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2 text-xs font-bold text-emerald-400">
              <TrendingUp className="w-4 h-4 text-emerald-400" />
              <span>واجهة تتبع ومتابعة تقدم ختمة القرآن الكريم</span>
              <span className="bg-emerald-950 text-emerald-300 px-2 py-0.5 rounded-full text-[10px] border border-emerald-500/40 font-mono">
                30 جزءاً
              </span>
            </div>
            <h3 className="text-xl sm:text-2xl font-bold text-white font-quran">
              لوحة إنجاز: {khatmah.title}
            </h3>
            <p className="text-xs text-stone-300">{motivation.sub}</p>
          </div>

          {/* Quick Action Buttons */}
          <div className="flex items-center gap-2 self-start md:self-auto flex-wrap">
            <button
              onClick={handleShareProgress}
              className="px-3.5 py-2 rounded-2xl bg-stone-950/90 hover:bg-stone-800 text-emerald-300 border border-emerald-500/40 text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shadow-sm active:scale-95"
              title="مشاركة تقرير نسبة الإنجاز عبر وسائل التواصل"
            >
              <Share2 className="w-3.5 h-3.5" />
              <span>مشاركة التقدم</span>
            </button>

            {completedCount === 30 && (
              <button
                onClick={onOpenFullKhatmahCard}
                className="px-3.5 py-2 rounded-2xl bg-amber-500 hover:bg-amber-400 text-stone-950 text-xs font-black transition-all flex items-center gap-1.5 cursor-pointer shadow-lg animate-bounce"
              >
                <PartyPopper className="w-4 h-4" />
                <span>شهادة الختم</span>
              </button>
            )}
          </div>
        </div>

        {/* Motivational Banner */}
        <div className="p-3.5 rounded-2xl bg-stone-950/70 border border-emerald-500/30 flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400 shrink-0">
            <Sparkles className="w-5 h-5 text-amber-400" />
          </div>
          <div className="space-y-0.5">
            <div className={`text-xs font-bold ${motivation.color}`}>{motivation.text}</div>
            {remainingCount > 0 ? (
              <div className="text-[11px] text-stone-400">
                المحطة القادمة للورد:{' '}
                <strong className="text-emerald-400 font-bold font-quran">
                  {nextJuzToRead.name}
                </strong>{' '}
                (صفحة {nextJuzToRead.startPage})
              </div>
            ) : null}
          </div>
        </div>

        {/* Big Metric Display & Circular Gauge Row */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {/* Metric 1: Percentage */}
          <div className="p-4 rounded-2xl bg-stone-950/80 border border-stone-800/80 text-center space-y-1">
            <div className="text-[11px] text-stone-400 font-semibold">نسبة الإنجاز</div>
            <div className="text-2xl sm:text-3xl font-black text-amber-400 font-mono tracking-tight">
              {progressPercent}%
            </div>
            <div className="text-[10px] text-stone-500 font-medium">من القرآن الكريم</div>
          </div>

          {/* Metric 2: Completed Parts */}
          <div className="p-4 rounded-2xl bg-stone-950/80 border border-stone-800/80 text-center space-y-1">
            <div className="text-[11px] text-stone-400 font-semibold">الأجزاء المنجزة</div>
            <div className="text-2xl sm:text-3xl font-black text-emerald-400 font-mono tracking-tight">
              {completedCount} <span className="text-xs text-stone-400 font-sans">/ 30</span>
            </div>
            <div className="text-[10px] text-stone-500 font-medium">جزءاً مكتملاً</div>
          </div>

          {/* Metric 3: Remaining Parts */}
          <div className="p-4 rounded-2xl bg-stone-950/80 border border-stone-800/80 text-center space-y-1">
            <div className="text-[11px] text-stone-400 font-semibold">المتبقي للختام</div>
            <div className="text-2xl sm:text-3xl font-black text-stone-200 font-mono tracking-tight">
              {remainingCount}
            </div>
            <div className="text-[10px] text-stone-500 font-medium">جزءاً متبقياً</div>
          </div>

          {/* Metric 4: Approx Pages */}
          <div className="p-4 rounded-2xl bg-stone-950/80 border border-stone-800/80 text-center space-y-1">
            <div className="text-[11px] text-stone-400 font-semibold">الصفحات التقديرية</div>
            <div className="text-2xl sm:text-3xl font-black text-teal-400 font-mono tracking-tight">
              {approxPagesRead} <span className="text-xs text-stone-400 font-sans">/ 604</span>
            </div>
            <div className="text-[10px] text-stone-500 font-medium">صفحة برسم المصحف</div>
          </div>
        </div>

        {/* Primary Interactive Stepper & Slider for Setting Completed Parts */}
        <div className="p-4 sm:p-5 rounded-3xl bg-stone-950/90 border border-stone-800 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="space-y-0.5">
              <label className="text-xs sm:text-sm font-bold text-white flex items-center gap-1.5">
                <Target className="w-4 h-4 text-emerald-400" />
                <span>تحديد عدد الأجزاء المنجزة مباشرة:</span>
              </label>
              <p className="text-[11px] text-stone-400">
                حرك المؤشر أو استخدم الأزرار لتحديد كم جزءاً أتممت قراءته حتى الآن
              </p>
            </div>

            {/* Stepper Buttons (-1, Input, +1) */}
            <div className="flex items-center gap-2 self-start sm:self-auto">
              <button
                onClick={() => onUpdateCompletedCount(Math.max(0, completedCount - 1))}
                disabled={completedCount <= 0}
                className="w-8 h-8 rounded-xl bg-stone-900 hover:bg-stone-800 disabled:opacity-30 text-stone-200 border border-stone-800 flex items-center justify-center font-bold cursor-pointer transition-colors"
                title="إنقاص جزء واحد"
              >
                <Minus className="w-4 h-4" />
              </button>

              <div className="flex items-center gap-1 bg-stone-900 border border-emerald-500/40 rounded-xl px-3 py-1">
                <input
                  type="number"
                  min="0"
                  max="30"
                  value={completedCount}
                  onChange={(e) => {
                    const val = parseInt(e.target.value, 10);
                    if (!isNaN(val)) {
                      onUpdateCompletedCount(Math.max(0, Math.min(30, val)));
                    }
                  }}
                  className="w-12 bg-transparent text-center font-mono font-black text-lg text-amber-400 outline-none"
                />
                <span className="text-xs text-stone-400 font-bold">جزء</span>
              </div>

              <button
                onClick={() => onUpdateCompletedCount(Math.min(30, completedCount + 1))}
                disabled={completedCount >= 30}
                className="w-8 h-8 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-30 text-white flex items-center justify-center font-bold cursor-pointer transition-colors shadow-xs"
                title="إضافة جزء واحد مكتمل (+1)"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Range Slider for instant continuous scrubbing */}
          <div className="space-y-1.5 pt-1">
            <input
              type="range"
              min="0"
              max="30"
              step="1"
              value={completedCount}
              onChange={(e) => onUpdateCompletedCount(parseInt(e.target.value, 10))}
              className="w-full h-3 rounded-lg bg-stone-800 accent-emerald-500 cursor-pointer"
            />
            <div className="flex items-center justify-between text-[10px] text-stone-500 font-mono">
              <span>0 (البداية)</span>
              <span>7 (الربع)</span>
              <span>15 (النصف)</span>
              <span>22 (3/4)</span>
              <span>30 (الختام)</span>
            </div>
          </div>

          {/* Quick-Jump Milestone Buttons */}
          <div className="flex flex-wrap items-center gap-1.5 pt-2 border-t border-stone-800/80 text-xs">
            <span className="text-[11px] text-stone-400 ml-1 font-semibold">تحديد سريع:</span>

            <button
              onClick={() => onUpdateCompletedCount(7)}
              className={`px-2.5 py-1 rounded-xl font-bold transition-all cursor-pointer ${
                completedCount === 7
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'bg-stone-900 hover:bg-stone-800 text-stone-300 border border-stone-800'
              }`}
            >
              ربع القرآن (7 أجزاء)
            </button>

            <button
              onClick={() => onUpdateCompletedCount(15)}
              className={`px-2.5 py-1 rounded-xl font-bold transition-all cursor-pointer ${
                completedCount === 15
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'bg-stone-900 hover:bg-stone-800 text-stone-300 border border-stone-800'
              }`}
            >
              نصف القرآن (15 جزءاً)
            </button>

            <button
              onClick={() => onUpdateCompletedCount(22)}
              className={`px-2.5 py-1 rounded-xl font-bold transition-all cursor-pointer ${
                completedCount === 22
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'bg-stone-900 hover:bg-stone-800 text-stone-300 border border-stone-800'
              }`}
            >
              ثلاثة أرباع (22 جزءاً)
            </button>

            <button
              onClick={() => onUpdateCompletedCount(30)}
              className={`px-2.5 py-1 rounded-xl font-bold transition-all cursor-pointer ${
                completedCount === 30
                  ? 'bg-amber-500 text-stone-950 font-black shadow-xs'
                  : 'bg-stone-900 hover:bg-stone-800 text-amber-300 border border-amber-600/30'
              }`}
            >
              تم الختام بالكامل (30) 🎉
            </button>

            <button
              onClick={() => onUpdateCompletedCount(0)}
              className="px-2.5 py-1 rounded-xl bg-stone-900 hover:bg-stone-800 text-stone-400 hover:text-white border border-stone-800 font-bold transition-all cursor-pointer"
              title="تصفير الأجزاء والبدء من جديد"
            >
              <RotateCcw className="w-3 h-3 inline ml-1" />
              تصفير
            </button>
          </div>
        </div>

        {/* 30-Juz Visual Matrix / Interactive Pills */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="font-bold text-stone-300">
              خريطة الأجزاء الثلاثين (انقر على أي جزء لتحديث حالته):
            </span>
            <span className="text-[11px] text-stone-400">
              الأخضر = مكتمل · الرمادي = قيد القراءة
            </span>
          </div>

          <div className="grid grid-cols-5 sm:grid-cols-10 md:grid-cols-15 gap-1.5">
            {khatmah.parts.map((part) => {
              const isDone = part.isCompleted;

              return (
                <button
                  key={part.partNumber}
                  onClick={() => onTogglePart(part)}
                  className={`h-10 rounded-xl font-mono text-xs font-black transition-all flex flex-col items-center justify-center cursor-pointer border ${
                    isDone
                      ? 'bg-emerald-600 text-white border-emerald-400 shadow-xs scale-102 ring-1 ring-emerald-400/40'
                      : 'bg-stone-950 hover:bg-stone-800 text-stone-400 hover:text-white border-stone-800'
                  }`}
                  title={`${part.name} (صفحة ${part.startPage}) - انقر لتغيير الحالة`}
                >
                  <span>{part.partNumber}</span>
                  {isDone ? (
                    <CheckCircle2 className="w-2.5 h-2.5 fill-white text-emerald-600" />
                  ) : (
                    <span className="w-1.5 h-1.5 rounded-full bg-stone-700"></span>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Goal Planning & Target Date Estimator */}
        <div className="p-4 rounded-3xl bg-stone-950/70 border border-stone-800 flex flex-col md:flex-row md:items-center justify-between gap-4 text-xs">
          <div className="space-y-1">
            <div className="flex items-center gap-1.5 font-bold text-stone-200">
              <Calendar className="w-4 h-4 text-amber-400" />
              <span>الخطة الزمنية المقترحة للختم:</span>
            </div>
            <p className="text-[11px] text-stone-400">
              {remainingCount > 0 ? (
                <>
                  بمعدل <strong>{(30 / goalDays).toFixed(1)} جزء يومياً</strong>، يتبقى لك نحو{' '}
                  <strong className="text-emerald-400">{daysNeededToFinish} يوماً</strong> لإتمام
                  الختمة (تاريخ الختم المتوقع:{' '}
                  {estimatedFinishDate.toLocaleDateString('ar-SA', {
                    month: 'long',
                    day: 'numeric',
                  })}
                  ).
                </>
              ) : (
                'تم تحقيق الختمة بنجاح! يمكنك الآن البدء في ختمة جديدة وطلب الأجر والثواب.'
              )}
            </p>
          </div>

          {/* Goal Selector Tabs */}
          <div className="inline-flex items-center p-1 rounded-2xl bg-stone-900 border border-stone-800 gap-1 shrink-0 self-start md:self-auto">
            {[
              { days: 30, label: '30 يوماً (جزء/يوم)' },
              { days: 15, label: '15 يوماً (جزئين)' },
              { days: 10, label: '10 أيام (3 أجزاء)' },
              { days: 7, label: 'أسبوع' },
            ].map((plan) => (
              <button
                key={plan.days}
                onClick={() => setGoalDays(plan.days)}
                className={`px-2.5 py-1 rounded-xl text-[11px] font-bold transition-all cursor-pointer ${
                  goalDays === plan.days
                    ? 'bg-emerald-600 text-white shadow-xs'
                    : 'text-stone-400 hover:text-white'
                }`}
              >
                {plan.label}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
