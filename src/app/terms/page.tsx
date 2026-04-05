'use client';

import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { useI18n } from '@/hooks/useI18n';

export default function TermsPage() {
  const { t, ready } = useI18n();

  if (!ready) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-2 border-gray-200 border-t-blue-600 rounded-full" />
      </div>
    );
  }

  const sections = [
    { title: t('terms.acceptance.title'), text: t('terms.acceptance.text') },
    { title: t('terms.service.title'), text: t('terms.service.text') },
    { title: t('terms.responsibility.title'), text: t('terms.responsibility.text') },
    { title: t('terms.disclaimer.title'), text: t('terms.disclaimer.text') },
    { title: t('terms.ip.title'), text: t('terms.ip.text') },
    { title: t('terms.changes.title'), text: t('terms.changes.text') },
  ];

  return (
    <>
      <Header />
      <main className="flex-1 max-w-3xl mx-auto px-4 py-16">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
          {t('terms.title')}
        </h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mb-10">
          {t('terms.lastUpdated', { date: '2026-02-11' })}
        </p>

        <div className="space-y-8">
          {sections.map((section, idx) => (
            <div key={idx}>
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                {section.title}
              </h2>
              <p className="text-gray-600 dark:text-gray-400 leading-relaxed">
                {section.text}
              </p>
            </div>
          ))}
        </div>
      </main>
      <Footer />
    </>
  );
}
