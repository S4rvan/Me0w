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

// 4-Point Sparkle Diamond Star (Astronomical star vertex from reference star map)
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
          ? `drop-shadow(0 0 8px ${color}) drop-shadow(0 0 20px ${color})`
          : `drop-shadow(0 0 2px ${color})`,
      }}
    >
      {/* 4-Point Celestial Sparkle Diamond */}
      <path
        d={`M 0,-${r} Q 0,0 ${r},0 Q 0,0 0,${r} Q 0,0 -${r},0 Q 0,0 0,-${r} Z`}
        fill={color}
      />
      {/* Bright Stellar White Core */}
      <circle cx="0" cy="0" r={Math.max(1.6, r * 0.32)} fill="#ffffff" />
    </svg>
  );
};

export interface ConstellationStar {
  id: string;
  wordIndex: number;
  text: string;
  start: number;
  end: number;
  x: number; // Viewport % (18 - 82)
  y: number; // Viewport % (22 - 68)
  labelPlacement: 'top' | 'bottom';
  color: string;
  threadColor: string;
}

export interface ConstellationEdge {
  fromIndex: number;
  toIndex: number;
}

export interface ConstellationPhrase {
  lineId: number;
  constellationName: string;
  start: number;
  end: number;
  stars: ConstellationStar[];
  edges: ConstellationEdge[];
  centerX: number;
  centerY: number;
}

// Real Astronomical Constellation Templates (Modeled directly from the user's star map image)
interface RealConstellationDefinition {
  name: string;
  points: { dx: number; dy: number; labelPlacement?: 'top' | 'bottom' }[];
}

const REAL_CONSTELLATIONS: RealConstellationDefinition[] = [
  {
    name: 'CASSIOPEIA',
    // The iconic W / Crown zig-zag from the top of the star map
    points: [
      { dx: -0.9, dy: -0.22, labelPlacement: 'top' },    // Caph
      { dx: -0.45, dy: 0.55, labelPlacement: 'bottom' }, // Schedar
      { dx: 0.0, dy: -0.38, labelPlacement: 'top' },    // Gamma Cas
      { dx: 0.48, dy: 0.52, labelPlacement: 'bottom' },  // Ruchbah
      { dx: 0.9, dy: -0.42, labelPlacement: 'top' },    // Segin
    ],
  },
  {
    name: 'URSA MAJOR',
    // The famous Plough / Great Bear handle and pointer arc
    points: [
      { dx: -0.9, dy: 0.42, labelPlacement: 'bottom' },  // Alkaid
      { dx: -0.6, dy: 0.16, labelPlacement: 'top' },     // Mizar
      { dx: -0.3, dy: 0.02, labelPlacement: 'top' },     // Alioth
      { dx: 0.05, dy: -0.06, labelPlacement: 'bottom' }, // Megrez
      { dx: 0.55, dy: -0.24, labelPlacement: 'top' },    // Dubhe
      { dx: 0.65, dy: 0.46, labelPlacement: 'bottom' },  // Merak
      { dx: 0.15, dy: 0.52, labelPlacement: 'bottom' },  // Phecda
    ],
  },
  {
    name: 'DRACO',
    // The celestial dragon winding through the stars
    points: [
      { dx: -0.85, dy: -0.45, labelPlacement: 'top' },
      { dx: -0.6, dy: -0.15, labelPlacement: 'top' },
      { dx: -0.35, dy: 0.35, labelPlacement: 'bottom' },
      { dx: -0.05, dy: 0.6, labelPlacement: 'bottom' },
      { dx: 0.35, dy: 0.35, labelPlacement: 'bottom' },
      { dx: 0.55, dy: -0.25, labelPlacement: 'top' },
      { dx: 0.35, dy: -0.6, labelPlacement: 'top' },
      { dx: 0.7, dy: -0.45, labelPlacement: 'top' },
      { dx: 0.9, dy: 0.02, labelPlacement: 'bottom' },
    ],
  },
  {
    name: 'CYGNUS',
    // The Northern Cross diagonal celestial spine
    points: [
      { dx: -0.8, dy: -0.55, labelPlacement: 'top' },    // Deneb
      { dx: -0.4, dy: -0.25, labelPlacement: 'top' },
      { dx: 0.0, dy: 0.02, labelPlacement: 'bottom' },   // Sadr
      { dx: 0.45, dy: 0.35, labelPlacement: 'bottom' },
      { dx: 0.85, dy: 0.65, labelPlacement: 'bottom' },  // Albireo
    ],
  },
  {
    name: 'ANDROMEDA',
    // Radiating celestial star chain
    points: [
      { dx: -0.85, dy: 0.42, labelPlacement: 'bottom' }, // Alpheratz
      { dx: -0.4, dy: 0.12, labelPlacement: 'top' },     // Delta And
      { dx: 0.1, dy: -0.22, labelPlacement: 'top' },     // Mirach
      { dx: 0.6, dy: -0.52, labelPlacement: 'top' },     // Almach
      { dx: 0.85, dy: -0.16, labelPlacement: 'bottom' },
    ],
  },
  {
    name: 'PERSEUS',
    // The sweeping angular hero branch from Mirfak
    points: [
      { dx: -0.75, dy: -0.45, labelPlacement: 'top' },   // Gamma Per
      { dx: -0.35, dy: -0.15, labelPlacement: 'top' },   // Mirfak
      { dx: -0.45, dy: 0.52, labelPlacement: 'bottom' },  // Algol
      { dx: 0.15, dy: 0.12, labelPlacement: 'top' },     // Epsilon Per
      { dx: 0.55, dy: 0.42, labelPlacement: 'bottom' },  // Menkib
      { dx: 0.85, dy: 0.16, labelPlacement: 'bottom' },  // Atik
    ],
  },
  {
    name: 'BOOTES',
    // The soaring herdsman kite spine leading to Arcturus
    points: [
      { dx: -0.65, dy: 0.62, labelPlacement: 'bottom' }, // Arcturus
      { dx: -0.85, dy: 0.16, labelPlacement: 'bottom' },
      { dx: -0.25, dy: 0.02, labelPlacement: 'top' },    // Izar
      { dx: 0.25, dy: -0.32, labelPlacement: 'top' },    // Delta Boo
      { dx: 0.65, dy: -0.65, labelPlacement: 'top' },   // Nekkar
      { dx: 0.35, dy: -0.65, labelPlacement: 'top' },   // Seginus
    ],
  },
  {
    name: 'LACERTA',
    // Tight, sharp 5-star zigzag
    points: [
      { dx: -0.7, dy: 0.52, labelPlacement: 'bottom' },
      { dx: -0.3, dy: 0.06, labelPlacement: 'top' },
      { dx: -0.45, dy: -0.46, labelPlacement: 'top' },
      { dx: 0.2, dy: -0.16, labelPlacement: 'bottom' },
      { dx: 0.65, dy: -0.56, labelPlacement: 'top' },
    ],
  },
  {
    name: 'URSA MINOR',
    // The polar constellation pointing to Polaris
    points: [
      { dx: 0.0, dy: -0.55, labelPlacement: 'top' },     // Polaris
      { dx: -0.25, dy: -0.25, labelPlacement: 'top' },   // Yildun
      { dx: -0.45, dy: 0.02, labelPlacement: 'bottom' },
      { dx: -0.35, dy: 0.46, labelPlacement: 'bottom' }, // Anwar al Farkadain
      { dx: 0.15, dy: 0.56, labelPlacement: 'bottom' },  // Kochab
      { dx: 0.4, dy: 0.26, labelPlacement: 'top' },      // Pherkad
    ],
  },
];

// Warm Celestial Constellation Palette (coral, peach, amber, rose, lilac, sky)
const CONSTELLATION_PALETTE = [
  { text: '#fca5a5', active: '#f87171', thread: 'rgba(248, 113, 113, 0.55)', glow: 'rgba(248, 113, 113, 0.45)' },
  { text: '#fbcfe8', active: '#f472b6', thread: 'rgba(244, 114, 182, 0.55)', glow: 'rgba(244, 114, 182, 0.45)' },
  { text: '#fed7aa', active: '#fb923c', thread: 'rgba(251, 146, 60, 0.55)', glow: 'rgba(251, 146, 60, 0.45)' },
  { text: '#fef08a', active: '#facc15', thread: 'rgba(250, 204, 21, 0.55)', glow: 'rgba(250, 204, 21, 0.45)' },
  { text: '#ddd6fe', active: '#c084fc', thread: 'rgba(192, 132, 252, 0.55)', glow: 'rgba(192, 132, 252, 0.45)' },
  { text: '#bae6fd', active: '#38bdf8', thread: 'rgba(56, 189, 248, 0.55)', glow: 'rgba(56, 189, 248, 0.45)' },
];

/**
 * Builds an authentic astronomical constellation layout for each lyric phrase
 * modeled directly after the constellations in the star map image (Cassiopeia, Ursa Major, Draco, Cygnus, etc.).
 * Strictly a 1-to-1 forward angular chain with ZERO LOOPS.
 */
function buildConstellationForLine(line: LyricLine, lineIndex: number): ConstellationPhrase {
  const words = line.words && line.words.length > 0
    ? line.words.filter((w) => w.text && w.text.trim().length > 0)
    : [{ text: line.text.trim(), start: line.start, end: line.end }];

  const N = words.length;
  const stars: ConstellationStar[] = [];
  const edges: ConstellationEdge[] = [];

  const themeColor = CONSTELLATION_PALETTE[lineIndex % CONSTELLATION_PALETTE.length];
  const template = REAL_CONSTELLATIONS[lineIndex % REAL_CONSTELLATIONS.length];

  // Constellation Center across the viewport
  const centerX = 50 + (((lineIndex * 5) % 9) - 4);
  const centerY = 45 + (((lineIndex * 7) % 7) - 3);

  // Scale widths in viewport percentage (stays clear of turntable at bottom-left)
  const scaleX = 28;
  const scaleY = 20;

  // Sample or interpolate points from the authentic constellation
  for (let i = 0; i < N; i++) {
    const w = words[i];

    let dx = 0;
    let dy = 0;
    let placement: 'top' | 'bottom' = 'top';

    if (N === 1) {
      dx = 0;
      dy = 0;
      placement = 'bottom';
    } else {
      // Map i across the template's real star points
      const t = i / (N - 1);
      const exactIndex = t * (template.points.length - 1);
      const lowIndex = Math.floor(exactIndex);
      const highIndex = Math.min(template.points.length - 1, Math.ceil(exactIndex));
      const frac = exactIndex - lowIndex;

      const pLow = template.points[lowIndex];
      const pHigh = template.points[highIndex];

      dx = pLow.dx + (pHigh.dx - pLow.dx) * frac;
      dy = pLow.dy + (pHigh.dy - pLow.dy) * frac;
      placement = (pLow.labelPlacement || (dy < 0 ? 'top' : 'bottom')) as any;
    }

    const finalX = Math.max(18, Math.min(82, centerX + dx * scaleX));
    const finalY = Math.max(22, Math.min(68, centerY + dy * scaleY));

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

    // STRICTLY 1-TO-1 FORWARD CHAIN: Zero loops, zero cross-ties!
    if (i > 0) {
      edges.push({ fromIndex: i - 1, toIndex: i });
    }
  }

  return {
    lineId: line.id,
    constellationName: template.name,
    start: line.start,
    end: line.end,
    stars,
    edges,
    centerX,
    centerY,
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

    const FADE_OUT_DURATION = 1.2; // Quick, graceful 1.2s decay for completed lyrics

    for (const phrase of constellations) {
      // Phrase starts softly 0.25s ahead to eliminate any perceived vocal start delay
      const isOngoing = currentTime >= phrase.start - 0.25 && currentTime <= phrase.end;
      const isFading = currentTime > phrase.end && currentTime <= phrase.end + FADE_OUT_DURATION;

      if (isOngoing || isFading) {
        let opacity = 1.0;
        if (isFading) {
          // Continuous gentle power fade-out into deep space over 1.2s
          const fadeProgress = (currentTime - phrase.end) / FADE_OUT_DURATION;
          opacity = Math.max(0, Math.pow(1 - fadeProgress, 1.5));
        }

        // Determine which stars have spawned so far in this constellation
        const spawnedStars: ConstellationStar[] = [];
        let activeStar: ConstellationStar | null = null;

        for (let i = 0; i < phrase.stars.length; i++) {
          const star = phrase.stars[i];
          const nextStar = phrase.stars[i + 1];

          // 0.1s anticipation for crisp, zero-latency lyric synchronization
          if (currentTime >= star.start - 0.1) {
            spawnedStars.push(star);

            // Stays active and prominent following the vocal flow until the next star begins,
            // or through the phrase duration if it's the final word
            const singingUntil = nextStar ? nextStar.start - 0.05 : Math.max(star.end, phrase.end);
            if (currentTime >= star.start - 0.1 && currentTime <= singingUntil) {
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
          color: 'rgba(251, 113, 133, 0.45)',
          size: 280,
        });
      }
    }
  }, [activeConstellations, onSpawnRipple]);

  // Font size configuration (Significantly enlarged as requested!)
  const activeFontSizeClass = useMemo(() => {
    switch (fontSize) {
      case 'small': return 'text-3xl sm:text-4xl md:text-5xl';
      case 'large': return 'text-5xl sm:text-6xl md:text-7xl lg:text-8xl';
      case 'huge': return 'text-6xl sm:text-7xl md:text-8xl lg:text-9xl';
      case 'medium':
      default: return 'text-4xl sm:text-5xl md:text-6xl lg:text-7xl';
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

      {/* 2. Constellations Layer: Connecting Angular Luminous Lines (Authentic Star Map Paths, NO LOOPS!) */}
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
                  strokeWidth="0.38"
                  strokeLinecap="round"
                  style={{
                    filter: `drop-shadow(0 0 4px ${p2.threadColor})`,
                  }}
                />
              );
            })}
          </g>
        ))}
      </svg>

      {/* 3. Constellation Star Nodes and Big Bold Lyric Words */}
      <div className="absolute inset-0 z-20 pointer-events-none">
        {activeConstellations.map(({ phrase, opacity, spawnedStars, activeStar }) => (
          <div
            key={`stars-${phrase.lineId}`}
            style={{ opacity }}
            className="absolute inset-0 transition-opacity duration-300"
          >
            {/* Stars and Word Labels */}
            {spawnedStars.map((star) => {
              const isActive = activeStar?.id === star.id;
              const isTop = star.labelPlacement === 'top';

              return (
                <div
                  key={star.id}
                  onClick={(e) => {
                    e.stopPropagation();
                    onSeek(star.start);
                  }}
                  className={`absolute pointer-events-auto cursor-pointer flex items-center transition-all duration-200 ${
                    isTop ? 'flex-col-reverse' : 'flex-col'
                  } gap-1.5`}
                  style={{
                    left: `${star.x}%`,
                    top: `${star.y}%`,
                    transform: 'translate(-50%, -50%)',
                  }}
                >
                  {/* Astronomical 4-Point Diamond Star at Vertex */}
                  <DiamondStar
                    size={isActive ? 22 : 12}
                    isActive={isActive}
                    color={isActive ? star.color : 'rgba(255, 255, 255, 0.75)'}
                  />

                  {/* Word Label (Never wraps, prominent, sharp glow) */}
                  <span
                    style={{
                      color: isActive ? star.color : 'rgba(255, 255, 255, 0.82)',
                      textShadow: isActive
                        ? `0 0 16px ${star.color}, 0 0 32px ${star.color}`
                        : '0 0 6px rgba(255, 255, 255, 0.35)',
                    }}
                    className={`inline-block whitespace-nowrap font-black tracking-tight select-none transition-all duration-200 ${
                      isActive
                        ? `${activeFontSizeClass} font-black z-30 scale-105`
                        : 'text-sm sm:text-base md:text-lg lg:text-xl font-bold z-20'
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

      {/* 4. Astronomical Constellation Name Badge Positioned at Bottom-Right Corner */}
      {activeConstellations.length > 0 && (
        <div
          className="fixed bottom-20 right-8 z-30 pointer-events-none select-none transition-all duration-500 flex items-center gap-2 bg-black/60 backdrop-blur-md px-3.5 py-1.5 rounded-full border border-white/10 shadow-lg"
          style={{
            opacity: activeConstellations[activeConstellations.length - 1].opacity,
          }}
        >
          <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
          <span className="text-[10px] sm:text-[11px] font-mono uppercase tracking-[0.25em] text-amber-200/60 font-semibold">
            {activeConstellations[activeConstellations.length - 1].phrase.constellationName}
          </span>
        </div>
      )}
    </div>
  );
};
