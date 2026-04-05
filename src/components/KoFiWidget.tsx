'use client';

import Script from 'next/script';
import { useCallback, useEffect, useState } from 'react';
import { useTheme } from '@/hooks/useTheme';

declare global {
  interface Window {
    kofiWidgetOverlay?: {
      draw: (username: string, options: Record<string, string>) => void;
    };
  }
}

const DARK_WIDGET_OPTIONS: Record<string, string> = {
  type: 'floating-chat',
  'floating-chat.position': 'right',
  'floating-chat.donateButton.text': 'Buy me a coffee',
  'floating-chat.donateButton.background-color': '#ffffff',
  'floating-chat.donateButton.text-color': '#323842',
};

const LIGHT_WIDGET_OPTIONS: Record<string, string> = {
  type: 'floating-chat',
  'floating-chat.position': 'right',
  'floating-chat.donateButton.text': 'Buy me a coffee',
  'floating-chat.donateButton.background-color': '#323842',
  'floating-chat.donateButton.text-color': '#fff',
};

function clearExistingKoFiWidgets() {
  const selectors = [
    '#kofi-widget-overlay',
    '[id^="kofi-widget-overlay"]',
    '.floatingchat-container-wrap',
    '.floatingchat-container',
  ];

  selectors.forEach((selector) => {
    document.querySelectorAll(selector).forEach((element) => {
      element.remove();
    });
  });
}

export function KoFiWidget() {
  const { theme } = useTheme();
  const [scriptLoaded, setScriptLoaded] = useState(false);
  const [scriptError, setScriptError] = useState(false);
  const [widgetVisible, setWidgetVisible] = useState(false);
  const [officialInitialized, setOfficialInitialized] = useState(false);
  const [fallbackAllowed, setFallbackAllowed] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  const detectWidget = useCallback(() => {
    const element = document.querySelector(
      '#kofi-widget-overlay, [id^="kofi-widget-overlay"], [id*="kofi"], .floatingchat-container-wrap, .floatingchat-container, iframe[src*="ko-fi.com"], iframe[src*="ko-fi"]',
    );

    setWidgetVisible(Boolean(element));
  }, []);

  const drawWidget = useCallback(() => {
    if (isMobile) {
      clearExistingKoFiWidgets();
      setWidgetVisible(false);
      setOfficialInitialized(false);
      return;
    }

    if (!scriptLoaded || !window.kofiWidgetOverlay) {
      return;
    }

    clearExistingKoFiWidgets();

    const options = theme === 'dark' ? DARK_WIDGET_OPTIONS : LIGHT_WIDGET_OPTIONS;
    window.kofiWidgetOverlay.draw('daesrock', options);
    setOfficialInitialized(true);

    // Patch iframes injected by the Ko-fi script to remove scrollbars
    const patchKofiIframes = () => {
      document
        .querySelectorAll<HTMLIFrameElement>(
          '#kofi-widget-overlay iframe, [id^="kofi-widget-overlay"] iframe, .floatingchat-container-wrap iframe',
        )
        .forEach((iframe) => {
          iframe.scrolling = 'no';
          iframe.style.overflow = 'hidden';
        });
    };

    // Patch once immediately and again after a short delay (iframes may not be ready yet)
    patchKofiIframes();
    window.setTimeout(patchKofiIframes, 300);
    window.setTimeout(patchKofiIframes, 800);

    window.setTimeout(detectWidget, 150);
    window.setTimeout(detectWidget, 600);
  }, [isMobile, scriptLoaded, theme, detectWidget]);

  useEffect(() => {
    const mediaQuery = window.matchMedia('(max-width: 767px)');
    const handleChange = (event: MediaQueryListEvent) => {
      setIsMobile(event.matches);
    };

    setIsMobile(mediaQuery.matches);
    mediaQuery.addEventListener('change', handleChange);

    return () => {
      mediaQuery.removeEventListener('change', handleChange);
    };
  }, []);

  useEffect(() => {
    drawWidget();
  }, [drawWidget]);

  useEffect(() => {
    detectWidget();

    const intervalId = window.setInterval(detectWidget, 400);

    return () => {
      window.clearInterval(intervalId);
    };
  }, [detectWidget]);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      setFallbackAllowed(true);
    }, 2500);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, []);

  const showFallback = !isMobile && fallbackAllowed && (scriptError || (!officialInitialized && !widgetVisible));
  const fallbackClassName =
    theme === 'dark'
      ? 'hidden md:inline-flex fixed bottom-4 right-4 z-[9999] items-center gap-2 rounded-full border border-gray-300 bg-white text-[#323842] px-4 py-2.5 text-sm font-semibold shadow-lg transition-colors hover:bg-gray-100'
      : 'hidden md:inline-flex fixed bottom-4 right-4 z-[9999] items-center gap-2 rounded-full border border-[#323842] bg-[#323842] text-white px-4 py-2.5 text-sm font-semibold shadow-lg transition-colors hover:bg-[#2b313a]';

  return (
    <>
      <Script
        src="https://storage.ko-fi.com/cdn/scripts/overlay-widget.js"
        strategy="afterInteractive"
        onLoad={() => {
          setScriptLoaded(true);
        }}
        onError={() => {
          setScriptError(true);
        }}
      />

      {showFallback ? (
        <a
          href="https://ko-fi.com/daesrock"
          target="_blank"
          rel="noopener noreferrer"
          aria-label="Buy me a coffee on Ko-fi"
          className={fallbackClassName}
        >
          <span className="inline-flex items-center justify-center w-4 h-4 rounded bg-white/95">
            <svg className="w-3 h-3 text-slate-700" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
              <path d="M4 7h11a1 1 0 011 1v4a4 4 0 01-4 4H8a4 4 0 01-4-4V8a1 1 0 011-1z" strokeLinecap="round" strokeLinejoin="round" />
              <path d="M16 9h2a2 2 0 010 4h-2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </span>
          <span>Buy me a coffee</span>
        </a>
      ) : null}
    </>
  );
}
