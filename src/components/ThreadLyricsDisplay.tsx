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

// Iconic TV Girl aesthetic palette: bright but soft & soothing pastels
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

const QUEUE_CAP = 8; // 8 spacious words in queue with plenty of room
const IDLE_FADE_DELAY = 1.4; // Fade words after 1.4s of silence

// 12 Spacious Non-Overlapping Spatial Anchor Regions
const SPATIOUS_ANCHORS: { x: number; y: number }[] = [
  { x: 22, y: 32 }, // 0: Top-Left
  { x: 50, y: 25 }, // 1: Top-Center
  { x: 78, y: 32 }, // 2: Top-Right
  { x: 30, y: 48 }, // 3: Mid-Left
  { x: 70, y: 46 }, // 4: Mid-Right
  { x: 24, y: 66 }, // 5: Bottom-Left
  { x: 52, y: 68 }, // 6: Bottom-Center
  { x: 78, y: 64 }, // 7: Bottom-Right
  { x: 38, y: 36 }, // 8: Center-Upper-Left
  { x: 64, y: 56 }, // 9: Center-Lower-Right
  { x: 36, y: 60 }, // 10: Center-Lower-Left
  { x: 62, y: 32 }, // 11: Center-Upper-Right
];

// Spatially separated leap coordinate generator: guarantees words are spaced far apart
function getSpaciousWordCoordinates(index: number): { x: number; y: number } {
  // Use prime leap multiplier 7 to ensure consecutive words jump across opposite quadrants
  const anchorIdx = (index * 7) % SPATIOUS_ANCHORS.length;
  const base = SPATIOUS_ANCHORS[anchorIdx];

  // Subtle organic float offset (±2%) so it never feels robotic
  const jitterX = ((index * 11) % 5) - 2;
  const jitterY = ((index * 13) % 5) - 2;

  return {
    x: Math.max(18, Math.min(82, base.x + jitterX)),
    y: Math.max(22, Math.min(74, base.y + jitterY)),
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
  const lastSpawnedWordId = useRef<number>(-1);

  // 1. Flatten all words with TV Girl pastel colors & spacious non-overlapping positions
  const allWords = useMemo<FlattenedWord[]>(() => {
    const list: FlattenedWord[] = [];
    let counter = 0;

    for (const line of lines) {
      if (!line.words || line.words.length === 0) continue;
      for (const w of line.words) {
        if (!w.text.trim()) continue;
        const pos = getSpaciousWordCoordinates(counter);
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
          floatDelay: (counter * 0.4) % 3,
        });
        counter++;
      }
    }
    return list;
  }, [lines]);

  // 2. Find current active word index
  const currentWordIndex = useMemo(() => {
    if (allWords.length === 0) return -1;
    if (currentTime < allWords[0].start - 0.1) return -1;

    for (let i = allWords.length - 1; i >= 0; i--) {
      if (currentTime >= allWords[i].start - 0.08) {
        return i;
      }
    }
    return -1;
  }, [allWords, currentTime]);

  // 3. Instrumental break & silence detection
  const { instrumentalNow, idleFadeRatio } = useMemo(() => {
    if (currentWordIndex === -1) {
      return { instrumentalNow: true, idleFadeRatio: 0 };
    }
    const currentWord = allWords[currentWordIndex];
    const timeSinceEnd = currentTime - currentWord.end;

    const nextWord = allWords[currentWordIndex + 1];
    const isWaitingForNext = nextWord ? currentTime < nextWord.start : true;

    if (timeSinceEnd > IDLE_FADE_DELAY && isWaitingForNext) {
      const fadeProgress = Math.min(1, (timeSinceEnd - IDLE_FADE_DELAY) / 1.3);
      return {
        instrumentalNow: fadeProgress >= 1,
        idleFadeRatio: 1 - fadeProgress,
      };
    }

    return { instrumentalNow: false, idleFadeRatio: 1 };
  }, [allWords, currentWordIndex, currentTime]);

  // Update parent instrumental state for ambient water droplets
  useEffect(() => {
    setIsInstrumental(instrumentalNow);
  }, [instrumentalNow, setIsInstrumental]);

  // 4. Compute active queue of 7-8 spacious words
  const queueWords = useMemo(() => {
    if (currentWordIndex === -1 || instrumentalNow) return [];

    const startIndex = Math.max(0, currentWordIndex - QUEUE_CAP + 1);
    const endIndex = currentWordIndex;
    return allWords.slice(startIndex, endIndex + 1);
  }, [allWords, currentWordIndex, instrumentalNow]);

  // 5. Spawn water ripple whenever a new word arrives on screen!
  useEffect(() => {
    if (currentWordIndex !== -1 && currentWordIndex !== lastSpawnedWordId.current) {
      lastSpawnedWordId.current = currentWordIndex;
      const word = allWords[currentWordIndex];
      if (word) {
        onSpawnRipple({
          id: Date.now() + Math.random(),
          xPercent: word.x,
          yPercent: word.y,
          color: word.color.ripple,
          size: 220,
        });
      }
    }
  }, [currentWordIndex, allWords, onSpawnRipple]);

  // 6. Connect words with thin, delicate, pale colored threads
  const threadSegments = useMemo(() => {
    if (queueWords.length <= 1) return [];

    const segments: { path: string; color: string }[] = [];
    for (let i = 0; i < queueWords.length - 1; i++) {
      const p1 = queueWords[i];
      const p2 = queueWords[i + 1];

      // Smooth flowing cubic bezier curve
      const dx = p2.x - p1.x;
      const dy = p2.y - p1.y;
      const midX = (p1.x + p2.x) / 2;
      const midY = (p1.y + p2.y) / 2;

      const ctrlX = midX - dy * 0.14;
      const ctrlY = midY + dx * 0.14;

      segments.push({
        path: `M ${p1.x},${p1.y} Q ${ctrlX},${ctrlY} ${p2.x},${p2.y}`,
        color: p2.color.thread,
      });
    }
    return segments;
  }, [queueWords]);

  // Font size multiplier (Spacious and large)
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

  // No lyrics or track not selected
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

  const activeWord = currentWordIndex !== -1 ? allWords[currentWordIndex] : null;

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

      {/* 2. Delicate, Thin, Pale-Colored Threads */}
      <svg
        className="absolute inset-0 w-full h-full pointer-events-none z-10 transition-opacity duration-700"
        viewBox="0 0 100 100"
        preserveAspectRatio="none"
        style={{ opacity: idleFadeRatio }}
      >
        {threadSegments.map((seg, idx) => (
          <path
            key={`thread-${idx}`}
            d={seg.path}
            fill="none"
            stroke={seg.color}
            strokeWidth="0.28" // Very thin and delicate
            strokeLinecap="round"
            className="animate-thread-appear"
            style={{
              filter: `drop-shadow(0 0 2px ${seg.color})`,
            }}
          />
        ))}

        {/* Ultra-transparent broken circle around the active singing word */}
        {activeWord && (
          <circle
            cx={activeWord.x}
            cy={activeWord.y}
            r="6"
            fill="none"
            stroke={activeWord.color.thread}
            strokeWidth="0.22"
            strokeDasharray="1.2 2"
            className="animate-broken-ring-pulse"
          />
        )}
      </svg>

      {/* 3. Spacious Floating Words Queue with TV Girl Pastel Aesthetics */}
      <div
        className="absolute inset-0 z-20 pointer-events-none transition-opacity duration-700"
        style={{ opacity: idleFadeRatio }}
      >
        {queueWords.map((word, qIdx) => {
          const isCurrent = word.id === activeWord?.id;
          const isEntering = qIdx === queueWords.length - 1;
          const isOldest = qIdx === 0 && queueWords.length >= QUEUE_CAP;

          // Word styling: TV Girl bright-but-pale soothing pastels
          let wordOpacity = 0.85;
          let glowStyle = `0 0 14px ${word.color.glow}`;

          if (isCurrent) {
            wordOpacity = 1;
            glowStyle = `0 0 24px ${word.color.glow}, 0 0 40px ${word.color.glow}`;
          } else if (isOldest) {
            wordOpacity = 0.28;
          }

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
                  opacity: wordOpacity,
                  textShadow: glowStyle,
                  transition: 'opacity 0.4s ease, transform 0.4s ease, color 0.4s ease',
                  transform: isCurrent ? 'scale(1.1)' : isOldest ? 'scale(0.9)' : 'scale(1)',
                  animation: `floatingDrift 6s ease-in-out infinite alternate`,
                  animationDelay: `${word.floatDelay}s`,
                }}
                className={`inline-block font-extrabold tracking-tight select-none ${fontSizeClass} ${
                  isEntering ? 'animate-word-arrive' : ''
                }`}
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
