/**
 * PDF Processor — Renders PDF pages, removes watermarks, rebuilds PDF.
 * Uses pdf.js for rendering and pdf-lib for reconstruction.
 * All client-side.
 */

import { removeWatermark, type RemovalMethod, type WatermarkRegion, type RemovalResult, canvasToBlob } from './watermark-remover';

// We use dynamic import for pdf.js to avoid SSR issues
let pdfjsLib: typeof import('pdfjs-dist') | null = null;

async function getPdfJs() {
  if (pdfjsLib) return pdfjsLib;
  pdfjsLib = await import('pdfjs-dist');

  // Use a bundled local worker to avoid runtime failures when external CDNs
  // are blocked or unavailable.
  try {
    pdfjsLib.GlobalWorkerOptions.workerPort = new Worker(
      new URL('pdfjs-dist/build/pdf.worker.min.mjs', import.meta.url),
      { type: 'module' }
    );
  } catch {
    // Fallback for environments that don't support workerPort/new URL pattern.
    pdfjsLib.GlobalWorkerOptions.workerSrc = '/pdf.worker.min.mjs';
  }

  return pdfjsLib;
}

export interface PdfPageResult {
  pageNum: number;
  original: HTMLCanvasElement;
  result: RemovalResult;
}

export interface PdfProcessingProgress {
  currentPage: number;
  totalPages: number;
  status: 'rendering' | 'removing' | 'building' | 'done';
}

/**
 * Render a single PDF page to a canvas at full resolution.
 */
async function renderPdfPage(
  pdfDoc: import('pdfjs-dist').PDFDocumentProxy,
  pageNum: number,
  scale: number = 2
): Promise<HTMLCanvasElement> {
  const page = await pdfDoc.getPage(pageNum);
  const viewport = page.getViewport({ scale });

  const canvas = document.createElement('canvas');
  canvas.width = viewport.width;
  canvas.height = viewport.height;

  const ctx = canvas.getContext('2d')!;
  await page.render({ canvasContext: ctx, viewport, canvas } as Parameters<typeof page.render>[0]).promise;

  return canvas;
}

/**
 * Process an entire PDF: render each page, remove watermarks, rebuild PDF.
 */
export async function processPdf(
  file: File,
  method: RemovalMethod,
  customRegion?: WatermarkRegion,
  onProgress?: (progress: PdfProcessingProgress) => void
): Promise<{ blob: Blob; pages: PdfPageResult[] }> {
  const pdfjs = await getPdfJs();
  const arrayBuffer = await file.arrayBuffer();
  const pdfDoc = await pdfjs.getDocument({ data: arrayBuffer }).promise;
  const numPages = pdfDoc.numPages;
  const pages: PdfPageResult[] = [];

  // Phase 1: Render and clean each page
  for (let i = 1; i <= numPages; i++) {
    onProgress?.({ currentPage: i, totalPages: numPages, status: 'rendering' });

    const originalCanvas = await renderPdfPage(pdfDoc, i);

    onProgress?.({ currentPage: i, totalPages: numPages, status: 'removing' });

    const result = removeWatermark(originalCanvas, method, customRegion);
    pages.push({ pageNum: i, original: originalCanvas, result });
  }

  // Phase 2: Rebuild PDF
  onProgress?.({ currentPage: numPages, totalPages: numPages, status: 'building' });

  const { PDFDocument } = await import('pdf-lib');
  const newPdf = await PDFDocument.create();

  for (const page of pages) {
    const pngBlob = await canvasToBlob(page.result.canvas, 'image/png');
    const pngBytes = new Uint8Array(await pngBlob.arrayBuffer());
    const pngImage = await newPdf.embedPng(pngBytes);

    const pdfPage = newPdf.addPage([page.result.canvas.width, page.result.canvas.height]);
    pdfPage.drawImage(pngImage, {
      x: 0,
      y: 0,
      width: page.result.canvas.width,
      height: page.result.canvas.height,
    });
  }

  const pdfBytes = await newPdf.save();
  const blob = new Blob([new Uint8Array(pdfBytes)], { type: 'application/pdf' });

  onProgress?.({ currentPage: numPages, totalPages: numPages, status: 'done' });

  return { blob, pages };
}

/**
 * Get PDF page count without fully processing.
 */
export async function getPdfPageCount(file: File): Promise<number> {
  const pdfjs = await getPdfJs();
  const arrayBuffer = await file.arrayBuffer();
  const pdfDoc = await pdfjs.getDocument({ data: arrayBuffer }).promise;
  return pdfDoc.numPages;
}

/**
 * Render a single page preview (for UI display before full processing).
 */
export async function renderPdfPagePreview(file: File, pageNum: number = 1, scale: number = 1): Promise<HTMLCanvasElement> {
  const pdfjs = await getPdfJs();
  const arrayBuffer = await file.arrayBuffer();
  const pdfDoc = await pdfjs.getDocument({ data: arrayBuffer }).promise;
  return renderPdfPage(pdfDoc, pageNum, scale);
}
