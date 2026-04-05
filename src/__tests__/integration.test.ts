/**
 * Integration tests for watermark removal using real example files.
 * Uses node-canvas for server-side canvas support and sharp for image I/O.
 *
 * Tests the Smart Fill (gradient interpolation) and Crop methods on all
 * example images and verifies correct behavior.
 */
import { describe, it, expect, beforeAll } from 'vitest';
import { createCanvas, loadImage as loadCanvasImage } from 'canvas';
import sharp from 'sharp';
import path from 'path';
import fs from 'fs';
import {
  detectWatermarkRegion,
  cloneStamp,
  analyzeComplexity,
  type WatermarkRegion,
} from '@/lib/watermark-remover';

const EXAMPLES_DIR = path.resolve(__dirname, '../../examples');
const OUTPUT_DIR = path.resolve(__dirname, '../../test-output');
const EXAMPLE_FILES = ['1.png', '2.png', '3.png', '4.png', '5.png', '6.png'];

// Ensure output directory exists
beforeAll(() => {
  if (!fs.existsSync(OUTPUT_DIR)) {
    fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  }
});

/**
 * Load an example image into a node-canvas Canvas.
 */
async function loadExampleImage(filename: string) {
  const filePath = path.join(EXAMPLES_DIR, filename);
  const img = await loadCanvasImage(filePath);
  const canvas = createCanvas(img.width, img.height);
  const ctx = canvas.getContext('2d');
  ctx.drawImage(img, 0, 0);
  return { canvas, ctx, width: img.width, height: img.height };
}

/**
 * Save a canvas to a PNG file in the test-output directory.
 */
function saveCanvas(canvas: ReturnType<typeof createCanvas>, filename: string) {
  const buffer = canvas.toBuffer('image/png');
  fs.writeFileSync(path.join(OUTPUT_DIR, filename), buffer);
}

/**
 * Calculate average color in a rectangular region.
 */
function avgColor(ctx: ReturnType<ReturnType<typeof createCanvas>['getContext']>, x: number, y: number, w: number, h: number): [number, number, number] {
  const data = ctx.getImageData(x, y, w, h).data;
  let r = 0, g = 0, b = 0;
  const count = data.length / 4;
  for (let i = 0; i < data.length; i += 4) {
    r += data[i]; g += data[i + 1]; b += data[i + 2];
  }
  return [r / count, g / count, b / count];
}

/**
 * Calculate the mean absolute difference between two color arrays.
 */
function colorDiff(a: [number, number, number], b: [number, number, number]): number {
  return (Math.abs(a[0] - b[0]) + Math.abs(a[1] - b[1]) + Math.abs(a[2] - b[2])) / 3;
}

function countDarkPixels(
  ctx: ReturnType<ReturnType<typeof createCanvas>['getContext']>,
  x: number,
  y: number,
  w: number,
  h: number,
  threshold: number = 170
): number {
  const data = ctx.getImageData(x, y, w, h).data;
  let dark = 0;
  for (let i = 0; i < data.length; i += 4) {
    const lum = (data[i] + data[i + 1] + data[i + 2]) / 3;
    if (lum < threshold) dark++;
  }
  return dark;
}

describe('Integration: Watermark Removal with Real Images', () => {
  // Ensure examples exist
  it('should have example files available', () => {
    for (const f of EXAMPLE_FILES) {
      const filePath = path.join(EXAMPLES_DIR, f);
      expect(fs.existsSync(filePath), `Missing example file: ${f}`).toBe(true);
    }
  });

  describe('detectWatermarkRegion', () => {
    it('should detect valid region for 1536x2752 infographic (portrait)', () => {
      const region = detectWatermarkRegion(1536, 2752);
      // Region extends to right and bottom edges
      expect(region.x + region.width).toBe(1536);
      expect(region.y + region.height).toBe(2752);
      // Width: 16% of image
      expect(region.width).toBe(Math.round(1536 * 0.16));
      // Height: max(44, round(2752*0.009)) = 44
      expect(region.height).toBe(44);
      // Region top should cover watermark start (y=2722)
      expect(region.y).toBeLessThanOrEqual(2722);
    });

    it('should detect valid region for 2752x1536 landscape', () => {
      const region = detectWatermarkRegion(2752, 1536);
      expect(region.x + region.width).toBe(2752);
      expect(region.y + region.height).toBe(1536);
      expect(region.height).toBe(44);
      // Region top should cover watermark start (y=1506)
      expect(region.y).toBeLessThanOrEqual(1506);
    });
  });

  describe('Smart Fill (gradient interpolation)', () => {
    for (const filename of EXAMPLE_FILES) {
      it(`should process ${filename} and reduce watermark visibility`, async () => {
        const { canvas, ctx, width, height } = await loadExampleImage(filename);
        const region = detectWatermarkRegion(width, height);

        // Sample background ABOVE the watermark
        const bgAboveY = Math.max(0, region.y - 10);
        const sampleX = region.x + Math.floor(region.width * 0.7);
        const bgAbove = avgColor(ctx, sampleX, bgAboveY, 20, 4);

        // Sample watermark area BEFORE processing
        const wmCenterY = region.y + Math.floor(region.height / 2);
        const beforeColor = avgColor(ctx, sampleX, wmCenterY, 20, 4);

        // Apply gradient fill (cloneStamp)
        cloneStamp(ctx as unknown as CanvasRenderingContext2D, region, width, height);

        // Save output
        saveCanvas(canvas, `test_smartfill_${filename}`);

        // Verify watermark region was modified
        const afterColor = avgColor(ctx, sampleX, wmCenterY, 20, 4);
        const diff = colorDiff(beforeColor, afterColor);
        expect(diff).toBeGreaterThan(0);

        // After processing, the watermark area should be CLOSER to the background
        const afterDiffFromBg = colorDiff(afterColor, bgAbove);
        const beforeDiffFromBg = colorDiff(beforeColor, bgAbove);
        expect(afterDiffFromBg).toBeLessThan(beforeDiffFromBg);

        // Canvas dimensions unchanged
        expect(canvas.width).toBe(width);
        expect(canvas.height).toBe(height);
      });
    }

    it('should produce diff_from_bg < 15 on all images', async () => {
      for (const filename of EXAMPLE_FILES) {
        const { canvas, ctx, width, height } = await loadExampleImage(filename);
        const region = detectWatermarkRegion(width, height);

        const sampleX = region.x + Math.floor(region.width * 0.7);
        const bgAboveY = Math.max(0, region.y - 10);
        const bgAbove = avgColor(ctx, sampleX, bgAboveY, 20, 4);
        // Bottom-most rows are typically clean background beneath the badge.
        const bgBelowY = Math.max(0, Math.min(height - 4, height - 8));
        const bgBelow = avgColor(ctx, sampleX, bgBelowY, 20, 4);

        cloneStamp(ctx as unknown as CanvasRenderingContext2D, region, width, height);

        const wmCenterY = region.y + Math.floor(region.height / 2);
        const afterColor = avgColor(ctx, sampleX, wmCenterY, 20, 4);
        const diffFromAbove = colorDiff(afterColor, bgAbove);
        const diffFromBelow = colorDiff(afterColor, bgBelow);
        const diffFromBg = Math.min(diffFromAbove, diffFromBelow);

        // Max acceptable diff is 15. On images with a background transition (e.g. 1.png),
        // the algorithm intentionally blends above↔below, so either reference is acceptable.
        expect(diffFromBg, `${filename}: diff_from_bg=${diffFromBg.toFixed(1)} exceeds limit`).toBeLessThan(15);
      }
    });

    it('should preserve non-watermark pixels', async () => {
      const { canvas, ctx, width, height } = await loadExampleImage('2.png');
      const region = detectWatermarkRegion(width, height);

      // Sample a region FAR from the watermark (top-left corner)
      const beforeSafe = avgColor(ctx, 50, 50, 30, 30);

      cloneStamp(ctx as unknown as CanvasRenderingContext2D, region, width, height);

      const afterSafe = avgColor(ctx, 50, 50, 30, 30);
      expect(colorDiff(beforeSafe, afterSafe)).toBe(0);
    });
  });

  describe('Crop method', () => {
    for (const filename of EXAMPLE_FILES) {
      it(`should crop ${filename} and remove watermark strip`, async () => {
        const { canvas, ctx, width, height } = await loadExampleImage(filename);
        const region = detectWatermarkRegion(width, height);

        // Simulate cropWatermark (uses document.createElement unavailable in Node)
        const croppedCanvas = createCanvas(width, region.y);
        const croppedCtx = croppedCanvas.getContext('2d');
        croppedCtx.drawImage(canvas, 0, 0, width, region.y, 0, 0, width, region.y);

        saveCanvas(croppedCanvas, `test_crop_${filename}`);

        // Width preserved
        expect(croppedCanvas.width).toBe(width);
        // Height reduced
        expect(croppedCanvas.height).toBe(region.y);
        expect(croppedCanvas.height).toBeLessThan(height);

        // Amount removed should be small (< 3.2%)
        const removedPct = ((height - region.y) / height) * 100;
        expect(removedPct).toBeLessThan(3.2);
        expect(removedPct).toBeGreaterThan(0.5);
      });
    }

    it('should preserve content above the watermark', async () => {
      const { canvas, ctx, width, height } = await loadExampleImage('4.png');
      const region = detectWatermarkRegion(width, height);

      const croppedCanvas = createCanvas(width, region.y);
      const croppedCtx = croppedCanvas.getContext('2d');
      croppedCtx.drawImage(canvas, 0, 0, width, region.y, 0, 0, width, region.y);

      const beforeSafe = avgColor(ctx, 100, 100, 30, 30);
      const afterSafe = avgColor(croppedCtx, 100, 100, 30, 30);
      expect(colorDiff(beforeSafe, afterSafe)).toBe(0);
    });
  });

  describe('Watermark coverage', () => {
    it('should cover the known watermark position on portrait images', () => {
      const region = detectWatermarkRegion(1536, 2752);
      // Known watermark: y=2722-2742, x=1335-1536
      expect(region.x).toBeLessThanOrEqual(1335);
      expect(region.y).toBeLessThanOrEqual(2722);
      expect(region.x + region.width).toBeGreaterThanOrEqual(1536);
      expect(region.y + region.height).toBeGreaterThanOrEqual(2742);
    });

    it('should cover the known watermark position on landscape images', () => {
      const region = detectWatermarkRegion(2752, 1536);
      // Known watermark: y=1506-1526, x=2551-2740
      expect(region.x).toBeLessThanOrEqual(2551);
      expect(region.y).toBeLessThanOrEqual(1506);
      expect(region.x + region.width).toBeGreaterThanOrEqual(2740);
      expect(region.y + region.height).toBeGreaterThanOrEqual(1526);
    });
  });

  describe('analyzeComplexity', () => {
    it('should return a value between 0 and 1', async () => {
      const { canvas, ctx, width, height } = await loadExampleImage('3.png');
      const region = detectWatermarkRegion(width, height);
      const complexity = analyzeComplexity(ctx as unknown as CanvasRenderingContext2D, region);
      expect(complexity).toBeGreaterThanOrEqual(0);
      expect(complexity).toBeLessThanOrEqual(1);
    });
  });

  describe('PDF-like watermark scenarios', () => {
    it('should significantly reduce dark watermark-like text on white paper near the bottom-right', () => {
      const width = 2200;
      const height = 1400;
      const canvas = createCanvas(width, height);
      const ctx = canvas.getContext('2d');

      // White paper background
      ctx.fillStyle = '#f8f8f6';
      ctx.fillRect(0, 0, width, height);

      // Simulate NotebookLM-like dark text watermark near bottom-right
      ctx.fillStyle = '#1a1a1a';
      ctx.font = '46px Arial';
      ctx.fillText('NotebookLM', width - 420, height - 18);

      const region = detectWatermarkRegion(width, height);
      const beforeDark = countDarkPixels(ctx, region.x, region.y, region.width, region.height, 180);

      cloneStamp(ctx as unknown as CanvasRenderingContext2D, region, width, height);

      const afterDark = countDarkPixels(ctx, region.x, region.y, region.width, region.height, 180);
      saveCanvas(canvas, 'test_pdf_like_cleanup.png');

      // Expect substantial reduction of dark text pixels
      expect(afterDark).toBeLessThan(beforeDark * 0.45);
    });

    it('should avoid creating a large visible box on mostly flat paper background', () => {
      const width = 2200;
      const height = 1400;
      const canvas = createCanvas(width, height);
      const ctx = canvas.getContext('2d');

      // Slightly textured paper simulation
      for (let y = 0; y < height; y++) {
        const v = 246 + Math.round((y / height) * 3);
        ctx.fillStyle = `rgb(${v},${v},${v - 1})`;
        ctx.fillRect(0, y, width, 1);
      }

      // Simulated watermark text
      ctx.fillStyle = '#151515';
      ctx.font = '40px Arial';
      ctx.fillText('NotebookLM', width - 380, height - 16);

      const region = detectWatermarkRegion(width, height);
      const sampleX = region.x + Math.floor(region.width * 0.7);
      const beforeBg = avgColor(ctx, sampleX, Math.max(0, region.y - 12), 20, 4);

      cloneStamp(ctx as unknown as CanvasRenderingContext2D, region, width, height);

      const afterCenter = avgColor(ctx, sampleX, region.y + Math.floor(region.height / 2), 20, 4);
      const diff = colorDiff(afterCenter, beforeBg);

      // Keep blend close to nearby paper tone
      expect(diff).toBeLessThan(18);
    });
  });
});
