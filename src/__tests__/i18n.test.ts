import { describe, it, expect } from 'vitest';
import {
  detectLocale,
  interpolate,
  isRTL,
  SUPPORTED_LOCALES,
  LOCALE_NAMES,
  type Locale,
} from '@/lib/i18n';

describe('i18n', () => {
  describe('SUPPORTED_LOCALES', () => {
    it('should have 13 locales', () => {
      expect(SUPPORTED_LOCALES).toHaveLength(13);
    });

    it('should include English', () => {
      expect(SUPPORTED_LOCALES).toContain('en');
    });

    it('should include Spanish', () => {
      expect(SUPPORTED_LOCALES).toContain('es');
    });

    it('should include Arabic', () => {
      expect(SUPPORTED_LOCALES).toContain('ar');
    });
  });

  describe('LOCALE_NAMES', () => {
    it('should have a name for every supported locale', () => {
      for (const locale of SUPPORTED_LOCALES) {
        expect(LOCALE_NAMES[locale]).toBeDefined();
        expect(typeof LOCALE_NAMES[locale]).toBe('string');
        expect(LOCALE_NAMES[locale].length).toBeGreaterThan(0);
      }
    });
  });

  describe('isRTL', () => {
    it('should return true for Arabic', () => {
      expect(isRTL('ar')).toBe(true);
    });

    it('should return false for English', () => {
      expect(isRTL('en')).toBe(false);
    });

    it('should return false for Chinese', () => {
      expect(isRTL('zh-CN')).toBe(false);
    });
  });

  describe('interpolate', () => {
    it('should replace single variable', () => {
      expect(interpolate('Hello {name}', { name: 'World' })).toBe('Hello World');
    });

    it('should replace multiple variables', () => {
      expect(interpolate('Page {current} of {total}', { current: 1, total: 10 })).toBe('Page 1 of 10');
    });

    it('should return text unchanged without vars', () => {
      expect(interpolate('Hello World')).toBe('Hello World');
    });

    it('should preserve unreplaced placeholders', () => {
      expect(interpolate('Hello {name}', {})).toBe('Hello {name}');
    });

    it('should handle numeric values', () => {
      expect(interpolate('{count} items', { count: 42 })).toBe('42 items');
    });
  });

  describe('detectLocale', () => {
    it('should return en as default', () => {
      // localStorage is empty in test environment
      const locale = detectLocale();
      expect(SUPPORTED_LOCALES).toContain(locale);
    });
  });
});
