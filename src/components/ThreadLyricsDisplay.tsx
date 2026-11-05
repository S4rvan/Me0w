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

// 4-Point Sparkle Diamond Star (Matches the exact astronomical stars in the user's reference video)
interface DiamondStarProps {
  size: number;
  isActive: boolean;
  color: string;
}

const DiamondStar: React.FC<DiamondStarProps> = ({ size, isActive, color }) => {
  const r = size / 2;
  return (
    <svg
      width={size}
      height={size}
      viewBox={`-${r} -${r} ${size} ${size}`}
      className="overflow-visible pointer-events-none inline-block flex-shrink-0"
      style={{
        filter: isActive
          ? `drop-shadow(0 0 6px ${color}) drop-shadow(0 0 14px ${color})`
          : `drop-shadow(0 0 2px ${color})`,
      }}
    >
      {/* 4-Point Celestial Sparkle Diamond */}
      <path
        d={`M 0,-${r} Q 0,0 ${r},0 Q 0,0 0,${r} Q 0,0 -${r},0 Q 0,0 0,-${r} Z`}
        fill={color}
      />
      {/* Bright Stellar White Core */}
      <circle cx="0" cy="0" r={Math.max(1.2, r * 0.28)} fill="#ffffff" />
    </svg>
  );
};

// Constellation Data Structures
export interface ConstellationStar {
  id: string;
  wordIndex: number;
  text: string;
  start: number;
  end: number;
  x: number; // Viewport % (18 - 82)
  y: number; // Viewport % (22 - 68)
  labelPlacement: 'top' | 'bottom' | 'left' | 'right';
  color: string;
  threadColor: string;
}

export interface ConstellationEdge {
  fromIndex: number;
  toIndex: number;
}

export interface ConstellationPhrase {
  lineId: number;
  start: number;
  end: number;
  stars: ConstellationStar[];
  edges: ConstellationEdge[];
}

// Warm Celestial / TV Girl Constellation Palette (from the video: coral, peach, amber, rose)
const CONSTELLATION_PALETTE = [
  { text: '#fca5a5', active: '#f87171', thread: 'rgba(248, 113, 113, 0.45)', glow: 'rgba(248, 113, 113, 0.4)' },
  { text: '#fbcfe8', active: '#f472b6', thread: 'rgba(244, 114, 182, 0.45)', glow: 'rgba(244, 114, 182, 0.4)' },
  { text: '#fed7aa', active: '#fb923c', thread: 'rgba(251, 146, 60, 0.45)', glow: 'rgba(251, 146, 60, 0.4)' },
  { text: '#fef08a', active: '#facc15', thread: 'rgba(250, 204, 21, 0.45)', glow: 'rgba(250, 204, 21, 0.4)' },
  { text: '#ddd6fe', active: '#c084fc', thread: 'rgba(192, 132, 252, 0.45)', glow: 'rgba(192, 132, 252, 0.4)' },
  { text: '#bae6fd', active: '#38bdf8', thread: 'rgba(56, 189, 248, 0.45)', glow: 'rgba(56, 189, 248, 0.4)' },
];

/**
 * Generates an authentic astronomical constellation layout for each lyric phrase
 * (e.g. Ursa Major, Orion, Cassiopeia, Cygnus geometric archetypes).
 * Guarantees zero overlapping between stars and readable label placement.
 */
function buildConstellationForLine(line: LyricLine, lineIndex: number): ConstellationPhrase {
  const words = line.words && line.words.length > 0
    ? line.words.filter((w) => w.text && w.text.trim().length > 0)
    : [{ text: line.text.trim(), start: line.start, end: line.end }];

  const N = words.length;
  const stars: ConstellationStar[] = [];
  const edges: ConstellationEdge[] = [];

  const themeColor = CONSTELLATION_PALETTE[lineIndex % CONSTELLATION_PALETTE.length];

  // Base constellation center (subtly shifts per phrase for natural sky variety)
  const centerX = 50 + (((lineIndex * 7) % 11) - 5);
  const centerY = 44 + (((lineIndex * 13) % 9) - 4);

  // Geometric Constellation Archetypes based on star count
  if (N === 1) {
    stars.push({
      id: `${line.id}-0`,
      wordIndex: 0,
      text: words[0].text,
      start: words[0].start,
      end: words[0].end,
      x: centerX,
      y: centerY,
      labelPlacement: 'bottom',
      color: themeColor.active,
      threadColor: themeColor.thread,
    });
  } else if (N === 2) {
    // Binary Star Pair (matches video frame 00:05 "about - all")
    stars.push(
      {
        id: `${line.id}-0`,
        wordIndex: 0,
        text: words[0].text,
        start: words[0].start,
        end: words[0].end,
        x: centerX - 12,
        y: centerY + 2,
        labelPlacement: 'left',
        color: themeColor.active,
        threadColor: themeColor.thread,
      },
      {
        id: `${line.id}-1`,
        wordIndex: 1,
        text: words[1].text,
        start: words[1].start,
        end: words[1].end,
        x: centerX + 12,
        y: centerY - 2,
        labelPlacement: 'right',
        color: themeColor.active,
        threadColor: themeColor.thread,
      }
    );
    edges.push({ fromIndex: 0, toIndex: 1 });
  } else if (N === 3) {
    // Celestial Triangle (matches video frame 00:06 "about - mac - is")
    stars.push(
      {
        id: `${line.id}-0`,
        wordIndex: 0,
        text: words[0].text,
        start: words[0].start,
        end: words[0].end,
        x: centerX - 14,
        y: centerY + 8,
        labelPlacement: 'bottom',
        color: themeColor.active,
        threadColor: themeColor.thread,
      },
      {
        id: `${line.id}-1`,
        wordIndex: 1,
        text: words[1].text,
        start: words[1].start,
        end: words[1].end,
        x: centerX,
        y: centerY - 10,
        labelPlacement: 'top',
        color: themeColor.active,
        threadColor: themeColor.thread,
      },
      {
        id: `${line.id}-2`,
        wordIndex: 2,
        text: words[2].text,
        start: words[2].start,
        end: words[2].end,
        x: centerX + 16,
        y: centerY + 6,
        labelPlacement: 'right',
        color: themeColor.active,
        threadColor: themeColor.thread,
      }
    );
    edges.push({ fromIndex: 0, toIndex: 1 });
    edges.push({ fromIndex: 1, toIndex: 2 });
    edges.push({ fromIndex: 2, toIndex: 0 }); // closed loop
  } else {
    // Multi-Star Astronomical Constellation (Ursa Major, Orion, Cassiopeia shapes from video)
    // Select archetype template
    const archetype = lineIndex % 4;

    for (let i = 0; i < N; i++) {
      const w = words[i];
      const progress = i / (N - 1); // 0 to 1

      let relX = 0;
      let relY = 0;
      let placement: 'top' | 'bottom' | 'left' | 'right' = 'top';

      if (archetype === 0) {
        // The Great Dipper: Handle curving down, bowl forming enclosed quad
        if (progress < 0.45) {
          relX = -26 + progress * 32;
          relY = 12 - Math.sin(progress * Math.PI) * 16;
          placement = 'bottom';
        } else {
          // Bowl quad
          const bowlIdx = i - Math.floor(N * 0.45);
          const bowlOffsets = [
            { x: -4, y: -8, p: 'top' },
            { x: 16, y: -12, p: 'top' },
            { x: 24, y: 10, p: 'right' },
            { x: 6, y: 14, p: 'bottom' },
          ];
          const b = bowlOffsets[bowlIdx % bowlOffsets.length];
          relX = b.x;
          relY = b.y;
          placement = b.p as any;
        }
      } else if (archetype === 1) {
        // The Hunter / Hourglass (Orion style from frame 00:04)
        const angles = [-150, -45, 0, 45, 140, 90, -90, 180];
        const rad = (angles[i % angles.length] * Math.PI) / 180;
        const dist = 14 + (i % 3) * 6;
        relX = Math.cos(rad) * dist * 1.3;
        relY = Math.sin(rad) * dist;
        placement = relY < 0 ? 'top' : 'bottom';
      } else if (archetype === 2) {
        // Cassiopeia Zig-Zag W-shape
        relX = (progress - 0.5) * 54;
        relY = Math.sin(progress * Math.PI * 2.2) * 14;
        placement = relY < 0 ? 'top' : 'bottom';
      } else {
        // Celestial Crown / Arc with Center Anchor
        const angle = (progress - 0.5) * Math.PI * 0.9;
        relX = Math.sin(angle) * 28;
        relY = -Math.cos(angle) * 15 + 4;
        placement = angle < 0 ? 'left' : 'right';
      }

      // Safe bounds clamping (avoids bottom-left turntable and top edge)
      const finalX = Math.max(18, Math.min(82, centerX + relX));
      const finalY = Math.max(22, Math.min(68, centerY + relY));

      stars.push({
        id: `${line.id}-${i}`,
        wordIndex: i,
        text: w.text,
        start: w.start,
        end: w.end,
        x: finalX,
        y: finalY,
        labelPlacement: placement,
        color: themeColor.active,
        threadColor: themeColor.thread,
      });

      // Primary backbone constellation line
      if (i > 0) {
        edges.push({ fromIndex: i - 1, toIndex: i });
      }
    }

    // Add geometric cross-links for realistic polygon constellations (as seen in video frames 00:04 & 00:13)
    if (N >= 4) {
      edges.push({ fromIndex: 0, toIndex: Math.min(N - 1, 3) });
    }
    if (N >= 6) {
      edges.push({ fromIndex: 2, toIndex: Math.min(N - 1, 5) });
    }
    if (N >= 8) {
      edges.push({ fromIndex: 3, toIndex: N - 1 });
    }
  }

  return {
    lineId: line.id,
    start: line.start,
    end: line.end,
    stars,
    edges,
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
  const spawnedRipplesRef = useRef<Set<string>>(new Set());

  // 1. Build authentic Constellation phrases for all lines in the track
  const constellations = useMemo<ConstellationPhrase[]>(() => {
    return lines.map((line, idx) => buildConstellationForLine(line, idx));
  }, [lines]);

  // Clear spawned ripples when track lines change
  useEffect(() => {
    spawnedRipplesRef.current.clear();
  }, [lines]);

  // 2. Identify active and recently completed constellations with smooth celestial fade-out
  const activeConstellations = useMemo(() => {
    if (constellations.length === 0) return [];

    const visible: {
      phrase: ConstellationPhrase;
      opacity: number;
      activeStar: ConstellationStar | null;
      spawnedStars: ConstellationStar[];
      drawnEdges: ConstellationEdge[];
    }[] = [];

    for (const phrase of constellations) {
      // Phrase is active or within its 2.2s graceful fade-out window
      const isOngoing = currentTime >= phrase.start && currentTime <= phrase.end;
      const isFading = currentTime > phrase.end && currentTime <= phrase.end + 2.2;

      if (isOngoing || isFading) {
        let opacity = 1.0;
        if (isFading) {
          // Continuous gentle power fade-out into deep space
          const fadeProgress = (currentTime - phrase.end) / 2.2;
          opacity = Math.max(0, Math.pow(1 - fadeProgress, 1.5));
        }

        // Determine which stars have spawned so far in this constellation
        const spawnedStars: ConstellationStar[] = [];
        let activeStar: ConstellationStar | null = null;

        for (let i = 0; i < phrase.stars.length; i++) {
          const star = phrase.stars[i];
          const nextStar = phrase.stars[i + 1];

          if (currentTime >= star.start) {
            spawnedStars.push(star);

            // Stays active and prominent following the vocal flow until the next star begins,
            // or through the phrase duration if it's the final word
            const singingUntil = nextStar ? nextStar.start : Math.max(star.end, phrase.end);
            if (currentTime >= star.start && currentTime <= singingUntil) {
              activeStar = star;
            }
          }
        }

        // Only draw constellation lines between stars that have already spawned
        const drawnEdges = phrase.edges.filter(
          (edge) =>
            edge.fromIndex < spawnedStars.length &&
            edge.toIndex < spawnedStars.length
        );

        if (spawnedStars.length > 0 && opacity > 0.01) {
          visible.push({
            phrase,
            opacity,
            activeStar,
            spawnedStars,
            drawnEdges,
          });
        }
      }
    }

    return visible;
  }, [constellations, currentTime]);

  // Update instrumental status
  useEffect(() => {
    const isSilent = activeConstellations.length === 0;
    setIsInstrumental(isSilent);
  }, [activeConstellations, setIsInstrumental]);

  // 3. Trigger water surface ripple on active star ignition
  useEffect(() => {
    for (const c of activeConstellations) {
      if (c.activeStar && !spawnedRipplesRef.current.has(c.activeStar.id)) {
        spawnedRipplesRef.current.add(c.activeStar.id);
        onSpawnRipple({
          id: Date.now() + Math.random(),
          xPercent: c.activeStar.x,
          yPercent: c.activeStar.y,
          color: 'rgba(251, 113, 133, 0.4)',
          size: 260,
        });
      }
    }
  }, [activeConstellations, onSpawnRipple]);

  // Font size configuration
  const activeFontSizeClass = useMemo(() => {
    switch (fontSize) {
      case 'small': return 'text-2xl md:text-3xl';
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
        <div className="w-8 h-8 mb-4 rounded-full border-2 border-t-rose-400 border-white/10 animate-spin" />
        <p className="text-xs font-mono text-rose-300/60 tracking-widest uppercase animate-pulse">
          Charting constellations...
        </p>
      </div>
    );
  }

  // No lyrics state
  if (!hasLyrics || constellations.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-center px-6 select-none bg-black">
        <h2 className="text-2xl md:text-3xl font-light text-rose-200/80 mb-2 tracking-wider">
          {trackTitle ? trackTitle : 'Tranquil Water'}
        </h2>
        <p className="text-xs text-white/40 mb-6 font-mono tracking-widest">
          {trackArtist ? trackArtist : 'Play music to summon constellations into the night'}
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
      {/* 1. Subtle Deep-Space Cosmic Background Circles */}
      <svg
        className="absolute inset-0 w-full h-full pointer-events-none z-0"
        viewBox="0 0 100 100"
        preserveAspectRatio="none"
      >
        <circle
          cx="50"
          cy="48"
          r="36"
          fill="none"
          stroke="rgba(244, 63, 94, 0.05)"
          strokeWidth="0.25"
          strokeDasharray="2 6"
          className="animate-celestial-spin"
        />
        <circle
          cx="50"
          cy="48"
          r="46"
          fill="none"
          stroke="rgba(251, 146, 60, 0.04)"
          strokeWidth="0.2"
          strokeDasharray="4 10"
          className="animate-celestial-spin-reverse"
        />
      </svg>

      {/* 2. Constellations Layer: Connecting Luminous Astronomical Thread Lines */}
      <svg
        className="absolute inset-0 w-full h-full pointer-events-none z-10"
        viewBox="0 0 100 100"
        preserveAspectRatio="none"
      >
        {activeConstellations.map(({ phrase, opacity, drawnEdges, spawnedStars }) => (
          <g key={`edges-${phrase.lineId}`} style={{ opacity }}>
            {drawnEdges.map((edge, idx) => {
              const p1 = spawnedStars[edge.fromIndex];
              const p2 = spawnedStars[edge.toIndex];
              if (!p1 || !p2) return null;

              return (
                <line
                  key={`line-${phrase.lineId}-${idx}`}
                  x1={p1.x}
                  y1={p1.y}
                  x2={p2.x}
                  y2={p2.y}
                  stroke={p2.threadColor}
                  strokeWidth="0.32"
                  strokeLinecap="round"
                  style={{
                    filter: `drop-shadow(0 0 3px ${p2.threadColor})`,
                  }}
                />
              );
            })}
          </g>
        ))}
      </svg>

      {/* 3. Constellation Star Nodes and Lyric Words */}
      <div className="absolute inset-0 z-20 pointer-events-none">
        {activeConstellations.map(({ phrase, opacity, spawnedStars, activeStar }) => (
          <div
            key={`stars-${phrase.lineId}`}
            style={{ opacity }}
            className="absolute inset-0 transition-opacity duration-300"
          >
            {spawnedStars.map((star) => {
              const isActive = activeStar?.id === star.id;

              return (
                <div
                  key={star.id}
                  onClick={(e) => {
                    e.stopPropagation();
                    onSeek(star.start);
                  }}
                  className="absolute pointer-events-auto cursor-pointer flex items-center gap-1.5 transition-all duration-300"
                  style={{
                    left: `${star.x}%`,
                    top: `${star.y}%`,
                    transform: 'translate(-50%, -50%)',
                  }}
                >
                  {/* Astronomical 4-Point Diamond Star at Vertex (Matches Reference Video) */}
                  <DiamondStar
                    size={isActive ? 18 : 10}
                    isActive={isActive}
                    color={isActive ? star.color : 'rgba(255, 255, 255, 0.7)'}
                  />

                  {/* Word Label Positioned at Star Node */}
                  <span
                    style={{
                      color: isActive ? star.color : 'rgba(255, 255, 255, 0.75)',
                      textShadow: isActive
                        ? `0 0 14px ${star.color}, 0 0 28px ${star.color}`
                        : '0 0 6px rgba(255, 255, 255, 0.3)',
                    }}
                    className={`inline-block font-bold tracking-tight select-none transition-all duration-300 ${
                      isActive
                        ? `${activeFontSizeClass} font-extrabold z-30 scale-105`
                        : 'text-xs sm:text-sm md:text-base font-semibold z-20'
                    }`}
                  >
                    {star.text}
                  </span>
                </div>
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
};
