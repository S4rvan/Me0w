import React from 'react';
import { EdgeLightMode, ColorPalette } from '../types';

interface EdgeLightsProps {
  mode: EdgeLightMode;
  palette: ColorPalette;
  isPlaying: boolean;
  intensity?: number; // 0.2 to 1.0
}

export const EdgeLights: React.FC<EdgeLightsProps> = ({
  mode,
  palette,
  isPlaying,
  intensity = 0.85,
}) => {
  if (mode === 'off') return null;

  const isPulse = mode === 'pulse' || (isPlaying && mode !== 'subtle');
  const blurAmount = mode === 'neon' ? '18px' : mode === 'subtle' ? '40px' : '65px';
  const thickness = mode === 'neon' ? '6px' : mode === 'subtle' ? '20px' : '45px';
  const pulseClass = isPulse ? 'animate-edge-breathe' : '';

  return (
    <div
      className="fixed inset-0 pointer-events-none z-20 overflow-hidden select-none"
      style={{
        opacity: intensity,
        transition: 'opacity 0.6s ease',
      }}
    >
      {/* 1. Inset perimeter soft glow (Ambilight effect) */}
      <div
        className={`absolute inset-0 transition-all duration-1000 ${pulseClass}`}
        style={{
          boxShadow:
            mode === 'neon'
              ? `inset 0 0 25px ${palette.primary}, inset 0 0 60px ${palette.secondary}88`
              : mode === 'subtle'
              ? `inset 0 0 40px ${palette.primary}44, inset 0 0 80px ${palette.secondary}22`
              : `inset 0 0 70px ${palette.primary}77, inset 0 0 140px ${palette.secondary}55, inset 0 0 200px ${palette.accent}33`,
        }}
      />

      {/* 2. Top Edge Light Bar */}
      <div
        className={`absolute top-0 left-0 right-0 transition-all duration-1000 ${pulseClass}`}
        style={{
          height: thickness,
          background: `linear-gradient(90deg, ${palette.primary}, ${palette.secondary}, ${palette.accent}, ${palette.primary})`,
          filter: `blur(${blurAmount})`,
          opacity: 0.9,
        }}
      />

      {/* 3. Bottom Edge Light Bar */}
      <div
        className={`absolute bottom-0 left-0 right-0 transition-all duration-1000 ${pulseClass}`}
        style={{
          height: thickness,
          background: `linear-gradient(90deg, ${palette.secondary}, ${palette.accent}, ${palette.primary}, ${palette.secondary})`,
          filter: `blur(${blurAmount})`,
          opacity: 0.9,
        }}
      />

      {/* 4. Left Edge Light Bar */}
      <div
        className={`absolute top-0 bottom-0 left-0 transition-all duration-1000 ${pulseClass}`}
        style={{
          width: thickness,
          background: `linear-gradient(180deg, ${palette.primary}, ${palette.accent}, ${palette.secondary})`,
          filter: `blur(${blurAmount})`,
          opacity: 0.85,
        }}
      />

      {/* 5. Right Edge Light Bar */}
      <div
        className={`absolute top-0 bottom-0 right-0 transition-all duration-1000 ${pulseClass}`}
        style={{
          width: thickness,
          background: `linear-gradient(180deg, ${palette.secondary}, ${palette.primary}, ${palette.accent})`,
          filter: `blur(${blurAmount})`,
          opacity: 0.85,
        }}
      />

      {/* 6. Four Corner Radiant Flare Orbs */}
      <div
        className="absolute top-0 left-0 w-36 h-36 rounded-full -translate-x-1/2 -translate-y-1/2 pointer-events-none transition-colors duration-1000"
        style={{
          background: `radial-gradient(circle, ${palette.primary}aa 0%, transparent 70%)`,
          filter: 'blur(35px)',
        }}
      />
      <div
        className="absolute top-0 right-0 w-36 h-36 rounded-full translate-x-1/2 -translate-y-1/2 pointer-events-none transition-colors duration-1000"
        style={{
          background: `radial-gradient(circle, ${palette.secondary}aa 0%, transparent 70%)`,
          filter: 'blur(35px)',
        }}
      />
      <div
        className="absolute bottom-0 left-0 w-36 h-36 rounded-full -translate-x-1/2 translate-y-1/2 pointer-events-none transition-colors duration-1000"
        style={{
          background: `radial-gradient(circle, ${palette.accent}aa 0%, transparent 70%)`,
          filter: 'blur(35px)',
        }}
      />
      <div
        className="absolute bottom-0 right-0 w-36 h-36 rounded-full translate-x-1/2 translate-y-1/2 pointer-events-none transition-colors duration-1000"
        style={{
          background: `radial-gradient(circle, ${palette.primary}aa 0%, transparent 70%)`,
          filter: 'blur(35px)',
        }}
      />
    </div>
  );
};
