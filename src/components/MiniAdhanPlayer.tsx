import React, { useEffect, useState } from 'react';
import { Play, Pause, Square, Maximize2, Volume2, Sparkles } from 'lucide-react';
import { soundService, AdhanPlaybackState } from '../utils/soundService';

interface MiniAdhanPlayerProps {
  onOpenFullModal: () => void;
  isFullModalOpen: boolean;
}

export const MiniAdhanPlayer: React.FC<MiniAdhanPlayerProps> = ({
  onOpenFullModal,
  isFullModalOpen,
}) => {
  const [playback, setPlayback] = useState<AdhanPlaybackState>(() => soundService.getState());

  useEffect(() => {
    const unsub = soundService.subscribeState((st) => {
      setPlayback(st);
    });
    return () => unsub();
  }, []);

  // Do not show floating mini player if nothing is playing, or if the full modal is currently active
  if (!playback.isPlaying && !playback.isPaused) {
    return null;
  }
  if (isFullModalOpen) {
    return null;
  }

  const formatTime = (secs: number) => {
    if (!secs || isNaN(secs)) return '00:00';
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const progressPercent =
    playback.duration > 0 ? Math.min(100, (playback.currentTime / playback.duration) * 100) : 0;

  return (
    <div
      dir="rtl"
      className="fixed bottom-20 lg:bottom-4 left-3 right-3 sm:left-auto sm:right-6 sm:w-[460px] z-50 animate-in slide-in-from-bottom-5 duration-300 pointer-events-auto"
    >
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-stone-950 via-[#0a1e1b] to-stone-950 border-2 border-emerald-500/50 p-3.5 shadow-2xl shadow-emerald-950/90 text-right backdrop-blur-xl">
        {/* Subtle top progress bar */}
        <div className="absolute top-0 inset-x-0 h-1 bg-stone-800">
          <div
            className="h-full bg-gradient-to-r from-emerald-500 via-teal-400 to-amber-400 transition-all duration-300"
            style={{ width: `${progressPercent}%` }}
          />
        </div>

        <div className="flex items-center justify-between gap-3">
          {/* Left / Info */}
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500/30 to-amber-500/20 border border-emerald-400/40 flex items-center justify-center text-amber-300 shrink-0">
              <Volume2 className="w-5 h-5 animate-pulse" />
            </div>

            <div className="min-w-0">
              <div className="flex items-center gap-1.5">
                <span className="text-xs font-black text-white truncate">
                  يصدح الآن: أذان {playback.prayerName || 'الصلاة'}
                </span>
                <span className="text-[9px] bg-emerald-500/20 text-emerald-300 px-1.5 py-0.5 rounded-md border border-emerald-500/40 font-bold shrink-0">
                  نداء كامل
                </span>
              </div>
              <p className="text-[11px] text-stone-300 truncate">
                {playback.reciterTitle || 'تسجيل نقي كامل'} · {formatTime(playback.currentTime)} /{' '}
                {formatTime(playback.duration)}
              </p>
            </div>
          </div>

          {/* Right / Controls */}
          <div className="flex items-center gap-1.5 shrink-0">
            {/* Play / Pause */}
            <button
              onClick={() => {
                if (playback.isPlaying) {
                  soundService.pauseAdhan();
                } else {
                  soundService.resumeAdhan();
                }
              }}
              className="p-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white transition-colors cursor-pointer shadow-sm"
              title={playback.isPlaying ? 'إيقاف مؤقت' : 'متابعة الأذان'}
            >
              {playback.isPlaying ? (
                <Pause className="w-4 h-4 fill-white" />
              ) : (
                <Play className="w-4 h-4 fill-white mr-0.5" />
              )}
            </button>

            {/* Stop */}
            <button
              onClick={() => soundService.stopAdhan()}
              className="p-2 rounded-xl bg-rose-950/80 hover:bg-rose-900 text-rose-300 border border-rose-500/40 transition-colors cursor-pointer shadow-sm"
              title="إيقاف الأذان"
            >
              <Square className="w-4 h-4 fill-rose-300" />
            </button>

            {/* Maximize to full modal */}
            <button
              onClick={onOpenFullModal}
              className="p-2 rounded-xl bg-stone-800 hover:bg-stone-700 text-stone-300 hover:text-white transition-colors cursor-pointer"
              title="تكبير المشغل المرئي الكامل"
            >
              <Maximize2 className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
