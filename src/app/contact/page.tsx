'use client';

import React, { useState } from 'react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { useI18n } from '@/hooks/useI18n';

export default function ContactPage() {
  const { t, ready } = useI18n();
  const [sent, setSent] = useState(false);
  const contactEmail = 'daesrock.3707@gmail.com';

  if (!ready) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-2 border-gray-200 border-t-blue-600 rounded-full" />
      </div>
    );
  }

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    const form = new FormData(e.currentTarget);
    const name = String(form.get('name') || '').trim();
    const email = String(form.get('email') || '').trim();
    const subject = String(form.get('subject') || '').trim();
    const message = String(form.get('message') || '').trim();

    const fullSubject = encodeURIComponent(subject || 'UnMarkLM Contact');
    const body = encodeURIComponent(
      `Name: ${name}\nEmail: ${email}\n\nMessage:\n${message}`
    );

    window.location.href = `mailto:${contactEmail}?subject=${fullSubject}&body=${body}`;
    setSent(true);
  };

  return (
    <>
      <Header />
      <main className="flex-1 max-w-2xl mx-auto px-4 py-16">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
          {t('contact.title')}
        </h1>
        <p className="text-gray-600 dark:text-gray-400 mb-10">
          {t('contact.subtitle')}
        </p>

        {sent ? (
          <div className="bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-800 rounded-xl p-6 text-center">
            <svg className="w-12 h-12 text-green-600 dark:text-green-400 mx-auto mb-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
              <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            <p className="text-green-800 dark:text-green-200 font-medium">Thank you for your message!</p>
            <p className="text-green-600 dark:text-green-400 text-sm mt-1">{t('contact.response')}</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                {t('contact.name')}
              </label>
              <input
                type="text"
                name="name"
                required
                placeholder={t('contact.name.placeholder')}
                className="w-full px-4 py-2.5 rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                {t('contact.email')}
              </label>
              <input
                type="email"
                name="email"
                required
                placeholder={t('contact.email.placeholder')}
                className="w-full px-4 py-2.5 rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                {t('contact.subject')}
              </label>
              <input
                type="text"
                name="subject"
                required
                placeholder={t('contact.subject.placeholder')}
                className="w-full px-4 py-2.5 rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                {t('contact.message')}
              </label>
              <textarea
                name="message"
                required
                rows={5}
                placeholder={t('contact.message.placeholder')}
                className="w-full px-4 py-2.5 rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all resize-none"
              />
            </div>
            <button
              type="submit"
              className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-xl transition-colors"
            >
              {t('contact.send')}
            </button>
          </form>
        )}

        <div className="mt-10 text-center">
          <p className="text-sm text-gray-500 dark:text-gray-400">
            {t('contact.info')}
          </p>
          <a href={`mailto:${contactEmail}`} className="text-blue-600 dark:text-blue-400 hover:underline text-sm mt-1 inline-block mr-4">
            {contactEmail}
          </a>
          <a href="https://github.com/Daesrock/UnMarkLM/issues" target="_blank" rel="noopener noreferrer" className="text-blue-600 dark:text-blue-400 hover:underline text-sm mt-1 inline-block">
            GitHub Issues
          </a>
        </div>
      </main>
      <Footer />
    </>
  );
}
