'use client';

import React, { useCallback, useRef, useState } from 'react';
import { useI18n } from '@/hooks/useI18n';

interface DropZoneProps {
  onFiles: (files: File[]) => void;
  accept?: string;
  maxSize?: number;
  disabled?: boolean;
}

export default function DropZone({ onFiles, accept = '.pdf,.png,.jpg,.jpeg', maxSize = 50 * 1024 * 1024, disabled = false }: DropZoneProps) {
  const { t } = useI18n();
  const [isDragging, setIsDragging] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const acceptedFormats = accept
    .split(',')
    .map((value) => value.trim().replace('.', '').toUpperCase());

  const handleFiles = useCallback((fileList: FileList | null) => {
    if (!fileList || fileList.length === 0) return;
    setError(null);

    const validFiles: File[] = [];
    const acceptedExts = accept.split(',').map(e => e.trim().toLowerCase());

    for (let i = 0; i < fileList.length; i++) {
      const file = fileList[i];

      // Check extension
      const ext = '.' + (file.name.split('.').pop()?.toLowerCase() || '');
      const typeMatch = file.type === 'application/pdf' || file.type.startsWith('image/');
      const extMatch = acceptedExts.some(ae => ext === ae || ae === file.type);

      if (!typeMatch && !extMatch) {
        setError(t('error.unsupported'));
        continue;
      }

      if (file.size > maxSize) {
        setError(t('error.tooLarge'));
        continue;
      }

      validFiles.push(file);
    }

    if (validFiles.length > 0) {
      onFiles(validFiles);
    }
  }, [accept, maxSize, onFiles, t]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!disabled) setIsDragging(true);
  }, [disabled]);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    if (!disabled) handleFiles(e.dataTransfer.files);
  }, [disabled, handleFiles]);

  const handleClick = useCallback(() => {
    if (!disabled) inputRef.current?.click();
  }, [disabled]);

  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    handleFiles(e.target.files);
    // Reset so same file can be selected again
    if (inputRef.current) inputRef.current.value = '';
  }, [handleFiles]);

  return (
    <div className="w-full max-w-2xl mx-auto">
      <div
        onClick={handleClick}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={`
          section-shell surface-panel-strong grid-glow relative overflow-hidden
          w-full rounded-[2rem] border
          cursor-pointer transition-all duration-300 ease-in-out
          ${isDragging
            ? 'border-sky-400 dark:border-sky-500 -translate-y-1 shadow-2xl shadow-sky-500/10'
            : 'border-slate-200/80 dark:border-slate-800 hover:border-sky-300 dark:hover:border-sky-600'
          }
          ${disabled ? 'opacity-50 cursor-not-allowed' : 'hover:-translate-y-1'}
        `}
      >
        <div className="pointer-events-none absolute inset-x-10 top-0 h-px bg-gradient-to-r from-transparent via-white/60 to-transparent dark:via-white/15" />
        <div className="relative z-10 px-6 py-7 md:px-8 md:py-8">
          <div className="flex items-center justify-between gap-3">
            <div className="inline-flex items-center gap-2 rounded-full bg-white/70 dark:bg-slate-900/70 px-3 py-1.5 text-xs font-medium uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400">
              <span className="inline-flex h-2 w-2 rounded-full bg-emerald-500" />
              {t('dropzone.badge')}
            </div>
            <div className="rounded-full bg-slate-950 px-3 py-1 text-xs font-medium text-white dark:bg-white dark:text-slate-950">
              {t('dropzone.maxsize')}
            </div>
          </div>

          <div className="mt-8 flex flex-col items-start text-left">
            <div className={`mb-5 rounded-[1.75rem] bg-sky-100/80 dark:bg-sky-950/45 p-4 text-sky-600 dark:text-sky-300 transition-transform duration-300 ${isDragging ? 'scale-105' : ''}`}>
              <svg
                className="h-12 w-12 md:h-14 md:w-14"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={1.2}
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
              </svg>
            </div>

            <h2 className="font-display text-2xl md:text-3xl font-semibold text-slate-950 dark:text-white">
              {t('dropzone.title')}
            </h2>
            <p className="mt-3 max-w-xl text-sm md:text-base leading-6 text-slate-600 dark:text-slate-300">
              {t('dropzone.description')}
            </p>

            <div className="mt-6 flex flex-wrap gap-2">
              {acceptedFormats.map((format) => (
                <span
                  key={format}
                  className="rounded-full border border-slate-200/80 dark:border-slate-700 bg-white/80 dark:bg-slate-900/75 px-3 py-1.5 text-xs font-medium text-slate-600 dark:text-slate-300"
                >
                  {format}
                </span>
              ))}
            </div>

            <div className="mt-6 flex flex-wrap gap-3">
              <button
                type="button"
                className="rounded-2xl bg-slate-950 dark:bg-white px-5 py-3 text-sm font-medium text-white dark:text-slate-950 shadow-lg shadow-slate-950/10"
                onClick={(e) => {
                  e.stopPropagation();
                  inputRef.current?.click();
                }}
              >
                {t('dropzone.button')}
              </button>
              <div className="rounded-2xl border border-dashed border-slate-300 dark:border-slate-700 px-4 py-3 text-sm text-slate-500 dark:text-slate-400">
                {t('dropzone.subtitle')}
              </div>
            </div>
          </div>

          <div className="mt-8 grid gap-3 sm:grid-cols-3">
            <HighlightPill label={t('dropzone.highlights.local')} />
            <HighlightPill label={t('dropzone.highlights.batch')} />
            <HighlightPill label={t('dropzone.highlights.instant')} />
          </div>
        </div>

        <input
          ref={inputRef}
          type="file"
          accept={accept}
          multiple
          onChange={handleInputChange}
          className="hidden"
        />
      </div>

      {/* Error message */}
      {error && (
        <div className="mt-4 rounded-2xl border border-red-200 dark:border-red-900/60 bg-red-50/90 dark:bg-red-950/30 px-4 py-3 text-sm text-red-600 dark:text-red-400">
          {error}
        </div>
      )}
    </div>
  );
}

function HighlightPill({ label }: { label: string }) {
  return (
    <div className="rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white/75 dark:bg-slate-900/55 px-4 py-3 text-sm text-slate-600 dark:text-slate-300">
      {label}
    </div>
  );
}
