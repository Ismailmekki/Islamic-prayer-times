import React, { useState, useRef, useEffect } from 'react';
import {
  Play,
  Pause,
  RotateCcw,
  Volume2,
  VolumeX,
  Download,
  ExternalLink,
  Radio,
  Sun,
  Moon,
  Sparkles,
  Music,
  SkipForward,
  SkipBack,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { ADHKAR_AUDIO_TRACKS, AdhkarAudioTrack } from '../data/adhkarAudioData';

interface AdhkarAudioPlayerProps {
  initialTrackId?: string;
  onTrackChange?: (track: AdhkarAudioTrack) => void;
}

export const AdhkarAudioPlayer: React.FC<AdhkarAudioPlayerProps> = ({
  initialTrackId = 'sabah_alafasy',
  onTrackChange,
}) => {
  const [currentTrackId, setCurrentTrackId] = useState<string>(initialTrackId);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [currentTime, setCurrentTime] = useState<number>(0);
  const [duration, setDuration] = useState<number>(0);
  const [playbackRate, setPlaybackRate] = useState<number>(1);
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [selectedFilter, setSelectedFilter] = useState<string>('all');
  const [isCollapsed, setIsCollapsed] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  const audioRef = useRef<HTMLAudioElement | null>(null);

  const currentTrack =
    ADHKAR_AUDIO_TRACKS.find((t) => t.id === currentTrackId) ||
    ADHKAR_AUDIO_TRACKS[0];

  // Set up audio instance
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const handleTimeUpdate = () => {
      setCurrentTime(audio.currentTime);
    };

    const handleLoadedMetadata = () => {
      setDuration(audio.duration || 0);
      setIsLoading(false);
    };

    const handleWaiting = () => {
      setIsLoading(true);
    };

    const handleCanPlay = () => {
      setIsLoading(false);
    };

    const handleEnded = () => {
      setIsPlaying(false);
      setCurrentTime(0);
    };

    const handleError = () => {
      setIsLoading(false);
      setIsPlaying(false);
    };

    audio.addEventListener('timeupdate', handleTimeUpdate);
    audio.addEventListener('loadedmetadata', handleLoadedMetadata);
    audio.addEventListener('waiting', handleWaiting);
    audio.addEventListener('canplay', handleCanPlay);
    audio.addEventListener('ended', handleEnded);
    audio.addEventListener('error', handleError);

    return () => {
      audio.removeEventListener('timeupdate', handleTimeUpdate);
      audio.removeEventListener('loadedmetadata', handleLoadedMetadata);
      audio.removeEventListener('waiting', handleWaiting);
      audio.removeEventListener('canplay', handleCanPlay);
      audio.removeEventListener('ended', handleEnded);
      audio.removeEventListener('error', handleError);
    };
  }, []);

  // Update track source and play state
  const handleSelectTrack = (track: AdhkarAudioTrack) => {
    setCurrentTrackId(track.id);
    if (onTrackChange) onTrackChange(track);

    if (audioRef.current) {
      setIsLoading(true);
      audioRef.current.src = track.audioUrl;
      audioRef.current.playbackRate = playbackRate;
      audioRef.current.play().then(() => {
        setIsPlaying(true);
        setIsLoading(false);
      }).catch(() => {
        setIsLoading(false);
        setIsPlaying(false);
      });
    }
  };

  const togglePlayPause = () => {
    if (!audioRef.current) return;

    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      setIsLoading(true);
      if (audioRef.current.src !== currentTrack.audioUrl) {
        audioRef.current.src = currentTrack.audioUrl;
      }
      audioRef.current.playbackRate = playbackRate;
      audioRef.current.play().then(() => {
        setIsPlaying(true);
        setIsLoading(false);
      }).catch(() => {
        setIsLoading(false);
        setIsPlaying(false);
      });
    }
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const time = parseFloat(e.target.value);
    setCurrentTime(time);
    if (audioRef.current) {
      audioRef.current.currentTime = time;
    }
  };

  const handleSpeedToggle = () => {
    const rates = [1, 1.25, 1.5];
    const currentIndex = rates.indexOf(playbackRate);
    const nextRate = rates[(currentIndex + 1) % rates.length];
    setPlaybackRate(nextRate);
    if (audioRef.current) {
      audioRef.current.playbackRate = nextRate;
    }
  };

  const handleMuteToggle = () => {
    if (audioRef.current) {
      audioRef.current.muted = !isMuted;
      setIsMuted(!isMuted);
    }
  };

  const handleRestart = () => {
    if (audioRef.current) {
      audioRef.current.currentTime = 0;
      setCurrentTime(0);
      if (!isPlaying) {
        audioRef.current.play().then(() => setIsPlaying(true));
      }
    }
  };

  const handleNextTrack = () => {
    const currentIndex = ADHKAR_AUDIO_TRACKS.findIndex((t) => t.id === currentTrack.id);
    const nextIndex = (currentIndex + 1) % ADHKAR_AUDIO_TRACKS.length;
    handleSelectTrack(ADHKAR_AUDIO_TRACKS[nextIndex]);
  };

  const handlePrevTrack = () => {
    const currentIndex = ADHKAR_AUDIO_TRACKS.findIndex((t) => t.id === currentTrack.id);
    const prevIndex = (currentIndex - 1 + ADHKAR_AUDIO_TRACKS.length) % ADHKAR_AUDIO_TRACKS.length;
    handleSelectTrack(ADHKAR_AUDIO_TRACKS[prevIndex]);
  };

  const formatTime = (seconds: number) => {
    if (isNaN(seconds) || seconds < 0) return '00:00';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const filteredTracks = ADHKAR_AUDIO_TRACKS.filter((track) => {
    if (selectedFilter === 'all') return true;
    if (selectedFilter === 'morning') return track.category === 'morning' || track.category === 'morning_evening';
    if (selectedFilter === 'evening') return track.category === 'evening' || track.category === 'morning_evening';
    if (selectedFilter === 'sleep') return track.category === 'sleep';
    if (selectedFilter === 'doors') return track.category === 'doors' || track.category === 'prayer' || track.category === 'istikhara';
    return true;
  });

  return (
    <div className="relative overflow-hidden rounded-3xl bg-gradient-to-b from-stone-900 via-stone-900/95 to-stone-950 border border-emerald-500/40 shadow-2xl text-right">
      <audio ref={audioRef} preload="metadata" />

      {/* Header bar */}
      <div className="p-4 sm:p-5 border-b border-stone-800/80 flex items-center justify-between flex-wrap gap-3 bg-emerald-950/30">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-emerald-600/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400">
            <Radio className="w-5 h-5 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-base sm:text-lg font-bold text-white font-quran">
                المكتبة الصوتية لأذكار الصباح والمساء وحصن المسلم
              </h3>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-900/70 border border-emerald-500/40 text-emerald-300 font-semibold">
                تسجيلات نقية MP3
              </span>
            </div>
            <p className="text-[11px] text-stone-400">
              تسجيلات موثوقة من مكتبة شبكة الشفاء الإسلامية بصوت الشيخ مشاري راشد العفاسي والشيخ حمد الدريهم
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <a
            href="https://www.ashefaa.com/catsmktba-890.html"
            target="_blank"
            rel="noopener noreferrer"
            className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-stone-950 hover:bg-stone-800 border border-stone-800 text-[11px] font-semibold text-emerald-400 hover:text-emerald-300 transition-colors"
            title="زيارة صفحة المصدر في شبكة الشفاء"
          >
            <span>المصدر: شبكة الشفاء</span>
            <ExternalLink className="w-3 h-3" />
          </a>

          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="p-2 rounded-xl bg-stone-950 hover:bg-stone-800 border border-stone-800 text-stone-400 hover:text-white transition-colors cursor-pointer"
            title={isCollapsed ? 'توسيع المشغل' : 'طي المشغل'}
          >
            {isCollapsed ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Main Player Display */}
      <div className="p-4 sm:p-6 space-y-5">
        {/* Current Active Track Card */}
        <div className="p-4 sm:p-5 rounded-2xl bg-stone-950/80 border border-emerald-500/30 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1.5 flex-1">
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-emerald-950 text-emerald-300 border border-emerald-600/30">
                {currentTrack.categoryLabel}
              </span>
              <span className="text-xs text-amber-400 font-bold">
                🎙️ {currentTrack.reciter}
              </span>
            </div>
            <h4 className="text-lg sm:text-xl font-bold text-white font-quran">
              {currentTrack.title}
            </h4>
            <p className="text-xs text-stone-300 leading-relaxed">
              {currentTrack.description}
            </p>
          </div>

          {/* Direct Actions: Download MP3 / Restart */}
          <div className="flex items-center gap-2 shrink-0">
            <a
              href={currentTrack.audioUrl}
              download
              target="_blank"
              rel="noopener noreferrer"
              className="p-2.5 rounded-xl bg-stone-900 hover:bg-stone-800 border border-stone-800 hover:border-emerald-500/50 text-stone-300 hover:text-emerald-400 transition-colors flex items-center gap-1.5 text-xs font-semibold"
              title="تحميل الملف الصوتي MP3 بجودة أصلية"
            >
              <Download className="w-4 h-4" />
              <span className="hidden sm:inline">تحميل MP3</span>
            </a>

            <button
              onClick={handleRestart}
              className="p-2.5 rounded-xl bg-stone-900 hover:bg-stone-800 border border-stone-800 text-stone-300 hover:text-white transition-colors cursor-pointer"
              title="إعادة التشغيل من البداية"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Timeline & Scrubber */}
        <div className="space-y-1.5">
          <div className="relative flex items-center">
            <input
              type="range"
              min={0}
              max={duration || 100}
              value={currentTime}
              onChange={handleSeek}
              className="w-full h-2 bg-stone-800 rounded-lg appearance-none cursor-pointer accent-emerald-500 hover:accent-emerald-400 transition-all"
            />
          </div>
          <div className="flex items-center justify-between text-[11px] font-mono text-stone-400">
            <span>{formatTime(currentTime)}</span>
            <span className="text-stone-500">{isLoading ? 'جاري التحميل...' : currentTrack.durationLabel}</span>
            <span>{formatTime(duration)}</span>
          </div>
        </div>

        {/* Audio Controls Bar */}
        <div className="flex items-center justify-between flex-wrap gap-4 pt-1">
          {/* Left: Speed & Volume */}
          <div className="flex items-center gap-2">
            <button
              onClick={handleSpeedToggle}
              className="px-2.5 py-1.5 rounded-xl bg-stone-950 hover:bg-stone-800 border border-stone-800 text-xs font-mono font-bold text-stone-300 hover:text-emerald-400 transition-colors cursor-pointer"
              title="تغيير سرعة الصوت"
            >
              {playbackRate}x
            </button>

            <button
              onClick={handleMuteToggle}
              className="p-2 rounded-xl bg-stone-950 hover:bg-stone-800 border border-stone-800 text-stone-400 hover:text-white transition-colors cursor-pointer"
              title={isMuted ? 'إلغاء كتم الصوت' : 'كتم الصوت'}
            >
              {isMuted ? <VolumeX className="w-4 h-4 text-rose-400" /> : <Volume2 className="w-4 h-4" />}
            </button>
          </div>

          {/* Center: Play, Next, Prev Controls */}
          <div className="flex items-center gap-3">
            <button
              onClick={handlePrevTrack}
              className="p-2.5 rounded-xl bg-stone-950 hover:bg-stone-800 border border-stone-800 text-stone-300 hover:text-white transition-colors cursor-pointer"
              title="التسجيل السابق"
            >
              <SkipForward className="w-5 h-5" />
            </button>

            <button
              onClick={togglePlayPause}
              disabled={isLoading}
              className="w-13 h-13 rounded-2xl bg-emerald-600 hover:bg-emerald-500 active:scale-95 text-white flex items-center justify-center shadow-lg shadow-emerald-950/70 border border-emerald-400 transition-all cursor-pointer"
              title={isPlaying ? 'إيقاف مؤقت' : 'تشغيل الاستماع'}
            >
              {isLoading ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : isPlaying ? (
                <Pause className="w-6 h-6 fill-white" />
              ) : (
                <Play className="w-6 h-6 fill-white translate-x-0.5" />
              )}
            </button>

            <button
              onClick={handleNextTrack}
              className="p-2.5 rounded-xl bg-stone-950 hover:bg-stone-800 border border-stone-800 text-stone-300 hover:text-white transition-colors cursor-pointer"
              title="التسجيل التالي"
            >
              <SkipBack className="w-5 h-5" />
            </button>
          </div>

          {/* Right: Status badge */}
          <div className="text-left">
            <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold ${
              isPlaying
                ? 'bg-emerald-950/90 text-emerald-300 border border-emerald-500/40 animate-pulse'
                : 'bg-stone-950 text-stone-400 border border-stone-800'
            }`}>
              <span className={`w-2 h-2 rounded-full ${isPlaying ? 'bg-emerald-400' : 'bg-stone-500'}`} />
              <span>{isPlaying ? 'استماع مباشر' : 'جاهز للاستماع'}</span>
            </span>
          </div>
        </div>

        {/* Collapsible Playlist Selector */}
        {!isCollapsed && (
          <div className="pt-4 border-t border-stone-800/80 space-y-3">
            {/* Filter pills */}
            <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar">
              <span className="text-xs text-stone-400 whitespace-nowrap ml-1">تصفية التسجيلات:</span>
              <button
                onClick={() => setSelectedFilter('all')}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap border transition-all cursor-pointer ${
                  selectedFilter === 'all'
                    ? 'bg-emerald-600 text-white border-emerald-500 shadow-md'
                    : 'bg-stone-950 border-stone-800 text-stone-400 hover:text-white'
                }`}
              >
                جميع التسجيلات ({ADHKAR_AUDIO_TRACKS.length})
              </button>
              <button
                onClick={() => setSelectedFilter('morning')}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap border transition-all cursor-pointer flex items-center gap-1 ${
                  selectedFilter === 'morning'
                    ? 'bg-emerald-600 text-white border-emerald-500 shadow-md'
                    : 'bg-stone-950 border-stone-800 text-stone-400 hover:text-white'
                }`}
              >
                <Sun className="w-3.5 h-3.5 text-amber-400" />
                <span>أذكار الصباح</span>
              </button>
              <button
                onClick={() => setSelectedFilter('evening')}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap border transition-all cursor-pointer flex items-center gap-1 ${
                  selectedFilter === 'evening'
                    ? 'bg-emerald-600 text-white border-emerald-500 shadow-md'
                    : 'bg-stone-950 border-stone-800 text-stone-400 hover:text-white'
                }`}
              >
                <Moon className="w-3.5 h-3.5 text-indigo-400" />
                <span>أذكار المساء</span>
              </button>
              <button
                onClick={() => setSelectedFilter('sleep')}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap border transition-all cursor-pointer flex items-center gap-1 ${
                  selectedFilter === 'sleep'
                    ? 'bg-emerald-600 text-white border-emerald-500 shadow-md'
                    : 'bg-stone-950 border-stone-800 text-stone-400 hover:text-white'
                }`}
              >
                <Sparkles className="w-3.5 h-3.5 text-purple-400" />
                <span>أذكار النوم</span>
              </button>
              <button
                onClick={() => setSelectedFilter('doors')}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap border transition-all cursor-pointer flex items-center gap-1 ${
                  selectedFilter === 'doors'
                    ? 'bg-emerald-600 text-white border-emerald-500 shadow-md'
                    : 'bg-stone-950 border-stone-800 text-stone-400 hover:text-white'
                }`}
              >
                <Music className="w-3.5 h-3.5 text-teal-400" />
                <span>أبواب حصن المسلم</span>
              </button>
            </div>

            {/* Tracks List Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5 max-h-64 overflow-y-auto pr-1 no-scrollbar">
              {filteredTracks.map((track) => {
                const isSelected = track.id === currentTrack.id;
                return (
                  <button
                    key={track.id}
                    onClick={() => handleSelectTrack(track)}
                    className={`p-3 rounded-xl border text-right transition-all cursor-pointer flex items-center justify-between gap-2.5 ${
                      isSelected
                        ? 'bg-emerald-950/80 border-emerald-500 text-white ring-1 ring-emerald-500/30'
                        : 'bg-stone-950/70 hover:bg-stone-900 border-stone-800 text-stone-300 hover:border-stone-700'
                    }`}
                  >
                    <div className="space-y-0.5 truncate flex-1">
                      <div className="flex items-center gap-1.5">
                        <span className="text-[9px] px-1.5 py-0.2 rounded bg-stone-900 text-emerald-400 border border-stone-800 font-medium">
                          {track.categoryLabel}
                        </span>
                        <span className="text-[10px] text-amber-400 truncate">
                          {track.reciter}
                        </span>
                      </div>
                      <h5 className="text-xs font-bold text-white truncate font-quran">
                        {track.title}
                      </h5>
                    </div>

                    <div className="shrink-0">
                      <div className={`w-7 h-7 rounded-lg flex items-center justify-center ${
                        isSelected && isPlaying
                          ? 'bg-emerald-600 text-white'
                          : isSelected
                          ? 'bg-emerald-950 text-emerald-400 border border-emerald-500/40'
                          : 'bg-stone-900 text-stone-400'
                      }`}>
                        {isSelected && isPlaying ? (
                          <Pause className="w-3.5 h-3.5 fill-white" />
                        ) : (
                          <Play className="w-3.5 h-3.5 fill-current" />
                        )}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
