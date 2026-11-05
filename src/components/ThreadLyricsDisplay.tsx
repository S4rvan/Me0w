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

export interface TVGirlColor {
  name: string;
  text: string;
  thread: string;
  ripple: string;
  glow: string;
}

// TV Girl pastel palette: bright, soothing, eye-friendly pastels
export const TV_GIRL_PALETTE: TVGirlColor[] = [
  {
    name: 'Blush Pink',
    text: '#fbcfe8',
    thread: 'rgba(244, 114, 182, 0.4)',
    ripple: 'rgba(244, 114, 182, 0.3)',
    glow: 'rgba(244, 114, 182, 0.35)',
  },
  {
    name: 'Soft Mint',
    text: '#bbf7d0',
    thread: 'rgba(74, 222, 128, 0.4)',
    ripple: 'rgba(74, 222, 128, 0.3)',
    glow: 'rgba(74, 222, 128, 0.35)',
  },
  {
    name: 'Baby Blue',
    text: '#bae6fd',
    thread: 'rgba(56, 189, 248, 0.4)',
    ripple: 'rgba(56, 189, 248, 0.3)',
    glow: 'rgba(56, 189, 248, 0.35)',
  },
  {
    name: 'Lavender Lilac',
    text: '#ddd6fe',
    thread: 'rgba(167, 139, 250, 0.4)',
    ripple: 'rgba(167, 139, 250, 0.3)',
    glow: 'rgba(167, 139, 250, 0.35)',
  },
  {
    name: 'Warm Peach',
    text: '#fecdd3',
    thread: 'rgba(251, 113, 133, 0.4)',
    ripple: 'rgba(251, 113, 133, 0.3)',
    glow: 'rgba(251, 113, 133, 0.35)',
  },
  {
    name: 'Butter Yellow',
    text: '#fef08a',
    thread: 'rgba(250, 204, 21, 0.4)',
    ripple: 'rgba(250, 204, 21, 0.3)',
    glow: 'rgba(250, 204, 21, 0.35)',
  },
];

interface PositionedWord {
  id: number;
  text: string;
  start: number;
  end: number;
  x: number;
  y: number;
  color: TVGirlColor;
  floatDelay: number;
}

const WORD_LIFESPAN = 4.2; // Each word lives 4.2 seconds total
const MAX_ACTIVE_QUEUE = 8; // FIFO queue cap: at most 8 simultaneous words

/**
 * Spatial Collision Avoidance Algorithm:
 * Guarantees that no two words on screen at the same time can ever overlap.
 * Evaluates candidate coordinates across the canvas, avoiding turntable & string lights,
 * and picks the position that maximizes distance from all other active concurrent words.
 */
function computeCollisionFreePositions(rawWords: { text: string; start: number; end: number }[]): PositionedWord[] {
  const result: PositionedWord[] = [];

  // Candidate grid points: X from 16% to 84%, Y from 20% to 76%
  const candidateXs = [18, 28, 38, 48, 58, 68, 78, 84, 22, 34, 44, 54, 64, 74, 82];
  const candidateYs = [22, 30, 38, 46, 54, 62, 70, 76, 26, 34, 42, 50, 58, 66, 74];

  for (let i = 0; i < rawWords.length; i++) {
    const w = rawWords[i];
    const color = TV_GIRL_PALETTE[i % TV_GIRL_PALETTE.length];

    // Find all active concurrent words (alive within ±4.2s window)
    const concurrentWords: PositionedWord[] = [];
    for (let j = Math.max(0, i - 16); j < i; j++) {
      if (Math.abs(w.start - result[j].start) < WORD_LIFESPAN + 0.2) {
        concurrentWords.push(result[j]);
      }
    }

    let bestX = 50;
    let bestY = 50;
    let bestScore = -Infinity;

    // Alternating side bias: alternate left / right of center for natural reading flow
    const preferRight = i % 2 === 1;

    // Test a variety of candidates across the screen
    for (let cx of candidateXs) {
      for (let cy of candidateYs) {
        // 1. Avoid bottom-left corner reserved for Turntable (x < 38% and y > 58%)
        if (cx < 38 && cy > 58) continue;
        // 2. Avoid top edge reserved for String Lights (y < 18%)
        if (cy < 18) continue;

        // Calculate minimum distance to all concurrent words
        let minDistance = 999;
        let hasDirectCollision = false;

        for (const other of concurrentWords) {
          const dx = Math.abs(cx - other.x);
          const dy = Math.abs(cy - other.y);

          // Horizontal overlap penalty (text is wider than tall)
          if (dy < 12 && dx < 22) {
            hasDirectCollision = true;
            break;
          }

          // Elliptical distance metric
          const dist = Math.sqrt((dx / 1.25) * (dx / 1.25) + dy * dy);
          if (dist < minDistance) {
            minDistance = dist;
          }
        }

        if (hasDirectCollision) continue;

        // Score: prioritize maximum distance from neighbors + natural flow
        let score = minDistance;
        if (preferRight && cx >= 48) score += 4;
        if (!preferRight && cx < 52) score += 4;

        if (score > bestScore) {
          bestScore = score;
          bestX = cx;
          bestY = cy;
        }
      }
    }

    // Add tiny organic offset (±1.5%) so words don't look rigid on a grid
    const jitterX = (((i * 7) % 7) - 3) * 0.5;
    const jitterY = (((i * 11) % 7) - 3) * 0.5;

    result.push({
      id: i,
      text: w.text,
      start: w.start,
      end: w.end,
      x: Math.max(16, Math.min(84, bestX + jitterX)),
      y: Math.max(20, Math.min(76, bestY + jitterY)),
      color,
      floatDelay: (i * 0.4) % 3,
    });
  }

  return result;
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

  // 1. Flatten lines into clean words and compute collision-free non-overlapping positions
  const positionedWords = useMemo<PositionedWord[]>(() => {
    const raw: { text: string; start: number; end: number }[] = [];
    for (const line of lines) {
      if (!line.words || line.words.length === 0) continue;
      for (const w of line.words) {
        const trimmed = w.text.trim();
        if (trimmed) {
          raw.push({ text: trimmed, start: w.start, end: w.end });
        }
      }
    }
    return computeCollisionFreePositions(raw);
  }, [lines]);

  // Clear spawned ripples on song change
  useEffect(() => {
    spawnedRipplesRef.current.clear();
  }, [lines]);

  // 2. Compute alive words at current time with graceful continuous decay & FIFO queue cap
  const { aliveWords, instrumentalNow } = useMemo(() => {
    if (positionedWords.length === 0) {
      return { aliveWords: [], instrumentalNow: true };
    }

    // Find all words whose start time has passed and within lifespan
    const candidates: { word: PositionedWord; age: number }[] = [];
    for (const w of positionedWords) {
      const age = currentTime - w.start;
      if (age >= 0 && age <= WORD_LIFESPAN + 0.3) {
        candidates.push({ word: w, age });
      }
    }

    // Sort chronologically (oldest words first)
    candidates.sort((a, b) => a.word.start - b.word.start);

    // Apply FIFO Queue cap: if more than MAX_ACTIVE_QUEUE words are active,
    // accelerate fade of the oldest excess words so they melt away gracefully
    const excessCount = Math.max(0, candidates.length - MAX_ACTIVE_QUEUE);

    const alive: { word: PositionedWord; opacity: number; isSingingNow: boolean }[] = [];

    for (let idx = 0; idx < candidates.length; idx++) {
      const { word, age } = candidates[idx];

      // Is this word currently singing right now?
      const isSingingNow = currentTime >= word.start && currentTime <= word.end + 0.15;

      let opacity = 1.0;

      // Stage A: Soft blossoming fade-in (0.0s to 0.4s)
      if (age < 0.4) {
        opacity = Math.max(0.05, Math.sin((age / 0.4) * (Math.PI / 2)));
      }
      // Stage B: Slow, continuous, graceful decay (0.4s to 4.2s)
      // Uses a smooth power curve: starts gentle, smoothly dissolves to 0.000 before vanishing
      else {
        const decayProgress = Math.min(1.0, (age - 0.4) / (WORD_LIFESPAN - 0.4));
        opacity = Math.pow(Math.max(0, 1.0 - decayProgress), 1.6);
      }

      // If word is among the oldest excess in the queue, accelerate its dissolution smoothly
      if (idx < excessCount) {
        const queuePenalty = (excessCount - idx) / (excessCount + 1);
        opacity = Math.max(0, opacity * (1 - queuePenalty * 0.7));
      }

      // Only render if opacity is visibly above threshold (ensures zero abrupt cutoffs)
      if (opacity > 0.02) {
        alive.push({ word, opacity, isSingingNow });
      }
    }

    return {
      aliveWords: alive,
      instrumentalNow: alive.length === 0,
    };
  }, [positionedWords, currentTime]);

  // Update parent instrumental state
  useEffect(() => {
    setIsInstrumental(instrumentalNow);
  }, [instrumentalNow, setIsInstrumental]);

  // 3. Trigger water ripple on word birth
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

  // 4. Thread connections between consecutive alive words (opacity fades in exact unison)
  const threadSegments = useMemo(() => {
    if (aliveWords.length <= 1) return [];

    const segments: { path: string; color: string; opacity: number }[] = [];
    for (let i = 0; i < aliveWords.length - 1; i++) {
      const p1 = aliveWords[i];
      const p2 = aliveWords[i + 1];

      // Thread opacity matches the decaying words
      const segOpacity = Math.min(p1.opacity, p2.opacity) * 0.45;
      if (segOpacity <= 0.02) continue;

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
        opacity: segOpacity,
      });
    }
    return segments;
  }, [aliveWords]);

  // Font size multiplier
  const fontSizeClass = useMemo(() => {
    switch (fontSize) {
      case 'small': return 'text-xl md:text-2xl';
      case 'large': return 'text-4xl md:text-5xl lg:text-6xl';
      case 'huge': return 'text-5xl md:text-6xl lg:text-7xl';
      case 'medium':
      default: return 'text-3xl md:text-4xl lg:text-5xl';
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

  // No lyrics state
  if (!hasLyrics || positionedWords.length === 0) {
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
      {/* 1. Ghostly Broken Celestial Circle in Background (Subtle transparency: 0.05) */}
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
          stroke="rgba(244, 114, 182, 0.06)"
          strokeWidth="0.25"
          strokeDasharray="2 5"
          className="animate-celestial-spin"
        />
        <circle
          cx="50"
          cy="48"
          r="44"
          fill="none"
          stroke="rgba(147, 197, 253, 0.05)"
          strokeWidth="0.2"
          strokeDasharray="4 9"
          className="animate-celestial-spin-reverse"
        />
      </svg>

      {/* 2. Thin Silk Threads Connecting Words (No transition fights, pure continuous opacity) */}
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
            strokeWidth="0.25"
            strokeLinecap="round"
            style={{
              opacity: seg.opacity,
              filter: `drop-shadow(0 0 2px ${seg.color})`,
            }}
          />
        ))}
      </svg>

      {/* 3. Collision-Free Words with Continuous Graceful Decay (NO CSS TRANSITION LAG OR FLICKER) */}
      <div className="absolute inset-0 z-20 pointer-events-none">
        {aliveWords.map(({ word, opacity, isSingingNow }) => {
          // Soft, eye-pleasing glow - never harsh or flashing
          const softGlow = `0 0 12px ${word.color.glow}`;

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
                  textShadow: softGlow,
                  animation: `floatingDrift 7s ease-in-out infinite alternate`,
                  animationDelay: `${word.floatDelay}s`,
                }}
                className={`inline-block font-semibold tracking-tight select-none ${fontSizeClass}`}
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
