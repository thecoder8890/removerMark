import type { Metadata } from "next";
import { Geist, Space_Grotesk } from "next/font/google";
import Script from "next/script";
import "./globals.css";
import { Providers } from "./providers";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const displayFont = Space_Grotesk({
  variable: "--font-space-grotesk",
  subsets: ["latin"],
});

const isVercelAppHost = (process.env.VERCEL_URL ?? "").includes("vercel.app");

export const metadata: Metadata = {
  metadataBase: new URL("https://removermark.com"),
  title: "removerMark — Remove NotebookLM Watermarks",
  description:
    "Free online tool to remove NotebookLM watermarks from infographics, slide decks, and PDFs. 100% client-side, no uploads.",
  alternates: {
    canonical: "/",
  },
  robots: isVercelAppHost
    ? {
        index: false,
        follow: false,
        googleBot: {
          index: false,
          follow: false,
        },
      }
    : {
        index: true,
        follow: true,
        googleBot: {
          index: true,
          follow: true,
          "max-image-preview": "large",
          "max-snippet": -1,
          "max-video-preview": -1,
        },
      },
  icons: {
    icon: [
      { url: '/favicon.ico', sizes: 'any' },
      { url: '/favicon.svg', type: 'image/svg+xml' },
      { url: '/favicon-96x96.png', sizes: '96x96', type: 'image/png' },
    ],
    apple: '/apple-touch-icon.png',
  },
  manifest: '/site.webmanifest',
  keywords: [
    "NotebookLM watermark remover",
    "remove NotebookLM watermark",
    "NotebookLM remover",
    "how to remove NotebookLM watermark",
    "NotebookLM watermark",
    "NotebookLM PDF watermark",
    "NotebookLM infographic watermark",
    "free watermark remover",
    "client-side watermark remover",
    "removerMark",
  ],
  authors: [{ name: "removerMark" }],
  openGraph: {
    title: "removerMark — Remove NotebookLM Watermarks",
    description:
      "Clean your infographics, slide decks, and PDFs instantly. 100% free, 100% private — your files never leave your device.",
    url: "https://removermark.com",
    siteName: "removerMark",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "removerMark — Remove NotebookLM Watermarks",
    description:
      "Clean your infographics, slide decks, and PDFs instantly. 100% free, 100% private.",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${displayFont.variable} antialiased min-h-screen flex flex-col`}
      >
        <Script
          id="ld-json"
          type="application/ld+json"
          strategy="beforeInteractive"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify([
              {
                "@context": "https://schema.org",
                "@type": "WebSite",
                name: "removerMark",
                url: "https://removermark.com/",
                potentialAction: {
                  "@type": "SearchAction",
                  target: "https://removermark.com/?q={search_term_string}",
                  "query-input": "required name=search_term_string",
                },
              },
              {
                "@context": "https://schema.org",
                "@type": "SoftwareApplication",
                name: "removerMark",
                applicationCategory: "MultimediaApplication",
                operatingSystem: "Web",
                url: "https://removermark.com/",
                description:
                  "Free client-side tool to remove the NotebookLM watermark from infographics, PDFs, and slide decks.",
                featureList:
                  "Watermark removal, Batch processing, PDF support, PNG support, JPG support, Before/After preview, Dark mode, 13 languages",
                offers: {
                  "@type": "Offer",
                  price: "0",
                  priceCurrency: "USD",
                },
              },
              {
                "@context": "https://schema.org",
                "@type": "FAQPage",
                mainEntity: [
                  {
                    "@type": "Question",
                    name: "How do I remove a NotebookLM watermark from a PDF?",
                    acceptedAnswer: {
                      "@type": "Answer",
                      text: "Upload your PDF directly to removerMark. The tool automatically detects each page, locates the NotebookLM watermark badge at the bottom-right corner, removes it, and lets you download a clean PDF — all inside your browser with no uploads.",
                    },
                  },
                  {
                    "@type": "Question",
                    name: "Is removerMark free?",
                    acceptedAnswer: {
                      "@type": "Answer",
                      text: "Yes, completely free with no limits. removerMark is open source software.",
                    },
                  },
                  {
                    "@type": "Question",
                    name: "Are my files uploaded to a server?",
                    acceptedAnswer: {
                      "@type": "Answer",
                      text: "No. All processing happens entirely in your browser using JavaScript. Your files never leave your device.",
                    },
                  },
                  {
                    "@type": "Question",
                    name: "What file formats does removerMark support?",
                    acceptedAnswer: {
                      "@type": "Answer",
                      text: "removerMark supports PDF files (slide decks), PNG images (infographics), and JPG/JPEG images from NotebookLM.",
                    },
                  },
                ],
              },
            ]),
          }}
        />
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
