import React, { useEffect, useRef, useState, useMemo } from 'react';
import { LyricLine, VisualTheme, FontSizeSetting, ColorPalette } from '../types';
import { ArrowDown, Music } from 'lucide-react';

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
  onOpenSearch?: () => void;
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
  onOpenSearch,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const lineRefs = useRef<Map<number, HTMLDivElement>>(new Map());
  const [isUserScrolling, setIsUserScrolling] = useState(false);
  const userScrollTimeoutRef = useRef<number | null>(null);

  // Filter out completely empty or purely punctuation lines to prevent gaps
  const displayLines = useMemo(() => {
    return lines.filter((l) => l.text && l.text.trim().length > 0);
  }, [lines]);

  // Find active line index accurately
  const activeIndex = useMemo(() => {
    if (!displayLines || displayLines.length === 0) return -1;
    // Before first lyric
    if (currentTime < displayLines[0].start - 0.5) {
      return -1;
    }

    for (let i = displayLines.length - 1; i >= 0; i--) {
      if (currentTime >= displayLines[i].start - 0.15) {
        return i;
      }
    }
    return -1;
  }, [displayLines, currentTime]);

  // Handle user manual scroll: pause auto-scroll temporarily
  const handleScroll = () => {
    setIsUserScrolling(true);
    if (userScrollTimeoutRef.current) {
      clearTimeout(userScrollTimeoutRef.current);
    }
    // Resume auto-scroll after 3.5s of no manual scrolling
    userScrollTimeoutRef.current = window.setTimeout(() => {
      setIsUserScrolling(false);
    }, 3500);
  };

  // Smoothly scroll to active line without jitter
  useEffect(() => {
    if (isUserScrolling || activeIndex === -1) return;

    const activeEl = lineRefs.current.get(activeIndex);
    const container = containerRef.current;
    if (activeEl && container) {
      const containerHeight = container.clientHeight;
      const targetScroll = activeEl.offsetTop - containerHeight * 0.42 + activeEl.clientHeight / 2;

      container.scrollTo({
        top: Math.max(0, targetScroll),
        behavior: 'smooth',
      });
    }
  }, [activeIndex, isUserScrolling]);

  // Font size multiplier
  const fontSizeClass = useMemo(() => {
    switch (fontSize) {
      case 'small': return 'text-lg md:text-2xl';
      case 'large': return 'text-3xl md:text-5xl';
      case 'huge': return 'text-4xl md:text-6xl';
      case 'medium':
      default: return 'text-2xl md:text-4xl';
    }
  }, [fontSize]);

  if (isLoadingLyrics) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-center px-6 select-none">
        <div className="relative w-16 h-16 mb-6">
          <div className="w-16 h-16 rounded-full border-2 border-t-white border-white/10 animate-spin" />
        </div>
        <p className="text-xl font-bold text-white tracking-wide animate-pulse">
          Loading Synced Lyrics...
        </p>
        <p className="text-xs text-white/50 mt-2">
          Syncing word-by-word timestamps
        </p>
      </div>
    );
  }

  if (!hasLyrics || displayLines.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-center px-6 select-none animate-fade-in">
        <div className="w-20 h-20 mb-6 rounded-3xl bg-white/5 border border-white/10 flex items-center justify-center text-white/40 shadow-2xl">
          <Music className="w-10 h-10" />
        </div>
        <h2 className="text-2xl md:text-3xl font-extrabold text-white mb-2">
          {trackTitle ? trackTitle : 'No Track Playing'}
        </h2>
        <p className="text-white/60 mb-6 max-w-sm">
          {trackArtist ? trackArtist : 'Search for any song or connect Spotify to view synchronized lyrics'}
        </p>
        {onOpenSearch && (
          <button
            onClick={onOpenSearch}
            className="px-6 py-3 rounded-2xl bg-white text-black font-bold text-sm hover:scale-105 active:scale-95 transition shadow-xl"
          >
            Find a Song
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="relative h-full w-full overflow-hidden">
      {/* Resume Auto-scroll Floating Pill */}
      {isUserScrolling && activeIndex !== -1 && (
        <button
          onClick={() => {
            setIsUserScrolling(false);
            const activeEl = lineRefs.current.get(activeIndex);
            const container = containerRef.current;
            if (activeEl && container) {
              container.scrollTo({
                top: activeEl.offsetTop - container.clientHeight * 0.42,
                behavior: 'smooth',
              });
            }
          }}
          className="absolute top-6 left-1/2 -translate-x-1/2 z-30 flex items-center gap-2 px-4 py-2 rounded-full bg-white/20 backdrop-blur-md border border-white/20 text-white text-xs font-semibold shadow-2xl hover:bg-white/30 transition animate-fade-in"
        >
          <ArrowDown className="w-3.5 h-3.5 animate-bounce" />
          Resume Auto-scroll
        </button>
      )}

      {/* Main Scrollable Viewport */}
      <div
        ref={containerRef}
        onScroll={handleScroll}
        className="lyrics-scroll-container h-full w-full overflow-y-auto px-6 md:px-16 py-[38vh] select-none scrollbar-none"
      >
        <div className="max-w-4xl mx-auto flex flex-col space-y-8 md:space-y-11">
          {/* Instrumental Intro Indicator */}
          {activeIndex === -1 && displayLines.length > 0 && (
            <div className="text-center py-8 text-white/40 text-sm font-semibold tracking-wider uppercase animate-pulse">
              ••• Instrumental Intro •••
            </div>
          )}

          {displayLines.map((line, index) => {
            const isActive = index === activeIndex;
            const isPast = index < activeIndex && activeIndex !== -1;
            const distance = activeIndex === -1 ? 1 : Math.abs(index - activeIndex);

            // Calculate styling based on distance to active line
            let opacityStyle = 'opacity-25';
            let filterStyle = 'none';

            if (isActive) {
              opacityStyle = 'opacity-100';
            } else if (distance === 1) {
              opacityStyle = isPast ? 'opacity-40' : 'opacity-45';
              filterStyle = theme === 'fisheye' ? 'blur(1px)' : 'none';
            } else if (distance === 2) {
              opacityStyle = isPast ? 'opacity-25' : 'opacity-30';
              filterStyle = theme === 'fisheye' ? 'blur(2px)' : 'none';
            } else {
              opacityStyle = 'opacity-15';
              filterStyle = theme === 'fisheye' ? 'blur(3.5px)' : 'none';
            }

            return (
              <div
                key={line.id}
                ref={(el) => {
                  if (el) lineRefs.current.set(index, el);
                  else lineRefs.current.delete(index);
                }}
                onClick={() => onSeek(line.start)}
                style={{
                  filter: filterStyle,
                  transition: 'opacity 0.3s ease, filter 0.3s ease',
                }}
                className={`group cursor-pointer font-bold tracking-tight text-center md:text-left ${opacityStyle} ${fontSizeClass} ${
                  isActive ? 'py-1 text-white' : 'hover:opacity-75'
                }`}
              >
                {line.words && line.words.length > 0 ? (
                  <div className="flex flex-wrap items-center justify-center md:justify-start gap-x-[0.32em] gap-y-1 leading-snug">
                    {line.words.map((word, wIdx) => {
                      let wordStatus: 'past' | 'current' | 'future' = 'future';
                      let progressRatio = 0;

                      if (isActive) {
                        if (currentTime >= word.end) {
                          wordStatus = 'past';
                          progressRatio = 1;
                        } else if (currentTime >= word.start) {
                          wordStatus = 'current';
                          const dur = Math.max(0.06, word.end - word.start);
                          progressRatio = Math.min(1, Math.max(0, (currentTime - word.start) / dur));
                        } else {
                          wordStatus = 'future';
                          progressRatio = 0;
                        }
                      } else if (isPast) {
                        wordStatus = 'past';
                        progressRatio = 1;
                      }

                      // Active word with smooth karaoke wipe
                      if (isActive && wordStatus === 'current') {
                        const fillPercent = Math.min(100, Math.max(0, progressRatio * 100)).toFixed(1);
                        return (
                          <span
                            key={wIdx}
                            className="inline-block transition-none"
                            style={{
                              background: `linear-gradient(90deg, #ffffff ${fillPercent}%, rgba(255, 255, 255, 0.35) ${fillPercent}%)`,
                              WebkitBackgroundClip: 'text',
                              WebkitTextFillColor: 'transparent',
                              filter: theme === 'aurora'
                                ? `drop-shadow(0 0 12px ${palette.accent}99)`
                                : theme === 'cyberpunk'
                                ? 'drop-shadow(0 0 8px #00ffff)'
                                : 'none',
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
                            className="text-white"
                            style={{
                              filter: theme === 'aurora'
                                ? `drop-shadow(0 0 6px ${palette.accent}44)`
                                : 'none',
                            }}
                          >
                            {word.text}
                          </span>
                        );
                      }

                      return (
                        <span
                          key={wIdx}
                          className={isActive ? 'text-white/35' : isPast ? 'text-white/40' : 'text-white/25'}
                        >
                          {word.text}
                        </span>
                      );
                    })}
                  </div>
                ) : (
                  <span className={isActive ? 'text-white' : 'text-white/30'}>
                    {line.text}
                  </span>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
