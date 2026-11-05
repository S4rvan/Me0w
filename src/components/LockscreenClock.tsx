import React, { useState, useEffect } from 'react';

export const LockscreenClock: React.FC = () => {
  const [timeStr, setTimeStr] = useState('');
  const [dateStr, setDateStr] = useState('');

  useEffect(() => {
    const update = () => {
      const now = new Date();
      setTimeStr(
        now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false })
      );
      setDateStr(
        now.toLocaleDateString([], { weekday: 'long', month: 'long', day: 'numeric' })
      );
    };

    update();
    const interval = setInterval(update, 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="flex flex-col items-center justify-center select-none pointer-events-none opacity-40 hover:opacity-80 transition-opacity">
      <div className="text-3xl md:text-5xl font-extralight tracking-tight text-white font-mono">
        {timeStr}
      </div>
      <div className="text-xs md:text-sm font-medium tracking-wide text-white/70 uppercase">
        {dateStr}
      </div>
    </div>
  );
};
