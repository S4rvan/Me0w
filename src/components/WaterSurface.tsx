import React, { useState, useEffect, useCallback, useRef } from 'react';

export interface RippleEvent {
  id: number;
  xPercent: number;
  yPercent: number;
  color?: string;
  size?: number;
}

interface WaterSurfaceProps {
  externalRipples?: RippleEvent[];
  isInstrumental?: boolean;
}

export const WaterSurface: React.FC<WaterSurfaceProps> = ({
  externalRipples = [],
  isInstrumental = false,
}) => {
  const [ripples, setRipples] = useState<RippleEvent[]>([]);
  const lastMouseTimeRef = useRef<number>(0);

  // Add external ripples (from lyrics spawning)
  useEffect(() => {
    if (externalRipples.length === 0) return;
    const latest = externalRipples[externalRipples.length - 1];
    setRipples((prev) => [...prev.slice(-8), latest]);
  }, [externalRipples]);

  // Periodic tranquil raindrops during instrumental/blank moments
  useEffect(() => {
    if (!isInstrumental) return;

    const interval = setInterval(() => {
      const randomX = 25 + Math.random() * 50;
      const randomY = 25 + Math.random() * 45;
      const drop: RippleEvent = {
        id: Date.now() + Math.random(),
        xPercent: randomX,
        yPercent: randomY,
        color: 'rgba(255, 230, 240, 0.4)',
        size: 180,
      };
      setRipples((prev) => [...prev.slice(-8), drop]);
    }, 2800);

    return () => clearInterval(interval);
  }, [isInstrumental]);

  // Clean up old ripples after animation duration (2.8s)
  useEffect(() => {
    const timer = setInterval(() => {
      const now = Date.now();
      setRipples((prev) => prev.filter((r) => now - r.id < 2800));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Smooth mouse move water trail (throttled to 140ms for 100% butter smoothness)
  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    const now = performance.now();
    if (now - lastMouseTimeRef.current < 140) return;
    lastMouseTimeRef.current = now;

    const rect = e.currentTarget.getBoundingClientRect();
    const xPercent = ((e.clientX - rect.left) / rect.width) * 100;
    const yPercent = ((e.clientY - rect.top) / rect.height) * 100;

    const trailRipple: RippleEvent = {
      id: Date.now() + Math.random(),
      xPercent,
      yPercent,
      color: 'rgba(255, 255, 255, 0.22)',
      size: 110,
    };

    setRipples((prev) => [...prev.slice(-8), trailRipple]);
  }, []);

  return (
    <div
      onMouseMove={handleMouseMove}
      className="absolute inset-0 pointer-events-auto overflow-hidden z-5 select-none"
    >
      {ripples.map((r) => (
        <div
          key={r.id}
          className="absolute -translate-x-1/2 -translate-y-1/2 pointer-events-none"
          style={{
            left: `${r.xPercent}%`,
            top: `${r.yPercent}%`,
          }}
        >
          {/* Water drop impact center flash */}
          <div
            className="w-1.5 h-1.5 rounded-full animate-drop-impact mx-auto"
            style={{ backgroundColor: r.color || 'rgba(255, 255, 255, 0.5)' }}
          />

          {/* Concentric puddle ripple rings */}
          <div
            className="water-ripple ripple-1"
            style={{
              borderColor: r.color || 'rgba(255, 220, 235, 0.35)',
              maxWidth: `${r.size || 200}px`,
              maxHeight: `${r.size || 200}px`,
            }}
          />
          <div
            className="water-ripple ripple-2"
            style={{
              borderColor: r.color || 'rgba(255, 220, 235, 0.25)',
              maxWidth: `${(r.size || 200) * 0.8}px`,
              maxHeight: `${(r.size || 200) * 0.8}px`,
            }}
          />
          <div
            className="water-ripple ripple-3"
            style={{
              borderColor: r.color || 'rgba(255, 220, 235, 0.15)',
              maxWidth: `${(r.size || 200) * 0.6}px`,
              maxHeight: `${(r.size || 200) * 0.6}px`,
            }}
          />
        </div>
      ))}
    </div>
  );
};
