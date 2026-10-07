import React, { useState, useEffect } from 'react';
import {
  X,
  Play,
  Pause,
  Square,
  Volume2,
  VolumeX,
  Sparkles,
  Moon,
  Check,
} from 'lucide-react';
import { ADHAN_VOICES, DUA_AFTER_ADHAN, ADHAN_WORDS } from '../data/adhanSounds';
import { AdhanVoice } from '../types/prayer';
import { soundService } from '../utils/soundService';

interface AdhanPlayerModalProps {
  isOpen: boolean;
  onClose: () => void;
  prayerName?: string;
  selectedVoice: AdhanVoice;
  onSelectVoice: (voice: AdhanVoice) => void;
}

export const AdhanPlayerModal: React.FC<AdhanPlayerModalProps> = ({
  isOpen,
  onClose,
  prayerName = 'الصلاة',
  selectedVoice,
  onSelectVoice,
}) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(0.9);
  const [activeWordIndex, setActiveWordIndex] = useState(0);

  useEffect(() => {
    // Subscribe to soundService playback state
    const unsubscribe = soundService.subscribeState((st) => {
      setIsPlaying(st.isPlaying);
      setCurrentTime(st.currentTime);
      if (st.duration > 0) {
        setDuration(st.duration);
      }
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (isOpen) {
      const state = soundService.getState();
      if (!state.isPlaying || state.audioUrl !== selectedVoice.audioUrl) {
        startAdhanPlayback(selectedVoice);
      }
    }
  }, [isOpen, selectedVoice]);

  // Rotate adhan phrases calmly during playback
  useEffect(() => {
    if (!isPlaying) return;
    const interval = setInterval(() => {
      setActiveWordIndex((prev) => (prev + 1) % ADHAN_WORDS.length);
    }, 7000);
    return () => clearInterval(interval);
  }, [isPlaying]);

  const startAdhanPlayback = (voice: AdhanVoice) => {
    setIsPlaying(true);
    soundService.playAdhan(voice.audioUrl, {
      prayerName,
      reciterTitle: voice.reciterArabic,
      onTimeUpdate: (curr, dur) => {
        setCurrentTime(curr);
        if (dur && !isNaN(dur)) setDuration(dur);
      },
      onEnded: () => {
        setIsPlaying(false);
      },
      onError: (err) => {
        console.warn('Adhan play error:', err);
      },
    });
  };

  const handleTogglePlay = () => {
    if (isPlaying) {
      soundService.pauseAdhan();
      setIsPlaying(false);
    } else {
      soundService.resumeAdhan();
      setIsPlaying(true);
    }
  };

  const handleStop = () => {
    soundService.stopAdhan();
    setIsPlaying(false);
    setCurrentTime(0);
  };

  if (!isOpen) return null;

  const isFajr = prayerName.includes('الفجر');
  const availablePhrases = ADHAN_WORDS.filter((w) => !w.fajrOnly || isFajr);
  const currentPhrase = availablePhrases[activeWordIndex % availablePhrases.length] || availablePhrases[0];

  const formatTime = (secs: number) => {
    if (!secs || isNaN(secs)) return '00:00';
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  return (
    <div
      dir="rtl"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/85 backdrop-blur-md animate-in fade-in duration-300 font-sans"
    >
      <div className="relative w-full max-w-xl max-h-[92vh] overflow-y-auto bg-gradient-to-b from-[#07241e] via-stone-900 to-stone-950 border-2 border-emerald-500/50 rounded-3xl p-5 sm:p-8 shadow-2xl shadow-emerald-950/80 flex flex-col items-center text-center">
        {/* Top Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 left-4 p-2 rounded-full bg-stone-800 text-stone-300 hover:text-white hover:bg-stone-700 transition-colors cursor-pointer"
          title="إغلاق النافذة"
        >
          <X className="w-6 h-6" />
        </button>

        {/* Spiritual Title */}
        <div className="inline-flex items-center gap-2 text-emerald-300 text-xs sm:text-sm font-bold mb-1">
          <Moon className="w-4 h-4 text-amber-400" />
          <span>نداء الصلاة المبارك · {prayerName}</span>
        </div>

        <h2 className="text-2xl sm:text-3xl font-black text-white mb-1 font-quran">
          {selectedVoice.titleArabic}
        </h2>
        <p className="text-xs sm:text-sm text-stone-300 mb-4">
          {selectedVoice.reciterArabic}
        </p>

        {/* Central Quranic Calligraphy Card */}
        <div className="w-full py-8 px-6 my-2 rounded-3xl bg-stone-950/85 border border-emerald-500/30 shadow-inner flex flex-col items-center justify-center min-h-[140px]">
          <span className="text-3xl sm:text-5xl font-black text-emerald-300 font-quran leading-relaxed drop-shadow-sm">
            {currentPhrase.text}
          </span>
          <span className="text-xs sm:text-sm text-stone-400 mt-3 font-sans">
            «حَيَّ عَلَى الصَّلَاةِ، حَيَّ عَلَى الْفَلَاحِ»
          </span>
        </div>

        {/* Time Progress */}
        <div className="w-full mt-4 flex items-center justify-between text-xs text-stone-400 font-mono px-2">
          <span>{formatTime(currentTime)}</span>
          <span className="text-emerald-400 font-sans font-bold">
            {isPlaying ? 'الأذان يصدح الآن 🔊' : 'الأذان متوقف مؤقتاً'}
          </span>
          <span>{formatTime(duration)}</span>
        </div>

        {/* Simple Controls (Large & Senior Friendly) */}
        <div className="flex items-center justify-center gap-4 my-6 flex-wrap">
          {/* Play / Pause Toggle */}
          <button
            onClick={handleTogglePlay}
            className="w-16 h-16 rounded-full bg-emerald-600 hover:bg-emerald-500 text-white flex items-center justify-center shadow-xl shadow-emerald-950/80 transition-transform active:scale-95 cursor-pointer ring-4 ring-emerald-400/20"
            title={isPlaying ? 'إيقاف مؤقت' : 'متابعة الأذان'}
          >
            {isPlaying ? (
              <Pause className="w-8 h-8 fill-current" />
            ) : (
              <Play className="w-8 h-8 fill-current mr-1" />
            )}
          </button>

          {/* Big Red Stop Button */}
          <button
            onClick={handleStop}
            className="px-5 py-3.5 rounded-2xl bg-rose-950/80 hover:bg-rose-900 text-rose-300 border border-rose-500/40 text-xs sm:text-sm font-bold flex items-center gap-2 cursor-pointer transition-colors shadow-md"
            title="إيقاف الأذان"
          >
            <Square className="w-4 h-4 fill-current" />
            <span>إيقاف الأذان</span>
          </button>
        </div>

        {/* Quick Reciter Selection Pills (Simple & Big) */}
        <div className="w-full text-right mb-6">
          <label className="block text-xs font-bold text-stone-300 mb-2">
            اختر صوت المؤذن المفضل:
          </label>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {ADHAN_VOICES.slice(0, 6).map((voice) => {
              const isSelected = selectedVoice.id === voice.id;
              return (
                <button
                  key={voice.id}
                  onClick={() => {
                    onSelectVoice(voice);
                    startAdhanPlayback(voice);
                  }}
                  className={`p-2.5 rounded-xl text-xs font-bold transition-all border text-center cursor-pointer ${
                    isSelected
                      ? 'bg-emerald-600 text-white border-emerald-400 shadow-md ring-1 ring-emerald-300'
                      : 'bg-stone-900 text-stone-300 border-stone-800 hover:bg-stone-800'
                  }`}
                >
                  {voice.titleArabic.replace('أذان ', '')}
                </button>
              );
            })}
          </div>
        </div>

        {/* Authentic Dua After Adhan */}
        <div className="w-full text-right p-4 rounded-2xl bg-emerald-950/40 border border-emerald-500/20 space-y-2 mb-6">
          <div className="flex items-center gap-2 text-emerald-400 text-xs font-bold">
            <Sparkles className="w-4 h-4 text-amber-400" />
            <span>دعاء ما بعد الأذان:</span>
          </div>
          <p className="text-sm font-quran text-stone-200 leading-relaxed">
            «{DUA_AFTER_ADHAN.arabic}»
          </p>
        </div>

        {/* Bottom Close Button */}
        <button
          onClick={onClose}
          className="w-full py-3.5 px-6 rounded-2xl bg-stone-800 hover:bg-stone-700 text-stone-200 text-sm font-bold transition-colors cursor-pointer"
        >
          إغلاق النافذة (مع استمرار الأذان حتى اكتماله) ✕
        </button>
      </div>
    </div>
  );
};
