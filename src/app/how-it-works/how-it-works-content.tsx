'use client';

import Link from 'next/link';
import Script from 'next/script';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { useI18n } from '@/hooks/useI18n';

export default function HowItWorksContent() {
  const { t, ready } = useI18n();
  const steps = [t('howItWorks.steps.1'), t('howItWorks.steps.2'), t('howItWorks.steps.3'), t('howItWorks.steps.4')];

  if (!ready) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-2 border-gray-200 border-t-blue-600 rounded-full" />
      </div>
    );
  }

  const howToSchema = {
    '@context': 'https://schema.org',
    '@type': 'HowTo',
    name: t('howItWorks.schema.name'),
    description: t('howItWorks.schema.description'),
    totalTime: 'PT1M',
    step: [
      {
        '@type': 'HowToStep',
        position: 1,
        name: t('howItWorks.schema.step1Name'),
        text: t('howItWorks.steps.1'),
      },
      {
        '@type': 'HowToStep',
        position: 2,
        name: t('howItWorks.schema.step2Name'),
        text: t('howItWorks.steps.2'),
      },
      {
        '@type': 'HowToStep',
        position: 3,
        name: t('howItWorks.schema.step3Name'),
        text: t('howItWorks.steps.3'),
      },
      {
        '@type': 'HowToStep',
        position: 4,
        name: t('howItWorks.schema.step4Name'),
        text: t('howItWorks.steps.4'),
      },
    ],
  };

  return (
    <>
      <Header />
      <main className="flex-1 max-w-3xl mx-auto px-4 py-16">
        <article className="space-y-10">
          <header>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
              {t('howItWorks.title')}
            </h1>
            <p className="text-gray-600 dark:text-gray-400 leading-relaxed">
              {t('howItWorks.intro')}
            </p>
          </header>

          <section aria-labelledby="steps-heading">
            <h2 id="steps-heading" className="text-2xl font-bold text-gray-900 dark:text-white mt-12 mb-4">
              {t('howItWorks.steps.title')}
            </h2>
            <ol className="space-y-4 text-gray-700 dark:text-gray-300 leading-relaxed">
              {steps.map((step, idx) => (
                <li
                  key={idx}
                  className="bg-gray-50 dark:bg-gray-900 rounded-xl border border-gray-100 dark:border-gray-800 px-6 py-4"
                >
                  <span className="font-semibold text-gray-900 dark:text-white mr-2">{idx + 1}.</span>
                  {step}
                </li>
              ))}
            </ol>
          </section>

          <section className="flex justify-center mt-12">
            <Link
              href="/"
              className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-xl transition-colors"
            >
              Remove your watermark now
            </Link>
          </section>

          <section aria-labelledby="why-heading" className="space-y-3 mb-16">
            <h2 id="why-heading" className="text-2xl font-bold text-gray-900 dark:text-white mt-12 mb-4">
              {t('howItWorks.why.title')}
            </h2>
            <p className="text-gray-600 dark:text-gray-400 leading-relaxed">{t('howItWorks.why.p1')}</p>
            <p className="text-gray-600 dark:text-gray-400 leading-relaxed">{t('howItWorks.why.p2')}</p>
          </section>
        </article>
      </main>
      <Script
        id="how-to-ld-json"
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(howToSchema) }}
      />
      <Footer />
    </>
  );
}
