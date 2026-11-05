import { ColorPalette } from '../types';

const DEFAULT_PALETTE: ColorPalette = {
  primary: '#ff3366',
  secondary: '#7928ca',
  accent: '#ff0080',
  background: '#0a0a0f',
};

export async function extractPaletteFromImage(imageUrl: string): Promise<ColorPalette> {
  if (!imageUrl) return DEFAULT_PALETTE;

  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = 'Anonymous';

    const timeout = setTimeout(() => {
      resolve(DEFAULT_PALETTE);
    }, 2500);

    img.onload = () => {
      clearTimeout(timeout);
      try {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          resolve(DEFAULT_PALETTE);
          return;
        }

        // Downscale for instant fast sampling
        canvas.width = 64;
        canvas.height = 64;
        ctx.drawImage(img, 0, 0, 64, 64);

        const imageData = ctx.getImageData(0, 0, 64, 64).data;
        const colorCounts: { [key: string]: { r: number; g: number; b: number; count: number; sat: number } } = {};

        for (let i = 0; i < imageData.length; i += 16) { // sample every 4th pixel
          const r = imageData[i];
          const g = imageData[i + 1];
          const b = imageData[i + 2];
          const a = imageData[i + 3];

          if (a < 128) continue; // skip transparent

          // Calculate saturation and lightness
          const max = Math.max(r, g, b);
          const min = Math.min(r, g, b);
          const l = (max + min) / (2 * 255);
          const sat = max === min ? 0 : (max - min) / (l > 0.5 ? 510 - max - min : max + min);

          // Bin colors (quantization)
          const qr = Math.round(r / 24) * 24;
          const qg = Math.round(g / 24) * 24;
          const qb = Math.round(b / 24) * 24;
          const key = `${qr},${qg},${qb}`;

          if (!colorCounts[key]) {
            colorCounts[key] = { r: qr, g: qg, b: qb, count: 0, sat };
          }
          colorCounts[key].count++;
        }

        // Sort by vibrant score (saturation + frequency)
        const sorted = Object.values(colorCounts).sort((a, b) => {
          const scoreA = a.sat * 2 + (a.count / 100);
          const scoreB = b.sat * 2 + (b.count / 100);
          return scoreB - scoreA;
        });

        if (sorted.length === 0) {
          resolve(DEFAULT_PALETTE);
          return;
        }

        const primaryObj = sorted[0];
        const secondaryObj = sorted.length > 2 ? sorted[2] : (sorted[1] || primaryObj);

        const primary = `rgb(${primaryObj.r}, ${primaryObj.g}, ${primaryObj.b})`;
        const secondary = `rgb(${secondaryObj.r}, ${secondaryObj.g}, ${secondaryObj.b})`;
        const accent = `rgba(${Math.min(255, primaryObj.r + 40)}, ${Math.min(255, primaryObj.g + 40)}, ${Math.min(255, primaryObj.b + 40)}, 1)`;
        const bgDark = `rgb(${Math.floor(primaryObj.r * 0.08)}, ${Math.floor(primaryObj.g * 0.08)}, ${Math.floor(primaryObj.b * 0.1)})`;

        resolve({
          primary,
          secondary,
          accent,
          background: bgDark,
        });
      } catch (err) {
        resolve(DEFAULT_PALETTE);
      }
    };

    img.onerror = () => {
      clearTimeout(timeout);
      resolve(DEFAULT_PALETTE);
    };

    img.src = imageUrl;
  });
}
