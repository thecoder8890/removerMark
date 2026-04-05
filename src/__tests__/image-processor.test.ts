import { describe, it, expect } from 'vitest';
import { isSupportedFile, getFileType, MAX_FILE_SIZE } from '@/lib/image-processor';

describe('Image Processor', () => {
  describe('isSupportedFile', () => {
    it('should accept PNG files', () => {
      const file = new File([''], 'test.png', { type: 'image/png' });
      expect(isSupportedFile(file)).toBe(true);
    });

    it('should accept JPEG files', () => {
      const file = new File([''], 'test.jpg', { type: 'image/jpeg' });
      expect(isSupportedFile(file)).toBe(true);
    });

    it('should accept PDF files', () => {
      const file = new File([''], 'test.pdf', { type: 'application/pdf' });
      expect(isSupportedFile(file)).toBe(true);
    });

    it('should reject unsupported formats', () => {
      const file = new File([''], 'test.gif', { type: 'image/gif' });
      expect(isSupportedFile(file)).toBe(false);
    });

    it('should reject text files', () => {
      const file = new File([''], 'test.txt', { type: 'text/plain' });
      expect(isSupportedFile(file)).toBe(false);
    });

    it('should accept files by extension when MIME type is missing', () => {
      const file = new File([''], 'test.png', { type: '' });
      expect(isSupportedFile(file)).toBe(true);
    });
  });

  describe('getFileType', () => {
    it('should identify PDF files', () => {
      const file = new File([''], 'doc.pdf', { type: 'application/pdf' });
      expect(getFileType(file)).toBe('pdf');
    });

    it('should identify image files', () => {
      const file = new File([''], 'pic.png', { type: 'image/png' });
      expect(getFileType(file)).toBe('image');
    });

    it('should return unknown for unsupported files', () => {
      const file = new File([''], 'data.csv', { type: 'text/csv' });
      expect(getFileType(file)).toBe('unknown');
    });

    it('should identify JPEG by extension', () => {
      const file = new File([''], 'photo.jpeg', { type: '' });
      expect(getFileType(file)).toBe('image');
    });
  });

  describe('MAX_FILE_SIZE', () => {
    it('should be 50MB', () => {
      expect(MAX_FILE_SIZE).toBe(50 * 1024 * 1024);
    });
  });
});
