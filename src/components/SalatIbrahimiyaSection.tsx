import React, { useState } from 'react';
import { Sparkles, RotateCcw, Copy, Check, Heart, BookOpen, Award } from 'lucide-react';
import { SALAT_IBRAHIMIYYA } from '../data/duasAndIbrahimiya';
import { soundService } from '../utils/soundService';

export const SalatIbrahimiyaSection: React.FC = () => {
  const [counter, setCounter] = useState<number>(0);
  const [goal, setGoal] = useState<number>(10);
  const [copied, setCopied] = useState(false);
  const [activeTab, setActiveTab] = useState<'text' | 'explanation' | 'virtues'>('text');

  const handleIncrement = () => {
    soundService.playTasbeehClick();
    const nextVal = counter + 1;
    setCounter(nextVal);
    if (nextVal === goal) {
      soundService.playGoalCelebration();
    }
  };

  const handleReset = () => {
    setCounter(0);
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(SALAT_IBRAHIMIYYA.arabicText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const progress = Math.min(100, Math.round((counter / goal) * 100));

  return (
    <div className="space-y-6">
      {/* Hero Card */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-emerald-950 via-stone-900 to-amber-950/40 border border-emerald-500/30 p-6 sm:p-8">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-amber-400 text-xs font-semibold">
              <Sparkles className="w-4 h-4" />
              <span>الصيغة الفضلى والمباركة في الصلاة على النبي ﷺ</span>
            </div>
            <h2 className="text-2xl sm:text-4xl font-bold text-white font-quran">
              الصلاة الإبراهيمية المباركة
            </h2>
            <p className="text-xs sm:text-sm text-stone-300 max-w-2xl leading-relaxed">
              عن كعب بن عجرة رضي الله عنه قال: قيل: يا رسول الله، أما السلام عليك فقد عرفناه، فكيف نصلي عليك؟ قال: قولوا: اللهم صل على محمد وعلى آل محمد... (متفق عليه).
            </p>
          </div>

          <div className="flex items-center gap-2 self-start md:self-auto">
            <button
              onClick={handleCopy}
              className="px-3.5 py-2 rounded-xl bg-stone-800 hover:bg-stone-700 text-stone-200 text-xs font-medium border border-stone-700 transition-colors flex items-center gap-1.5"
            >
              {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
              <span>{copied ? 'تم النسخ' : 'نسخ النص'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Interactive Prayer Display & Counter */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Text & Meaning Card */}
        <div className="lg:col-span-7 space-y-4">
          {/* Sub-tabs */}
          <div className="flex items-center gap-1 p-1 bg-stone-900/80 rounded-xl border border-stone-800">
            <button
              onClick={() => setActiveTab('text')}
              className={`flex-1 py-2 text-xs font-semibold rounded-lg transition-colors ${
                activeTab === 'text'
                  ? 'bg-emerald-950 text-emerald-300 border border-emerald-500/40 shadow-xs'
                  : 'text-stone-400 hover:text-white'
              }`}
            >
              النص المشكول
            </button>
            <button
              onClick={() => setActiveTab('explanation')}
              className={`flex-1 py-2 text-xs font-semibold rounded-lg transition-colors ${
                activeTab === 'explanation'
                  ? 'bg-emerald-950 text-emerald-300 border border-emerald-500/40 shadow-xs'
                  : 'text-stone-400 hover:text-white'
              }`}
            >
              شرح المعاني والألفاظ
            </button>
            <button
              onClick={() => setActiveTab('virtues')}
              className={`flex-1 py-2 text-xs font-semibold rounded-lg transition-colors ${
                activeTab === 'virtues'
                  ? 'bg-emerald-950 text-emerald-300 border border-emerald-500/40 shadow-xs'
                  : 'text-stone-400 hover:text-white'
              }`}
            >
              فضائلها وثمراتها
            </button>
          </div>

          {activeTab === 'text' && (
            <div className="p-6 sm:p-8 rounded-3xl bg-stone-900/70 border border-emerald-500/30 shadow-xl space-y-6 text-right">
              {/* Primary authentic text */}
              <div className="space-y-3">
                <span className="text-xs font-semibold text-emerald-400">الصيغة الأولى المعتمدة في التشهد:</span>
                <p className="text-xl sm:text-2xl font-bold font-quran text-stone-100 leading-[2.4] tracking-wide select-all">
                  «{SALAT_IBRAHIMIYYA.arabicText}»
                </p>
                <div className="text-xs text-stone-400 pt-2 border-t border-stone-800">
                  {SALAT_IBRAHIMIYYA.reference}
                </div>
              </div>

              {/* Alternative narration */}
              <div className="space-y-2 pt-4 border-t border-stone-800">
                <span className="text-xs font-semibold text-amber-400">صيغة أخرى صحيحة مأثورة:</span>
                <p className="text-base sm:text-lg font-quran text-stone-300 leading-loose">
                  «{SALAT_IBRAHIMIYYA.alternativeText}»
                </p>
                <div className="text-[11px] text-stone-500">رواه البخاري ومسلم في صحيحيهما</div>
              </div>
            </div>
          )}

          {activeTab === 'explanation' && (
            <div className="p-6 rounded-3xl bg-stone-900/70 border border-stone-800 space-y-4 text-right">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <BookOpen className="w-4 h-4 text-emerald-400" />
                <span>شرح ألفاظ الصلاة الإبراهيمية</span>
              </h3>
              <div className="space-y-3">
                {SALAT_IBRAHIMIYYA.explanations.map((exp, idx) => (
                  <div key={idx} className="p-3.5 rounded-xl bg-stone-950/60 border border-stone-800">
                    <span className="font-bold text-sm text-emerald-400 font-quran">{exp.term}</span>
                    <p className="text-xs text-stone-300 mt-1 leading-relaxed">{exp.meaning}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'virtues' && (
            <div className="p-6 rounded-3xl bg-stone-900/70 border border-stone-800 space-y-4 text-right">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Award className="w-4 h-4 text-amber-400" />
                <span>فضائل الصلاة على النبي ﷺ</span>
              </h3>
              <div className="space-y-3">
                {SALAT_IBRAHIMIYYA.virtues.map((v, idx) => (
                  <div key={idx} className="p-3.5 rounded-xl bg-stone-950/60 border border-stone-800 flex items-start gap-2.5">
                    <span className="text-amber-400 font-bold">•</span>
                    <p className="text-xs sm:text-sm text-stone-200 leading-relaxed font-sans">{v}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Right: Dedicated Counter Card */}
        <div className="lg:col-span-5 flex flex-col justify-between p-6 sm:p-8 rounded-3xl bg-gradient-to-b from-stone-900 via-stone-900 to-emerald-950/60 border border-emerald-500/40 shadow-xl">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Heart className="w-4 h-4 text-rose-400" />
                <span>عدّاد الصلاة على النبي ﷺ</span>
              </h3>

              {/* Goal selectors */}
              <div className="flex items-center gap-1 bg-stone-950/80 p-1 rounded-lg border border-stone-800 text-xs">
                {[10, 33, 100, 1000].map((g) => (
                  <button
                    key={g}
                    onClick={() => setGoal(g)}
                    className={`px-2 py-0.5 rounded-md transition-colors ${
                      goal === g ? 'bg-emerald-600 text-white font-bold' : 'text-stone-400 hover:text-white'
                    }`}
                  >
                    {g}
                  </button>
                ))}
              </div>
            </div>

            {/* Big Tappable Counter Button */}
            <div className="flex flex-col items-center justify-center my-6">
              <button
                onClick={handleIncrement}
                className="w-48 h-48 sm:w-56 sm:h-56 rounded-full bg-gradient-to-br from-emerald-600 via-emerald-700 to-teal-800 text-white flex flex-col items-center justify-center shadow-2xl shadow-emerald-700/40 hover:scale-[1.02] active:scale-95 transition-all cursor-pointer border-4 border-emerald-400/40"
              >
                <span className="text-4xl sm:text-6xl font-extrabold tabular-nums tracking-tight">
                  {counter}
                </span>
                <span className="text-xs sm:text-sm font-medium text-emerald-100 mt-2">
                  اضغط للتسبيح
                </span>
              </button>
            </div>

            {/* Progress */}
            <div className="space-y-1 text-center">
              <div className="flex items-center justify-between text-xs text-stone-400">
                <span>الهدف اليومي: {goal} مرة</span>
                <span className="text-emerald-400 font-bold tabular-nums">{progress}%</span>
              </div>
              <div className="w-full h-2 rounded-full bg-stone-950 overflow-hidden">
                <div
                  className="h-full bg-gradient-to-l from-emerald-400 to-amber-400 transition-all duration-300"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>
          </div>

          {/* Reset button */}
          <div className="mt-6 pt-4 border-t border-stone-800 flex items-center justify-between">
            <span className="text-xs text-stone-400">
              «أولى الناس بي يوم القيامة أكثرهم عليّ صلاة»
            </span>
            <button
              onClick={handleReset}
              className="p-2 rounded-xl bg-stone-800 hover:bg-stone-700 text-stone-400 hover:text-rose-400 transition-colors"
              title="تصفير العداد"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
