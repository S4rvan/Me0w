import React, { useState } from 'react';
import { Play, Pause, Radio } from 'lucide-react';
import { Track } from '../types';

interface RetroTurntableProps {
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

export const RetroTurntable: React.FC<RetroTurntableProps> = ({
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

  const artwork =
    currentTrack?.artworkUrl ||
    'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?auto=format&fit=crop&w=400&q=80';

  return (
    <div
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className="fixed bottom-6 left-6 z-40 flex flex-col sm:flex-row items-start sm:items-center gap-3 bg-[#0a0a0c]/85 backdrop-blur-2xl border border-white/15 p-3 rounded-3xl shadow-[0_8px_32px_rgba(0,0,0,0.85)] select-none transition-all duration-300 group"
    >
      {/* Hand-Drawn / Ink Illustrated Turntable Deck (Matches User Sketch) */}
      <div
        onClick={onTogglePlay}
        className="relative w-[190px] h-[155px] cursor-pointer flex-shrink-0 transition-transform hover:scale-[1.02] active:scale-[0.98]"
        title={isPlaying ? 'Pause Turntable' : 'Start Turntable'}
      >
        <svg
          viewBox="0 0 280 230"
          className="w-full h-full filter drop-shadow-xl"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          {/* Deck Feet (4 corners) */}
          <rect x="18" y="215" width="28" height="10" rx="4" fill="#1c1c20" stroke="#ffffff" strokeWidth="2.5" />
          <rect x="234" y="215" width="28" height="10" rx="4" fill="#1c1c20" stroke="#ffffff" strokeWidth="2.5" />

          {/* Main Rectangular Chassis / Plinth */}
          <rect
            x="10"
            y="10"
            width="260"
            height="210"
            rx="20"
            fill="#121216"
            stroke="#ffffff"
            strokeWidth="3.5"
          />
          {/* Inset deck chassis border */}
          <rect
            x="16"
            y="16"
            width="248"
            height="198"
            rx="16"
            fill="#18181e"
            stroke="#ffffff"
            strokeWidth="1.5"
            strokeDasharray="none"
          />

          {/* Top-Left Power Switch Knob */}
          <g transform="translate(36, 36)">
            <circle cx="0" cy="0" r="14" fill="#0c0c0e" stroke="#ffffff" strokeWidth="2.5" />
            <circle cx="0" cy="0" r="10" fill="#222228" stroke="#ffffff" strokeWidth="1.5" />
            <line x1="0" y1="-8" x2="0" y2="-4" stroke="#ffffff" strokeWidth="2" strokeLinecap="round" />
            <circle cx="0" cy="0" r="4" fill={isPlaying ? '#f472b6' : '#ffffff'} />
          </g>

          {/* Bottom-Left 33/45 RPM Speed Knob */}
          <g transform="translate(36, 186)">
            <circle cx="0" cy="0" r="13" fill="#0c0c0e" stroke="#ffffff" strokeWidth="2.5" />
            <circle cx="0" cy="0" r="9" fill="#222228" stroke="#ffffff" strokeWidth="1.5" />
            <line x1="-6" y1="0" x2="-2" y2="0" stroke="#ffffff" strokeWidth="2" strokeLinecap="round" />
          </g>

          {/* Large Circular Platter (Stroboscopic Rim) */}
          <g transform="translate(108, 116)">
            {/* Outer Platter Ring with Strobe Dots */}
            <circle cx="0" cy="0" r="88" fill="#101014" stroke="#ffffff" strokeWidth="2.5" />
            <circle cx="0" cy="0" r="83" fill="#0c0c0e" stroke="#ffffff" strokeWidth="1.2" strokeDasharray="3 5" />
            <circle cx="0" cy="0" r="80" fill="#141418" stroke="#ffffff" strokeWidth="1.5" />

            {/* Rotating Vinyl Record Disc */}
            <g className={isPlaying ? 'animate-vinyl-spin' : ''} style={{ transformOrigin: '0px 0px' }}>
              {/* Vinyl grooves */}
              <circle cx="0" cy="0" r="76" fill="#08080a" stroke="#ffffff" strokeWidth="2" />
              <circle cx="0" cy="0" r="70" fill="none" stroke="rgba(255,255,255,0.4)" strokeWidth="0.8" />
              <circle cx="0" cy="0" r="62" fill="none" stroke="rgba(255,255,255,0.25)" strokeWidth="0.8" />
              <circle cx="0" cy="0" r="54" fill="none" stroke="rgba(255,255,255,0.35)" strokeWidth="0.8" />
              <circle cx="0" cy="0" r="46" fill="none" stroke="rgba(255,255,255,0.2)" strokeWidth="0.8" />
              <circle cx="0" cy="0" r="38" fill="none" stroke="rgba(255,255,255,0.3)" strokeWidth="0.8" />

              {/* Vinyl light sheen reflections */}
              <path
                d="M -76,0 A 76,76 0 0,1 0,-76 L 0,0 Z"
                fill="rgba(255,255,255,0.06)"
              />
              <path
                d="M 76,0 A 76,76 0 0,1 0,76 L 0,0 Z"
                fill="rgba(255,255,255,0.06)"
              />

              {/* Record Label Center Disc */}
              <clipPath id="albumArtClip">
                <circle cx="0" cy="0" r="26" />
              </clipPath>
              <circle cx="0" cy="0" r="27" fill="#f472b6" stroke="#ffffff" strokeWidth="2" />
              <image
                href={artwork}
                x="-26"
                y="-26"
                width="52"
                height="52"
                clipPath="url(#albumArtClip)"
                preserveAspectRatio="xMidYMid slice"
              />
              {/* Spindle hole */}
              <circle cx="0" cy="0" r="4" fill="#0c0c0e" stroke="#ffffff" strokeWidth="1.5" />
            </g>
          </g>

          {/* Right Side: Pitch Fader & Controls */}
          {/* Pitch Fader Slot */}
          <rect x="238" y="112" width="14" height="60" rx="3" fill="#0a0a0c" stroke="#ffffff" strokeWidth="1.5" />
          <line x1="245" y1="116" x2="245" y2="168" stroke="#ffffff" strokeWidth="1" strokeDasharray="2 3" />
          {/* Pitch Fader Knob */}
          <rect
            x="234"
            y={122 + (1 - progressRatio) * 36}
            width="22"
            height="8"
            rx="2"
            fill="#2c2c34"
            stroke="#ffffff"
            strokeWidth="1.5"
            className="transition-all duration-300"
          />

          {/* Start / Stop Button (Bottom Right) */}
          <g transform="translate(216, 186)">
            <rect
              x="-18"
              y="-10"
              width="36"
              height="20"
              rx="4"
              fill={isPlaying ? '#22222a' : '#141418'}
              stroke="#ffffff"
              strokeWidth="2"
            />
            <text
              x="0"
              y="3"
              fill="#ffffff"
              fontSize="7"
              fontWeight="bold"
              fontFamily="sans-serif"
              textAnchor="middle"
            >
              {isPlaying ? 'STOP' : 'START'}
            </text>
          </g>

          {/* Target Stylus Light (Left of Tonearm) */}
          <circle cx="70" cy="30" r="5" fill="#181820" stroke="#ffffff" strokeWidth="1.5" />
          <circle cx="70" cy="30" r="2" fill={isPlaying ? '#ffe0a3' : '#444450'} />

          {/* Tonearm Assembly (Top-Right Pivot) */}
          <g transform="translate(230, 48)">
            {/* Tonearm Gimbal / Base */}
            <circle cx="0" cy="0" r="22" fill="#141418" stroke="#ffffff" strokeWidth="2.5" />
            <circle cx="0" cy="0" r="16" fill="#08080a" stroke="#ffffff" strokeWidth="1.5" />
            <circle cx="0" cy="0" r="8" fill="#24242e" stroke="#ffffff" strokeWidth="1.5" />

            {/* Counterweight at the back (pointing top-right) */}
            <rect
              x="-6"
              y="-28"
              width="12"
              height="16"
              rx="3"
              fill="#181820"
              stroke="#ffffff"
              strokeWidth="1.8"
            />
            <line x1="-6" y1="-20" x2="6" y2="-20" stroke="#ffffff" strokeWidth="1.2" />

            {/* Moving Tonearm Wand + Cartridge Needle */}
            {/* When Playing: Pivots onto record (~28deg). When Paused: Rests in cradle (~0deg) */}
            <g
              style={{
                transform: isPlaying ? 'rotate(27deg)' : 'rotate(0deg)',
                transformOrigin: '0px 0px',
                transition: 'transform 0.85s cubic-bezier(0.25, 1, 0.5, 1)',
              }}
            >
              {/* S-Shaped Metal Wand */}
              <path
                d="M 0,0 C -6,30 8,65 -36,105 C -48,116 -54,124 -60,132"
                fill="none"
                stroke="#ffffff"
                strokeWidth="3.2"
                strokeLinecap="round"
              />
              <path
                d="M 0,0 C -6,30 8,65 -36,105 C -48,116 -54,124 -60,132"
                fill="none"
                stroke="#121218"
                strokeWidth="1.2"
                strokeLinecap="round"
              />

              {/* Headshell & Cartridge Needle */}
              <g transform="translate(-60, 132) rotate(42)">
                <polygon
                  points="-5,-12 5,-12 4,14 -4,14"
                  fill="#1a1a24"
                  stroke="#ffffff"
                  strokeWidth="2"
                />
                {/* Finger lift hook */}
                <path d="M 5,-4 Q 10,-8 11,-2" fill="none" stroke="#ffffff" strokeWidth="1.5" strokeLinecap="round" />
                {/* Stylus needle tip */}
                <rect x="-2" y="14" width="4" height="4" fill="#ffffff" />
                <circle cx="0" cy="18" r="1.5" fill={isPlaying ? '#f472b6' : '#ffffff'} />
              </g>
            </g>

            {/* Tonearm Rest Cradle */}
            <rect x="-4" y="62" width="8" height="12" rx="2" fill="#0a0a0c" stroke="#ffffff" strokeWidth="1.5" />
            <path d="M -6,62 L 6,62" stroke="#ffffff" strokeWidth="2" strokeLinecap="round" />
          </g>
        </svg>

        {/* Play/Pause Hover Overlay Icon */}
        <div
          className={`absolute inset-0 flex items-center justify-center rounded-2xl bg-black/40 backdrop-blur-xs transition-opacity duration-200 ${
            isHovered ? 'opacity-100' : 'opacity-0'
          }`}
        >
          <div className="w-10 h-10 rounded-full bg-white text-black flex items-center justify-center shadow-2xl">
            {isPlaying ? (
              <Pause className="w-5 h-5 fill-current" />
            ) : (
              <Play className="w-5 h-5 fill-current ml-0.5" />
            )}
          </div>
        </div>
      </div>

      {/* Song Metadata & Progress Next to Turntable */}
      <div className="min-w-0 max-w-[190px] sm:max-w-[220px] flex flex-col justify-center">
        <div className="flex items-center gap-1.5">
          <p className="text-sm font-bold text-white truncate leading-snug">
            {currentTrack?.title || 'No Track Selected'}
          </p>
          {isSpotifyActive && (
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse flex-shrink-0" title="Spotify Active" />
          )}
        </div>

        <p className="text-xs text-pink-200/80 truncate mt-0.5 font-medium">
          {currentTrack?.artist || 'Ready to spin'}
        </p>

        {currentTrack?.album && (
          <p className="text-[11px] text-white/40 truncate mt-0.5">
            {currentTrack.album}
          </p>
        )}

        {/* Interactive Progress Bar */}
        <div className="mt-2 flex items-center gap-2">
          <div
            onClick={(e) => {
              const rect = e.currentTarget.getBoundingClientRect();
              const ratio = (e.clientX - rect.left) / rect.width;
              onSeek(ratio * safeDuration);
            }}
            className="flex-1 h-1.5 bg-white/15 hover:h-2.5 rounded-full cursor-pointer transition-all overflow-hidden"
          >
            <div
              className="h-full bg-gradient-to-r from-pink-300 via-purple-300 to-blue-300 rounded-full"
              style={{ width: `${progressRatio * 100}%` }}
            />
          </div>
          <span className="text-[10px] font-mono text-white/45 flex-shrink-0">
            {formatTime(currentTime)}
          </span>
        </div>
      </div>
    </div>
  );
};
