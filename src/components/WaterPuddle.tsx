import React, { useState, useEffect } from 'react';

interface Ripple {
  id: number;
  xPercent: number;
  yPercent: number;
}

export const WaterPuddle: React.FC = () => {
  const [ripples, setRipples] = useState<Ripple[]>([]);

  useEffect(() => {
    // Initial ripple
    setRipples([{ id: Date.now(), xPercent: 50, yPercent: 50 }]);

    const interval = setInterval(() => {
      // Spawn droplet near center with gentle organic deviation
      const offsetX = 50 + (Math.random() - 0.5) * 20;
      const offsetY = 50 + (Math.random() - 0.5) * 16;
      const newRipple = {
        id: Date.now(),
        xPercent: offsetX,
        yPercent: offsetY,
      };

      setRipples((prev) => [...prev.slice(-3), newRipple]);
    }, 3200);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden z-10 flex items-center justify-center select-none">
      {ripples.map((r) => (
        <div
          key={r.id}
          className="absolute -translate-x-1/2 -translate-y-1/2 pointer-events-none"
          style={{
            left: `${r.xPercent}%`,
            top: `${r.yPercent}%`,
          }}
        >
          {/* Water drop impact dot */}
          <div className="w-1.5 h-1.5 rounded-full bg-white/40 animate-drop-impact mx-auto" />

          {/* Concentric ripple rings */}
          <div className="water-ripple ripple-1" />
          <div className="water-ripple ripple-2" />
          <div className="water-ripple ripple-3" />
        </div>
      ))}
    </div>
  );
};
