export const SUPPORTED_LOCALES = [
  'en', 'zh-CN', 'zh-TW', 'ja', 'de', 'fr', 'es', 'ar', 'pt', 'id', 'ko', 'vi', 'ru'
] as const;

export type Locale = typeof SUPPORTED_LOCALES[number];

export const LOCALE_NAMES: Record<Locale, string> = {
  'en': 'English',
  'zh-CN': '简体中文',
  'zh-TW': '繁體中文',
  'ja': '日本語',
  'de': 'Deutsch',
  'fr': 'Français',
  'es': 'Español',
  'ar': 'العربية',
  'pt': 'Português',
  'id': 'Indonesia',
  'ko': '한국어',
  'vi': 'Tiếng Việt',
  'ru': 'Русский',
};

export const RTL_LOCALES: Locale[] = ['ar'];

export function isRTL(locale: Locale): boolean {
  return RTL_LOCALES.includes(locale);
}

export function detectLocale(): Locale {
  if (typeof window === 'undefined') return 'en';
  
  const saved = localStorage.getItem('unmarklm-locale');
  if (saved && SUPPORTED_LOCALES.includes(saved as Locale)) {
    return saved as Locale;
  }

  const browserLang = navigator.language || (navigator as { userLanguage?: string }).userLanguage || 'en';
  
  // Exact match first
  if (SUPPORTED_LOCALES.includes(browserLang as Locale)) {
    return browserLang as Locale;
  }

  // Check zh variants
  if (browserLang.startsWith('zh')) {
    if (browserLang.includes('TW') || browserLang.includes('Hant') || browserLang.includes('HK')) {
      return 'zh-TW';
    }
    return 'zh-CN';
  }

  // Match by prefix
  const prefix = browserLang.split('-')[0];
  const match = SUPPORTED_LOCALES.find(l => l === prefix || l.startsWith(prefix + '-'));
  if (match) return match;

  return 'en';
}

export function saveLocale(locale: Locale): void {
  if (typeof window !== 'undefined') {
    localStorage.setItem('unmarklm-locale', locale);
  }
}

// Translation dictionary type
export type TranslationDict = Record<string, string>;

// Lazy-loaded translations cache
const translationsCache: Partial<Record<Locale, TranslationDict>> = {};

export async function loadTranslations(locale: Locale): Promise<TranslationDict> {
  if (translationsCache[locale]) {
    return translationsCache[locale]!;
  }
  
  try {
    const mod = await import(`@/locales/${locale}.json`);
    const dict = mod.default as TranslationDict;
    translationsCache[locale] = dict;
    return dict;
  } catch {
    // Fallback to English
    if (locale !== 'en') {
      return loadTranslations('en');
    }
    return {};
  }
}

// Simple interpolation: t('hello {name}', { name: 'World' })
export function interpolate(text: string, vars?: Record<string, string | number>): string {
  if (!vars) return text;
  return text.replace(/\{(\w+)\}/g, (_, key) => String(vars[key] ?? `{${key}}`));
}
