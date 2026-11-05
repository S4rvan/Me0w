import React, { useMemo, useRef, useState, useEffect } from 'react';
import { LyricLine, FontSizeSetting } from '../types';

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
}

const QUEUE_CAP = 11; // 10-12 words in queue
const IDLE_FADE_DELAY = 1.4; // Fade words after 1.4s of no singing

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
  const containerRef = useRef<HTMLDivElement>(null);
  const wordRefs = useRef<Map<number, HTMLSpanElement>>(new Map());
  const [threadPaths, setThreadPaths] = useState<string[]>([]);
  const [anchorDots, setAnchorDots] = useState<{ x: number; y: number }[]>([]);

  // 1. Flatten all lyric words into chronological array
  const allWords = useMemo<FlattenedWord[]>(() => {
    const list: FlattenedWord[] = [];
    let counter = 0;
    for (const line of lines) {
      if (!line.words || line.words.length === 0) continue;
      for (const w of line.words) {
        if (!w.text.trim()) continue;
        list.push({
          id: counter++,
          lineId: line.id,
          text: w.text.trim(),
          start: w.start,
          end: w.end,
        });
      }
    }
    return list;
  }, [lines]);

  // 2. Find current word index based on currentTime
  const currentWordIndex = useMemo(() => {
    if (allWords.length === 0) return -1;
    // Before first word
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

    // Check if next word exists and when it starts
    const nextWord = allWords[currentWordIndex + 1];
    const isWaitingForNext = nextWord ? currentTime < nextWord.start : true;

    if (timeSinceEnd > IDLE_FADE_DELAY && isWaitingForNext) {
      // Fade out over 1.2s
      const fadeProgress = Math.min(1, (timeSinceEnd - IDLE_FADE_DELAY) / 1.2);
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

  // 5. Measure word positions and calculate connecting SVG threads
  useEffect(() => {
    if (queueWords.length <= 1 || isInstrumental) {
      setThreadPaths([]);
      setAnchorDots([]);
      return;
    }

    const container = containerRef.current;
    if (!container) return;

    const containerRect = container.getBoundingClientRect();
    const paths: string[] = [];
    const dots: { x: number; y: number }[] = [];

    for (let i = 0; i < queueWords.length; i++) {
      const currentEl = wordRefs.current.get(queueWords[i].id);
      if (!currentEl) continue;

      const r1 = currentEl.getBoundingClientRect();
      const x1 = r1.left - containerRect.left + r1.width / 2;
      const y1 = r1.top - containerRect.top + r1.height / 2;

      dots.push({ x: x1, y: y1 });

      if (i < queueWords.length - 1) {
        const nextEl = wordRefs.current.get(queueWords[i + 1].id);
        if (!nextEl) continue;

        const r2 = nextEl.getBoundingClientRect();
        const startX = r1.right - containerRect.left + 3;
        const startY = r1.top - containerRect.top + r1.height / 2;
        const endX = r2.left - containerRect.left - 3;
        const endY = r2.top - containerRect.top + r2.height / 2;

        const isSameLine = Math.abs(startY - endY) < 18;

        if (isSameLine) {
          // Gentle hanging sagging thread arc between adjacent words
          const midX = (startX + endX) / 2;
          const sagY = startY + 8; // subtle natural thread sag
          paths.push(`M ${startX},${startY} Q ${midX},${sagY} ${endX},${endY}`);
        } else {
          // Elegant S-curve connecting to word on the next line
          const dx = Math.abs(endX - startX) * 0.4;
          paths.push(
            `M ${startX},${startY} C ${startX + dx},${startY + 20} ${endX - dx},${endY - 20} ${endX},${endY}`
          );
        }
      }
    }

    setThreadPaths(paths);
    setAnchorDots(dots);
  }, [queueWords, isInstrumental, fontSize]);

  // Font size multiplier
  const fontSizeClass = useMemo(() => {
    switch (fontSize) {
      case 'small': return 'text-xl md:text-3xl tracking-wide';
      case 'large': return 'text-3xl md:text-5xl tracking-normal';
      case 'huge': return 'text-4xl md:text-6xl tracking-tight';
      case 'medium':
      default: return 'text-2xl md:text-4xl tracking-normal';
    }
  }, [fontSize]);

  // Loading state
  if (isLoadingLyrics) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-center px-6 select-none bg-black">
        <div className="w-10 h-10 mb-4 rounded-full border-2 border-t-white border-white/10 animate-spin" />
        <p className="text-sm font-mono text-white/50 tracking-widest uppercase animate-pulse">
          Connecting lyrics...
        </p>
      </div>
    );
  }

  // No lyrics or track not selected
  if (!hasLyrics || allWords.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-center px-6 select-none bg-black">
        <h2 className="text-xl md:text-2xl font-light text-white/70 mb-2 tracking-wider">
          {trackTitle ? trackTitle : 'Quiet Screen'}
        </h2>
        <p className="text-xs text-white/40 mb-6 font-mono tracking-widest">
          {trackArtist ? trackArtist : 'Play music to summon words onto the thread'}
        </p>
        {onOpenSearch && (
          <button
            onClick={onOpenSearch}
            className="px-5 py-2.5 rounded-full bg-white/10 hover:bg-white/20 text-white font-medium text-xs tracking-wider border border-white/15 transition shadow-lg"
          >
            Choose a Song
          </button>
        )}
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className="relative w-full h-full bg-black flex items-center justify-center overflow-hidden px-8 md:px-24 select-none"
    >
      {/* Connecting Glowing Threads Layer */}
      <svg
        className="absolute inset-0 w-full h-full pointer-events-none z-10 transition-opacity duration-700"
        style={{ opacity: idleFadeRatio }}
      >
        {/* Shadow / Glow blur under thread */}
        {threadPaths.map((d, idx) => (
          <path
            key={`glow-${idx}`}
            d={d}
            fill="none"
            stroke="rgba(255, 235, 190, 0.3)"
            strokeWidth="3.5"
            style={{ filter: 'blur(3px)' }}
          />
        ))}

        {/* Crisp luminous core thread */}
        {threadPaths.map((d, idx) => (
          <path
            key={`core-${idx}`}
            d={d}
            fill="none"
            stroke="rgba(255, 245, 225, 0.75)"
            strokeWidth="1.4"
            strokeDasharray="none"
          />
        ))}

        {/* Glowing Anchor Dots at each word */}
        {anchorDots.map((dot, idx) => (
          <circle
            key={`dot-${idx}`}
            cx={dot.x}
            cy={dot.y}
            r="2"
            fill="#ffffff"
            style={{
              filter: 'drop-shadow(0 0 4px rgba(255, 255, 255, 0.9))',
            }}
          />
        ))}
      </svg>

      {/* Words Container (Center Cluster Queue) */}
      <div
        className="relative z-20 max-w-4xl flex flex-wrap items-center justify-center gap-x-5 md:gap-x-7 gap-y-6 md:gap-y-9 text-center transition-all duration-700"
        style={{
          opacity: idleFadeRatio,
          transform: isInstrumental ? 'scale(0.97)' : 'scale(1)',
        }}
      >
        {queueWords.map((word, qIdx) => {
          const isCurrent = word.id === allWords[currentWordIndex]?.id;
          const isEntering = qIdx === queueWords.length - 1;
          const isOldest = qIdx === 0 && queueWords.length >= QUEUE_CAP;

          // Word opacity: older words in queue softly dim, newest illuminates
          let wordOpacity = 0.75;
          let textShadow = '0 0 10px rgba(255, 255, 255, 0.2)';
          let textColor = 'text-white/80';

          if (isCurrent) {
            wordOpacity = 1;
            textShadow = '0 0 20px rgba(255, 255, 255, 0.9), 0 0 35px rgba(255, 235, 190, 0.4)';
            textColor = 'text-white';
          } else if (isOldest) {
            wordOpacity = 0.4;
          }

          return (
            <span
              key={word.id}
              ref={(el) => {
                if (el) wordRefs.current.set(word.id, el);
                else wordRefs.current.delete(word.id);
              }}
              onClick={() => onSeek(word.start)}
              style={{
                opacity: wordOpacity,
                textShadow,
                transition: 'opacity 0.5s ease, transform 0.5s cubic-bezier(0.16, 1, 0.3, 1)',
                transform: isCurrent ? 'scale(1.05)' : isOldest ? 'scale(0.95)' : 'scale(1)',
              }}
              className={`relative inline-block font-medium cursor-pointer ${fontSizeClass} ${textColor} ${
                isEntering ? 'animate-word-arrive' : ''
              }`}
            >
              {word.text}
            </span>
          );
        })}
      </div>

      {/* Pure black tranquility during instrumental */}
      {isInstrumental && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none select-none animate-fade-in">
          {/* Completely black screen - whisper quiet dot */}
          <div className="w-1.5 h-1.5 rounded-full bg-white/10 animate-ping" />
        </div>
      )}
    </div>
  );
};
