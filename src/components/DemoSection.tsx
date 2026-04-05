'use client';

import React, { useState, useEffect } from 'react';
import BeforeAfterSlider from './BeforeAfterSlider';
import { removeWatermark } from '@/lib/watermark-remover';
import { useI18n } from '@/hooks/useI18n';

const DEMO_IMAGE = '/demo/demo-1.png';
const DEMO_ASPECT_RATIO = 1536 / 500;

export default function DemoSection() {
  const { t } = useI18n();
  const [beforeCanvas, setBeforeCanvas] = useState<HTMLCanvasElement | null>(null);
  const [afterCanvas, setAfterCanvas] = useState<HTMLCanvasElement | null>(null);

  useEffect(() => {
    let cancelled = false;

    const runWhenIdle = (fn: () => void) => {
      const g = globalThis as typeof globalThis & {
        requestIdleCallback?: (cb: () => void, opts?: { timeout: number }) => number;
      };
      if (typeof g.requestIdleCallback === 'function') {
        g.requestIdleCallback(fn, { timeout: 1500 });
        return;
      }
      setTimeout(fn, 0);
    };

    const img = new Image();
    img.onload = () => {
      if (cancelled) return;

      // Draw the "before" canvas quickly, then defer the heavier watermark
      // removal work so we don't block initial rendering / inflate TBT.
      const before = document.createElement('canvas');
      before.width = img.naturalWidth;
      before.height = img.naturalHeight;
      before.getContext('2d')!.drawImage(img, 0, 0);
      setBeforeCanvas(before);

      runWhenIdle(() => {
        if (cancelled) return;
        const result = removeWatermark(img, 'smartfill');
        setAfterCanvas(result.canvas);
      });
    };
    img.src = DEMO_IMAGE;

    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <section className="max-w-6xl mx-auto px-4 py-10 md:py-14">
      <div className="surface-panel-strong rounded-[2rem] p-6 md:p-8 lg:p-10">
        <div className="mb-6 md:mb-8 flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-sm font-medium uppercase tracking-[0.24em] text-sky-600 dark:text-sky-400">
              {t('demo.eyebrow')}
            </p>
            <h2 className="font-display mt-3 text-3xl md:text-4xl font-semibold text-slate-950 dark:text-white">
              {t('demo.title')}
            </h2>
          </div>
          <p className="max-w-xl text-sm md:text-base text-slate-600 dark:text-slate-300">
            {t('demo.subtitle')}
          </p>
        </div>
        {beforeCanvas && afterCanvas ? (
          <BeforeAfterSlider
            before={beforeCanvas}
            after={afterCanvas}
            beforeLabel={t('preview.before')}
            afterLabel={t('preview.after')}
          />
        ) : (
          <div
            className="w-full rounded-[1.5rem] border border-slate-200 dark:border-slate-800 bg-slate-100/80 dark:bg-slate-950/60"
            style={{ aspectRatio: String(DEMO_ASPECT_RATIO) }}
            aria-hidden="true"
          />
        )}
      </div>
    </section>
  );
}
