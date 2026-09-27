import React, { useState } from 'react';
import { Volume2, Play, Pause, Sparkles, Radio, Check, Moon, MapPin, Award } from 'lucide-react';
import { ADHAN_VOICES, DUA_AFTER_ADHAN } from '../data/adhanSounds';
import { AdhanVoice } from '../types/prayer';
import { soundService } from '../utils/soundService';

interface AdhanSectionProps {
  currentVoice: AdhanVoice;
  onSelectVoice: (voice: AdhanVoice) => void;
  onTriggerModal: (voice?: AdhanVoice) => void;
}

export const AdhanSection: React.FC<AdhanSectionProps> = ({
  currentVoice,
  onSelectVoice,
  onTriggerModal,
}) => {
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
  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-emerald-950 via-stone-900 to-stone-900 border border-emerald-500/30 p-6 sm:p-8">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-emerald-400 text-xs font-semibold">
              <Radio className="w-4 h-4 animate-pulse" />
              <span>مكتبة الأذان الشاملة والأصوات الندية</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-bold text-white font-quran">
              أصوات الأذان من الحرمين الشريفين والعالم الإسلامي
            </h2>
            <p className="text-xs sm:text-sm text-stone-300 max-w-2xl">
              استمع لأجمل أصوات الأذان بصوت مشايخ الحرم المكي، والمسجد النبوي، والمسجد الأقصى، وكبار المقرئين، مع إمكانية تعيين المؤذن المفضل وتفعيل التنبيهات.
            </p>
          </div>

          <button
            onClick={() => onTriggerModal(currentVoice)}
            className="px-6 py-3.5 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-sm shadow-xl shadow-emerald-700/30 flex items-center justify-center gap-2.5 transition-transform active:scale-95 shrink-0"
          >
            <Volume2 className="w-5 h-5" />
            <span>رفع الأذان الآن</span>
          </button>
        </div>
      </div>

      {/* Reciters List */}
      <div className="space-y-3">
        <div className="flex items-center justify-between px-1">
          <h3 className="text-base font-bold text-white flex items-center gap-2">
            <Moon className="w-4 h-4 text-emerald-400" />
            <span>قائمة المؤذنين والأصوات المعتمدة</span>
          </h3>
          <span className="text-xs text-stone-400">
            الصوت النشط: <strong className="text-emerald-400">{currentVoice.titleArabic}</strong>
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {ADHAN_VOICES.map((voice) => {
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
                        ? 'bg-emerald-600 text-white border-emerald-400'
                        : 'bg-stone-800 text-emerald-400 border-stone-700'
                    }`}
                  >
                    <Volume2 className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="font-bold text-sm sm:text-base text-white">{voice.titleArabic}</h4>
                      {voice.isFajrSpecific && (
                        <span className="text-[10px] bg-indigo-950/80 text-indigo-300 border border-indigo-700/40 px-1.5 py-0.5 rounded-md">
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
                      onTriggerModal(voice);
                    }}
                    className="p-2.5 rounded-xl bg-emerald-600/20 text-emerald-300 hover:bg-emerald-600 hover:text-white transition-colors border border-emerald-500/30"
                    title="استماع ورفع"
                  >
                    <Play className="w-4 h-4 fill-current" />
                  </button>

                  <button
                    onClick={() => onSelectVoice(voice)}
                    className={`px-3 py-2 rounded-xl text-xs font-medium border transition-colors ${
                      isSelected
                        ? 'bg-emerald-900/60 text-emerald-300 border-emerald-500/40'
                        : 'bg-stone-800/80 text-stone-300 border-stone-700 hover:bg-stone-700'
                    }`}
                  >
                    {isSelected ? (
                      <span className="flex items-center gap-1">
                        <Check className="w-3.5 h-3.5" />
                        المحدد
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
          <span>من سنن سماع الأذان وفضائله</span>
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
              <strong>الصلاة على النبي ﷺ بعد الفراغ من الأذان:</strong> ثم سؤال الوسيلة له ﷺ، لتحل لك شفاعته.
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
