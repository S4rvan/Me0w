import React, { useState, useEffect, useRef, useCallback } from 'react';
import { X, Palette, Check } from 'lucide-react';
import { ColorPalette, EdgeLightMode } from '../types';

interface ColorWheelModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentPalette: ColorPalette;
  onUpdatePalette: (palette: ColorPalette) => void;
  edgeLightMode: EdgeLightMode;
  onUpdateEdgeMode: (mode: EdgeLightMode) => void;
  edgeIntensity: number;
  onUpdateEdgeIntensity: (intensity: number) => void;
}

function hslToHex(h: number, s: number, l: number): string {
  const c = (1 - Math.abs(2 * l - 1)) * s;
  const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
  const m = l - c / 2;
  let r = 0, g = 0, b = 0;

  if (0 <= h && h < 60) { r = c; g = x; b = 0; }
  else if (60 <= h && h < 120) { r = x; g = c; b = 0; }
  else if (120 <= h && h < 180) { r = 0; g = c; b = x; }
  else if (180 <= h && h < 240) { r = 0; g = x; b = c; }
  else if (240 <= h && h < 300) { r = x; g = 0; b = c; }
  else if (300 <= h && h < 360) { r = c; g = 0; b = x; }

  const toHex = (n: number) => {
    const val = Math.max(0, Math.min(255, Math.round((n + m) * 255)));
    return val.toString(16).padStart(2, '0');
  };
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}

function hslToRgb(h: number, s: number, l: number): { r: number; g: number; b: number } {
  const c = (1 - Math.abs(2 * l - 1)) * s;
  const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
  const m = l - c / 2;
  let r = 0, g = 0, b = 0;

  if (0 <= h && h < 60) { r = c; g = x; b = 0; }
  else if (60 <= h && h < 120) { r = x; g = c; b = 0; }
  else if (120 <= h && h < 180) { r = 0; g = c; b = x; }
  else if (180 <= h && h < 240) { r = 0; g = x; b = c; }
  else if (240 <= h && h < 300) { r = x; g = 0; b = c; }
  else if (300 <= h && h < 360) { r = c; g = 0; b = x; }

  return {
    r: Math.round((r + m) * 255),
    g: Math.round((g + m) * 255),
    b: Math.round((b + m) * 255),
  };
}

function hexToHsl(hex: string): { h: number; s: number; l: number } {
  let clean = hex.replace('#', '');
  if (clean.length === 3) {
    clean = clean.split('').map((c) => c + c).join('');
  }
  const r = parseInt(clean.substring(0, 2), 16) / 255;
  const g = parseInt(clean.substring(2, 4), 16) / 255;
  const b = parseInt(clean.substring(4, 6), 16) / 255;

  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  let h = 0;
  let s = 0;
  const l = (max + min) / 2;

  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r: h = (g - b) / d + (g < b ? 6 : 0); break;
      case g: h = (b - r) / d + 2; break;
      case b: h = (r - g) / d + 4; break;
    }
    h = h * 60;
  }

  return { h, s, l };
}

// Preset Swatches for fast edge lighting themes
const PRESET_SWATCHES = [
  { name: 'Neon Coral', hex: '#f43f5e' },
  { name: 'Electric Cyan', hex: '#06b6d4' },
  { name: 'Cyber Violet', hex: '#a855f7' },
  { name: 'Sunset Amber', hex: '#f59e0b' },
  { name: 'Emerald Mint', hex: '#10b981' },
  { name: 'TV Girl Blush', hex: '#f472b6' },
  { name: 'Deep Indigo', hex: '#6366f1' },
  { name: 'Pure White', hex: '#ffffff' },
];

export const ColorWheelModal: React.FC<ColorWheelModalProps> = ({
  isOpen,
  onClose,
  currentPalette,
  onUpdatePalette,
  edgeLightMode,
  onUpdateEdgeMode,
  edgeIntensity,
  onUpdateEdgeIntensity,
}) => {
  const wheelContainerRef = useRef<HTMLDivElement | null>(null);
  const sliderRef = useRef<HTMLDivElement | null>(null);

  const [hue, setHue] = useState<number>(345);
  const [saturation, setSaturation] = useState<number>(0.85);
  const [lightness, setLightness] = useState<number>(0.55);
  const [activeTab, setActiveTab] = useState<'HSL' | 'RGB' | 'Hex'>('HSL');
  const isDraggingWheel = useRef<boolean>(false);
  const isDraggingSlider = useRef<boolean>(false);

  // Initialize from current palette
  useEffect(() => {
    if (currentPalette.primary) {
      const hsl = hexToHsl(currentPalette.primary);
      setHue(hsl.h);
      setSaturation(hsl.s);
      setLightness(Math.max(0.2, Math.min(0.8, hsl.l)));
    }
  }, [currentPalette.primary]);

  // Update edge glow palette
  const applyColor = useCallback((h: number, s: number, l: number) => {
    const primary = hslToHex(h, s, l);
    const secondary = hslToHex((h + 20) % 360, Math.min(1, s * 0.95), Math.min(0.85, l * 1.15));
    const accent = hslToHex((h - 20 + 360) % 360, Math.min(1, s * 0.8), Math.min(0.9, l * 1.3));

    onUpdatePalette({
      primary,
      secondary,
      accent,
      background: '#000000',
    });
    localStorage.setItem('verci_custom_edge_color', primary);
  }, [onUpdatePalette]);

  // Handle interaction on the Circular Wheel
  // Matches Image 2: Cyan at Top (12 o'clock), Blue at Top-Right/Right, Red at Bottom (6 o'clock), Green at Left
  const handleWheelMove = useCallback((clientX: number, clientY: number) => {
    const el = wheelContainerRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const cx = rect.width / 2;
    const cy = rect.height / 2;
    const x = clientX - rect.left - cx;
    const y = clientY - rect.top - cy;

    const dist = Math.sqrt(x * x + y * y);
    const maxRadius = cx;

    // Clock angle starting from 12 o'clock (0 to 360 clockwise)
    const clockAngle = (Math.atan2(y, x) * 180 / Math.PI + 90 + 360) % 360;

    // Hue: Cyan (180) at 12 o'clock (0deg), Red (0/360) at 6 o'clock (180deg)
    const newHue = Math.round((clockAngle - 180 + 360) % 360);
    const newSat = Math.max(0, Math.min(1, dist / maxRadius));

    setHue(newHue);
    setSaturation(newSat);
    applyColor(newHue, newSat, lightness);
  }, [lightness, applyColor]);

  // Handle interaction on the Vertical Lightness Slider
  const handleSliderMove = useCallback((clientY: number) => {
    const el = sliderRef.current;
    if (!el) return;
    const sliderRect = el.getBoundingClientRect();
    const relY = clientY - sliderRect.top;
    const ratio = Math.max(0, Math.min(1, relY / sliderRect.height));
    // Top is 1.0 (white), bottom is 0.0 (black)
    const newLightness = Math.max(0.05, Math.min(0.95, 1 - ratio));

    setLightness(newLightness);
    applyColor(hue, saturation, newLightness);
  }, [hue, saturation, applyColor]);

  // Global mouse & touch listeners while dragging
  useEffect(() => {
    const onMouseMove = (e: MouseEvent) => {
      if (isDraggingWheel.current) {
        handleWheelMove(e.clientX, e.clientY);
      } else if (isDraggingSlider.current) {
        handleSliderMove(e.clientY);
      }
    };
    const onTouchMove = (e: TouchEvent) => {
      if (e.touches.length > 0) {
        if (isDraggingWheel.current) {
          handleWheelMove(e.touches[0].clientX, e.touches[0].clientY);
        } else if (isDraggingSlider.current) {
          handleSliderMove(e.touches[0].clientY);
        }
      }
    };
    const onStopDrag = () => {
      isDraggingWheel.current = false;
      isDraggingSlider.current = false;
    };

    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onStopDrag);
    window.addEventListener('touchmove', onTouchMove);
    window.addEventListener('touchend', onStopDrag);

    return () => {
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onStopDrag);
      window.removeEventListener('touchmove', onTouchMove);
      window.removeEventListener('touchend', onStopDrag);
    };
  }, [handleWheelMove, handleSliderMove]);

  if (!isOpen) return null;

  const currentColorHex = hslToHex(hue, saturation, lightness);
  const rgb = hslToRgb(hue, saturation, lightness);

  // Selector thumb position on wheel (220px diameter, radius = 110px)
  const wheelRadius = 110;
  const clockAngle = (hue + 180) % 360;
  const mathAngle = ((clockAngle - 90) * Math.PI) / 180;
  const thumbDist = saturation * wheelRadius;
  const thumbX = wheelRadius + Math.cos(mathAngle) * thumbDist;
  const thumbY = wheelRadius + Math.sin(mathAngle) * thumbDist;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-xl animate-fade-in">
      <div className="relative w-full max-w-sm bg-[#16161b] border border-white/15 rounded-3xl p-6 shadow-[0_25px_70px_rgba(0,0,0,0.95)] text-white select-none">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-white/10">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-rose-500/20 text-rose-400 border border-rose-500/30">
              <Palette className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold tracking-wide">Borderline Lights Color</h3>
              <p className="text-[11px] text-white/50">Custom edge glow & ambient lighting</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-white/10 text-white/60 hover:text-white transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* The Circular Color Wheel & Vertical Lightness Slider (Identical to User Reference Image) */}
        <div className="flex items-center justify-center gap-5 my-6">
          {/* Circular Wheel (CSS Conic Gradient matching reference image: Cyan at top, Red at bottom) */}
          <div
            ref={wheelContainerRef}
            className="relative w-[220px] h-[220px] rounded-full cursor-crosshair shadow-2xl flex-shrink-0 border-2 border-white/20 select-none overflow-hidden"
            style={{
              background: `
                radial-gradient(circle closest-side, #ffffff 0%, rgba(255,255,255,0.7) 30%, rgba(255,255,255,0) 100%),
                conic-gradient(from 0deg, 
                  #00ffff 0deg, 
                  #0000ff 60deg, 
                  #ff00ff 120deg, 
                  #ff0000 180deg, 
                  #ffff00 240deg, 
                  #00ff00 300deg, 
                  #00ffff 360deg
                )
              `,
            }}
            onMouseDown={(e) => {
              isDraggingWheel.current = true;
              handleWheelMove(e.clientX, e.clientY);
            }}
            onTouchStart={(e) => {
              if (e.touches.length > 0) {
                isDraggingWheel.current = true;
                handleWheelMove(e.touches[0].clientX, e.touches[0].clientY);
              }
            }}
          >
            {/* Color Wheel Selector Handle Thumb (Matches reference: ring with white border and dark outline) */}
            <div
              className="absolute w-4 h-4 rounded-full border-2 border-white bg-black/40 shadow-[0_0_6px_rgba(0,0,0,0.9)] -translate-x-1/2 -translate-y-1/2 pointer-events-none transition-transform duration-75 flex items-center justify-center"
              style={{
                left: `${thumbX}px`,
                top: `${thumbY}px`,
              }}
            >
              <div
                className="w-1.5 h-1.5 rounded-full"
                style={{ backgroundColor: currentColorHex }}
              />
            </div>
          </div>

          {/* Vertical Lightness / Brightness Slider (Matches reference: white at top to black at bottom) */}
          <div
            ref={sliderRef}
            className="relative w-7 h-[220px] rounded-full cursor-pointer border-2 border-white/20 shadow-lg flex-shrink-0 select-none overflow-hidden"
            style={{
              background: `linear-gradient(to bottom, #ffffff 0%, hsl(${hue}, ${saturation * 100}%, 50%) 50%, #000000 100%)`,
            }}
            onMouseDown={(e) => {
              isDraggingSlider.current = true;
              handleSliderMove(e.clientY);
            }}
            onTouchStart={(e) => {
              if (e.touches.length > 0) {
                isDraggingSlider.current = true;
                handleSliderMove(e.touches[0].clientY);
              }
            }}
          >
            {/* Slider Handle Thumb (White pill with central ring, matching reference) */}
            <div
              className="absolute left-0.5 right-0.5 h-4 border-2 border-white rounded-full bg-white shadow-[0_0_8px_rgba(0,0,0,0.8)] pointer-events-none -translate-y-1/2 flex items-center justify-center"
              style={{ top: `${(1 - lightness) * 100}%` }}
            >
              <div className="w-1.5 h-1.5 rounded-full bg-black/60" />
            </div>
          </div>
        </div>

        {/* Format Tabs & Color Values Box (Exact match to Reference Image 2) */}
        <div className="bg-[#1e1e26] border border-white/10 rounded-2xl p-3 mb-4 space-y-2.5">
          {/* Tabs: RGB | HSL | Hex */}
          <div className="flex items-center justify-between pb-2 border-b border-white/10 text-xs font-mono">
            <div className="flex bg-black/40 rounded-xl p-0.5 border border-white/10">
              {(['RGB', 'HSL', 'Hex'] as const).map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`px-3 py-1 rounded-lg text-[11px] font-bold transition ${
                    activeTab === tab
                      ? 'bg-blue-600 text-white shadow'
                      : 'text-white/50 hover:text-white'
                  }`}
                >
                  {tab}
                </button>
              ))}
            </div>

            {/* Current Color Swatch Pill */}
            <div className="flex items-center gap-2 bg-black/40 px-2.5 py-1 rounded-xl border border-white/10">
              <div
                className="w-3.5 h-3.5 rounded-full border border-white/40 shadow-inner"
                style={{ backgroundColor: currentColorHex }}
              />
              <span className="font-mono text-[11px] uppercase font-bold text-white/90">
                {currentColorHex}
              </span>
            </div>
          </div>

          {/* Formatted Readout Table */}
          {activeTab === 'HSL' && (
            <div className="space-y-1.5 text-xs font-mono">
              <div className="flex items-center justify-between bg-black/30 px-3 py-1.5 rounded-xl border border-white/5">
                <span className="text-white/50 font-bold">H</span>
                <span className="text-white font-semibold">{(hue / 360).toFixed(3)} ({Math.round(hue)}°)</span>
              </div>
              <div className="flex items-center justify-between bg-black/30 px-3 py-1.5 rounded-xl border border-white/5">
                <span className="text-white/50 font-bold">S</span>
                <span className="text-white font-semibold">{saturation.toFixed(3)} ({Math.round(saturation * 100)}%)</span>
              </div>
              <div className="flex items-center justify-between bg-black/30 px-3 py-1.5 rounded-xl border border-white/5">
                <span className="text-white/50 font-bold">L</span>
                <span className="text-white font-semibold">{lightness.toFixed(3)} ({Math.round(lightness * 100)}%)</span>
              </div>
            </div>
          )}

          {activeTab === 'RGB' && (
            <div className="space-y-1.5 text-xs font-mono">
              <div className="flex items-center justify-between bg-black/30 px-3 py-1.5 rounded-xl border border-white/5">
                <span className="text-rose-400 font-bold">R</span>
                <span className="text-white font-semibold">{rgb.r}</span>
              </div>
              <div className="flex items-center justify-between bg-black/30 px-3 py-1.5 rounded-xl border border-white/5">
                <span className="text-emerald-400 font-bold">G</span>
                <span className="text-white font-semibold">{rgb.g}</span>
              </div>
              <div className="flex items-center justify-between bg-black/30 px-3 py-1.5 rounded-xl border border-white/5">
                <span className="text-blue-400 font-bold">B</span>
                <span className="text-white font-semibold">{rgb.b}</span>
              </div>
            </div>
          )}

          {activeTab === 'Hex' && (
            <div className="space-y-1.5 text-xs font-mono">
              <div className="flex items-center justify-between bg-black/30 px-3 py-2 rounded-xl border border-white/5">
                <span className="text-white/50 font-bold">HEX</span>
                <span className="text-rose-300 font-bold text-sm tracking-widest">{currentColorHex.toUpperCase()}</span>
              </div>
            </div>
          )}
        </div>

        {/* Quick Preset Swatches */}
        <div className="mb-4">
          <p className="text-[10px] uppercase font-mono tracking-wider text-white/40 mb-2">Preset Glows</p>
          <div className="flex items-center justify-between gap-1.5">
            {PRESET_SWATCHES.map((swatch) => (
              <button
                key={swatch.name}
                onClick={() => {
                  const hsl = hexToHsl(swatch.hex);
                  setHue(hsl.h);
                  setSaturation(hsl.s);
                  setLightness(hsl.l);
                  applyColor(hsl.h, hsl.s, hsl.l);
                }}
                className="w-6 h-6 rounded-full border border-white/20 transition-transform hover:scale-110 active:scale-95 flex items-center justify-center shadow-md"
                style={{ backgroundColor: swatch.hex }}
                title={swatch.name}
              >
                {currentColorHex.toLowerCase() === swatch.hex.toLowerCase() && (
                  <Check className="w-3 h-3 text-black stroke-[3]" />
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Edge Light Mode Selector & Intensity */}
        <div className="space-y-3 pt-3 border-t border-white/10">
          <div className="flex items-center justify-between">
            <span className="text-xs text-white/70 font-medium">Borderline Mode:</span>
            <div className="flex gap-1 bg-black/40 p-0.5 rounded-xl border border-white/10">
              {(['neon', 'subtle', 'pulse', 'off'] as const).map((m) => (
                <button
                  key={m}
                  onClick={() => onUpdateEdgeMode(m)}
                  className={`px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider transition ${
                    edgeLightMode === m
                      ? 'bg-rose-500 text-white shadow'
                      : 'text-white/50 hover:text-white'
                  }`}
                >
                  {m}
                </button>
              ))}
            </div>
          </div>

          <div className="flex items-center justify-between gap-3">
            <span className="text-xs text-white/70 font-medium">Glow Intensity:</span>
            <input
              type="range"
              min="0.2"
              max="1.0"
              step="0.05"
              value={edgeIntensity}
              onChange={(e) => onUpdateEdgeIntensity(parseFloat(e.target.value))}
              className="w-32 h-1.5 bg-white/20 rounded-full appearance-none cursor-pointer accent-rose-400"
            />
            <span className="text-xs font-mono text-white/50 w-8 text-right">
              {Math.round(edgeIntensity * 100)}%
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
