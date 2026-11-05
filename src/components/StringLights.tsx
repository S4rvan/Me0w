import React, { useMemo } from 'react';

interface StringLightsProps {
  intensity?: number; // 0.1 to 1.0 (default soft ~0.65)
  isPlaying?: boolean;
}

export const StringLights: React.FC<StringLightsProps> = ({
  intensity = 0.65,
  isPlaying = true,
}) => {
  // Generate bulbs along 3 drooping swag wire segments
  const bulbs = useMemo(() => {
    const list: { xPercent: number; yOffset: number; delay: number; size: number; color: string }[] = [];
    const count = 18; // 18 delicate bulbs across the top
    const colors = ['#ffe8b3', '#fff0cc', '#ffd699', '#ffe0a3'];

    for (let i = 0; i < count; i++) {
      const xPercent = ((i + 0.5) / count) * 100;
      // Calculate realistic catenary droop (hanging swag curve across segments)
      const segmentProgress = (xPercent % 33.33) / 33.33; // 3 swags across top
      const droop = Math.sin(segmentProgress * Math.PI) * 18 + 8; // 8px to 26px drop

      list.push({
        xPercent,
        yOffset: droop,
        delay: (i * 0.43) % 4,
        size: 5 + (i % 3) * 0.8, // 5px to 6.6px micro bulbs
        color: colors[i % colors.length],
      });
    }
    return list;
  }, []);

  return (
    <div
      className="fixed top-0 left-0 right-0 pointer-events-none z-20 select-none overflow-hidden"
      style={{
        height: '90px',
        opacity: intensity,
        transition: 'opacity 0.8s ease',
      }}
    >
      {/* 1. Wire Path: SVG catenary curves hanging across top */}
      <svg
        className="w-full h-full absolute top-0 left-0"
        preserveAspectRatio="none"
        viewBox="0 0 1000 90"
      >
        <path
          d="M 0,5 Q 166,42 333,8 Q 500,42 666,8 Q 833,42 1000,5"
          fill="none"
          stroke="rgba(255, 255, 255, 0.18)"
          strokeWidth="1.2"
        />
        {/* Soft secondary wire shadow */}
        <path
          d="M 0,6 Q 166,43 333,9 Q 500,43 666,9 Q 833,43 1000,6"
          fill="none"
          stroke="rgba(0, 0, 0, 0.4)"
          strokeWidth="1"
        />
      </svg>

      {/* 2. Delicate Fairy Light Bulbs */}
      {bulbs.map((b, idx) => (
        <div
          key={idx}
          className="absolute -translate-x-1/2 flex flex-col items-center pointer-events-none"
          style={{
            left: `${b.xPercent}%`,
            top: `${b.yOffset}px`,
          }}
        >
          {/* Bulb cap / socket */}
          <div className="w-[3px] h-[3px] bg-[#2a2a2e] rounded-xs" />

          {/* Micro bulb with warm soft halo */}
          <div
            className="rounded-full transition-all duration-1000"
            style={{
              width: `${b.size}px`,
              height: `${b.size * 1.3}px`,
              backgroundColor: b.color,
              boxShadow: isPlaying
                ? `0 0 10px 2px ${b.color}aa, 0 0 22px 6px ${b.color}44, 0 4px 15px 4px rgba(255, 200, 100, 0.25)`
                : `0 0 5px 1px ${b.color}66`,
              animation: isPlaying ? `fairyTwinkle 4s ease-in-out infinite alternate` : 'none',
              animationDelay: `${b.delay}s`,
            }}
          />
        </div>
      ))}

      {/* 3. Subtle ambient light wash downwards */}
      <div
        className="absolute top-0 left-0 right-0 h-20 pointer-events-none"
        style={{
          background: 'linear-gradient(to bottom, rgba(255, 220, 150, 0.04), transparent)',
        }}
      />
    </div>
  );
};
