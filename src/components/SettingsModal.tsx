import React from 'react';
import { X, Palette, Type, Clock, Eye, Sliders, Shield } from 'lucide-react';
import { VisualTheme, FontSizeSetting } from '../types';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  theme: VisualTheme;
  setTheme: (t: VisualTheme) => void;
  fontSize: FontSizeSetting;
  setFontSize: (s: FontSizeSetting) => void;
  showClock: boolean;
  setShowClock: (v: boolean) => void;
  wakeLockActive: boolean;
  syncOffset: number;
  setSyncOffset: (v: number) => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  theme,
  setTheme,
  fontSize,
  setFontSize,
  showClock,
  setShowClock,
  wakeLockActive,
  syncOffset,
  setSyncOffset,
}) => {
  if (!isOpen) return null;

  const themes: { id: VisualTheme; name: string; desc: string }[] = [
    { id: 'classic', name: 'Verci Classic', desc: 'Pitch black OLED background with pure white word focus' },
    { id: 'aurora', name: 'Ambient Aurora', desc: 'Vibrant fluid blurred gradients sampled from album art' },
    { id: 'fisheye', name: 'Fisheye Lens', desc: 'Dramatic dynamic depth scale between lines' },
    { id: 'cyberpunk', name: 'Neon Cyberpunk', desc: 'High-contrast cyan and magenta laser glow' },
    { id: 'minimal', name: 'Minimalist', desc: 'Clean Swiss typography without distractions' },
  ];

  const fontSizes: { id: FontSizeSetting; label: string }[] = [
    { id: 'small', label: 'Compact' },
    { id: 'medium', label: 'Balanced' },
    { id: 'large', label: 'Large' },
    { id: 'huge', label: 'Cinema' },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in">
      <div className="relative w-full max-w-lg bg-[#121216] border border-white/10 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-6 border-b border-white/10 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <Sliders className="w-5 h-5 text-white" />
            <h3 className="text-xl font-bold text-white">Display & Sync Settings</h3>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-full hover:bg-white/10 text-white/50 hover:text-white transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 overflow-y-auto space-y-6">
          {/* Visual Theme Selection */}
          <div>
            <label className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-white/50 mb-3">
              <Palette className="w-4 h-4" /> Visual Theme
            </label>
            <div className="grid grid-cols-1 gap-2">
              {themes.map((t) => (
                <div
                  key={t.id}
                  onClick={() => setTheme(t.id)}
                  className={`p-3 rounded-2xl border cursor-pointer transition flex items-center justify-between ${
                    theme === t.id
                      ? 'bg-white/15 border-white text-white'
                      : 'bg-white/[0.03] border-white/5 text-white/70 hover:bg-white/10'
                  }`}
                >
                  <div>
                    <p className="text-sm font-bold text-white">{t.name}</p>
                    <p className="text-xs text-white/50">{t.desc}</p>
                  </div>
                  {theme === t.id && (
                    <div className="w-2 h-2 rounded-full bg-white shadow-[0_0_8px_#ffffff]" />
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Typography Scale */}
          <div>
            <label className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-white/50 mb-3">
              <Type className="w-4 h-4" /> Typography Size
            </label>
            <div className="grid grid-cols-4 gap-2">
              {fontSizes.map((s) => (
                <button
                  key={s.id}
                  onClick={() => setFontSize(s.id)}
                  className={`py-2.5 rounded-xl text-xs font-semibold border transition ${
                    fontSize === s.id
                      ? 'bg-white text-black border-white'
                      : 'bg-white/5 text-white/70 border-white/10 hover:bg-white/10'
                  }`}
                >
                  {s.label}
                </button>
              ))}
            </div>
          </div>

          {/* Lock Screen Clock & Wake Lock */}
          <div className="space-y-3 pt-2 border-t border-white/10">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-white/60" />
                <div>
                  <p className="text-sm font-semibold text-white">Lockscreen Clock</p>
                  <p className="text-xs text-white/50">Display sleek Apple-style time and date</p>
                </div>
              </div>
              <input
                type="checkbox"
                checked={showClock}
                onChange={(e) => setShowClock(e.target.checked)}
                className="w-5 h-5 accent-white rounded cursor-pointer"
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Shield className="w-4 h-4 text-white/60" />
                <div>
                  <p className="text-sm font-semibold text-white">Display Sleep Prevention</p>
                  <p className="text-xs text-white/50">Keeps monitor or mobile screen awake (WakeLock)</p>
                </div>
              </div>
              <span className={`text-xs font-semibold px-2 py-1 rounded-lg ${wakeLockActive ? 'bg-emerald-500/20 text-emerald-400' : 'bg-white/10 text-white/40'}`}>
                {wakeLockActive ? 'Active' : 'Standby'}
              </span>
            </div>
          </div>

          {/* Precision Sync Adjustment */}
          <div className="pt-2 border-t border-white/10">
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-semibold uppercase tracking-wider text-white/50">
                Precision Timing Offset
              </label>
              <span className="font-mono text-xs text-white font-bold">
                {syncOffset >= 0 ? `+${syncOffset.toFixed(2)}s` : `${syncOffset.toFixed(2)}s`}
              </span>
            </div>
            <input
              type="range"
              min="-2"
              max="2"
              step="0.05"
              value={syncOffset}
              onChange={(e) => setSyncOffset(parseFloat(e.target.value))}
              className="w-full accent-white h-1.5 bg-white/20 rounded-full cursor-pointer"
            />
            <div className="flex justify-between text-[11px] text-white/40 mt-1">
              <span>-2.0s (later)</span>
              <button
                onClick={() => setSyncOffset(0)}
                className="text-white/60 hover:text-white underline"
              >
                Reset to 0
              </button>
              <span>+2.0s (earlier)</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
