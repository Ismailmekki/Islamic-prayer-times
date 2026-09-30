import React, { useState } from 'react';
import { Volume2, Play, Pause, Sparkles, Radio, Check, Moon, MapPin, Award, Sun, CloudSun } from 'lucide-react';
import { ADHAN_VOICES, DUA_AFTER_ADHAN } from '../data/adhanSounds';
import { AdhanVoice } from '../types/prayer';
import { soundService } from '../utils/soundService';

interface AdhanSectionProps {
  currentVoice: AdhanVoice;
  onSelectVoice: (voice: AdhanVoice) => void;
  onTriggerModal: (voice?: AdhanVoice, prayerName?: string) => void;
}

export const AdhanSection: React.FC<AdhanSectionProps> = ({
  currentVoice,
  onSelectVoice,
  onTriggerModal,
}) => {
  const [selectedCategory, setSelectedCategory] = useState<'all' | 'day' | 'haramein' | 'reciters' | 'fajr'>('all');
  const [isDuaPlaying, setIsDuaPlaying] = useState(false);

  const handleToggleDuaAudio = () => {
    if (isDuaPlaying) {
      soundService.stopDuaAfterAdhan();
      setIsDuaPlaying(false);
    } else {
      setIsDuaPlaying(true);
      soundService.playDuaAfterAdhan(() => {
        setIsDuaPlaying(false);
      });
    }
  };

  const dhuhrVoice = ADHAN_VOICES.find((v) => v.id === 'dhuhr_adhan') || ADHAN_VOICES[0];
  const asrVoice = ADHAN_VOICES.find((v) => v.id === 'asr_adhan') || ADHAN_VOICES[1];

  const filteredVoices = ADHAN_VOICES.filter((voice) => {
    if (selectedCategory === 'day') return voice.id === 'dhuhr_adhan' || voice.id === 'asr_adhan';
    if (selectedCategory === 'haramein') return voice.id === 'makkah_mulla' || voice.id === 'madinah_bukhari' || voice.id === 'alaqsa';
    if (selectedCategory === 'reciters') return voice.id === 'alafasy' || voice.id === 'abdulbasit' || voice.id === 'nafees';
    if (selectedCategory === 'fajr') return voice.isFajrSpecific;
    return true;
  });

  return (
    <div className="space-y-6 text-right">
      {/* Header Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-emerald-950 via-stone-900 to-stone-900 border border-emerald-500/30 p-6 sm:p-8 shadow-xl">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-emerald-400 text-xs font-semibold">
              <Radio className="w-4 h-4 animate-pulse" />
              <span>مكتبة الأذان الشاملة عالية الدقة (HQ 128kbps)</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-bold text-white font-quran">
              أصوات الأذان من الحرمين الشريفين والعالم الإسلامي
            </h2>
            <p className="text-xs sm:text-sm text-stone-300 max-w-2xl leading-relaxed">
              استمع لأجمل أصوات الأذان بصوت مشايخ الحرم المكي الشريف، والمسجد النبوي، والمسجد الأقصى، مع تسجيلات مخصصة ونقية لأذان الظهر والعصر والفجر بدون تشويش.
            </p>
          </div>

          <button
            onClick={() => onTriggerModal(currentVoice, 'الصلاة')}
            className="px-6 py-3.5 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-sm shadow-xl shadow-emerald-900/50 flex items-center justify-center gap-2.5 transition-transform active:scale-95 shrink-0 cursor-pointer"
          >
            <Volume2 className="w-5 h-5 text-amber-300" />
            <span>رفع الأذان الآن</span>
          </button>
        </div>
      </div>

      {/* Featured Highlight: Dhuhr & Asr Dedicated Adhan Cards */}
      <div className="space-y-3">
        <div className="flex items-center justify-between px-1">
          <h3 className="text-base font-bold text-white flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-amber-400" />
            <span>أذان صلاتي الظهر والعصر (تسجيلات مخصصة ونقية)</span>
          </h3>
          <span className="text-[11px] text-emerald-400 bg-emerald-950/80 px-2.5 py-0.5 rounded-full border border-emerald-500/30">
            صوت ندي خاشع
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Dhuhr Card */}
          <div className="p-5 rounded-3xl bg-gradient-to-br from-amber-950/40 via-stone-900 to-stone-900 border-2 border-amber-500/40 shadow-xl flex flex-col justify-between gap-4">
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-amber-500/20 border border-amber-400/40 flex items-center justify-center text-amber-400 shadow-sm shrink-0">
                  <Sun className="w-6 h-6 animate-spin" style={{ animationDuration: '16s' }} />
                </div>
                <div>
                  <h4 className="text-base font-black text-white font-quran">
                    أذان صلاة الظهر المبارك
                  </h4>
                  <p className="text-xs text-stone-300 mt-0.5">
                    الأذان الشرعي الكامل لصلاة الظهر بدون تثويب، بصوت شجي ندي
                  </p>
                </div>
              </div>
              <span className="text-[10px] bg-stone-950 text-amber-300 px-2 py-1 rounded-lg border border-amber-500/30 font-mono">
                {dhuhrVoice.durationText}
              </span>
            </div>

            <div className="flex items-center gap-2 pt-2 border-t border-stone-800">
              <button
                onClick={() => {
                  onSelectVoice(dhuhrVoice);
                  onTriggerModal(dhuhrVoice, 'صلاة الظهر');
                }}
                className="flex-1 py-2.5 px-4 rounded-xl bg-amber-500 hover:bg-amber-400 text-stone-950 font-black text-xs flex items-center justify-center gap-2 shadow-md cursor-pointer transition-transform active:scale-95"
              >
                <Play className="w-4 h-4 fill-stone-950" />
                <span>رفع أذان الظهر الآن</span>
              </button>

              <button
                onClick={() => onSelectVoice(dhuhrVoice)}
                className={`py-2.5 px-3.5 rounded-xl text-xs font-bold border transition-colors cursor-pointer ${
                  currentVoice.id === dhuhrVoice.id
                    ? 'bg-emerald-900/60 text-emerald-300 border-emerald-500/40 font-bold'
                    : 'bg-stone-800 hover:bg-stone-700 text-stone-300 border-stone-700'
                }`}
              >
                {currentVoice.id === dhuhrVoice.id ? '✓ المعتمد' : 'تعيين'}
              </button>
            </div>
          </div>

          {/* Asr Card */}
          <div className="p-5 rounded-3xl bg-gradient-to-br from-emerald-950/40 via-stone-900 to-stone-900 border-2 border-emerald-500/40 shadow-xl flex flex-col justify-between gap-4">
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 border border-emerald-400/40 flex items-center justify-center text-emerald-400 shadow-sm shrink-0">
                  <CloudSun className="w-6 h-6" />
                </div>
                <div>
                  <h4 className="text-base font-black text-white font-quran">
                    أذان صلاة العصر المبارك
                  </h4>
                  <p className="text-xs text-stone-300 mt-0.5">
                    الأذان الشرعي الكامل لصلاة العصر، حافظوا على الصلوات والصلاة الوسطى
                  </p>
                </div>
              </div>
              <span className="text-[10px] bg-stone-950 text-emerald-300 px-2 py-1 rounded-lg border border-emerald-500/30 font-mono">
                {asrVoice.durationText}
              </span>
            </div>

            <div className="flex items-center gap-2 pt-2 border-t border-stone-800">
              <button
                onClick={() => {
                  onSelectVoice(asrVoice);
                  onTriggerModal(asrVoice, 'صلاة العصر');
                }}
                className="flex-1 py-2.5 px-4 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-black text-xs flex items-center justify-center gap-2 shadow-md cursor-pointer transition-transform active:scale-95"
              >
                <Play className="w-4 h-4 fill-white" />
                <span>رفع أذان العصر الآن</span>
              </button>

              <button
                onClick={() => onSelectVoice(asrVoice)}
                className={`py-2.5 px-3.5 rounded-xl text-xs font-bold border transition-colors cursor-pointer ${
                  currentVoice.id === asrVoice.id
                    ? 'bg-emerald-900/60 text-emerald-300 border-emerald-500/40 font-bold'
                    : 'bg-stone-800 hover:bg-stone-700 text-stone-300 border-stone-700'
                }`}
              >
                {currentVoice.id === asrVoice.id ? '✓ المعتمد' : 'تعيين'}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Reciters List with Category Filter */}
      <div className="space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-1">
          <h3 className="text-base font-bold text-white flex items-center gap-2">
            <Moon className="w-4 h-4 text-emerald-400" />
            <span>جميع أصوات الأذان المعتمدة (جودة عالية)</span>
          </h3>

          {/* Filter Pills */}
          <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-1 sm:pb-0">
            <button
              onClick={() => setSelectedCategory('all')}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold cursor-pointer whitespace-nowrap transition-colors ${
                selectedCategory === 'all'
                  ? 'bg-emerald-600 text-white font-bold'
                  : 'bg-stone-900 text-stone-400 hover:text-stone-200'
              }`}
            >
              الكل ({ADHAN_VOICES.length})
            </button>
            <button
              onClick={() => setSelectedCategory('day')}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold cursor-pointer whitespace-nowrap transition-colors ${
                selectedCategory === 'day'
                  ? 'bg-amber-600 text-white font-bold'
                  : 'bg-stone-900 text-stone-400 hover:text-stone-200'
              }`}
            >
              الظهر والعصر
            </button>
            <button
              onClick={() => setSelectedCategory('haramein')}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold cursor-pointer whitespace-nowrap transition-colors ${
                selectedCategory === 'haramein'
                  ? 'bg-emerald-600 text-white font-bold'
                  : 'bg-stone-900 text-stone-400 hover:text-stone-200'
              }`}
            >
              الحرمين الشريفين
            </button>
            <button
              onClick={() => setSelectedCategory('reciters')}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold cursor-pointer whitespace-nowrap transition-colors ${
                selectedCategory === 'reciters'
                  ? 'bg-emerald-600 text-white font-bold'
                  : 'bg-stone-900 text-stone-400 hover:text-stone-200'
              }`}
            >
              كبار المقرئين
            </button>
            <button
              onClick={() => setSelectedCategory('fajr')}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold cursor-pointer whitespace-nowrap transition-colors ${
                selectedCategory === 'fajr'
                  ? 'bg-indigo-600 text-white font-bold'
                  : 'bg-stone-900 text-stone-400 hover:text-stone-200'
              }`}
            >
              أذان الفجر
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {filteredVoices.map((voice) => {
            const isSelected = currentVoice.id === voice.id;
            return (
              <div
                key={voice.id}
                className={`p-4 rounded-2xl border transition-all flex items-center justify-between gap-4 ${
                  isSelected
                    ? 'bg-gradient-to-l from-emerald-950/60 to-stone-900 border-emerald-500/60 shadow-md shadow-emerald-950/30'
                    : 'bg-stone-900/60 border-stone-800 hover:border-stone-700'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 border ${
                      isSelected
                        ? 'bg-emerald-600 text-white border-emerald-400 shadow-md'
                        : 'bg-stone-800 text-emerald-400 border-stone-700'
                    }`}
                  >
                    <Volume2 className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <h4 className="font-bold text-sm sm:text-base text-white">{voice.titleArabic}</h4>
                      {voice.isFajrSpecific && (
                        <span className="text-[10px] bg-indigo-950/80 text-indigo-300 border border-indigo-700/40 px-1.5 py-0.5 rounded-md font-semibold">
                          مخصوص بالفجر
                        </span>
                      )}
                    </div>
                    <div className="text-xs text-stone-400 flex items-center gap-1.5 mt-0.5">
                      <span>{voice.reciterArabic}</span>
                      <span>·</span>
                      <span className="flex items-center gap-1">
                        <MapPin className="w-3 h-3 text-emerald-400" />
                        {voice.locationArabic}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={() => {
                      onSelectVoice(voice);
                      onTriggerModal(voice, voice.titleArabic);
                    }}
                    className="p-2.5 rounded-xl bg-emerald-600/20 text-emerald-300 hover:bg-emerald-600 hover:text-white transition-colors border border-emerald-500/30 cursor-pointer shadow-xs"
                    title="استماع ورفع"
                  >
                    <Play className="w-4 h-4 fill-current" />
                  </button>

                  <button
                    onClick={() => onSelectVoice(voice)}
                    className={`px-3 py-2 rounded-xl text-xs font-medium border transition-colors cursor-pointer ${
                      isSelected
                        ? 'bg-emerald-900/60 text-emerald-300 border-emerald-500/40 font-bold'
                        : 'bg-stone-800/80 text-stone-300 border-stone-700 hover:bg-stone-700'
                    }`}
                  >
                    {isSelected ? (
                      <span className="flex items-center gap-1">
                        <Check className="w-3.5 h-3.5" />
                        المعتمد
                      </span>
                    ) : (
                      'تعيين'
                    )}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Adhan Virtues & Sunnah */}
      <div className="p-5 rounded-2xl bg-stone-900/60 border border-stone-800 space-y-3">
        <h4 className="text-sm font-bold text-emerald-400 flex items-center gap-2">
          <Award className="w-4 h-4" />
          <span>من سنن سماع الأذان وفضائله النبوية</span>
        </h4>
        <ul className="text-xs text-stone-300 space-y-2 leading-relaxed">
          <li className="flex items-start gap-2">
            <span className="text-emerald-400 font-bold">•</span>
            <span>
              <strong>الترديد خلف المؤذن:</strong> قال رسول الله ﷺ: «إذا سمعتم المؤذن فقولوا مثل ما يقول» (متفق عليه).
            </span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-emerald-400 font-bold">•</span>
            <span>
              <strong>الصلاة على النبي ﷺ بعد الفراغ من الأذان:</strong> ثم سؤال الوسيلة له ﷺ، لتحل لك شفاعته يوم القيامة.
            </span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-emerald-400 font-bold">•</span>
            <span>
              <strong>الدعاء بين الأذان والإقامة:</strong> قال ﷺ: «الدعاء لا يُردّ بين الأذان والإقامة» (رواه الترمذي وأبو داود).
            </span>
          </li>
        </ul>
      </div>

      {/* Post-Adhan Dua & Ibrahimiyya Prayer Card */}
      <div className="p-5 sm:p-6 rounded-3xl bg-gradient-to-l from-emerald-950/60 to-stone-900 border border-emerald-500/30 space-y-3.5 text-right">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-emerald-400 text-sm font-bold">
            <Sparkles className="w-4 h-4 text-amber-300" />
            <span>دعاء ما بعد الأذان والصلاة الإبراهيمية بالصوت</span>
          </div>

          <button
            onClick={handleToggleDuaAudio}
            className={`px-4 py-2 rounded-xl text-xs font-semibold flex items-center gap-2 transition-colors cursor-pointer self-start sm:self-auto ${
              isDuaPlaying
                ? 'bg-amber-600 hover:bg-amber-500 text-white'
                : 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-md'
            }`}
          >
            {isDuaPlaying ? (
              <>
                <Pause className="w-3.5 h-3.5 fill-current" />
                <span>إيقاف تلاوة الدعاء</span>
              </>
            ) : (
              <>
                <Volume2 className="w-3.5 h-3.5" />
                <span>استماع للدعاء بالصوت الآن</span>
              </>
            )}
          </button>
        </div>

        {/* Hadith Formulation */}
        <div className="p-3 rounded-2xl bg-emerald-900/30 border border-emerald-500/20 text-xs text-amber-200/90 leading-relaxed font-sans">
          {DUA_AFTER_ADHAN.hadithFull}
        </div>

        {/* Dua Arabic Text */}
        <div className="space-y-1">
          <div className="text-[11px] text-stone-400 font-bold">نص الدعاء بعد الفراغ من الأذان:</div>
          <p className="text-base sm:text-lg font-quran text-emerald-200 leading-loose bg-stone-950/70 p-3.5 rounded-2xl border border-stone-800">
            «{DUA_AFTER_ADHAN.arabic}»
          </p>
        </div>

        {/* Salat Ibrahimiya */}
        <div className="space-y-1">
          <div className="text-[11px] text-stone-400 font-bold">ثم الصلاة على النبي ﷺ (الصلاة الإبراهيمية):</div>
          <p className="text-xs sm:text-sm font-quran text-stone-200 leading-relaxed bg-stone-950/50 p-3 rounded-2xl border border-stone-800">
            «{DUA_AFTER_ADHAN.salatIbrahimiya}»
          </p>
        </div>

        <div className="text-xs text-stone-400 flex items-center justify-between pt-2 border-t border-emerald-900/40">
          <span>{DUA_AFTER_ADHAN.reference}</span>
          <span className="text-emerald-400 font-semibold">{DUA_AFTER_ADHAN.reward}</span>
        </div>
      </div>
    </div>
  );
};

