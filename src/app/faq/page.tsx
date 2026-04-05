'use client';

import { useState } from 'react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { useI18n } from '@/hooks/useI18n';

export default function FAQPage() {
  const { t, ready } = useI18n();
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  const toggleOpen = (index: number) => {
    setOpenIndex((prev) => (prev === index ? null : index));
  };

  if (!ready) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-2 border-gray-200 border-t-blue-600 rounded-full" />
      </div>
    );
  }

  const faqs = [
    { q: t('faq.q1'), a: t('faq.a1') },
    { q: t('faq.q2'), a: t('faq.a2') },
    { q: t('faq.q3'), a: t('faq.a3') },
    { q: t('faq.q4'), a: t('faq.a4') },
    { q: t('faq.q5'), a: t('faq.a5') },
    { q: t('faq.q6'), a: t('faq.a6') },
    { q: t('faq.q7'), a: t('faq.a7') },
    { q: t('faq.q8'), a: t('faq.a8') },
    { q: t('faq.q9'), a: t('faq.a9') },
    { q: t('faq.q10'), a: t('faq.a10') },
    { q: t('faq.q11'), a: t('faq.a11') },
    { q: t('faq.q12'), a: t('faq.a12') },
    { q: t('faq.q13'), a: t('faq.a13') },
    { q: t('faq.q14'), a: t('faq.a14') },
    { q: t('faq.q15'), a: t('faq.a15') },
    { q: t('faq.q16'), a: t('faq.a16') },
  ];

  return (
    <>
      <Header />
      <main className="flex-1 max-w-5xl mx-auto px-4 py-16 overflow-x-hidden">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-8">
          {t('faq.title')}
        </h1>
        <div className="space-y-6 w-full">
          {faqs.map((faq, idx) => (
            <div key={idx} className="w-full min-w-0 bg-gray-50 dark:bg-gray-900 rounded-xl border border-gray-100 dark:border-gray-800 overflow-hidden">
              <button
                type="button"
                onClick={() => toggleOpen(idx)}
                className="w-full min-w-0 flex items-center justify-between cursor-pointer px-6 py-4 text-gray-900 dark:text-white font-medium hover:bg-gray-100 dark:hover:bg-gray-800/50 transition-colors"
                aria-expanded={openIndex === idx}
              >
                <span className="min-w-0 break-words pr-2 text-left">{faq.q}</span>
                <svg className={`w-5 h-5 text-gray-400 transition-transform flex-shrink-0 ml-4 ${openIndex === idx ? 'rotate-180' : ''}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                  <path d="M6 9l6 6 6-6" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </button>
              <div className={`grid transition-[grid-template-rows] duration-200 ease-out ${openIndex === idx ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]'}`}>
                <div className="overflow-hidden min-w-0">
                  <div className="px-6 pb-4 text-gray-600 dark:text-gray-400 text-sm leading-relaxed break-words [overflow-wrap:anywhere]">
                    {faq.a}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </main>
      <Footer />
    </>
  );
}
