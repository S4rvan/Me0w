import React, { useState } from 'react';
import { Play, Pause, Disc3, Radio } from 'lucide-react';
import { Track } from '../types';

interface CornerVinylProps {
  currentTrack: Track | null;
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  onTogglePlay: () => void;
  onSeek: (time: number) => void;
  isSpotifyActive: boolean;
}

function formatTime(seconds: number): string {
  if (isNaN(seconds) || seconds < 0) return '0:00';
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s < 10 ? '0' : ''}${s}`;
}

export const CornerVinyl: React.FC<CornerVinylProps> = ({
  currentTrack,
  isPlaying,
  currentTime,
  duration,
  onTogglePlay,
  onSeek,
  isSpotifyActive,
}) => {
  const [isHovered, setIsHovered] = useState(false);
  const safeDuration = duration > 0 ? duration : 180;
  const progressRatio = Math.min(1, Math.max(0, currentTime / safeDuration));

  // Circular progress calculations (Radius = 38, Circumference = 2 * PI * 38 ≈ 238.76)
  const radius = 38;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - progressRatio * circumference;

  const artwork =
    currentTrack?.artworkUrl ||
    'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?auto=format&fit=crop&w=400&q=80';

  return (
    <div
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className="fixed bottom-6 left-6 z-40 flex items-center gap-4 bg-black/60 backdrop-blur-xl border border-white/10 p-2.5 pr-5 rounded-3xl shadow-2xl transition-all duration-300 select-none group"
    >
      {/* 1. Spinning Vinyl Disc Container with Circular Progress Ring */}
      <div
        onClick={onTogglePlay}
        className="relative w-20 h-20 flex-shrink-0 cursor-pointer"
        title={isPlaying ? 'Pause' : 'Play'}
      >
        {/* SVG Circular Progress Ring */}
        <svg className="w-full h-full -rotate-90 pointer-events-none absolute inset-0 z-10" viewBox="0 0 84 84">
          {/* Background track ring */}
          <circle
            cx="42"
            cy="42"
            r={radius}
            fill="none"
            stroke="rgba(255, 255, 255, 0.12)"
            strokeWidth="2.5"
          />
          {/* Active progress arc */}
          <circle
            cx="42"
            cy="42"
            r={radius}
            fill="none"
            stroke="#ffffff"
            strokeWidth="2.5"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            className="transition-all duration-150"
            style={{
              filter: 'drop-shadow(0 0 4px rgba(255, 255, 255, 0.6))',
            }}
          />
        </svg>

        {/* Realistic Vinyl Record Disc */}
        <div
          className={`w-full h-full p-1.5 flex items-center justify-center transition-transform ${
            isHovered ? 'scale-105' : 'scale-100'
          }`}
        >
          <div
            className={`w-16 h-16 rounded-full relative shadow-xl overflow-hidden flex items-center justify-center ${
              isPlaying ? 'animate-vinyl-spin' : ''
            }`}
            style={{
              background: `
                radial-gradient(circle at center,
                  transparent 0%,
                  transparent 30%,
                  rgba(255, 255, 255, 0.05) 32%,
                  #0c0c0e 34%,
                  #18181c 42%,
                  #0c0c0e 48%,
                  #202026 56%,
                  #0c0c0e 64%,
                  #1a1a20 72%,
                  #08080a 100%
                )
              `,
              boxShadow: '0 4px 20px rgba(0, 0, 0, 0.8), inset 0 0 10px rgba(0,0,0,0.9)',
            }}
          >
            {/* Center Label (Album Art) */}
            <div className="w-8 h-8 rounded-full overflow-hidden border border-black/40 shadow-inner relative flex items-center justify-center">
              <img
                src={artwork}
                alt="Album Art"
                className="w-full h-full object-cover"
              />
              {/* Spindle hole */}
              <div className="w-2 h-2 rounded-full bg-black/90 border border-white/20 absolute center" />
            </div>

            {/* Vinyl light sheen reflections (anisotropic sheen) */}
            <div
              className="absolute inset-0 pointer-events-none opacity-20"
              style={{
                background: 'conic-gradient(from 45deg, transparent 0deg, rgba(255,255,255,0.4) 60deg, transparent 120deg, rgba(255,255,255,0.4) 240deg, transparent 300deg)',
              }}
            />
          </div>
        </div>

        {/* Play / Pause overlay on hover */}
        <div
          className={`absolute inset-0 z-20 flex items-center justify-center rounded-full bg-black/50 backdrop-blur-xs transition-opacity duration-200 ${
            isHovered ? 'opacity-100' : 'opacity-0'
          }`}
        >
          {isPlaying ? (
            <Pause className="w-5 h-5 text-white fill-current" />
          ) : (
            <Play className="w-5 h-5 text-white fill-current ml-0.5" />
          )}
        </div>
      </div>

      {/* 2. Song & Album Metadata */}
      <div className="min-w-0 max-w-[200px] md:max-w-[240px]">
        <div className="flex items-center gap-1.5">
          <p className="text-sm font-bold text-white truncate leading-snug">
            {currentTrack?.title || 'No Track Selected'}
          </p>
          {isSpotifyActive && (
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse flex-shrink-0" title="Spotify Active" />
          )}
        </div>

        <p className="text-xs text-white/60 truncate mt-0.5">
          {currentTrack?.artist || 'Ready to play'}
        </p>

        {currentTrack?.album && (
          <p className="text-[11px] text-white/35 truncate mt-0.5 font-sans">
            {currentTrack.album}
          </p>
        )}

        {/* Timestamp */}
        <div className="flex items-center gap-2 mt-1 text-[11px] font-mono text-white/45">
          <span>{formatTime(currentTime)}</span>
          <span>/</span>
          <span>{formatTime(safeDuration)}</span>
        </div>
      </div>
    </div>
  );
};
