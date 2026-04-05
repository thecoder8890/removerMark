'use client';

import Link from 'next/link';
import { useI18n } from '@/hooks/useI18n';

export default function Footer() {
  const { t } = useI18n();
  const year = new Date().getFullYear();

  return (
    <footer className="w-full px-4 pb-4 md:pb-6">
      <div className="surface-panel max-w-6xl mx-auto rounded-[2rem] px-6 py-8 md:px-8 md:py-10">
        <div className="flex flex-col gap-8 md:flex-row md:items-start md:justify-between">
          <div className="max-w-md">
            <p className="font-display text-2xl font-semibold text-slate-950 dark:text-white">UnMarkLM</p>
            <p className="mt-3 text-sm leading-6 text-slate-600 dark:text-slate-300">
              {t('hero.subtitle')}
            </p>
          </div>

          <nav className="flex flex-wrap gap-x-5 gap-y-3 text-sm">
            <Link href="/faq" className="text-slate-600 dark:text-slate-400 hover:text-slate-950 dark:hover:text-white transition-colors">{t('nav.faq')}</Link>
            <Link href="/privacy" className="text-slate-600 dark:text-slate-400 hover:text-slate-950 dark:hover:text-white transition-colors">{t('nav.privacy')}</Link>
            <Link href="/terms" className="text-slate-600 dark:text-slate-400 hover:text-slate-950 dark:hover:text-white transition-colors">{t('nav.terms')}</Link>
            <Link href="/contact" className="text-slate-600 dark:text-slate-400 hover:text-slate-950 dark:hover:text-white transition-colors">{t('nav.contact')}</Link>
            <a
              href="https://github.com/Daesrock/UnMarkLM"
              target="_blank"
              rel="noopener noreferrer"
              className="text-slate-600 dark:text-slate-400 hover:text-slate-950 dark:hover:text-white transition-colors flex items-center gap-1"
            >
              GitHub
              <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                <path d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6M15 3h6v6M10 14L21 3" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </a>
          </nav>
        </div>

        <div className="mt-8 border-t border-slate-200 dark:border-slate-800 pt-6">
          <p className="text-xs text-slate-400 dark:text-slate-500 text-center mb-2">
            {t('disclaimer')}
          </p>
          <p className="text-xs text-slate-400 dark:text-slate-500 text-center">
            {t('footer.rights', { year: String(year) })}
          </p>
        </div>
      </div>
    </footer>
  );
}
