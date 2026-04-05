'use client';

import React, { useRef, useState, useCallback, useEffect } from 'react';
import { useI18n } from '@/hooks/useI18n';

export interface BeforeAfterSliderProps {
  before: HTMLCanvasElement;
  after: HTMLCanvasElement;
  beforeLabel?: string;
  afterLabel?: string;
  className?: string;
}

export default function BeforeAfterSlider({ before, after, beforeLabel, afterLabel, className = '' }: BeforeAfterSliderProps) {
  const { t } = useI18n();
  const containerRef = useRef<HTMLDivElement>(null);
  const [sliderPos, setSliderPos] = useState(50); // percentage
  const [isDragging, setIsDragging] = useState(false);
  const [beforeUrl, setBeforeUrl] = useState('');
  const [afterUrl, setAfterUrl] = useState('');

  const labelBefore = beforeLabel || t('preview.before');
  const labelAfter = afterLabel || t('preview.after');

  // Convert canvases to object URLs for display (async, avoids blocking toDataURL)
  useEffect(() => {
    let cancelled = false;
    let beforeObjectUrl = '';
    let afterObjectUrl = '';

    const toObjectUrl = async (canvas: HTMLCanvasElement): Promise<string> => {
      const blob: Blob | null = await new Promise((resolve) => canvas.toBlob(resolve, 'image/png'));
      if (!blob) return '';
      return URL.createObjectURL(blob);
    };

    (async () => {
      const [bUrl, aUrl] = await Promise.all([toObjectUrl(before), toObjectUrl(after)]);
      if (cancelled) {
        if (bUrl) URL.revokeObjectURL(bUrl);
        if (aUrl) URL.revokeObjectURL(aUrl);
        return;
      }
      beforeObjectUrl = bUrl;
      afterObjectUrl = aUrl;
      setBeforeUrl(bUrl);
      setAfterUrl(aUrl);
    })();

    return () => {
      cancelled = true;
      if (beforeObjectUrl) URL.revokeObjectURL(beforeObjectUrl);
      if (afterObjectUrl) URL.revokeObjectURL(afterObjectUrl);
    };
  }, [before, after]);

  const updatePosition = useCallback((clientX: number) => {
    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect) return;
    const x = clientX - rect.left;
    const pct = Math.max(0, Math.min(100, (x / rect.width) * 100));
    setSliderPos(pct);
  }, []);

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    setIsDragging(true);
    updatePosition(e.clientX);
  }, [updatePosition]);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (isDragging) updatePosition(e.clientX);
  }, [isDragging, updatePosition]);

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    setIsDragging(true);
    updatePosition(e.touches[0].clientX);
  }, [updatePosition]);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (isDragging) updatePosition(e.touches[0].clientX);
  }, [isDragging, updatePosition]);

  useEffect(() => {
    const handleGlobalUp = () => setIsDragging(false);
    window.addEventListener('mouseup', handleGlobalUp);
    window.addEventListener('touchend', handleGlobalUp);
    return () => {
      window.removeEventListener('mouseup', handleGlobalUp);
      window.removeEventListener('touchend', handleGlobalUp);
    };
  }, []);

  // Calculate container aspect ratio from canvas
  const aspectRatio = before.width / before.height;

  return (
    <div
      ref={containerRef}
      className={`relative select-none overflow-hidden rounded-xl border border-gray-200 dark:border-gray-700 ${className}`}
      style={{ aspectRatio: String(aspectRatio) }}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
    >
      {/* After image (full background) */}
      {afterUrl && (
        <img
          src={afterUrl}
          alt={t('preview.after')}
          className="absolute inset-0 w-full h-full object-contain"
          draggable={false}
        />
      )}

      {/* Before image (clipped) */}
      {beforeUrl && (
        <div
          className="absolute inset-0 overflow-hidden"
          style={{ clipPath: `inset(0 ${100 - sliderPos}% 0 0)` }}
        >
          <img
            src={beforeUrl}
            alt={t('preview.before')}
            className="absolute inset-0 w-full h-full object-contain"
            draggable={false}
          />
        </div>
      )}

      {/* Slider line */}
      <div
        className="absolute top-0 bottom-0 w-0.5 bg-white shadow-lg z-10"
        style={{ left: `${sliderPos}%` }}
      >
        {/* Handle */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white shadow-lg flex items-center justify-center cursor-ew-resize border-2 border-gray-300">
          <svg className="w-5 h-5 text-gray-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
            <path d="M8 6l-4 6 4 6M16 6l4 6-4 6" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>
      </div>

      {/* Labels */}
      <div className="absolute top-3 left-3 px-2 py-1 bg-black/60 text-white text-xs rounded font-medium z-20">
        {labelBefore}
      </div>
      <div className="absolute top-3 right-3 px-2 py-1 bg-black/60 text-white text-xs rounded font-medium z-20">
        {labelAfter}
      </div>
    </div>
  );
}
