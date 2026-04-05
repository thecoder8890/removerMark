'use client';

import React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useI18n } from '@/hooks/useI18n';
import { useTheme } from '@/hooks/useTheme';
import { LOCALE_NAMES, SUPPORTED_LOCALES, type Locale } from '@/lib/i18n';

export default function Header() {
  const { t, locale, setLocale } = useI18n();
  const { theme, toggleTheme } = useTheme();
  const [menuOpen, setMenuOpen] = React.useState(false);
  const [langOpen, setLangOpen] = React.useState(false);

  return (
    <header className="sticky top-0 z-50 w-full px-4 pt-3">
      <div className="surface-panel max-w-6xl mx-auto rounded-[1.75rem] border border-white/40 dark:border-slate-800/80 px-4 md:px-5">
        <div className="h-16 flex items-center justify-between gap-4">
          <Link href="/" className="flex items-center gap-3 text-slate-900 dark:text-white">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-slate-950 text-white dark:bg-white dark:text-slate-950">
              <Image src="/favicon.svg" alt="removerMark logo" width={22} height={22} priority />
            </div>
            <div>
              <div className="font-display text-lg font-semibold leading-none">removerMark</div>
              <div className="hidden sm:block text-xs text-slate-500 dark:text-slate-400">
                {t('header.tagline')}
              </div>
            </div>
          </Link>

          <nav className="hidden lg:flex items-center gap-1">
            <Link href="/faq" className="px-3 py-2 text-sm text-slate-600 dark:text-slate-300 hover:text-slate-950 dark:hover:text-white rounded-xl hover:bg-white/70 dark:hover:bg-slate-900/70">
              {t('nav.faq')}
            </Link>
            <Link href="/how-it-works" className="px-3 py-2 text-sm text-slate-600 dark:text-slate-300 hover:text-slate-950 dark:hover:text-white rounded-xl hover:bg-white/70 dark:hover:bg-slate-900/70">
              {t('nav.howItWorks')}
            </Link>
            <Link href="/privacy" className="px-3 py-2 text-sm text-slate-600 dark:text-slate-300 hover:text-slate-950 dark:hover:text-white rounded-xl hover:bg-white/70 dark:hover:bg-slate-900/70">
              {t('nav.privacy')}
            </Link>
            <Link href="/terms" className="px-3 py-2 text-sm text-slate-600 dark:text-slate-300 hover:text-slate-950 dark:hover:text-white rounded-xl hover:bg-white/70 dark:hover:bg-slate-900/70">
              {t('nav.terms')}
            </Link>
            <Link href="/contact" className="px-3 py-2 text-sm text-slate-600 dark:text-slate-300 hover:text-slate-950 dark:hover:text-white rounded-xl hover:bg-white/70 dark:hover:bg-slate-900/70">
              {t('nav.contact')}
            </Link>
          </nav>

          <div className="hidden md:flex items-center gap-2">
            <div className="relative">
              <button
                onClick={() => setLangOpen(!langOpen)}
                className="px-3 py-2 text-sm text-slate-600 dark:text-slate-300 hover:text-slate-950 dark:hover:text-white rounded-xl hover:bg-white/70 dark:hover:bg-slate-900/70 transition-colors flex items-center gap-2"
                aria-label={t('language.select')}
              >
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                  <circle cx="12" cy="12" r="10" />
                  <path d="M2 12h20M12 2a15.3 15.3 0 014 10 15.3 15.3 0 01-4 10 15.3 15.3 0 01-4-10 15.3 15.3 0 014-10z" />
                </svg>
                <span className="hidden xl:inline">{LOCALE_NAMES[locale]}</span>
              </button>
              {langOpen && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setLangOpen(false)} />
                  <div className="absolute right-0 top-full mt-2 z-50 surface-panel-strong rounded-2xl py-2 min-w-[180px] max-h-[320px] overflow-y-auto">
                    {SUPPORTED_LOCALES.map((l) => (
                      <button
                        key={l}
                        onClick={() => { setLocale(l as Locale); setLangOpen(false); }}
                        className={`w-full text-left px-4 py-2.5 text-sm ${l === locale ? 'text-sky-600 dark:text-sky-300 font-medium' : 'text-slate-700 dark:text-slate-300'} hover:bg-white/70 dark:hover:bg-slate-900/70`}
                      >
                        {LOCALE_NAMES[l as Locale]}
                      </button>
                    ))}
                  </div>
                </>
              )}
            </div>

            <button
              onClick={toggleTheme}
              className="p-2.5 text-slate-600 dark:text-slate-300 hover:text-slate-950 dark:hover:text-white rounded-xl hover:bg-white/70 dark:hover:bg-slate-900/70"
              aria-label={t('theme.toggle')}
            >
              {theme === 'light' ? (
                <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                  <path d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z" />
                </svg>
              ) : (
                <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                  <circle cx="12" cy="12" r="5" />
                  <path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42" />
                </svg>
              )}
            </button>

            <Link
              href="/#tool"
              className="inline-flex items-center justify-center rounded-2xl bg-slate-950 dark:bg-white px-4 py-2.5 text-sm font-medium text-white dark:text-slate-950 shadow-lg shadow-slate-950/10"
            >
              {t('hero.cta.primary')}
            </Link>
          </div>

          <div className="flex md:hidden items-center gap-2">
            <button
              onClick={toggleTheme}
              className="p-2.5 text-slate-600 dark:text-slate-300 rounded-xl hover:bg-white/70 dark:hover:bg-slate-900/70"
              aria-label={t('theme.toggle')}
            >
              {theme === 'light' ? (
                <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                  <path d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z" />
                </svg>
              ) : (
                <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                  <circle cx="12" cy="12" r="5" />
                  <path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42" />
                </svg>
              )}
            </button>

            <button
              onClick={() => setMenuOpen(!menuOpen)}
              className="p-2.5 text-slate-600 dark:text-slate-300 rounded-xl hover:bg-white/70 dark:hover:bg-slate-900/70"
              aria-label="Menu"
            >
              {menuOpen ? (
                <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                  <path d="M6 18L18 6M6 6l12 12" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              ) : (
                <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                  <path d="M4 6h16M4 12h16M4 18h16" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              )}
            </button>
          </div>
        </div>
      </div>

      {menuOpen && (
        <div className="md:hidden max-w-6xl mx-auto mt-3 surface-panel rounded-[1.75rem] px-4 py-4">
          <nav className="flex flex-col gap-1">
            <Link href="/#tool" onClick={() => setMenuOpen(false)} className="rounded-2xl bg-slate-950 dark:bg-white px-4 py-3 text-center text-sm font-medium text-white dark:text-slate-950">{t('hero.cta.primary')}</Link>
            <Link href="/faq" onClick={() => setMenuOpen(false)} className="px-4 py-3 text-slate-700 dark:text-slate-300 hover:bg-white/70 dark:hover:bg-slate-900/70 rounded-xl">{t('nav.faq')}</Link>
            <Link href="/how-it-works" onClick={() => setMenuOpen(false)} className="px-4 py-3 text-slate-700 dark:text-slate-300 hover:bg-white/70 dark:hover:bg-slate-900/70 rounded-xl">{t('nav.howItWorks')}</Link>
            <Link href="/privacy" onClick={() => setMenuOpen(false)} className="px-4 py-3 text-slate-700 dark:text-slate-300 hover:bg-white/70 dark:hover:bg-slate-900/70 rounded-xl">{t('nav.privacy')}</Link>
            <Link href="/terms" onClick={() => setMenuOpen(false)} className="px-4 py-3 text-slate-700 dark:text-slate-300 hover:bg-white/70 dark:hover:bg-slate-900/70 rounded-xl">{t('nav.terms')}</Link>
            <Link href="/contact" onClick={() => setMenuOpen(false)} className="px-4 py-3 text-slate-700 dark:text-slate-300 hover:bg-white/70 dark:hover:bg-slate-900/70 rounded-xl">{t('nav.contact')}</Link>
            <div className="border-t border-slate-200 dark:border-slate-800 my-2" />
            <p className="px-4 py-1 text-xs text-slate-500 uppercase tracking-[0.22em]">{t('language.select')}</p>
            <div className="grid grid-cols-2 gap-1">
              {SUPPORTED_LOCALES.map((l) => (
                <button
                  key={l}
                  onClick={() => { setLocale(l as Locale); setMenuOpen(false); }}
                  className={`px-4 py-2.5 text-sm text-left rounded-xl ${l === locale ? 'bg-sky-100/80 dark:bg-sky-950/30 text-sky-600 dark:text-sky-300 font-medium' : 'text-slate-700 dark:text-slate-300 hover:bg-white/70 dark:hover:bg-slate-900/70'}`}
                >
                  {LOCALE_NAMES[l as Locale]}
                </button>
              ))}
            </div>
          </nav>
        </div>
      )}
    </header>
  );
}
