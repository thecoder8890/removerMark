/**
 * Image Processor — Handles PNG/JPG watermark removal.
 * Wraps the watermark-remover engine with file I/O.
 */

import { loadImage, removeWatermark, canvasToBlob, type RemovalMethod, type WatermarkRegion, type RemovalResult } from './watermark-remover';

export interface ImageProcessingResult {
  original: HTMLImageElement;
  result: RemovalResult;
  blob: Blob;
  fileName: string;
  originalType: string;
}

/**
 * Process a single image file: load, detect watermark, remove, export.
 */
export async function processImage(
  file: File,
  method: RemovalMethod,
  customRegion?: WatermarkRegion
): Promise<ImageProcessingResult> {
  const img = await loadImage(file);
  const result = removeWatermark(img, method, customRegion);

  // Export in the same format as the original
  const isPng = file.type === 'image/png' || file.name.toLowerCase().endsWith('.png');
  const mimeType = isPng ? 'image/png' : 'image/jpeg';
  const blob = await canvasToBlob(result.canvas, mimeType, 0.95);

  // Generate clean filename
  const baseName = file.name.replace(/\.[^.]+$/, '');
  const ext = isPng ? '.png' : '.jpg';
  const fileName = `${baseName}_clean${ext}`;

  return {
    original: img,
    result,
    blob,
    fileName,
    originalType: mimeType,
  };
}

/**
 * Generate a preview of both methods without final export.
 */
export async function generatePreview(
  file: File,
  customRegion?: WatermarkRegion
): Promise<{ original: HTMLImageElement; smartfill: RemovalResult; crop: RemovalResult }> {
  const img = await loadImage(file);
  const smartfill = removeWatermark(img, 'smartfill', customRegion);
  const crop = removeWatermark(img, 'crop', customRegion);

  return { original: img, smartfill, crop };
}

/**
 * Check if file type is supported.
 */
export function isSupportedFile(file: File): boolean {
  const supportedTypes = ['image/png', 'image/jpeg', 'image/jpg', 'application/pdf'];
  if (supportedTypes.includes(file.type)) return true;

  // Check by extension as fallback
  const ext = file.name.toLowerCase().split('.').pop();
  return ['png', 'jpg', 'jpeg', 'pdf'].includes(ext || '');
}

/**
 * Check file type category.
 */
export function getFileType(file: File): 'image' | 'pdf' | 'unknown' {
  if (file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf')) return 'pdf';
  if (file.type.startsWith('image/') || /\.(png|jpe?g)$/i.test(file.name)) return 'image';
  return 'unknown';
}

/**
 * Max file size: 50MB
 */
export const MAX_FILE_SIZE = 50 * 1024 * 1024;
