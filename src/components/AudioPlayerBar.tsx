import React from 'react';
import {
  Play,
  Pause,
  RotateCcw,
  Volume2,
  VolumeX,
  Maximize2,
  Minimize2,
  FastForward,
  Rewind,
  Music2,
  Radio,
} from 'lucide-react';
import { Track } from '../types';

interface AudioPlayerBarProps {
  currentTrack: Track | null;
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  volume: number;
  syncOffset: number;
  isFullscreen: boolean;
  onTogglePlay: () => void;
  onSeek: (time: number) => void;
  onVolumeChange: (vol: number) => void;
  onNudgeSync: (delta: number) => void;
  onResetSync: () => void;
  onToggleFullscreen: () => void;
  isSpotifyActive: boolean;
}

function formatTime(seconds: number): string {
  if (isNaN(seconds) || seconds < 0) return '0:00';
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s < 10 ? '0' : ''}${s}`;
}

export const AudioPlayerBar: React.FC<AudioPlayerBarProps> = ({
  currentTrack,
  isPlaying,
  currentTime,
  duration,
  volume,
  syncOffset,
  isFullscreen,
  onTogglePlay,
  onSeek,
  onVolumeChange,
  onNudgeSync,
  onResetSync,
  onToggleFullscreen,
  isSpotifyActive,
}) => {
  const progressPercent = duration > 0 ? Math.min(100, (currentTime / duration) * 100) : 0;

  return (
    <div className="w-full glass-panel border-t border-white/10 px-4 py-3 md:px-8 md:py-4 flex flex-col gap-2 z-40 transition-all duration-300">
      {/* Interactive Progress Bar */}
      <div className="flex items-center gap-3 w-full group">
        <span className="text-xs font-mono text-white/50 w-10 text-right select-none">
          {formatTime(currentTime)}
        </span>
        <div
          onClick={(e) => {
            const rect = e.currentTarget.getBoundingClientRect();
            const ratio = (e.clientX - rect.left) / rect.width;
            onSeek(ratio * duration);
          }}
          className="relative flex-1 h-1.5 hover:h-3 bg-white/10 rounded-full cursor-pointer transition-all overflow-hidden"
        >
          <div
            className="h-full bg-gradient-to-r from-white/90 to-white rounded-full transition-all duration-75 relative"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
        <span className="text-xs font-mono text-white/50 w-10 text-left select-none">
          {formatTime(duration)}
        </span>
      </div>

      <div className="flex items-center justify-between gap-4">
        {/* Track Info */}
        <div className="flex items-center gap-3 min-w-0 max-w-[35%]">
          {currentTrack?.artworkUrl ? (
            <img
              src={currentTrack.artworkUrl}
              alt={currentTrack.title}
              className="w-12 h-12 rounded-xl object-cover shadow-lg border border-white/10 flex-shrink-0"
            />
          ) : (
            <div className="w-12 h-12 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center flex-shrink-0 text-white/40">
              <Music2 className="w-6 h-6" />
            </div>
          )}
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <p className="text-sm font-bold text-white truncate">
                {currentTrack?.title || 'No Track'}
              </p>
              {isSpotifyActive && (
                <span className="px-2 py-0.5 text-[10px] uppercase font-bold tracking-wider rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center gap-1">
                  <Radio className="w-2.5 h-2.5 animate-pulse" /> Spotify
                </span>
              )}
            </div>
            <p className="text-xs text-white/50 truncate">
              {currentTrack?.artist || 'Ready to play'}
            </p>
          </div>
        </div>

        {/* Center Controls */}
        <div className="flex items-center gap-2 md:gap-4">
          <button
            onClick={() => onSeek(Math.max(0, currentTime - 5))}
            className="p-2 rounded-full hover:bg-white/10 text-white/70 hover:text-white transition"
            title="Rewind 5s"
          >
            <Rewind className="w-4 h-4 md:w-5 md:h-5" />
          </button>

          <button
            onClick={onTogglePlay}
            disabled={!currentTrack}
            className="w-11 h-11 md:w-12 md:h-12 rounded-full bg-white text-black flex items-center justify-center hover:scale-105 active:scale-95 transition-all shadow-xl font-bold disabled:opacity-40"
          >
            {isPlaying ? (
              <Pause className="w-5 h-5 fill-current" />
            ) : (
              <Play className="w-5 h-5 fill-current ml-0.5" />
            )}
          </button>

          <button
            onClick={() => onSeek(Math.min(duration, currentTime + 5))}
            className="p-2 rounded-full hover:bg-white/10 text-white/70 hover:text-white transition"
            title="Forward 5s"
          >
            <FastForward className="w-4 h-4 md:w-5 md:h-5" />
          </button>
        </div>

        {/* Right Controls: Sync Nudge, Volume & Fullscreen */}
        <div className="flex items-center gap-2 md:gap-4">
          {/* Sync Nudge Pill */}
          <div className="hidden sm:flex items-center gap-1 bg-white/5 border border-white/10 px-2 py-1 rounded-xl text-xs">
            <span className="text-white/40 text-[10px] mr-1 uppercase tracking-wider font-semibold">Sync:</span>
            <button
              onClick={() => onNudgeSync(-0.1)}
              className="px-1.5 py-0.5 rounded hover:bg-white/15 text-white/70 active:scale-95 font-mono"
              title="Nudge lyrics later (-0.1s)"
            >
              -0.1s
            </button>
            <span className="font-mono text-white/90 text-xs px-1">
              {syncOffset >= 0 ? `+${syncOffset.toFixed(1)}s` : `${syncOffset.toFixed(1)}s`}
            </span>
            <button
              onClick={() => onNudgeSync(0.1)}
              className="px-1.5 py-0.5 rounded hover:bg-white/15 text-white/70 active:scale-95 font-mono"
              title="Nudge lyrics earlier (+0.1s)"
            >
              +0.1s
            </button>
            {syncOffset !== 0 && (
              <button
                onClick={onResetSync}
                className="p-1 rounded hover:bg-white/15 text-white/40 hover:text-white ml-0.5"
                title="Reset sync offset"
              >
                <RotateCcw className="w-3 h-3" />
              </button>
            )}
          </div>

          {/* Volume Control */}
          <div className="hidden md:flex items-center gap-2">
            <button
              onClick={() => onVolumeChange(volume === 0 ? 0.8 : 0)}
              className="text-white/70 hover:text-white transition"
            >
              {volume === 0 ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
            </button>
            <input
              type="range"
              min="0"
              max="1"
              step="0.01"
              value={volume}
              onChange={(e) => onVolumeChange(parseFloat(e.target.value))}
              className="w-16 h-1 bg-white/20 rounded-full appearance-none cursor-pointer accent-white"
            />
          </div>

          {/* Fullscreen Button */}
          <button
            onClick={onToggleFullscreen}
            className="p-2.5 rounded-xl hover:bg-white/10 text-white/80 hover:text-white transition"
            title={isFullscreen ? 'Exit Fullscreen (Esc)' : 'Enter Fullscreen (F)'}
          >
            {isFullscreen ? <Minimize2 className="w-5 h-5" /> : <Maximize2 className="w-5 h-5" />}
          </button>
        </div>
      </div>
    </div>
  );
};
