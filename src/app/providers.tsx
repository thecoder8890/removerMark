'use client';

import { I18nProvider } from '@/hooks/useI18n';
import { ThemeProvider } from '@/hooks/useTheme';
import { KoFiWidget } from '@/components/KoFiWidget';

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider>
      <I18nProvider>
        {children}
        <KoFiWidget />
      </I18nProvider>
    </ThemeProvider>
  );
}
