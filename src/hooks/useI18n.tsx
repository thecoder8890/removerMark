'use client';

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { Locale, detectLocale, saveLocale, loadTranslations, interpolate, isRTL, type TranslationDict } from '@/lib/i18n';
import enTranslations from '@/locales/en.json';

interface I18nContextType {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  t: (key: string, vars?: Record<string, string | number>) => string;
  isRtl: boolean;
  ready: boolean;
}

const I18nContext = createContext<I18nContextType>({
  locale: 'en',
  setLocale: () => {},
  t: (key) => key,
  isRtl: false,
  ready: false,
});

export function I18nProvider({ children }: { children: React.ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>('en');
  const [translations, setTranslations] = useState<TranslationDict>(enTranslations as TranslationDict);
  const [ready, setReady] = useState(true);

  useEffect(() => {
    const detected = detectLocale();
    setLocaleState(detected);
    loadTranslations(detected).then((dict) => {
      setTranslations(dict);
      setReady(true);
    });
  }, []);

  const setLocale = useCallback((newLocale: Locale) => {
    setLocaleState(newLocale);
    saveLocale(newLocale);
    loadTranslations(newLocale).then(setTranslations);
  }, []);

  const t = useCallback((key: string, vars?: Record<string, string | number>) => {
    const text = translations[key] || (enTranslations as TranslationDict)[key] || key;
    return interpolate(text, vars);
  }, [translations]);

  const isRtl = isRTL(locale);

  useEffect(() => {
    document.documentElement.dir = isRtl ? 'rtl' : 'ltr';
    document.documentElement.lang = locale;
  }, [locale, isRtl]);

  return (
    <I18nContext.Provider value={{ locale, setLocale, t, isRtl, ready }}>
      {children}
    </I18nContext.Provider>
  );
}

export function useI18n() {
  return useContext(I18nContext);
}
