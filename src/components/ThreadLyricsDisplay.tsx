import React, { useMemo } from 'react';
import { LyricLine, FontSizeSetting } from '../types';
import { WaterPuddle } from './WaterPuddle';

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
}

interface FlattenedWord {
  id: number;
  lineId: number;
  text: string;
  start: number;
  end: number;
  x: number; // percentage (0 - 100)
  y: number; // percentage (0 - 100)
}

const QUEUE_CAP = 11; // 10-12 words in queue
const IDLE_FADE_DELAY = 1.3; // Fade words after 1.3s of no singing

// Golden spiral organic coordinate generator
function getOrganicWordCoordinates(index: number): { x: number; y: number } {
  // Golden ratio angle distribution for celestial scattered placement
  const goldenAngle = 2.3999632; // ~137.5 degrees
  const angle = index * goldenAngle + 0.5;

  // Varied radius from center (20% to 38% radius)
  const radiusX = 20 + ((index * 7) % 18);
  const radiusY = 15 + ((index * 5) % 14);

  const cx = 50 + Math.cos(angle) * radiusX;
  const cy = 48 + Math.sin(angle) * radiusY;

  // Clamp within safe lyrics boundary (away from string lights & bottom-left vinyl)
  return {
    x: Math.max(18, Math.min(82, cx)),
    y: Math.max(22, Math.min(76, cy)),
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
}) => {
  // 1. Flatten all lyric words into chronological array with pre-computed organic positions
  const allWords = useMemo<FlattenedWord[]>(() => {
    const list: FlattenedWord[] = [];
    let counter = 0;

    for (const line of lines) {
      if (!line.words || line.words.length === 0) continue;
      for (const w of line.words) {
        if (!w.text.trim()) continue;
        const pos = getOrganicWordCoordinates(counter);
        list.push({
          id: counter,
          lineId: line.id,
          text: w.text.trim(),
          start: w.start,
          end: w.end,
          x: pos.x,
          y: pos.y,
        });
        counter++;
      }
    }
    return list;
  }, [lines]);

  // 2. Find current word index based on currentTime
  const currentWordIndex = useMemo(() => {
    if (allWords.length === 0) return -1;
    if (currentTime < allWords[0].start - 0.1) return -1;

    for (let i = allWords.length - 1; i >= 0; i--) {
      if (currentTime >= allWords[i].start - 0.1) {
        return i;
      }
    }
    return -1;
  }, [allWords, currentTime]);

  // 3. Determine if in instrumental break or lyrics pause
  const { isInstrumental, idleFadeRatio } = useMemo(() => {
    if (currentWordIndex === -1) {
      return { isInstrumental: true, idleFadeRatio: 0 };
    }
    const currentWord = allWords[currentWordIndex];
    const timeSinceEnd = currentTime - currentWord.end;

    const nextWord = allWords[currentWordIndex + 1];
    const isWaitingForNext = nextWord ? currentTime < nextWord.start : true;

    if (timeSinceEnd > IDLE_FADE_DELAY && isWaitingForNext) {
      // Fade out over 1.1s
      const fadeProgress = Math.min(1, (timeSinceEnd - IDLE_FADE_DELAY) / 1.1);
      return {
        isInstrumental: fadeProgress >= 1,
        idleFadeRatio: 1 - fadeProgress,
      };
    }

    return { isInstrumental: false, idleFadeRatio: 1 };
  }, [allWords, currentWordIndex, currentTime]);

  // 4. Compute active queue of 10-12 words
  const queueWords = useMemo(() => {
    if (currentWordIndex === -1 || isInstrumental) return [];

    const startIndex = Math.max(0, currentWordIndex - QUEUE_CAP + 1);
    const endIndex = currentWordIndex;
    return allWords.slice(startIndex, endIndex + 1);
  }, [allWords, currentWordIndex, isInstrumental]);

  // 5. Generate connecting thread paths directly from coordinates (NO layout thrashing!)
  const threadPaths = useMemo(() => {
    if (queueWords.length <= 1) return [];

    const paths: string[] = [];
    for (let i = 0; i < queueWords.length - 1; i++) {
      const p1 = queueWords[i];
      const p2 = queueWords[i + 1];

      // Organic curved spline between words
      const midX = (p1.x + p2.x) / 2;
      const midY = (p1.y + p2.y) / 2;
      // Slight perpendicular curve offset
      const dx = p2.x - p1.x;
      const dy = p2.y - p1.y;
      const curveX = midX - dy * 0.15;
      const curveY = midY + dx * 0.15;

      paths.push(`M ${p1.x},${p1.y} Q ${curveX},${curveY} ${p2.x},${p2.y}`);
    }
    return paths;
  }, [queueWords]);

  // Font size multiplier
  const fontSizeClass = useMemo(() => {
    switch (fontSize) {
      case 'small': return 'text-lg md:text-2xl';
      case 'large': return 'text-2xl md:text-4xl';
      case 'huge': return 'text-3xl md:text-5xl';
      case 'medium':
      default: return 'text-xl md:text-3xl';
    }
  }, [fontSize]);

  // Loading state
  if (isLoadingLyrics) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-center px-6 select-none bg-black">
        <div className="w-8 h-8 mb-4 rounded-full border-2 border-t-white border-white/10 animate-spin" />
        <p className="text-xs font-mono text-white/40 tracking-widest uppercase animate-pulse">
          Summoning lyrics...
        </p>
      </div>
    );
  }

  // No lyrics or track not selected
  if (!hasLyrics || allWords.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-center px-6 select-none bg-black">
        <h2 className="text-xl md:text-2xl font-light text-white/70 mb-2 tracking-wider">
          {trackTitle ? trackTitle : 'Tranquil Night'}
        </h2>
        <p className="text-xs text-white/40 mb-6 font-mono tracking-widest">
          {trackArtist ? trackArtist : 'Play a track to watch words materialize'}
        </p>
        {onOpenSearch && (
          <button
            onClick={onOpenSearch}
            className="px-5 py-2 rounded-full bg-white/10 hover:bg-white/20 text-white font-medium text-xs tracking-wider border border-white/15 transition shadow-lg"
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
      {/* 1. Ghostly Broken Celestial Circle in Background (Ultra-transparent: ~0.08) */}
      <svg
        className="absolute inset-0 w-full h-full pointer-events-none z-0"
        viewBox="0 0 100 100"
        preserveAspectRatio="none"
      >
        <circle
          cx="50"
          cy="48"
          r="32"
          fill="none"
          stroke="rgba(255, 255, 255, 0.08)"
          strokeWidth="0.3"
          strokeDasharray="2 4"
          className="animate-celestial-spin"
        />
        <circle
          cx="50"
          cy="48"
          r="42"
          fill="none"
          stroke="rgba(255, 255, 255, 0.05)"
          strokeWidth="0.25"
          strokeDasharray="4 8"
          className="animate-celestial-spin-reverse"
        />
      </svg>

      {/* 2. Water Puddle Ripples During Instrumental / Blank Screen */}
      {isInstrumental && <WaterPuddle />}

      {/* 3. Connecting Luminous Threads SVG */}
      <svg
        className="absolute inset-0 w-full h-full pointer-events-none z-10 transition-opacity duration-700"
        viewBox="0 0 100 100"
        preserveAspectRatio="none"
        style={{ opacity: idleFadeRatio }}
      >
        {/* Soft thread glow */}
        {threadPaths.map((d, idx) => (
          <path
            key={`glow-${idx}`}
            d={d}
            fill="none"
            stroke="rgba(255, 235, 190, 0.25)"
            strokeWidth="0.8"
            style={{ filter: 'blur(1px)' }}
          />
        ))}

        {/* Core delicate luminous thread */}
        {threadPaths.map((d, idx) => (
          <path
            key={`core-${idx}`}
            d={d}
            fill="none"
            stroke="rgba(255, 255, 255, 0.65)"
            strokeWidth="0.35"
          />
        ))}

        {/* Ultra-transparent broken circle around the active singing word */}
        {activeWord && (
          <circle
            cx={activeWord.x}
            cy={activeWord.y}
            r="4.5"
            fill="none"
            stroke="rgba(255, 255, 255, 0.15)"
            strokeWidth="0.3"
            strokeDasharray="1.2 2"
            className="animate-broken-ring-pulse"
          />
        )}
      </svg>

      {/* 4. Scattered Words Queue (Random organic positions) */}
      <div
        className="absolute inset-0 z-20 pointer-events-none transition-opacity duration-700"
        style={{ opacity: idleFadeRatio }}
      >
        {queueWords.map((word, qIdx) => {
          const isCurrent = word.id === activeWord?.id;
          const isEntering = qIdx === queueWords.length - 1;
          const isOldest = qIdx === 0 && queueWords.length >= QUEUE_CAP;

          // Opacity fade as words age in the 10-12 word queue
          let wordOpacity = 0.75;
          let textShadow = '0 0 8px rgba(255, 255, 255, 0.2)';
          let textColor = 'text-white/80';

          if (isCurrent) {
            wordOpacity = 1;
            textShadow = '0 0 18px rgba(255, 255, 255, 0.95), 0 0 30px rgba(255, 235, 190, 0.4)';
            textColor = 'text-white';
          } else if (isOldest) {
            wordOpacity = 0.35;
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
                  opacity: wordOpacity,
                  textShadow,
                  transition: 'opacity 0.4s ease, transform 0.4s ease',
                  transform: isCurrent ? 'scale(1.08)' : isOldest ? 'scale(0.92)' : 'scale(1)',
                }}
                className={`inline-block font-medium tracking-normal select-none ${fontSizeClass} ${textColor} ${
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
