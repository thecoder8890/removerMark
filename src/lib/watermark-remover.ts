/**
 * UnMarkLM — Watermark Removal Engine
 *
 * Detects and removes the NotebookLM watermark from images.
 * Two methods:
 *  - Clone Stamp (Smart Fill): copies pixels from just above the watermark
 *  - Crop: trims the bottom strip containing the watermark (100% reliable)
 *
 * The NotebookLM watermark is a small semi-transparent pill badge at the
 * bottom-right corner containing the text "NotebookLM". Measured across
 * real outputs:
 *  - Badge size: ~200×20 px on 1536×2752 images (~13% of width, ~0.7% of height)
 *  - Position: right-aligned, ~1% from bottom edge
 *
 * Zero external dependencies — pure Canvas API.
 */

import { detectFromRgbaData } from './notebooklm-detector';

export type RemovalMethod = 'smartfill' | 'crop';

export interface WatermarkRegion {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface RemovalResult {
  canvas: HTMLCanvasElement;
  method: RemovalMethod;
  region: WatermarkRegion;
  originalWidth: number;
  originalHeight: number;
}

/**
 * Detect the watermark region based on image dimensions.
 *
 * The NotebookLM watermark badge occupies:
 *  - Horizontally: rightmost ~16% of the image (with padding)
 *  - Vertically: bottom ~28px minimum (actual badge ~20px + padding)
 *
 * The watermark badge is a FIXED pixel size (~200×20px) regardless of
 * image dimensions, so we use a minimum pixel height instead of a pure
 * percentage to ensure accurate coverage on both portrait and landscape.
 */
export function detectWatermarkRegion(width: number, height: number): WatermarkRegion {
  // The watermark is always at bottom-right regardless of aspect ratio.
  // Calibrated from pixel-level measurements across 6 real images
  // (both portrait 1536×2752 and landscape 2752×1536).
  //
  // Actual badge: ~200×20 px (fixed size)
  // Width: 16% of image covers the badge with padding
  // Height: max(44px, 0.9% of image) — larger minimum better covers
  // PDF watermark text ascenders that can extend above the pill area.
  //         on large images, 0.9% scales for smaller images
  const wmWidthPct = 0.16;
  const wmH = Math.max(44, Math.round(height * 0.009));
  const wmW = Math.round(width * wmWidthPct);
  const wmX = width - wmW;
  const wmY = height - wmH;

  return { x: wmX, y: wmY, width: wmW, height: wmH };
}

/**
 * Analyze the background complexity in the watermark region.
 * Returns a score 0-1 where 0 = solid color, 1 = very complex.
 */
export function analyzeComplexity(ctx: CanvasRenderingContext2D, region: WatermarkRegion): number {
  const bandSize = 8;
  const samples: number[][] = [];

  const sampleY = Math.max(0, region.y - bandSize);
  const sampleHeight = Math.min(bandSize, region.y);
  if (sampleHeight <= 0) return 0.5;

  const imageData = ctx.getImageData(region.x, sampleY, region.width, sampleHeight);
  const data = imageData.data;

  for (let i = 0; i < data.length; i += 4) {
    samples.push([data[i], data[i + 1], data[i + 2]]);
  }
  if (samples.length < 2) return 0.5;

  const avgR = samples.reduce((s, p) => s + p[0], 0) / samples.length;
  const avgG = samples.reduce((s, p) => s + p[1], 0) / samples.length;
  const avgB = samples.reduce((s, p) => s + p[2], 0) / samples.length;

  const variance = samples.reduce((s, p) => {
    return s + Math.pow(p[0] - avgR, 2) + Math.pow(p[1] - avgG, 2) + Math.pow(p[2] - avgB, 2);
  }, 0) / (samples.length * 3);

  return Math.min(1, Math.sqrt(variance) / 50);
}

/**
 * Clone Stamp (Gradient Interpolation):
 *
 * For each pixel in the watermark region, we interpolate between the
 * background directly ABOVE and BELOW the watermark. This handles cases
 * where the watermark sits on a transition between two different background
 * sections (e.g., greenish content above, cream footer below).
 *
 * Only pixels that differ significantly from the expected interpolated
 * background are replaced — clean background pixels pass through untouched.
 * This ensures minimal visual disruption outside the actual watermark badge.
 */
export function cloneStamp(
  ctx: CanvasRenderingContext2D,
  region: WatermarkRegion,
  canvasWidth: number,
  canvasHeight: number
): void {
  const rx = Math.max(0, region.x);
  const ry = Math.max(0, region.y);
  const rw = Math.min(region.width, canvasWidth - rx);
  const rh = Math.min(region.height, canvasHeight - ry);

  if (rw <= 0 || rh <= 0) return;

  // Reference bands: average a few rows above and a few rows from the very
  // bottom of the region. The bottom of the region typically contains clean
  // background beneath the watermark badge even though we cover the full
  // bottom edge for safety.
  const bandH = 8;

  const aboveY = Math.max(0, ry - bandH);
  const aboveH = Math.max(1, Math.min(bandH, ry - aboveY || bandH));

  const belowY = Math.max(0, Math.min(canvasHeight - bandH, ry + rh - bandH));
  const belowH = Math.max(1, Math.min(bandH, canvasHeight - belowY));

  const aboveBand = ctx.getImageData(rx, aboveY, rw, aboveH).data;
  const belowBand = ctx.getImageData(rx, belowY, rw, belowH).data;

  // Precompute per-column RGB references for speed and stability.
  const refAbove = new Float32Array(rw * 3);
  const refBelow = new Float32Array(rw * 3);

  for (let px = 0; px < rw; px++) {
    let ar = 0, ag = 0, ab = 0;
    for (let py = 0; py < aboveH; py++) {
      const idx = (py * rw + px) * 4;
      ar += aboveBand[idx];
      ag += aboveBand[idx + 1];
      ab += aboveBand[idx + 2];
    }
    refAbove[px * 3] = ar / aboveH;
    refAbove[px * 3 + 1] = ag / aboveH;
    refAbove[px * 3 + 2] = ab / aboveH;

    let br = 0, bg = 0, bb = 0;
    for (let py = 0; py < belowH; py++) {
      const idx = (py * rw + px) * 4;
      br += belowBand[idx];
      bg += belowBand[idx + 1];
      bb += belowBand[idx + 2];
    }
    refBelow[px * 3] = br / belowH;
    refBelow[px * 3 + 1] = bg / belowH;
    refBelow[px * 3 + 2] = bb / belowH;
  }
  const origData = ctx.getImageData(rx, ry, rw, rh);
  const destData = ctx.createImageData(rw, rh);

  // Start with original pixels
  destData.data.set(origData.data);

  for (let py = 0; py < rh; py++) {
    // Interpolation weight: 0 at top → 1 at bottom (slightly biased to bottom)
    // to avoid bringing upper colors down on strong vertical gradients.
    const tRaw = rh > 1 ? py / (rh - 1) : 0.5;
    const t = Math.pow(tRaw, 0.75);

    for (let px = 0; px < rw; px++) {
      const idx = (py * rw + px) * 4;
      // Interpolated expected background at this position
      const refIdx = px * 3;
      const interpR = refAbove[refIdx] * (1 - t) + refBelow[refIdx] * t;
      const interpG = refAbove[refIdx + 1] * (1 - t) + refBelow[refIdx + 1] * t;
      const interpB = refAbove[refIdx + 2] * (1 - t) + refBelow[refIdx + 2] * t;

      // Current pixel
      const curR = origData.data[idx];
      const curG = origData.data[idx + 1];
      const curB = origData.data[idx + 2];

      const belowR = refBelow[refIdx];
      const belowG = refBelow[refIdx + 1];
      const belowB = refBelow[refIdx + 2];

      // How different is this pixel from expected background?
      const diff = Math.abs(curR - interpR) + Math.abs(curG - interpG) + Math.abs(curB - interpB);

      // Measure vertical background contrast (above vs below) for this column.
      const bgDelta =
        Math.abs(refAbove[refIdx] - belowR) +
        Math.abs(refAbove[refIdx + 1] - belowG) +
        Math.abs(refAbove[refIdx + 2] - belowB);

      // The watermark has both dark text and a faint light "pill" background.
      // Keep a lower threshold for subtle haze, but slightly increase threshold
      // on strong gradients to avoid painting a soft box.
      const threshold = bgDelta > 45 ? 16 : 12; // sum of RGB channel diffs
      if (diff > threshold) {
        // Gradual blend: fully replace at high diff, partial at threshold boundary
        const alpha = Math.min(1, (diff - threshold) / (bgDelta > 45 ? 26 : 30));

        // In high-contrast transitions, blend slightly more toward lower background
        // in lower rows to avoid dragging upper tint into footer areas.
        const lowerBias = bgDelta > 45 ? Math.pow(tRaw, 1.6) * 0.35 : 0;
        const targetR = interpR * (1 - lowerBias) + belowR * lowerBias;
        const targetG = interpG * (1 - lowerBias) + belowG * lowerBias;
        const targetB = interpB * (1 - lowerBias) + belowB * lowerBias;

        // For strong vertical gradients, reduce replacement strength very near
        // the bottom edge so we avoid creating a visible rectangular boundary.
        let edgeFade = 1;
        if (bgDelta > 45 && py >= rh - 8) {
          edgeFade = Math.max(0.3, (rh - 1 - py) / 8);
        }
        const finalAlpha = alpha * edgeFade;

        destData.data[idx] = Math.round(curR * (1 - finalAlpha) + targetR * finalAlpha);
        destData.data[idx + 1] = Math.round(curG * (1 - finalAlpha) + targetG * finalAlpha);
        destData.data[idx + 2] = Math.round(curB * (1 - finalAlpha) + targetB * finalAlpha);
        destData.data[idx + 3] = 255;
      }
      // else: pixel is clean background — leave it unchanged
    }
  }
  ctx.putImageData(destData, rx, ry);
}

// Backward-compatibility aliases
export const smartFill = cloneStamp;
export const smartFillAdvanced = cloneStamp;

/**
 * Crop method: trims the bottom strip of the image containing the watermark.
 * Returns a new canvas with reduced height (original width preserved).
 * This is the most reliable method — the watermark is physically removed.
 */
export function cropWatermark(
  sourceCanvas: HTMLCanvasElement,
  region: WatermarkRegion
): HTMLCanvasElement {
  const w = sourceCanvas.width;
  const cropHeight = Math.max(1, region.y);

  const result = document.createElement('canvas');
  result.width = w;
  result.height = cropHeight;

  const ctx = result.getContext('2d')!;
  ctx.drawImage(sourceCanvas, 0, 0, w, cropHeight, 0, 0, w, cropHeight);

  return result;
}

/**
 * Main removal function.
 */
export function removeWatermark(
  imageSource: HTMLCanvasElement | HTMLImageElement,
  method: RemovalMethod,
  customRegion?: WatermarkRegion
): RemovalResult {
  const canvas = document.createElement('canvas');
  const w = imageSource instanceof HTMLCanvasElement ? imageSource.width : imageSource.naturalWidth;
  const h = imageSource instanceof HTMLCanvasElement ? imageSource.height : imageSource.naturalHeight;
  canvas.width = w;
  canvas.height = h;

  const ctx = canvas.getContext('2d')!;
  ctx.drawImage(imageSource, 0, 0);

  let region: WatermarkRegion;
  if (customRegion) {
    region = customRegion;
  } else {
    const imageData = ctx.getImageData(0, 0, w, h);
    region = detectFromRgbaData(imageData.data, w, h);
  }

  if (method === 'crop') {
    const cropped = cropWatermark(canvas, region);
    return {
      canvas: cropped,
      method: 'crop',
      region,
      originalWidth: w,
      originalHeight: h,
    };
  }

  // Clone Stamp (Smart Fill)
  cloneStamp(ctx, region, w, h);

  return {
    canvas,
    method: 'smartfill',
    region,
    originalWidth: w,
    originalHeight: h,
  };
}

// ---- Utility functions ----

function addSubtleNoise(data: Uint8ClampedArray, w: number, h: number, intensity: number): void {
  for (let i = 0; i < w * h * 4; i += 4) {
    const noise = (Math.random() - 0.5) * intensity * 2;
    data[i] = Math.max(0, Math.min(255, data[i] + noise));
    data[i + 1] = Math.max(0, Math.min(255, data[i + 1] + noise));
    data[i + 2] = Math.max(0, Math.min(255, data[i + 2] + noise));
  }
}

/**
 * Load an image file (PNG/JPG) into an HTMLImageElement
 */
export function loadImage(file: File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      resolve(img);
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('Failed to load image'));
    };
    img.src = url;
  });
}

/**
 * Convert a canvas to a Blob of the specified type
 */
export function canvasToBlob(canvas: HTMLCanvasElement, type: string = 'image/png', quality: number = 0.95): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (blob) resolve(blob);
        else reject(new Error('Failed to convert canvas to blob'));
      },
      type,
      quality
    );
  });
}
