'use client';

import React from 'react';
import { useI18n } from '@/hooks/useI18n';
import BeforeAfterSlider from '@/components/BeforeAfterSlider';

export interface ProcessedFile {
  original: File;
  originalPreview: HTMLCanvasElement | null;
  smartFillResult: Blob | null;
  smartFillPreview: HTMLCanvasElement | null;
  cropResult: Blob | null;
  cropPreview: HTMLCanvasElement | null;
  selectedMethod: 'smartfill' | 'crop';
  status: 'pending' | 'processing' | 'done' | 'error';
  error?: string;
  progress: number;
}

interface FileResultsProps {
  files: ProcessedFile[];
  onDownload: (index: number) => void;
  onDownloadAll: () => void;
  onReset: () => void;
}

export default function FileResults({ files, onDownload, onDownloadAll, onReset }: FileResultsProps) {
  const { t } = useI18n();

  const allDone = files.every((f) => f.status === 'done');
  const anyProcessing = files.some((f) => f.status === 'processing');
  const anyError = files.some((f) => f.status === 'error');
  const showOverallProgress = anyProcessing && files.length > 1;
  const completedCount = files.filter((f) => f.status === 'done').length;
  const processingCount = files.filter((f) => f.status === 'processing').length;
  const failedCount = files.filter((f) => f.status === 'error').length;

  return (
    <div className="w-full space-y-5">
      <div className="surface-panel-strong rounded-[2rem] p-5 md:p-6">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full bg-sky-100/80 dark:bg-sky-950/40 px-3 py-1.5 text-xs font-medium uppercase tracking-[0.2em] text-sky-700 dark:text-sky-300">
              <span className={`inline-flex h-2 w-2 rounded-full ${anyError ? 'bg-amber-500' : allDone ? 'bg-emerald-500' : 'bg-sky-500'}`} />
              {anyError ? t('results.summary.badgeAttention') : allDone ? t('results.summary.badgeDone') : t('results.summary.badgeProcessing')}
            </div>
            <h2 className="font-display mt-4 text-2xl md:text-3xl font-semibold text-slate-950 dark:text-white">
              {allDone ? t('results.summary.titleDone') : t('results.summary.titleProcessing')}
            </h2>
            <p className="mt-2 text-sm md:text-base text-slate-600 dark:text-slate-300">
              {t('results.summary.subtitle', { done: completedCount, total: files.length })}
            </p>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <SummaryStat value={String(completedCount)} label={t('results.summary.done')} />
            <SummaryStat value={String(processingCount)} label={t('results.summary.processing')} />
            <SummaryStat value={String(failedCount)} label={t('results.summary.errors')} />
          </div>
        </div>

        {(showOverallProgress || anyProcessing) && (
          <div className="mt-5">
            <div className="flex items-center justify-between gap-3 text-sm text-slate-500 dark:text-slate-400">
              <span>{t('processing.title')}</span>
              <span>{completedCount} / {files.length}</span>
            </div>
            <div className="mt-3 h-2.5 overflow-hidden rounded-full bg-slate-200/80 dark:bg-slate-800">
              <div
                className="h-full rounded-full bg-gradient-to-r from-sky-500 via-blue-500 to-emerald-500 transition-all duration-300"
                style={{
                  width: `${(completedCount / files.length) * 100}%`,
                }}
              />
            </div>
          </div>
        )}
      </div>

      {/* File cards */}
      {files.map((file, idx) => (
        <div key={idx} className="surface-panel-strong overflow-hidden rounded-[2rem]">
          <div className="p-5 md:p-6">
            <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
              <div className="flex items-center gap-2 min-w-0">
                <FileIcon type={file.original.type} />
                <div className="min-w-0">
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="text-sm md:text-base font-medium text-slate-950 dark:text-white truncate">
                      {file.original.name}
                    </span>
                    <span className="text-xs text-slate-400 flex-shrink-0">
                      ({(file.original.size / 1024 / 1024).toFixed(1)} MB)
                    </span>
                  </div>
                  <p className="mt-1 text-xs uppercase tracking-[0.18em] text-slate-400 dark:text-slate-500">
                    {getKindLabel(file.original.type)}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <StatusBadge status={file.status} />
              </div>
            </div>

            {file.status === 'processing' && (
              <div className="mt-5">
                <div className="mb-2 flex items-center justify-between gap-3 text-sm text-slate-500 dark:text-slate-400">
                  <span>{t('results.file.processing')}</span>
                  <span>{Math.round(file.progress)}%</span>
                </div>
                <div className="h-2 bg-slate-200/80 dark:bg-slate-800 rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-sky-500 to-blue-600 transition-all duration-300"
                    style={{ width: `${file.progress}%` }}
                  />
                </div>
              </div>
            )}

            {file.status === 'error' && file.error && (
              <div className="mt-5 rounded-2xl border border-red-200 dark:border-red-900/60 bg-red-50/90 dark:bg-red-950/20 px-4 py-3 text-sm text-red-600 dark:text-red-400">
                {file.error}
              </div>
            )}

            {file.status === 'done' && file.originalPreview && file.smartFillPreview && (
              <div className="mt-5 overflow-hidden rounded-[1.5rem] border border-slate-200/80 dark:border-slate-800">
                <BeforeAfterSlider
                  before={file.originalPreview}
                  after={file.smartFillPreview}
                  beforeLabel={t('preview.before')}
                  afterLabel={t('preview.after')}
                />
              </div>
            )}

            {file.status === 'done' && (!file.originalPreview || !file.smartFillPreview) && (
              <div className="mt-5 rounded-[1.5rem] border border-slate-200/80 dark:border-slate-800 bg-white/70 dark:bg-slate-950/50 p-4">
                <p className="text-sm font-medium text-slate-900 dark:text-white">{t('results.file.readyTitle')}</p>
                <p className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-400">
                  {t('results.file.readyDesc')}
                </p>
              </div>
            )}

            {file.status === 'done' && (
              <div className="mt-5 flex flex-col sm:flex-row sm:items-center sm:justify-end gap-3">
                <a
                  href="https://ko-fi.com/daesrock"
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="Buy me a coffee on Ko-fi"
                  className="inline-flex items-center justify-center gap-2 rounded-2xl border border-slate-200/80 dark:border-slate-700 bg-white/80 dark:bg-slate-900/70 px-4 py-3 text-sm font-medium text-slate-700 dark:text-slate-200"
                >
                  <span className="inline-flex items-center justify-center w-5 h-5 rounded bg-slate-100 dark:bg-slate-800">
                    <svg className="w-3.5 h-3.5 text-slate-700" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                      <path d="M4 7h11a1 1 0 011 1v4a4 4 0 01-4 4H8a4 4 0 01-4-4V8a1 1 0 011-1z" strokeLinecap="round" strokeLinejoin="round" />
                      <path d="M16 9h2a2 2 0 010 4h-2" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </span>
                  Buy me a coffee
                </a>
                <button
                  onClick={() => onDownload(idx)}
                  className="inline-flex items-center justify-center gap-2 rounded-2xl bg-slate-950 dark:bg-white px-5 py-3 text-sm font-medium text-white dark:text-slate-950 shadow-lg shadow-slate-950/10"
                >
                  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                    <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M7 10l5 5 5-5M12 15V3" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                  {t('preview.download')}
                </button>
              </div>
            )}
          </div>
        </div>
      ))}

      {/* Action buttons */}
      {(allDone || anyError) && files.length > 0 && (
        <div className="flex flex-col sm:flex-row gap-3 pt-1">
          {files.length > 1 && (
            <button
              onClick={onDownloadAll}
              disabled={!allDone}
              className="flex-1 inline-flex items-center justify-center gap-2 rounded-2xl bg-slate-950 dark:bg-white px-6 py-3 text-sm font-medium text-white dark:text-slate-950 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M7 10l5 5 5-5M12 15V3" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              {t('preview.downloadAll')}
            </button>
          )}
          <button
            onClick={onReset}
            className="flex-1 rounded-2xl border border-slate-200 dark:border-slate-700 bg-white/80 dark:bg-slate-900/60 px-6 py-3 text-sm font-medium text-slate-700 dark:text-slate-200"
          >
            {anyError ? t('preview.retry') : t('preview.reset')}
          </button>
        </div>
      )}
    </div>
  );
}

function FileIcon({ type }: { type: string }) {
  const isPdf = type === 'application/pdf';
  return (
    <div className={`flex-shrink-0 w-10 h-10 rounded-2xl flex items-center justify-center ${isPdf ? 'bg-red-100/80 dark:bg-red-950/30' : 'bg-emerald-100/80 dark:bg-emerald-950/30'}`}>
      {isPdf ? (
        <svg className="w-5 h-5 text-red-600 dark:text-red-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
          <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" />
          <path d="M14 2v6h6M16 13H8M16 17H8M10 9H8" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      ) : (
        <svg className="w-5 h-5 text-emerald-600 dark:text-emerald-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
          <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
          <circle cx="8.5" cy="8.5" r="1.5" />
          <path d="M21 15l-5-5L5 21" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      )}
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  switch (status) {
    case 'done':
      return (
        <span className="flex items-center gap-1 rounded-full bg-emerald-100/80 dark:bg-emerald-950/30 px-3 py-1.5 text-xs font-medium text-emerald-700 dark:text-emerald-400">
          <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={3}>
            <path d="M20 6L9 17l-5-5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          Ready
        </span>
      );
    case 'processing':
      return (
        <span className="flex items-center gap-1 rounded-full bg-sky-100/80 dark:bg-sky-950/30 px-3 py-1.5 text-xs font-medium text-sky-700 dark:text-sky-400">
          <div className="animate-spin w-3 h-3 border-2 border-blue-200 border-t-blue-600 rounded-full" />
          Processing
        </span>
      );
    case 'error':
      return (
        <span className="rounded-full bg-red-100/80 dark:bg-red-950/30 px-3 py-1.5 text-xs font-medium text-red-700 dark:text-red-400">
          Error
        </span>
      );
    default:
      return (
        <span className="rounded-full bg-slate-100 dark:bg-slate-800 px-3 py-1.5 text-xs font-medium text-slate-500 dark:text-slate-400">
          Pending
        </span>
      );
  }
}

function SummaryStat({ value, label }: { value: string; label: string }) {
  return (
    <div className="min-w-[92px] rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white/75 dark:bg-slate-950/45 px-4 py-3 text-center">
      <div className="font-display text-2xl font-semibold text-slate-950 dark:text-white">{value}</div>
      <div className="mt-1 text-xs uppercase tracking-[0.18em] text-slate-400 dark:text-slate-500">{label}</div>
    </div>
  );
}

function getKindLabel(type: string) {
  if (type === 'application/pdf') return 'PDF';
  if (type === 'image/png') return 'PNG';
  if (type === 'image/jpeg') return 'JPG';
  return 'FILE';
}
