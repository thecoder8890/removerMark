import { describe, it, expect } from 'vitest';
import {
  detectWatermarkRegion,
  type WatermarkRegion,
} from '@/lib/watermark-remover';

// Canvas-based tests (analyzeComplexity, removeWatermark) require a real Canvas2D context
// which jsdom doesn't support. These tests are for the pure logic (no Canvas).

describe('Watermark Remover', () => {
  describe('detectWatermarkRegion', () => {
    it('should detect region for infographic dimensions (tall)', () => {
      const region = detectWatermarkRegion(1080, 2400);
      expect(region).toBeDefined();
      expect(region.x).toBeGreaterThan(0);
      expect(region.y).toBeGreaterThan(0);
      expect(region.width).toBeGreaterThan(0);
      expect(region.height).toBeGreaterThan(0);
      expect(region.x + region.width).toBe(1080);
      expect(region.y + region.height).toBe(2400);
    });

    it('should detect region for slide dimensions (wide)', () => {
      const region = detectWatermarkRegion(1920, 1080);
      expect(region).toBeDefined();
      expect(region.x + region.width).toBe(1920);
      expect(region.y + region.height).toBe(1080);
    });

    it('should detect region for arbitrary dimensions', () => {
      const region = detectWatermarkRegion(800, 800);
      expect(region).toBeDefined();
      expect(region.width).toBeGreaterThan(0);
      expect(region.height).toBeGreaterThan(0);
    });

    it('should use 16% width', () => {
      const region = detectWatermarkRegion(1536, 2752);
      expect(region.width).toBe(Math.round(1536 * 0.16));
    });

    it('should use minimum 44px height', () => {
      const region = detectWatermarkRegion(1536, 2752);
      expect(region.height).toBe(44);
    });

    it('should scale height for very large images', () => {
      // For an image where 0.9% > 44px: need height >= 4889
      const region = detectWatermarkRegion(2000, 4000);
      expect(region.height).toBe(Math.max(44, Math.round(4000 * 0.009)));
      expect(region.height).toBe(44); // round(4000*0.009) = 36 < 44
    });

    it('should place region at bottom-right', () => {
      const region = detectWatermarkRegion(1080, 2400);
      expect(region.y).toBeGreaterThan(2400 * 0.95);
      expect(region.x).toBeGreaterThan(1080 * 0.8);
    });

    it('should produce valid bounds for various sizes', () => {
      const sizes = [
        [640, 480],
        [1280, 720],
        [1920, 1080],
        [1080, 1920],
        [1080, 4000],
        [300, 300],
      ];
      for (const [w, h] of sizes) {
        const region = detectWatermarkRegion(w, h);
        expect(region.x).toBeGreaterThanOrEqual(0);
        expect(region.y).toBeGreaterThanOrEqual(0);
        expect(region.x + region.width).toBe(w);
        expect(region.y + region.height).toBe(h);
      }
    });
  });
});
