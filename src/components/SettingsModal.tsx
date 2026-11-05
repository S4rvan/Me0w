import React from 'react';
import { X, Palette, Type, Clock, Sliders, Shield, Sun, Sparkles, Tag } from 'lucide-react';
import { VisualTheme, FontSizeSetting, EdgeLightMode } from '../types';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  theme: VisualTheme;
  setTheme: (t: VisualTheme) => void;
  fontSize: FontSizeSetting;
  setFontSize: (s: FontSizeSetting) => void;
  edgeLightMode: EdgeLightMode;
  setEdgeLightMode: (m: EdgeLightMode) => void;
  edgeIntensity: number;
  setEdgeIntensity: (v: number) => void;
  showClock: boolean;
  setShowClock: (v: boolean) => void;
  wakeLockActive: boolean;
  syncOffset: number;
  setSyncOffset: (v: number) => void;
  appName: string;
  setAppName: (name: string) => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  theme,
  setTheme,
  fontSize,
  setFontSize,
  edgeLightMode,
  setEdgeLightMode,
  edgeIntensity,
  setEdgeIntensity,
  showClock,
  setShowClock,
  wakeLockActive,
  syncOffset,
  setSyncOffset,
  appName,
  setAppName,
}) => {
  if (!isOpen) return null;

  const edgeLightOptions: { id: EdgeLightMode; name: string; desc: string }[] = [
    { id: 'ambilight', name: 'Ambilight Screen Glow', desc: 'Soft diffused lighting flooding inward from all screen borders' },
    { id: 'neon', name: 'Neon Cyber Bezel', desc: 'Crisp, vibrant glowing neon light tubes lining the perimeter' },
    { id: 'pulse', name: 'Pulsing Reactive Glow', desc: 'Breathes dynamically in rhythm with the music' },
    { id: 'subtle', name: 'Subtle Edge Vignette', desc: 'Gentle warm ambient outline' },
    { id: 'off', name: 'Off', desc: 'No edge lights' },
  ];

  const themes: { id: VisualTheme; name: string; desc: string }[] = [
    { id: 'aurora', name: 'Ambient Aurora', desc: 'Fluid blurred gradients sampled from album art' },
    { id: 'classic', name: 'Verci Classic', desc: 'Pitch black OLED background with pure white word focus' },
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
            <h3 className="text-xl font-bold text-white">Display & Edge Light Settings</h3>
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
          {/* Edge Lights Around Screen Border */}
          <div className="bg-white/[0.03] border border-white/10 rounded-2xl p-4 space-y-3">
            <div className="flex items-center justify-between">
              <label className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-amber-400">
                <Sparkles className="w-4 h-4" /> Screen Edge Lights (Ambilight)
              </label>
              <span className="text-[11px] font-mono text-white/40">
                {edgeLightMode !== 'off' ? `${Math.round(edgeIntensity * 100)}% Brightness` : 'Disabled'}
              </span>
            </div>

            <div className="grid grid-cols-1 gap-1.5">
              {edgeLightOptions.map((opt) => (
                <div
                  key={opt.id}
                  onClick={() => setEdgeLightMode(opt.id)}
                  className={`p-2.5 rounded-xl border cursor-pointer transition flex items-center justify-between ${
                    edgeLightMode === opt.id
                      ? 'bg-amber-400/15 border-amber-400/50 text-white'
                      : 'bg-white/[0.02] border-white/5 text-white/70 hover:bg-white/5'
                  }`}
                >
                  <div>
                    <p className="text-xs font-bold text-white">{opt.name}</p>
                    <p className="text-[11px] text-white/45">{opt.desc}</p>
                  </div>
                  {edgeLightMode === opt.id && (
                    <div className="w-2 h-2 rounded-full bg-amber-400 shadow-[0_0_8px_#fbbf24]" />
                  )}
                </div>
              ))}
            </div>

            {edgeLightMode !== 'off' && (
              <div className="pt-2">
                <div className="flex items-center justify-between text-[11px] text-white/60 mb-1">
                  <span>Edge Light Brightness</span>
                  <span className="font-mono text-white font-bold">{Math.round(edgeIntensity * 100)}%</span>
                </div>
                <input
                  type="range"
                  min="0.2"
                  max="1.0"
                  step="0.05"
                  value={edgeIntensity}
                  onChange={(e) => setEdgeIntensity(parseFloat(e.target.value))}
                  className="w-full accent-amber-400 h-1.5 bg-white/15 rounded-full cursor-pointer"
                />
              </div>
            )}
          </div>

          {/* App / Website Brand Name */}
          <div>
            <label className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-white/50 mb-2">
              <Tag className="w-4 h-4" /> App Branding Name
            </label>
            <input
              type="text"
              value={appName}
              onChange={(e) => setAppName(e.target.value)}
              placeholder="e.g. Spootify or Lyrix"
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-white/30"
            />
            <p className="text-[11px] text-white/40 mt-1">
              Changes the header title so you can name it whatever you like.
            </p>
          </div>

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
              min="-3"
              max="3"
              step="0.05"
              value={syncOffset}
              onChange={(e) => setSyncOffset(parseFloat(e.target.value))}
              className="w-full accent-white h-1.5 bg-white/20 rounded-full cursor-pointer"
            />
            <div className="flex justify-between text-[11px] text-white/40 mt-1">
              <span>-3.0s (lyrics later)</span>
              <button
                onClick={() => setSyncOffset(0)}
                className="text-white/60 hover:text-white underline"
              >
                Reset to 0
              </button>
              <span>+3.0s (lyrics earlier)</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
