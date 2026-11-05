import React, { useEffect, useRef, useMemo } from 'react';
import { LyricLine, VisualTheme, FontSizeSetting, ColorPalette } from '../types';

interface LyricsDisplayProps {
  lines: LyricLine[];
  currentTime: number;
  onSeek: (time: number) => void;
  theme: VisualTheme;
  fontSize: FontSizeSetting;
  palette: ColorPalette;
  isLoadingLyrics: boolean;
  hasLyrics: boolean;
  trackTitle?: string;
  trackArtist?: string;
}

export const LyricsDisplay: React.FC<LyricsDisplayProps> = ({
  lines,
  currentTime,
  onSeek,
  theme,
  fontSize,
  palette,
  isLoadingLyrics,
  hasLyrics,
  trackTitle,
  trackArtist,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const activeLineRef = useRef<HTMLDivElement>(null);

  // Find active line index
  const activeIndex = useMemo(() => {
    if (!lines || lines.length === 0) return -1;
    for (let i = lines.length - 1; i >= 0; i--) {
      if (currentTime >= lines[i].start - 0.2) {
        return i;
      }
    }
    return 0;
  }, [lines, currentTime]);

  // Smooth auto-scroll to keep active line centered
  useEffect(() => {
    if (activeLineRef.current && containerRef.current) {
      activeLineRef.current.scrollIntoView({
        behavior: 'smooth',
        block: 'center',
      });
    }
  }, [activeIndex]);

  // Font size multiplier
  const fontSizeClass = useMemo(() => {
    switch (fontSize) {
      case 'small': return 'text-xl md:text-3xl';
      case 'large': return 'text-3xl md:text-5xl';
      case 'huge': return 'text-4xl md:text-6xl';
      case 'medium':
      default: return 'text-2xl md:text-4xl';
    }
  }, [fontSize]);

  if (isLoadingLyrics) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-center px-6">
        <div className="relative w-16 h-16 mb-6">
          <div className="absolute inset-0 rounded-full border-2 border-white/20 animate-ping" />
          <div className="w-16 h-16 rounded-full border-2 border-t-white border-white/10 animate-spin" />
        </div>
        <p className="text-xl font-medium text-white/80 animate-pulse">
          Fetching synced lyrics...
        </p>
        <p className="text-sm text-white/40 mt-2">
          Syncing with LRCLIB database
        </p>
      </div>
    );
  }

  if (!hasLyrics || lines.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-center px-6 select-none">
        <div className="w-20 h-20 mb-6 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-white/40">
          <svg className="w-10 h-10" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" />
          </svg>
        </div>
        <h2 className="text-2xl md:text-3xl font-bold text-white mb-2">
          {trackTitle ? trackTitle : 'No Track Selected'}
        </h2>
        <p className="text-white/60 mb-6">
          {trackArtist ? trackArtist : 'Search for a song or connect Spotify to begin'}
        </p>
        <p className="text-sm text-white/40 max-w-md">
          Synced lyrics will light up word-by-word automatically as each word is sung.
        </p>
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className="lyrics-scroll-container h-full w-full overflow-y-auto px-4 md:px-12 py-[38vh] select-none scrollbar-none"
    >
      <div className="max-w-4xl mx-auto flex flex-col space-y-7 md:space-y-10">
        {lines.map((line, index) => {
          const isActive = index === activeIndex;
          const isPast = index < activeIndex;
          const isNear = Math.abs(index - activeIndex) <= 2;
          const distance = Math.abs(index - activeIndex);

          // Calculate visual styling according to selected theme
          let lineOpacity = 'opacity-30';
          let lineScale = 'scale-95';
          let blurStyle = '';

          if (isActive) {
            lineOpacity = 'opacity-100';
            lineScale = 'scale-100';
            blurStyle = 'none';
          } else if (isNear) {
            lineOpacity = isPast ? 'opacity-40' : 'opacity-45';
            lineScale = theme === 'fisheye' ? (distance === 1 ? 'scale-90' : 'scale-75') : 'scale-95';
            blurStyle = theme === 'fisheye' ? 'blur-[1.5px]' : 'none';
          } else {
            lineOpacity = isPast ? 'opacity-20' : 'opacity-25';
            lineScale = theme === 'fisheye' ? 'scale-70' : 'scale-90';
            blurStyle = theme === 'fisheye' ? 'blur-[3px]' : 'none';
          }

          return (
            <div
              key={line.id}
              ref={isActive ? activeLineRef : null}
              onClick={() => onSeek(line.start)}
              style={{
                filter: blurStyle,
                transition: 'all 0.4s cubic-bezier(0.16, 1, 0.3, 1)',
              }}
              className={`group cursor-pointer font-bold tracking-tight text-center md:text-left transition-all duration-300 transform ${lineOpacity} ${lineScale} ${fontSizeClass} ${
                isActive ? 'py-2' : 'hover:opacity-60'
              }`}
            >
              {line.words && line.words.length > 0 ? (
                <div className="flex flex-wrap items-center justify-center md:justify-start gap-x-[0.32em] gap-y-1">
                  {line.words.map((word, wIdx) => {
                    let wordStatus: 'past' | 'current' | 'future' = 'future';
                    let progressRatio = 0;

                    if (isActive) {
                      if (currentTime >= word.end) {
                        wordStatus = 'past';
                        progressRatio = 1;
                      } else if (currentTime >= word.start) {
                        wordStatus = 'current';
                        const dur = Math.max(0.05, word.end - word.start);
                        progressRatio = Math.min(1, Math.max(0, (currentTime - word.start) / dur));
                      } else {
                        wordStatus = 'future';
                        progressRatio = 0;
                      }
                    } else if (isPast) {
                      wordStatus = 'past';
                      progressRatio = 1;
                    }

                    // Render word with fluid gradient fill
                    if (isActive && wordStatus === 'current') {
                      const fillPercent = (progressRatio * 100).toFixed(1);
                      return (
                        <span
                          key={wIdx}
                          className="relative inline-block tracking-normal transition-all"
                          style={{
                            background: `linear-gradient(90deg, #ffffff ${fillPercent}%, rgba(255, 255, 255, 0.35) ${fillPercent}%)`,
                            WebkitBackgroundClip: 'text',
                            WebkitTextFillColor: 'transparent',
                            textShadow: theme === 'aurora'
                              ? `0 0 25px ${palette.accent}`
                              : theme === 'cyberpunk'
                              ? '0 0 15px #00ffff'
                              : '0 0 20px rgba(255, 255, 255, 0.5)',
                            transform: 'scale(1.04)',
                            transformOrigin: 'bottom left',
                          }}
                        >
                          {word.text}
                        </span>
                      );
                    }

                    if (isActive && wordStatus === 'past') {
                      return (
                        <span
                          key={wIdx}
                          className="text-white transition-colors duration-200"
                          style={{
                            textShadow: theme === 'aurora'
                              ? `0 0 15px ${palette.accent}66`
                              : theme === 'cyberpunk'
                              ? '0 0 10px #00ffff88'
                              : '0 0 12px rgba(255, 255, 255, 0.3)',
                          }}
                        >
                          {word.text}
                        </span>
                      );
                    }

                    return (
                      <span
                        key={wIdx}
                        className={`transition-colors duration-200 ${
                          isActive
                            ? 'text-white/35'
                            : isPast
                            ? 'text-white/40'
                            : 'text-white/30'
                        }`}
                      >
                        {word.text}
                      </span>
                    );
                  })}
                </div>
              ) : (
                <span className={isActive ? 'text-white' : 'text-white/40'}>
                  {line.text}
                </span>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
