'use client';

import React, { useState, useCallback } from 'react';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import DropZone from '@/components/DropZone';
import { type ProcessedFile } from '@/components/FileResults';
import { useI18n } from '@/hooks/useI18n';

const DemoSection = dynamic(() => import('@/components/DemoSection'));
const FileResults = dynamic(() => import('@/components/FileResults'));


type AppState = 'idle' | 'processing' | 'done';

export default function HomePage() {
  const { t, ready } = useI18n();
  const [state, setState] = useState<AppState>('idle');
  const [files, setFiles] = useState<ProcessedFile[]>([]);

  const handleFiles = useCallback(async (selectedFiles: File[]) => {
    // Process all files — always uses Smart Fill (gradient interpolation)
    setState('processing');
    const processedFiles: ProcessedFile[] = selectedFiles.map((f) => ({
      original: f,
      originalPreview: null,
      smartFillResult: null,
      smartFillPreview: null,
      cropResult: null,
      cropPreview: null,
      selectedMethod: 'smartfill' as const,
      status: 'pending' as const,
      progress: 0,
    }));
    setFiles([...processedFiles]);

    for (let i = 0; i < selectedFiles.length; i++) {
      const file = selectedFiles[i];
      processedFiles[i].status = 'processing';
      setFiles([...processedFiles]);

      try {
        const imageProcessor = await import('@/lib/image-processor');
        const fileType = imageProcessor.getFileType(file);

        if (fileType === 'image') {
          const sfResult = await imageProcessor.processImage(file, 'smartfill');

          const origCanvas = document.createElement('canvas');
          origCanvas.width = sfResult.original.naturalWidth;
          origCanvas.height = sfResult.original.naturalHeight;
          origCanvas.getContext('2d')!.drawImage(sfResult.original, 0, 0);

          processedFiles[i] = {
            ...processedFiles[i],
            originalPreview: origCanvas,
            smartFillResult: sfResult.blob,
            smartFillPreview: sfResult.result.canvas,
            cropResult: null,
            cropPreview: null,
            selectedMethod: 'smartfill',
            status: 'done',
            progress: 100,
          };
        } else if (fileType === 'pdf') {
          const { processPdf } = await import('@/lib/pdf-processor');
          const sfResult = await processPdf(file, 'smartfill', undefined, (p) => {
            processedFiles[i].progress = (p.currentPage / p.totalPages) * 100;
            setFiles([...processedFiles]);
          });

          processedFiles[i] = {
            ...processedFiles[i],
            smartFillResult: sfResult.blob,
            cropResult: null,
            selectedMethod: 'smartfill',
            status: 'done',
            progress: 100,
          };
        }
      } catch (err) {
        processedFiles[i].status = 'error';
        processedFiles[i].error = err instanceof Error ? err.message : 'Unknown error';
      }

      setFiles([...processedFiles]);
    }

    setState('done');
  }, []);

  const handleDownload = useCallback((index: number) => {
    const file = files[index];
    if (!file || !file.smartFillResult) return;

    const baseName = file.original.name.replace(/\.[^.]+$/, '');
    const ext = file.original.type === 'application/pdf' ? '.pdf' : file.original.name.match(/\.png$/i) ? '.png' : '.jpg';
    const url = URL.createObjectURL(file.smartFillResult);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${baseName}_clean${ext}`;
    a.click();
    URL.revokeObjectURL(url);
  }, [files]);

  const handleDownloadAll = useCallback(async () => {
    if (files.length <= 1) {
      handleDownload(0);
      return;
    }

    const JSZip = (await import('jszip')).default;
    const zip = new JSZip();
    files.forEach((file) => {
      const blob = file.smartFillResult;
      if (!blob) return;
      const baseName = file.original.name.replace(/\.[^.]+$/, '');
      const ext = file.original.type === 'application/pdf' ? '.pdf' : file.original.name.match(/\.png$/i) ? '.png' : '.jpg';
      zip.file(`${baseName}_clean${ext}`, blob);
    });

    const zipBlob = await zip.generateAsync({ type: 'blob' });
    const url = URL.createObjectURL(zipBlob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'unmarklm_clean.zip';
    a.click();
    URL.revokeObjectURL(url);
  }, [files, handleDownload]);

  const handleReset = useCallback(() => {
    setState('idle');
    setFiles([]);
  }, []);

  const isIdle = state === 'idle';
  const processedCount = files.filter((file) => file.status === 'done').length;
  const hasErrors = files.some((file) => file.status === 'error');

  const heroStats = [
    { value: t('hero.stats.private.value'), label: t('hero.stats.private.label') },
    { value: t('hero.stats.batch.value'), label: t('hero.stats.batch.label') },
    { value: t('hero.stats.formats.value'), label: t('hero.stats.formats.label') },
  ];

  const processSteps = [
    {
      step: '01',
      title: t('home.workflow.upload.title'),
      desc: t('home.workflow.upload.desc'),
    },
    {
      step: '02',
      title: t('home.workflow.clean.title'),
      desc: t('home.workflow.clean.desc'),
    },
    {
      step: '03',
      title: t('home.workflow.export.title'),
      desc: t('home.workflow.export.desc'),
    },
  ];

  if (!ready) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-2 border-gray-200 border-t-blue-600 rounded-full" />
      </div>
    );
  }

  return (
    <>
      <Header />
      <main className="flex-1 pb-8">
        <section className="relative overflow-hidden">
          <div className="hero-orb top-20 left-[10%] h-32 w-32 bg-sky-300/55 dark:bg-sky-500/25" />
          <div className="hero-orb hero-orb--delay top-40 right-[8%] h-40 w-40 bg-emerald-300/45 dark:bg-emerald-500/20" />
          <div className="max-w-6xl mx-auto px-4 pt-8 md:pt-12 pb-10 md:pb-14">
            {isIdle ? (
              <div className="grid gap-10 lg:grid-cols-[1.08fr_0.92fr] items-start">
                <div className="fade-in-up">
                  <div className="inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium text-sky-700 dark:text-sky-300 hero-chip">
                    <span className="inline-flex h-2 w-2 rounded-full bg-emerald-500" />
                    {t('hero.eyebrow')}
                  </div>
                  <h1 className="font-display mt-6 max-w-3xl text-5xl md:text-6xl lg:text-7xl font-semibold text-slate-950 dark:text-white">
                    {t('hero.title')}
                  </h1>
                  <p className="mt-4 max-w-2xl text-base md:text-lg text-slate-600 dark:text-slate-300">
                    {t('hero.subtitle')}
                  </p>
                  <p className="mt-3 max-w-2xl text-sm md:text-base text-slate-500 dark:text-slate-400">
                    {t('hero.kicker')}
                  </p>

                  <div className="mt-8 flex flex-wrap gap-3">
                    <a
                      href="#tool"
                      className="inline-flex items-center justify-center rounded-2xl bg-slate-950 dark:bg-white px-5 py-3 text-sm font-medium text-white dark:text-slate-950 shadow-lg shadow-slate-950/10 hover:-translate-y-0.5"
                    >
                      {t('hero.cta.primary')}
                    </a>
                    <Link
                      href="/how-it-works"
                      className="inline-flex items-center justify-center rounded-2xl border border-slate-200/80 dark:border-slate-700 bg-white/70 dark:bg-slate-900/70 px-5 py-3 text-sm font-medium text-slate-700 dark:text-slate-200 hover:-translate-y-0.5"
                    >
                      {t('hero.cta.secondary')}
                    </Link>
                  </div>

                  <div className="mt-8 grid gap-4 sm:grid-cols-3">
                    {heroStats.map((item) => (
                      <div key={item.label} className="surface-panel rounded-3xl p-4">
                        <div className="font-display text-2xl font-semibold text-slate-950 dark:text-white">{item.value}</div>
                        <div className="mt-1 text-sm text-slate-500 dark:text-slate-400">{item.label}</div>
                      </div>
                    ))}
                  </div>

                  <div className="mt-8 grid gap-3 sm:grid-cols-3">
                    {processSteps.map((item) => (
                      <div key={item.step} className="rounded-3xl border border-slate-200/70 dark:border-slate-800 bg-white/55 dark:bg-slate-950/35 p-4">
                        <div className="font-display text-xs font-semibold tracking-[0.24em] text-sky-600 dark:text-sky-400">
                          {item.step}
                        </div>
                        <h2 className="mt-3 text-base font-semibold text-slate-900 dark:text-white">{item.title}</h2>
                        <p className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-400">{item.desc}</p>
                      </div>
                    ))}
                  </div>
                </div>

                <div id="tool" className="fade-in-up-delay lg:pt-6">
                  <DropZone onFiles={handleFiles} />
                </div>
              </div>
            ) : (
              <div className="max-w-3xl mx-auto text-center fade-in-up">
                <div className="inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium text-sky-700 dark:text-sky-300 hero-chip">
                  <span className={`inline-flex h-2 w-2 rounded-full ${hasErrors ? 'bg-amber-500' : 'bg-emerald-500'}`} />
                  {hasErrors ? t('results.hero.errorEyebrow') : t('results.hero.eyebrow')}
                </div>
                <h1 className="font-display mt-6 text-4xl md:text-5xl font-semibold text-slate-950 dark:text-white">
                  {t(
                    hasErrors
                      ? 'results.hero.errorTitle'
                      : allFilesDone(files)
                        ? 'results.hero.title'
                        : 'results.hero.processingTitle'
                  )}
                </h1>
                <p className="mt-4 text-base md:text-lg text-slate-600 dark:text-slate-300">
                  {t(
                    hasErrors
                      ? 'results.hero.errorSubtitle'
                      : state === 'processing'
                        ? 'results.hero.processingSubtitle'
                        : 'results.hero.subtitle',
                    { count: processedCount, total: files.length }
                  )}
                </p>
              </div>
            )}
          </div>
        </section>

        {!isIdle && (
          <section id="tool" className="max-w-5xl mx-auto px-4 pb-10">
            <FileResults
              files={files}
              onDownload={handleDownload}
              onDownloadAll={handleDownloadAll}
              onReset={handleReset}
            />
          </section>
        )}

        {isIdle && (
          <>
            <DemoSection />

            <section className="max-w-6xl mx-auto px-4 py-6 md:py-10">
              <div className="section-shell grid-glow surface-panel rounded-[2rem] p-6 md:p-8 lg:p-10">
                <div className="relative z-10 grid gap-8 lg:grid-cols-[0.9fr_1.1fr] lg:items-start">
                  <div>
                    <p className="text-sm font-medium uppercase tracking-[0.24em] text-sky-600 dark:text-sky-400">
                      {t('home.workflow.eyebrow')}
                    </p>
                    <h2 className="font-display mt-4 text-3xl md:text-4xl font-semibold text-slate-950 dark:text-white">
                      {t('home.workflow.title')}
                    </h2>
                    <p className="mt-4 max-w-xl text-base text-slate-600 dark:text-slate-300">
                      {t('home.workflow.subtitle')}
                    </p>
                  </div>
                  <div className="grid gap-4">
                    {processSteps.map((item) => (
                      <ProcessCard key={item.step} step={item.step} title={item.title} desc={item.desc} />
                    ))}
                  </div>
                </div>
              </div>
            </section>

            <section className="max-w-6xl mx-auto px-4 py-12 md:py-16">
              <div className="flex items-end justify-between gap-4 mb-8">
                <div>
                  <p className="text-sm font-medium uppercase tracking-[0.24em] text-sky-600 dark:text-sky-400">
                    {t('features.eyebrow')}
                  </p>
                  <h2 className="font-display mt-3 text-3xl md:text-4xl font-semibold text-slate-950 dark:text-white">
                    {t('features.title')}
                  </h2>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
                <FeatureCard
                  icon={
                    <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
                      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  }
                  title={t('features.privacy.title')}
                  desc={t('features.privacy.desc')}
                />
                <FeatureCard
                  icon={
                    <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
                      <path d="M12 2v20M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  }
                  title={t('features.free.title')}
                  desc={t('features.free.desc')}
                />
                <FeatureCard
                  icon={
                    <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
                      <path d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  }
                  title={t('features.smart.title')}
                  desc={t('features.smart.desc')}
                />
                <FeatureCard
                  icon={
                    <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
                      <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" />
                      <path d="M14 2v6h6M16 13H8M16 17H8M10 9H8" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  }
                  title={t('features.formats.title')}
                  desc={t('features.formats.desc')}
                />
              </div>
            </section>
          </>
        )}

        <section className="max-w-4xl mx-auto px-4 pb-10 md:pb-14 text-center">
          <div className="surface-panel rounded-[2rem] px-6 py-6 md:px-10 md:py-8">
            <p className="text-sm text-slate-500 dark:text-slate-400">
              {t('disclaimer')}
            </p>
            <p className="text-xs text-slate-400 dark:text-slate-500 mt-2">
              {t('disclaimer.user')}
            </p>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}

function FeatureCard({ icon, title, desc }: { icon: React.ReactNode; title: string; desc: string }) {
  return (
    <div className="surface-panel rounded-[1.75rem] p-6 md:p-7">
      <div className="w-11 h-11 rounded-2xl bg-sky-100/80 dark:bg-sky-950/40 text-sky-600 dark:text-sky-300 flex items-center justify-center mb-4">
        {icon}
      </div>
      <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-2">{title}</h3>
      <p className="text-sm leading-6 text-slate-600 dark:text-slate-400">{desc}</p>
    </div>
  );
}

function ProcessCard({ step, title, desc }: { step: string; title: string; desc: string }) {
  return (
    <div className="surface-panel-strong rounded-[1.75rem] p-5 md:p-6">
      <div className="flex items-start gap-4">
        <div className="font-display flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-950 text-sm font-semibold text-white dark:bg-white dark:text-slate-950">
          {step}
        </div>
        <div>
          <h3 className="text-lg font-semibold text-slate-900 dark:text-white">{title}</h3>
          <p className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-400">{desc}</p>
        </div>
      </div>
    </div>
  );
}

function allFilesDone(files: ProcessedFile[]) {
  return files.every((file) => file.status === 'done');
}
