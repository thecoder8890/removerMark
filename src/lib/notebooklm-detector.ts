/**
 * NotebookLM Watermark Region Detector
 *
 * Edge-based watermark detector with automatic clean/noisy background
 * classification.
 *
 * On CLEAN backgrounds: uses gradient edge-band detection to find the
 * exact watermark rows and columns.
 * On NOISY backgrounds: returns the proportional fallback region, since
 * content edges make precise detection unreliable.
 */

import { WatermarkRegion } from './watermark-remover';

// ---------------------------------------------------------------------------
// Calibration constants (measured from real NotebookLM exports)
// ---------------------------------------------------------------------------

/** Known badge pixel dimensions on reference portrait export (1536×2752). */
const DEFAULT_BADGE_WIDTH = 200;
const DEFAULT_BADGE_HEIGHT = 20;

/** Reference portrait export dimensions used for scaling. */
const DEFAULT_IMAGE_WIDTH = 1536;
const DEFAULT_IMAGE_HEIGHT = 2752;

/** Reference landscape export dimensions. */
const DEFAULT_HORIZONTAL_IMAGE_WIDTH = 2752;
const DEFAULT_HORIZONTAL_IMAGE_HEIGHT = 1536;

/** Fraction of image width that the anchor region covers (badge + l/r padding). */
const WIDTH_PERCENTAGE = 0.16;

/** Minimum vertical height of the anchor/fallback region in pixels. */
const MIN_HEIGHT_PIXELS = 44;

/** Fraction of image height used to scale the anchor height on larger images. */
const HEIGHT_PERCENTAGE = 0.009;

/**
 * Calibrated badge region size in pixels, derived from the reference portrait
 * export (1536×2752). The badge has a FIXED pixel size (~200×20 px) regardless
 * of orientation, so we use this constant for both default resolutions instead
 * of a width percentage (which would produce ~440 px on landscape — too wide).
 */
const BADGE_REGION_WIDTH = DEFAULT_BADGE_WIDTH + 16; // 216: badge + 16px left padding
const BADGE_REGION_HEIGHT = MIN_HEIGHT_PIXELS; // 44

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Detects the NotebookLM watermark region from raw RGBA pixel data.
 *
 * For the two known default NotebookLM export resolutions (portrait
 * 1536×2752 and landscape 2752×1536) the watermark position is fixed and
 * fully determined by the dimensions alone — no pixel analysis is needed.
 *
 * For any other resolution the detector falls back to gradient edge
 * detection over the proportional anchor region, and returns the
 * proportional region itself if no clear edge is found.
 */
export function detectFromRgbaData(
  data: Uint8ClampedArray,
  width: number,
  height: number
): WatermarkRegion {
  // ── Known default resolutions: position is fixed, return immediately ──
  // The badge is ~200 px wide regardless of orientation, so we use the
  // calibrated pixel width (246 px) rather than a percentage of the image width.
  if (isDefaultPortraitResolution(width, height) || isDefaultLandscapeResolution(width, height)) {
    return {
      x: width - BADGE_REGION_WIDTH,
      y: height - BADGE_REGION_HEIGHT,
      width: BADGE_REGION_WIDTH,
      height: BADGE_REGION_HEIGHT,
    };
  }

  // ── Unknown/custom resolution: pixel-based detection ──────────────────
  const anchor = anchorRegion(width, height);
  const fallback = fallbackPreciseRegion(width, height);

  // On noisy backgrounds edge detection is unreliable — use the trimmed
  // proportional fallback directly.
  if (isNoisyBackgroundNearAnchor(data, width, height, anchor)) {
    return trimNoisyFallbackRegion(data, width, height, fallback);
  }

  // On clean backgrounds, try to find the exact badge edges.
  const contourRegion = detectContourRegionNearBottomRight(data, width, height, anchor);
  if (contourRegion) {
    const refined = { ...contourRegion };

    // Probe the gap between the contour left edge and the anchor left edge.
    // If badge-brightness evidence is found there, extend the region left.
    const maxLeftReach = Math.max(0, refined.x - anchor.x);
    if (maxLeftReach > 10) {
      const probeW = Math.min(84, maxLeftReach);
      const probeX = Math.max(0, refined.x - probeW);
      const probeY = Math.max(0, refined.y - 12);
      const probeH = Math.max(8, Math.min(height - probeY, refined.height + 12));

      const probeLuma = sampleRegionAvgLuma(data, width, probeX, probeY, probeW, probeH);
      const bgLuma = sampleRegionAvgLuma(
        data, width,
        probeX, Math.max(0, probeY - 16),
        probeW, Math.min(16, probeY)
      );

      if (Math.abs(probeLuma - bgLuma) > 10) {
        refined.width += refined.x - probeX;
        refined.x = probeX;
      }
    }

    return refined;
  }

  // ── No edge found: return proportional fallback ───────────────────────
  return fallback;
}

// ---------------------------------------------------------------------------
// Region helpers
// ---------------------------------------------------------------------------

/**
 * Calculates the proportional anchor region at the bottom-right corner.
 * Mirrors the `detectWatermarkRegion` logic from watermark-remover.ts using
 * the calibration constants defined in this module.
 */
function anchorRegion(width: number, height: number): WatermarkRegion {
  const wmW = Math.round(width * WIDTH_PERCENTAGE);
  const wmH = Math.max(MIN_HEIGHT_PIXELS, Math.round(height * HEIGHT_PERCENTAGE));
  return { x: width - wmW, y: height - wmH, width: wmW, height: wmH };
}

/**
 * Returns a slightly taller fallback region used when edge detection is
 * unreliable. Extends the anchor upward by ~0.3 % of the image height to
 * ensure full badge and shadow coverage without guessing exact edges.
 */
function fallbackPreciseRegion(width: number, height: number): WatermarkRegion {
  const a = anchorRegion(width, height);
  const extraTop = Math.round(height * 0.003);
  const newY = Math.max(0, a.y - extraTop);
  return { x: a.x, y: newY, width: a.width, height: height - newY };
}

// ---------------------------------------------------------------------------
// Resolution classifiers
// ---------------------------------------------------------------------------

/**
 * True when the image has exactly the default NotebookLM landscape export
 * dimensions (2752 × 1536).
 */
function isDefaultLandscapeResolution(width: number, height: number): boolean {
  return width === DEFAULT_HORIZONTAL_IMAGE_WIDTH && height === DEFAULT_HORIZONTAL_IMAGE_HEIGHT;
}

/**
 * True when the image has exactly the default NotebookLM portrait export
 * dimensions (1536 × 2752).
 */
function isDefaultPortraitResolution(width: number, height: number): boolean {
  return width === DEFAULT_IMAGE_WIDTH && height === DEFAULT_IMAGE_HEIGHT;
}

// ---------------------------------------------------------------------------
// Background noise classifier
// ---------------------------------------------------------------------------

/**
 * Classifies the background complexity in the band immediately above the
 * anchor region.
 *
 * Measures two signals:
 *  - Luminance variance — flat backgrounds score near zero.
 *  - Horizontal edge density — text and content lines produce many transitions.
 *
 * Returns `true` when either signal exceeds its threshold, indicating that
 * gradient edge detection in this area would be unreliable.
 */
function isNoisyBackgroundNearAnchor(
  data: Uint8ClampedArray,
  width: number,
  _height: number,
  anchor: WatermarkRegion
): boolean {
  const probeH = 16;
  const probeY = Math.max(0, anchor.y - probeH);
  const actualH = anchor.y - probeY;
  if (actualH <= 0) return false;

  // ── Luminance variance ───────────────────────────────────────────────
  const lumas: number[] = [];
  for (let py = probeY; py < anchor.y; py++) {
    for (let px = anchor.x; px < anchor.x + anchor.width; px += 2) {
      const idx = (py * width + px) * 4;
      lumas.push(0.299 * data[idx] + 0.587 * data[idx + 1] + 0.114 * data[idx + 2]);
    }
  }
  if (lumas.length < 4) return false;

  const mean = lumas.reduce((a, b) => a + b, 0) / lumas.length;
  const variance = lumas.reduce((s, v) => s + (v - mean) ** 2, 0) / lumas.length;

  // ── Horizontal edge density ───────────────────────────────────────────
  let edgeCount = 0;
  const totalPx = actualH * (anchor.width - 2);
  for (let py = probeY; py < anchor.y; py++) {
    for (let px = anchor.x + 1; px < anchor.x + anchor.width - 1; px++) {
      const idx = (py * width + px) * 4;
      const idxL = (py * width + px - 1) * 4;
      const diff =
        Math.abs(data[idx] - data[idxL]) +
        Math.abs(data[idx + 1] - data[idxL + 1]) +
        Math.abs(data[idx + 2] - data[idxL + 2]);
      if (diff > 30) edgeCount++;
    }
  }
  const edgeDensity = edgeCount / Math.max(1, totalPx);

  return variance > 300 || edgeDensity > 0.08;
}

// ---------------------------------------------------------------------------
// Noisy-background region refinement
// ---------------------------------------------------------------------------

/**
 * On noisy backgrounds where edge-band detection cannot isolate the badge,
 * trims the fallback region to just the known badge height plus generous
 * padding, flush to the image bottom.
 *
 * The data / width parameters are reserved for future per-pixel refinement.
 */
function trimNoisyFallbackRegion(
  _data: Uint8ClampedArray,
  _width: number,
  height: number,
  fallback: WatermarkRegion
): WatermarkRegion {
  // Badge is ~20 px. Add 16 px total vertical padding (8 above, 8 below).
  const targetH = Math.min(fallback.height, DEFAULT_BADGE_HEIGHT + 16);
  return {
    x: fallback.x,
    y: height - targetH,
    width: fallback.width,
    height: targetH,
  };
}

// ---------------------------------------------------------------------------
// Edge-band contour detection (clean backgrounds)
// ---------------------------------------------------------------------------

/**
 * Performs gradient-band edge detection to find the exact pixel boundaries
 * of the watermark badge on clean (low-variance) backgrounds.
 *
 * - Vertical scan: locates the top edge of the badge via the sharpest
 *   row-level luminance transition within the scan window.
 * - Horizontal scan: locates the left edge of the badge via the sharpest
 *   column-level luminance transition, searching up to 60 px left of the
 *   anchor to account for slight layout variation.
 *
 * Returns `null` when no clear gradient is found so the caller can fall
 * back to the proportional region.
 */
function detectContourRegionNearBottomRight(
  data: Uint8ClampedArray,
  width: number,
  height: number,
  anchor: WatermarkRegion
): WatermarkRegion | null {
  // ── Vertical scan: find the top edge of the badge ─────────────────────
  const vScanY = Math.max(0, anchor.y - 20); // a little above anchor
  const vScanLeft = anchor.x;
  const vScanW = width - vScanLeft;
  if (vScanW <= 0) return null;

  const rowLumas: number[] = [];
  for (let py = vScanY; py < height; py++) {
    let sum = 0;
    for (let px = vScanLeft; px < width; px++) {
      const idx = (py * width + px) * 4;
      sum += (data[idx] + data[idx + 1] + data[idx + 2]) / 3;
    }
    rowLumas.push(sum / vScanW);
  }

  // Largest row-to-row gradient → top edge of the pill
  let maxRowGrad = 0;
  let peakRowOffset = -1;
  for (let i = 1; i < rowLumas.length; i++) {
    const g = Math.abs(rowLumas[i] - rowLumas[i - 1]);
    if (g > maxRowGrad) { maxRowGrad = g; peakRowOffset = i; }
  }

  if (maxRowGrad < 5 || peakRowOffset < 0) return null;

  const badgeTopY = vScanY + peakRowOffset;

  // ── Horizontal scan: find the left edge of the badge ──────────────────
  // Search up to 60 px left of the anchor in case of slight misalignment.
  const hScanLeft = Math.max(0, anchor.x - 60);
  const hScanH = Math.max(1, height - badgeTopY);

  const colLumas: number[] = [];
  for (let px = hScanLeft; px < width; px++) {
    let sum = 0;
    for (let py = badgeTopY; py < height; py++) {
      const idx = (py * width + px) * 4;
      sum += (data[idx] + data[idx + 1] + data[idx + 2]) / 3;
    }
    colLumas.push(sum / hScanH);
  }

  // Largest column-to-column gradient → left edge of the pill
  let maxColGrad = 0;
  let peakColOffset = 0;
  for (let i = 1; i < colLumas.length; i++) {
    const g = Math.abs(colLumas[i] - colLumas[i - 1]);
    if (g > maxColGrad) { maxColGrad = g; peakColOffset = i; }
  }

  const badgeLeftX =
    maxColGrad >= 5 ? hScanLeft + peakColOffset : anchor.x;

  // Sanity check: reject regions that are obviously wrong.
  // The badge is ~200 px wide; if the detected width is less than 40% of the
  // anchor width the column scan hit noise rather than a real left edge.
  const detectedWidth = width - badgeLeftX;
  const detectedHeight = height - badgeTopY;
  const minAcceptableWidth = Math.max(30, Math.round(anchor.width * 0.4));
  const minAcceptableHeight = 8;
  if (detectedWidth < minAcceptableWidth || detectedHeight < minAcceptableHeight) {
    return null;
  }

  return {
    x: Math.max(0, badgeLeftX),
    y: Math.max(0, badgeTopY),
    width: Math.max(1, detectedWidth),
    height: Math.max(1, detectedHeight),
  };
}

// ---------------------------------------------------------------------------
// Shared pixel utilities
// ---------------------------------------------------------------------------

/**
 * Returns the average (R+G+B)/3 luminance of a rectangular pixel region.
 * Bounds-checks each access against the data buffer length for safety.
 */
function sampleRegionAvgLuma(
  data: Uint8ClampedArray,
  imageWidth: number,
  rx: number,
  ry: number,
  rw: number,
  rh: number
): number {
  let sum = 0;
  let count = 0;
  const xEnd = rx + rw;
  const yEnd = ry + rh;
  for (let py = Math.max(0, ry); py < yEnd; py++) {
    for (let px = Math.max(0, rx); px < xEnd; px++) {
      const idx = (py * imageWidth + px) * 4;
      if (idx + 2 < data.length) {
        sum += (data[idx] + data[idx + 1] + data[idx + 2]) / 3;
        count++;
      }
    }
  }
  return count > 0 ? sum / count : 0;
}
