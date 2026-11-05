import React, { useState } from 'react';
import { Play, Pause, SkipBack, SkipForward, Volume2 } from 'lucide-react';
import { Track } from '../types';

interface RetroTurntableProps {
  currentTrack: Track | null;
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  onTogglePlay: () => void;
  onSeek: (time: number) => void;
  isSpotifyActive: boolean;
  onNextTrack?: () => void;
  onPrevTrack?: () => void;
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
  onNextTrack,
  onPrevTrack,
}) => {
  const [rpmSpeed, setRpmSpeed] = useState<'33' | '45'>('33');
  const safeDuration = duration > 0 ? duration : 180;
  const progressRatio = Math.min(1, Math.max(0, currentTime / safeDuration));

  const artwork =
    currentTrack?.artworkUrl ||
    'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?auto=format&fit=crop&w=400&q=80';

  return (
    <div className="fixed bottom-6 left-6 z-40 flex flex-col items-start gap-2.5 bg-[#08080a]/95 backdrop-blur-2xl border border-white/20 p-4 rounded-3xl shadow-[0_16px_50px_rgba(0,0,0,0.95)] select-none transition-all duration-300 group">
      {/* Hand-Drawn / Ink Illustrated Turntable Deck (Matches User Reference Sketch) */}
      <div className="relative w-[280px] h-[225px] sm:w-[330px] sm:h-[265px] flex-shrink-0 transition-transform hover:scale-[1.01]">
        <svg
          viewBox="0 0 320 260"
          className="w-full h-full filter drop-shadow-2xl select-none"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          {/* Deck Feet at bottom corners */}
          <rect x="24" y="244" width="34" height="12" rx="5" fill="#141418" stroke="#ffffff" strokeWidth="2.8" />
          <rect x="262" y="244" width="34" height="12" rx="5" fill="#141418" stroke="#ffffff" strokeWidth="2.8" />

          {/* Main Rectangular Chassis with Rounded Corners */}
          <rect
            x="12"
            y="12"
            width="296"
            height="236"
            rx="24"
            fill="#0f0f13"
            stroke="#ffffff"
            strokeWidth="3.8"
          />
          {/* Inset deck groove border */}
          <rect
            x="18"
            y="18"
            width="284"
            height="224"
            rx="20"
            fill="#15151b"
            stroke="#ffffff"
            strokeWidth="1.8"
          />

          {/* Top-Left Power Switch Knob (Clickable Toggle) */}
          <g
            transform="translate(42, 42)"
            onClick={(e) => {
              e.stopPropagation();
              onTogglePlay();
            }}
            className="cursor-pointer hover:opacity-80 active:scale-95 transition"
          >
            <circle cx="0" cy="0" r="16" fill="#08080a" stroke="#ffffff" strokeWidth="2.8" />
            <circle cx="0" cy="0" r="11" fill="#1f1f26" stroke="#ffffff" strokeWidth="1.6" />
            <line x1="0" y1="-9" x2="0" y2="-4" stroke="#ffffff" strokeWidth="2.4" strokeLinecap="round" />
            <circle cx="0" cy="0" r="4.5" fill={isPlaying ? '#f43f5e' : '#555566'} />
          </g>

          {/* Bottom-Left 33/45 RPM Speed Selector Knob (Clickable) */}
          <g
            transform="translate(42, 212)"
            onClick={(e) => {
              e.stopPropagation();
              setRpmSpeed((prev) => (prev === '33' ? '45' : '33'));
            }}
            className="cursor-pointer hover:opacity-80 active:scale-95 transition"
          >
            <circle cx="0" cy="0" r="15" fill="#08080a" stroke="#ffffff" strokeWidth="2.8" />
            <circle cx="0" cy="0" r="10" fill="#1f1f26" stroke="#ffffff" strokeWidth="1.6" />
            <line
              x1="-7"
              y1="0"
              x2="-2"
              y2="0"
              stroke="#ffffff"
              strokeWidth="2.4"
              strokeLinecap="round"
              transform={rpmSpeed === '45' ? 'rotate(45)' : 'rotate(0)'}
            />
            <text x="18" y="4" fill="#ffffff" fontSize="8" fontWeight="bold" fontFamily="sans-serif">
              {rpmSpeed}
            </text>
          </g>

          {/* Large Circular Platter with Stroboscopic Rim Dots */}
          <g
            transform="translate(126, 130)"
            onClick={(e) => {
              e.stopPropagation();
              onTogglePlay();
            }}
            className="cursor-pointer"
          >
            <circle cx="0" cy="0" r="102" fill="#0a0a0d" stroke="#ffffff" strokeWidth="3" />
            <circle cx="0" cy="0" r="96" fill="#08080a" stroke="#ffffff" strokeWidth="1.4" strokeDasharray="3 6" />
            <circle cx="0" cy="0" r="92" fill="#111116" stroke="#ffffff" strokeWidth="1.8" />

            {/* Rotating Vinyl Record Disc (Spins when playing) */}
            <g
              className={isPlaying ? 'animate-vinyl-spin' : ''}
              style={{
                transformOrigin: '0px 0px',
                animationDuration: rpmSpeed === '45' ? '1.33s' : '1.8s',
              }}
            >
              {/* Outer record disc */}
              <circle cx="0" cy="0" r="88" fill="#050507" stroke="#ffffff" strokeWidth="2.2" />

              {/* Concentric ink groove lines (just like reference sketch) */}
              <circle cx="0" cy="0" r="82" fill="none" stroke="rgba(255,255,255,0.45)" strokeWidth="0.9" />
              <circle cx="0" cy="0" r="74" fill="none" stroke="rgba(255,255,255,0.3)" strokeWidth="0.9" />
              <circle cx="0" cy="0" r="66" fill="none" stroke="rgba(255,255,255,0.4)" strokeWidth="0.9" />
              <circle cx="0" cy="0" r="58" fill="none" stroke="rgba(255,255,255,0.25)" strokeWidth="0.9" />
              <circle cx="0" cy="0" r="50" fill="none" stroke="rgba(255,255,255,0.38)" strokeWidth="0.9" />
              <circle cx="0" cy="0" r="42" fill="none" stroke="rgba(255,255,255,0.25)" strokeWidth="0.9" />

              {/* Light sheen reflections across grooves */}
              <path d="M -88,0 A 88,88 0 0,1 0,-88 L 0,0 Z" fill="rgba(255,255,255,0.07)" />
              <path d="M 88,0 A 88,88 0 0,1 0,88 L 0,0 Z" fill="rgba(255,255,255,0.07)" />

              {/* Record Label Center Disc (Album Cover Artwork) */}
              <clipPath id="albumArtClipLarge">
                <circle cx="0" cy="0" r="30" />
              </clipPath>
              <circle cx="0" cy="0" r="31" fill="#f43f5e" stroke="#ffffff" strokeWidth="2.4" />
              <image
                href={artwork}
                x="-30"
                y="-30"
                width="60"
                height="60"
                clipPath="url(#albumArtClipLarge)"
                preserveAspectRatio="xMidYMid slice"
              />
              {/* Center spindle brass hole */}
              <circle cx="0" cy="0" r="5" fill="#08080a" stroke="#ffffff" strokeWidth="1.8" />
            </g>
          </g>

          {/* Target Stylus Lamp (Left of Tonearm) */}
          <circle cx="82" cy="34" r="6" fill="#141418" stroke="#ffffff" strokeWidth="1.8" />
          <circle cx="82" cy="34" r="2.5" fill={isPlaying ? '#ffe0a3' : '#3a3a44'} />

          {/* Right Side: Pitch Fader (Clickable Scrub / Pitch) */}
          <g
            onClick={(e) => {
              e.stopPropagation();
              const rect = e.currentTarget.getBoundingClientRect();
              const ratio = Math.max(0, Math.min(1, (e.clientY - rect.top) / rect.height));
              onSeek(ratio * safeDuration);
            }}
            className="cursor-pointer"
          >
            <rect x="272" y="118" width="16" height="68" rx="4" fill="#0a0a0d" stroke="#ffffff" strokeWidth="1.8" />
            <line x1="280" y1="124" x2="280" y2="180" stroke="#ffffff" strokeWidth="1.2" strokeDasharray="3 3" />
            {/* Pitch Fader Handle */}
            <rect
              x="267"
              y={124 + progressRatio * 48}
              width="26"
              height="10"
              rx="2.5"
              fill="#2c2c36"
              stroke="#ffffff"
              strokeWidth="1.8"
              className="transition-all duration-150"
            />
          </g>

          {/* START / STOP Button (Bottom-Right) - Fully Interactive */}
          <g
            transform="translate(248, 212)"
            onClick={(e) => {
              e.stopPropagation();
              onTogglePlay();
            }}
            className="cursor-pointer hover:opacity-85 active:scale-95 transition"
          >
            <rect
              x="-20"
              y="-12"
              width="40"
              height="24"
              rx="5"
              fill={isPlaying ? '#f43f5e' : '#141418'}
              stroke="#ffffff"
              strokeWidth="2.4"
            />
            <text
              x="0"
              y="4"
              fill="#ffffff"
              fontSize="8"
              fontWeight="bold"
              fontFamily="sans-serif"
              textAnchor="middle"
            >
              {isPlaying ? 'STOP' : 'START'}
            </text>
          </g>

          {/* PROMINENT TONEARM ROD (Matches Reference Sketch) */}
          <g
            transform="translate(262, 54)"
            onClick={(e) => {
              e.stopPropagation();
              onTogglePlay();
            }}
            className="cursor-pointer"
          >
            {/* Gimbal / Pivot Circular Base at Top-Right */}
            <circle cx="0" cy="0" r="25" fill="#141418" stroke="#ffffff" strokeWidth="3" />
            <circle cx="0" cy="0" r="18" fill="#0a0a0d" stroke="#ffffff" strokeWidth="1.8" />
            <circle cx="0" cy="0" r="9" fill="#24242e" stroke="#ffffff" strokeWidth="1.8" />

            {/* Heavy Cylindrical Counterweight behind pivot */}
            <rect x="-8" y="-32" width="16" height="20" rx="4" fill="#181820" stroke="#ffffff" strokeWidth="2.2" />
            <line x1="-8" y1="-22" x2="8" y2="-22" stroke="#ffffff" strokeWidth="1.5" />

            {/* Tonearm Rest Cradle Stand */}
            <rect x="-5" y="70" width="10" height="15" rx="3" fill="#0a0a0d" stroke="#ffffff" strokeWidth="1.8" />
            <path d="M -8,70 L 8,70" stroke="#ffffff" strokeWidth="2.4" strokeLinecap="round" />

            {/* THE METALLIC TONEARM ROD (Arches Across Vinyl Body) */}
            <g
              style={{
                transform: isPlaying ? 'rotate(28deg)' : 'rotate(0deg)',
                transformOrigin: '0px 0px',
                transition: 'transform 0.85s cubic-bezier(0.25, 1, 0.5, 1)',
              }}
            >
              {/* Bold Outer S-Curved Metallic Rod Outline */}
              <path
                d="M 0,0 C -8,38 10,80 -42,126 C -56,138 -64,148 -72,158"
                fill="none"
                stroke="#ffffff"
                strokeWidth="4.5"
                strokeLinecap="round"
              />
              {/* Inner metallic tube core */}
              <path
                d="M 0,0 C -8,38 10,80 -42,126 C -56,138 -64,148 -72,158"
                fill="none"
                stroke="#1c1c24"
                strokeWidth="1.8"
                strokeLinecap="round"
              />

              {/* Headshell & Stylus Needle Cartridge (Resting on Vinyl Body) */}
              <g transform="translate(-72, 158) rotate(44)">
                {/* Cartridge body */}
                <polygon
                  points="-6,-14 6,-14 5,16 -5,16"
                  fill="#181822"
                  stroke="#ffffff"
                  strokeWidth="2.4"
                />
                {/* Finger lift hook */}
                <path d="M 6,-4 Q 13,-9 14,-2" fill="none" stroke="#ffffff" strokeWidth="1.8" strokeLinecap="round" />
                {/* Stylus needle body */}
                <rect x="-2.5" y="16" width="5" height="5" fill="#ffffff" />
                {/* Glowing stylus tip indicator */}
                <circle cx="0" cy="21" r="2" fill={isPlaying ? '#f43f5e' : '#ffffff'} />
              </g>
            </g>
          </g>
        </svg>
      </div>

      {/* Song Metadata, Track Controls & Interactive Progress Bar */}
      <div className="w-full flex flex-col gap-2 px-1">
        {/* Track Title and Artist */}
        <div className="flex items-center justify-between gap-2">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-1.5">
              <p className="text-sm font-bold text-white truncate leading-snug">
                {currentTrack?.title || 'No Track Selected'}
              </p>
              {isSpotifyActive && (
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse flex-shrink-0" title="Spotify Active" />
              )}
            </div>
            <p className="text-xs text-rose-300/80 truncate mt-0.5 font-medium">
              {currentTrack?.artist || 'Ready to spin'}
            </p>
          </div>

          {/* Time display */}
          <span className="text-[11px] font-mono text-white/50 flex-shrink-0">
            {formatTime(currentTime)} / {formatTime(safeDuration)}
          </span>
        </div>

        {/* Tactile Playback & Skip Controls (Previous, Play/Pause, Next) */}
        <div className="flex items-center justify-between pt-1">
          <div className="flex items-center gap-2">
            {/* Skip Previous Button */}
            {onPrevTrack && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onPrevTrack();
                }}
                className="p-1.5 rounded-full bg-white/10 hover:bg-white/20 active:scale-95 text-white/80 hover:text-white transition"
                title="Previous Track (P)"
              >
                <SkipBack className="w-4 h-4 fill-current" />
              </button>
            )}

            {/* Play / Pause Toggle Button */}
            <button
              onClick={(e) => {
                e.stopPropagation();
                onTogglePlay();
              }}
              className="px-3 py-1 rounded-full bg-rose-500 hover:bg-rose-600 active:scale-95 text-white flex items-center gap-1.5 shadow-lg transition"
              title={isPlaying ? 'Pause' : 'Play'}
            >
              {isPlaying ? (
                <>
                  <Pause className="w-3.5 h-3.5 fill-current" />
                  <span className="text-xs font-bold uppercase tracking-wider">Pause</span>
                </>
              ) : (
                <>
                  <Play className="w-3.5 h-3.5 fill-current ml-0.5" />
                  <span className="text-xs font-bold uppercase tracking-wider">Play</span>
                </>
              )}
            </button>

            {/* Skip Next Button */}
            {onNextTrack && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onNextTrack();
                }}
                className="p-1.5 rounded-full bg-white/10 hover:bg-white/20 active:scale-95 text-white/80 hover:text-white transition"
                title="Next Track (N)"
              >
                <SkipForward className="w-4 h-4 fill-current" />
              </button>
            )}
          </div>

          <span className="text-[10px] font-mono uppercase tracking-widest text-white/40">
            {isPlaying ? 'Spinning' : 'Paused'}
          </span>
        </div>

        {/* Interactive Progress Scrubbing Bar */}
        <div
          onClick={(e) => {
            const rect = e.currentTarget.getBoundingClientRect();
            const ratio = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
            onSeek(ratio * safeDuration);
          }}
          className="w-full h-2 bg-white/15 hover:h-3 rounded-full cursor-pointer transition-all overflow-hidden mt-1 group/bar"
          title="Click to Seek"
        >
          <div
            className="h-full bg-gradient-to-r from-rose-400 via-pink-400 to-amber-300 rounded-full transition-all duration-100"
            style={{ width: `${progressRatio * 100}%` }}
          />
        </div>
      </div>
    </div>
  );
};
