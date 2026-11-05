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

// Convert Hex to HSL
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

// Quick Preset Themes
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

  // Update color palette when HSL changes
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

    // Angle relative to 3 o'clock (0deg), standard math coordinates
    let angle = (Math.atan2(y, x) * 180) / Math.PI;
    if (angle < 0) angle += 360;

    const newHue = Math.round(angle);
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
    const newLightness = Math.max(0.1, Math.min(0.9, 1 - ratio));

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

  // Selector thumb position on wheel (210px diameter, radius = 105px)
  const wheelRadius = 105;
  const thumbDist = saturation * wheelRadius;
  const thumbRad = (hue * Math.PI) / 180;
  const thumbX = wheelRadius + Math.cos(thumbRad) * thumbDist;
  const thumbY = wheelRadius + Math.sin(thumbRad) * thumbDist;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xl animate-fade-in">
      <div className="relative w-full max-w-sm bg-[#121217] border border-white/15 rounded-3xl p-6 shadow-[0_20px_60px_rgba(0,0,0,0.9)] text-white select-none">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-white/10">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-full bg-rose-500/20 text-rose-400">
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

        {/* The Circular Color Wheel & Vertical Lightness Slider (Pure CSS, 100% Reliable!) */}
        <div className="flex items-center justify-center gap-5 my-6">
          {/* Circular Wheel (CSS Conic + Radial Gradient - Never Blank or Broken!) */}
          <div
            ref={wheelContainerRef}
            className="relative w-[210px] h-[210px] rounded-full cursor-crosshair shadow-2xl flex-shrink-0 border-2 border-white/20 select-none overflow-hidden"
            style={{
              background: `
                radial-gradient(circle closest-side, #ffffff 0%, rgba(255,255,255,0) 100%),
                conic-gradient(from 90deg, 
                  #ff0000 0deg, 
                  #ffff00 60deg, 
                  #00ff00 120deg, 
                  #00ffff 180deg, 
                  #0000ff 240deg, 
                  #ff00ff 300deg, 
                  #ff0000 360deg
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
            {/* Color Wheel Selector Handle Thumb (White Ring) */}
            <div
              className="absolute w-5 h-5 rounded-full border-2 border-white shadow-[0_0_8px_rgba(0,0,0,0.9)] -translate-x-1/2 -translate-y-1/2 pointer-events-none transition-transform duration-75"
              style={{
                left: `${thumbX}px`,
                top: `${thumbY}px`,
                backgroundColor: currentColorHex,
              }}
            />
          </div>

          {/* Vertical Lightness / Brightness Slider */}
          <div
            ref={sliderRef}
            className="relative w-6 h-[210px] rounded-full cursor-pointer border-2 border-white/20 shadow-lg flex-shrink-0 select-none overflow-hidden"
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
            {/* Slider Handle Thumb */}
            <div
              className="absolute left-0 right-0 h-4 border-2 border-white rounded-full bg-white shadow-[0_0_8px_rgba(0,0,0,0.8)] pointer-events-none -translate-y-1/2"
              style={{ top: `${(1 - lightness) * 100}%` }}
            />
          </div>
        </div>

        {/* Format Tabs & Color Values Box (Matches Reference Image) */}
        <div className="bg-[#181820] border border-white/10 rounded-2xl p-3 mb-4">
          <div className="flex items-center justify-between pb-2 mb-2 border-b border-white/10 text-xs font-mono">
            <div className="flex gap-1">
              {(['HSL', 'RGB', 'Hex'] as const).map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`px-2 py-0.5 rounded text-[11px] font-semibold transition ${
                    activeTab === tab ? 'bg-rose-500 text-white' : 'text-white/50 hover:text-white'
                  }`}
                >
                  {tab}
                </button>
              ))}
            </div>
            {/* Current Color Swatch Pill */}
            <div className="flex items-center gap-1.5">
              <div
                className="w-4 h-4 rounded-full border border-white/30 shadow-inner"
                style={{ backgroundColor: currentColorHex }}
              />
              <span className="font-mono text-[11px] uppercase text-white/80">{currentColorHex}</span>
            </div>
          </div>

          {/* HSL Info */}
          <div className="grid grid-cols-3 gap-2 text-center text-xs font-mono">
            <div className="bg-white/5 py-1 px-1.5 rounded">
              <span className="text-white/40 block text-[9px] uppercase">HUE</span>
              <span className="font-bold text-rose-300">{Math.round(hue)}°</span>
            </div>
            <div className="bg-white/5 py-1 px-1.5 rounded">
              <span className="text-white/40 block text-[9px] uppercase">SAT</span>
              <span className="font-bold text-rose-300">{Math.round(saturation * 100)}%</span>
            </div>
            <div className="bg-white/5 py-1 px-1.5 rounded">
              <span className="text-white/40 block text-[9px] uppercase">LUM</span>
              <span className="font-bold text-rose-300">{Math.round(lightness * 100)}%</span>
            </div>
          </div>
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
                className="w-6 h-6 rounded-full border border-white/20 transition-transform hover:scale-110 active:scale-95 flex items-center justify-center"
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
            <div className="flex gap-1">
              {(['neon', 'subtle', 'pulse', 'off'] as const).map((m) => (
                <button
                  key={m}
                  onClick={() => onUpdateEdgeMode(m)}
                  className={`px-2 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider transition ${
                    edgeLightMode === m
                      ? 'bg-rose-500 text-white'
                      : 'bg-white/5 text-white/50 hover:bg-white/10 hover:text-white'
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
