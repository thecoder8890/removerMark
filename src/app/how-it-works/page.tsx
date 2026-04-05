import type { Metadata } from 'next';
import HowItWorksContent from './how-it-works-content';

export const metadata: Metadata = {
  title: 'How to Remove a NotebookLM Watermark — Step by Step | UnMarkLM',
  description:
    'Learn how to remove the NotebookLM watermark from infographics, PDFs, and slide decks in seconds. Free, private, no uploads required.',
  alternates: { canonical: '/how-it-works' },
};

export default function HowItWorksPage() {
  return <HowItWorksContent />;
}
