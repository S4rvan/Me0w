import React, { useMemo, useEffect, useRef } from 'react';
import { LyricLine, FontSizeSetting } from '../types';
import { RippleEvent } from './WaterSurface';

interface ThreadLyricsDisplayProps {
  lines: LyricLine[];
  currentTime: number;
  onSeek: (time: number) => void;
  fontSize: FontSizeSetting;
  isLoadingLyrics: boolean;
  hasLyrics: boolean;
  trackTitle?: string;
  trackArtist?: string;
  onOpenSearch?: () => void;
  onSpawnRipple: (ripple: RippleEvent) => void;
  isInstrumental: boolean;
  setIsInstrumental: (val: boolean) => void;
}

interface TVGirlColor {
  name: string;
  text: string;
  thread: string;
  ripple: string;
  glow: string;
}

// Iconic TV Girl aesthetic palette: bright but soft & soothing pastels (easy on the eyes)
const TV_GIRL_PALETTE: TVGirlColor[] = [
  {
    name: 'Blush Pink',
    text: '#fbcfe8', // pale pink
    thread: 'rgba(244, 114, 182, 0.45)',
    ripple: 'rgba(244, 114, 182, 0.35)',
    glow: 'rgba(244, 114, 182, 0.25)',
  },
  {
    name: 'Soft Mint',
    text: '#bbf7d0', // pale light green
    thread: 'rgba(74, 222, 128, 0.45)',
    ripple: 'rgba(74, 222, 128, 0.35)',
    glow: 'rgba(74, 222, 128, 0.25)',
  },
  {
    name: 'Baby Blue',
    text: '#bae6fd', // pale baby blue
    thread: 'rgba(56, 189, 248, 0.45)',
    ripple: 'rgba(56, 189, 248, 0.35)',
    glow: 'rgba(56, 189, 248, 0.25)',
  },
  {
    name: 'Lavender Lilac',
    text: '#ddd6fe', // pale lavender
    thread: 'rgba(167, 139, 250, 0.45)',
    ripple: 'rgba(167, 139, 250, 0.35)',
    glow: 'rgba(167, 139, 250, 0.25)',
  },
  {
    name: 'Warm Peach',
    text: '#fecdd3', // soft blush coral / light red
    thread: 'rgba(251, 113, 133, 0.45)',
    ripple: 'rgba(251, 113, 133, 0.35)',
    glow: 'rgba(251, 113, 133, 0.25)',
  },
  {
    name: 'Butter Yellow',
    text: '#fef08a', // pale buttercream
    thread: 'rgba(250, 204, 21, 0.45)',
    ripple: 'rgba(250, 204, 21, 0.35)',
    glow: 'rgba(250, 204, 21, 0.25)',
  },
];

interface FlattenedWord {
  id: number;
  lineId: number;
  text: string;
  start: number;
  end: number;
  x: number;
  y: number;
  color: TVGirlColor;
  floatDelay: number;
}

// 4 Seconds Total Lifespan with Smooth Fade Decay
const WORD_LIFESPAN = 4.0;   // Word lives for 4.0s
const WORD_HOLD_TIME = 2.4;  // Fully bright for 2.4s
const WORD_FADE_TIME = 1.6;  // Decays smoothly over 1.6s

// 8 Far-Apart Spatial Anchor Zones (Guarantees zero clumping, separated by 30-70% screen distance)
const SPATIOUS_ZONES: { x: number; y: number }[] = [
  { x: 22, y: 28 }, // 0: Top-Left
  { x: 78, y: 70 }, // 1: Bottom-Right
  { x: 76, y: 28 }, // 2: Top-Right
  { x: 24, y: 70 }, // 3: Bottom-Left
  { x: 28, y: 48 }, // 4: Mid-Left
  { x: 72, y: 48 }, // 5: Mid-Right
  { x: 50, y: 22 }, // 6: Center-Top
  { x: 50, y: 74 }, // 7: Center-Bottom
];

function getSpaciousCoordinates(index: number): { x: number; y: number } {
  // Alternate across polar opposite zones
  const zone = SPATIOUS_ZONES[index % SPATIOUS_ZONES.length];
  // Tiny organic drift (±2%) so it feels natural
  const jitterX = ((index * 7) % 5) - 2;
  const jitterY = ((index * 11) % 5) - 2;

  return {
    x: Math.max(16, Math.min(84, zone.x + jitterX)),
    y: Math.max(20, Math.min(76, zone.y + jitterY)),
  };
}

export const ThreadLyricsDisplay: React.FC<ThreadLyricsDisplayProps> = ({
  lines,
  currentTime,
  onSeek,
  fontSize,
  isLoadingLyrics,
  hasLyrics,
  trackTitle,
  trackArtist,
  onOpenSearch,
  onSpawnRipple,
  isInstrumental,
  setIsInstrumental,
}) => {
  const spawnedRipplesRef = useRef<Set<number>>(new Set());

  // 1. Flatten all words with pre-computed spacious positions & TV Girl colors
  const allWords = useMemo<FlattenedWord[]>(() => {
    const list: FlattenedWord[] = [];
    let counter = 0;

    for (const line of lines) {
      if (!line.words || line.words.length === 0) continue;
      for (const w of line.words) {
        if (!w.text.trim()) continue;
        const pos = getSpaciousCoordinates(counter);
        const color = TV_GIRL_PALETTE[counter % TV_GIRL_PALETTE.length];

        list.push({
          id: counter,
          lineId: line.id,
          text: w.text.trim(),
          start: w.start,
          end: w.end,
          x: pos.x,
          y: pos.y,
          color,
          floatDelay: (counter * 0.5) % 3,
        });
        counter++;
      }
    }
    return list;
  }, [lines]);

  // Reset ripple tracking if track changes
  useEffect(() => {
    spawnedRipplesRef.current.clear();
  }, [lines]);

  // 2. Compute alive words using the 4-second lifecycle with continuous decay
  const { aliveWords, instrumentalNow, activeWord } = useMemo(() => {
    if (allWords.length === 0) {
      return { aliveWords: [], instrumentalNow: true, activeWord: null };
    }

    const alive: { word: FlattenedWord; opacity: number; scale: number; isCurrent: boolean }[] = [];
    let current: FlattenedWord | null = null;

    for (const word of allWords) {
      const age = currentTime - word.start;

      // Word has started and has not exceeded 4 seconds lifespan
      if (age >= 0 && age <= WORD_LIFESPAN) {
        let opacity = 1.0;
        let scale = 1.0;
        const isCurrent = currentTime >= word.start && currentTime <= word.end;

        if (isCurrent) {
          current = word;
          scale = 1.08;
        }

        // Entrance fade-in (first 0.35s)
        if (age < 0.35) {
          opacity = Math.max(0.1, age / 0.35);
          scale = 0.9 + 0.1 * (age / 0.35);
        }
        // Decay phase (from 2.4s to 4.0s)
        else if (age >= WORD_HOLD_TIME) {
          const decayProgress = Math.min(1, (age - WORD_HOLD_TIME) / WORD_FADE_TIME);
          // Smooth sinusoidal fade-out
          opacity = Math.max(0, 1 - Math.sin(decayProgress * (Math.PI / 2)));
          scale = 1.0 - 0.08 * decayProgress;
        }

        if (opacity > 0.01) {
          alive.push({ word, opacity, scale, isCurrent });
        }
      }
    }

    return {
      aliveWords: alive,
      instrumentalNow: alive.length === 0,
      activeWord: current,
    };
  }, [allWords, currentTime]);

  // Update parent instrumental state for ambient water droplets
  useEffect(() => {
    setIsInstrumental(instrumentalNow);
  }, [instrumentalNow, setIsInstrumental]);

  // 3. Spawn water ripples on word birth
  useEffect(() => {
    for (const item of aliveWords) {
      if (!spawnedRipplesRef.current.has(item.word.id)) {
        spawnedRipplesRef.current.add(item.word.id);
        onSpawnRipple({
          id: Date.now() + Math.random(),
          xPercent: item.word.x,
          yPercent: item.word.y,
          color: item.word.color.ripple,
          size: 240,
        });
      }
    }
  }, [aliveWords, onSpawnRipple]);

  // 4. Smooth connecting threads between alive words with synchronized opacity decay
  const threadSegments = useMemo(() => {
    if (aliveWords.length <= 1) return [];

    const segments: { path: string; color: string; opacity: number }[] = [];
    for (let i = 0; i < aliveWords.length - 1; i++) {
      const p1 = aliveWords[i];
      const p2 = aliveWords[i + 1];

      // Thread opacity matches the decaying words
      const segmentOpacity = Math.min(p1.opacity, p2.opacity) * 0.55;
      if (segmentOpacity <= 0.02) continue;

      const dx = p2.word.x - p1.word.x;
      const dy = p2.word.y - p1.word.y;
      const midX = (p1.word.x + p2.word.x) / 2;
      const midY = (p1.word.y + p2.word.y) / 2;

      // Gentle organic curve
      const ctrlX = midX - dy * 0.12;
      const ctrlY = midY + dx * 0.12;

      segments.push({
        path: `M ${p1.word.x},${p1.word.y} Q ${ctrlX},${ctrlY} ${p2.word.x},${p2.word.y}`,
        color: p2.word.color.thread,
        opacity: segmentOpacity,
      });
    }
    return segments;
  }, [aliveWords]);

  // Font size multiplier (Bigger and clearer)
  const fontSizeClass = useMemo(() => {
    switch (fontSize) {
      case 'small': return 'text-2xl md:text-3xl';
      case 'large': return 'text-4xl md:text-6xl lg:text-7xl';
      case 'huge': return 'text-5xl md:text-7xl lg:text-8xl';
      case 'medium':
      default: return 'text-3xl md:text-5xl lg:text-6xl';
    }
  }, [fontSize]);

  // Loading state
  if (isLoadingLyrics) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-center px-6 select-none bg-black">
        <div className="w-8 h-8 mb-4 rounded-full border-2 border-t-pink-300 border-white/10 animate-spin" />
        <p className="text-xs font-mono text-pink-200/50 tracking-widest uppercase animate-pulse">
          Summoning lyrics...
        </p>
      </div>
    );
  }

  // No lyrics
  if (!hasLyrics || allWords.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-center px-6 select-none bg-black">
        <h2 className="text-2xl md:text-3xl font-light text-pink-200/70 mb-2 tracking-wider">
          {trackTitle ? trackTitle : 'Tranquil Water'}
        </h2>
        <p className="text-xs text-white/40 mb-6 font-mono tracking-widest">
          {trackArtist ? trackArtist : 'Play music to summon words into the pond'}
        </p>
        {onOpenSearch && (
          <button
            onClick={onOpenSearch}
            className="px-6 py-2.5 rounded-full bg-white/10 hover:bg-white/20 text-white font-medium text-xs tracking-wider border border-white/15 transition shadow-lg"
          >
            Choose a Track
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="relative w-full h-full bg-black overflow-hidden select-none">
      {/* 1. Ghostly Broken Celestial Circle in Background (Ultra-transparent: 0.07) */}
      <svg
        className="absolute inset-0 w-full h-full pointer-events-none z-0"
        viewBox="0 0 100 100"
        preserveAspectRatio="none"
      >
        <circle
          cx="50"
          cy="48"
          r="34"
          fill="none"
          stroke="rgba(244, 114, 182, 0.08)"
          strokeWidth="0.25"
          strokeDasharray="2 5"
          className="animate-celestial-spin"
        />
        <circle
          cx="50"
          cy="48"
          r="44"
          fill="none"
          stroke="rgba(147, 197, 253, 0.06)"
          strokeWidth="0.2"
          strokeDasharray="4 9"
          className="animate-celestial-spin-reverse"
        />
      </svg>

      {/* 2. Thin, Delicate Luminous Threads with Synchronized Opacity Decay */}
      <svg
        className="absolute inset-0 w-full h-full pointer-events-none z-10"
        viewBox="0 0 100 100"
        preserveAspectRatio="none"
      >
        {threadSegments.map((seg, idx) => (
          <path
            key={`thread-${idx}`}
            d={seg.path}
            fill="none"
            stroke={seg.color}
            strokeWidth="0.28" // Very thin and wispy
            strokeLinecap="round"
            style={{
              opacity: seg.opacity,
              transition: 'opacity 0.2s linear',
              filter: `drop-shadow(0 0 2px ${seg.color})`,
            }}
          />
        ))}

        {/* Broken pulsing ring around active singing word */}
        {activeWord && (
          <circle
            cx={activeWord.x}
            cy={activeWord.y}
            r="6.5"
            fill="none"
            stroke={activeWord.color.thread}
            strokeWidth="0.22"
            strokeDasharray="1.2 2"
            className="animate-broken-ring-pulse"
          />
        )}
      </svg>

      {/* 3. Spacious Alive Words with Smooth 4-Second Lifecycle Decay */}
      <div className="absolute inset-0 z-20 pointer-events-none">
        {aliveWords.map(({ word, opacity, scale, isCurrent }) => {
          const glowStyle = isCurrent
            ? `0 0 24px ${word.color.glow}, 0 0 40px ${word.color.glow}`
            : `0 0 14px ${word.color.glow}`;

          return (
            <div
              key={word.id}
              onClick={(e) => {
                e.stopPropagation();
                onSeek(word.start);
              }}
              className="absolute -translate-x-1/2 -translate-y-1/2 pointer-events-auto cursor-pointer"
              style={{
                left: `${word.x}%`,
                top: `${word.y}%`,
              }}
            >
              <span
                style={{
                  color: word.color.text,
                  opacity,
                  textShadow: glowStyle,
                  transform: `scale(${scale})`,
                  transition: 'opacity 0.25s linear, transform 0.25s ease',
                  animation: `floatingDrift 6s ease-in-out infinite alternate`,
                  animationDelay: `${word.floatDelay}s`,
                }}
                className={`inline-block font-extrabold tracking-tight select-none ${fontSizeClass}`}
              >
                {word.text}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
};
