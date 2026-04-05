# removerMark

**Remove NotebookLM watermarks from infographics, slide decks, and PDFs.**

100% free. 100% private. Your files never leave your device.

🌐 **[removerMark.com](https://removermark.com)**

---

## Features

- **100% Client-Side** — All processing happens in your browser. No files are uploaded to any server.
- **Automatic Smart Removal** — Reconstructs the watermark area using surrounding pixels (gradient interpolation).
- **Before/After Preview** — Interactive slider to compare original and cleaned versions before downloading.
- **Multiple Formats** — Supports PDF slide decks, PNG infographics, and JPG images.
- **Batch Processing** — Upload multiple files and process them all at once. Download as ZIP.
- **13 Languages** — English, Spanish, Chinese (Simplified/Traditional), Japanese, German, French, Arabic, Portuguese, Indonesian, Korean, Vietnamese, Russian.
- **Dark Mode** — Light/dark theme toggle with localStorage persistence.
- **Mobile Responsive** — Works on smartphones and tablets.
- **Zero Dependencies for Processing** — Pure Canvas API watermark removal, no heavy WASM or external libraries needed.

## Tech Stack

- **Next.js 16** (App Router) with static export
- **React 19** + **TypeScript**
- **Tailwind CSS v4**
- **pdfjs-dist** — PDF rendering
- **pdf-lib** — PDF reconstruction
- **JSZip** — ZIP file generation for batch downloads
- **Vitest** — Tests

## Getting Started

```bash
# Install dependencies
npm install

# Run development server
npm run dev

# Build for production
npm run build

# Run tests
npm test
```

## Project Structure

```
src/
├── app/                   # Next.js App Router pages
│   ├── layout.tsx         # Root layout with providers
│   ├── page.tsx           # Main page (drop zone, preview, download)
│   ├── providers.tsx      # Theme + i18n context providers
│   ├── globals.css        # Tailwind + dark mode config
│   ├── faq/page.tsx       # FAQ page
│   ├── privacy/page.tsx   # Privacy Policy page
│   ├── terms/page.tsx     # Terms of Service page
│   └── contact/page.tsx   # Contact page
├── components/
│   ├── Header.tsx         # Sticky header with nav, language selector, theme toggle
│   ├── Footer.tsx         # Footer with links and disclaimer
│   ├── DropZone.tsx       # Drag-and-drop file upload
│   ├── BeforeAfterSlider.tsx  # Interactive before/after comparison
│   └── FileResults.tsx    # Processing progress + download
├── hooks/
│   ├── useI18n.tsx        # i18n React Context provider
│   └── useTheme.tsx       # Theme React Context provider
├── lib/
│   ├── i18n.ts            # i18n system (locale detection, loading, interpolation)
│   ├── watermark-remover.ts   # Core engine (detect, smartFill, crop)
│   ├── pdf-processor.ts   # PDF rendering + rebuilding
│   └── image-processor.ts # PNG/JPG processing wrapper
├── locales/               # 13 translation files (JSON)
│   ├── en.json, es.json, zh-CN.json, zh-TW.json, ja.json,
│   ├── de.json, fr.json, ar.json, pt.json, id.json,
│   ├── ko.json, vi.json, ru.json
└── __tests__/             # Vitest tests
    ├── setup.ts
    ├── i18n.test.ts
    ├── watermark-remover.test.ts
    └── image-processor.test.ts
```

## How It Works

1. **Watermark Detection** — Uses known NotebookLM watermark positioning (bottom-right corner) based on image dimensions (infographic vs slide deck vs fallback).
2. **Smart Removal** — Interpolates background from above/below the watermark and selectively replaces only watermark-affected pixels to avoid visible rectangles on gradients.
3. **PDF Pipeline** — Renders each page via pdf.js (local worker) → applies watermark removal → reconstructs PDF with pdf-lib.

## Deployment

The project is configured for static export (`output: 'export'`), making it deployable to:

- **Vercel** (recommended)
- Netlify
- GitHub Pages
- Any static hosting

```bash
npm run build
# Output in `out/` directory
```

## Disclaimer

**removerMark is not affiliated with, endorsed by, or associated with Google LLC or NotebookLM.**

Users are responsible for ensuring their use complies with applicable terms of service and laws.

## License

MIT — see [LICENSE](LICENSE)
