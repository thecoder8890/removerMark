import '@testing-library/jest-dom/vitest';
import sharp from 'sharp';
import fs from 'fs';
import path from 'path';
import { beforeAll } from 'vitest';

const EXAMPLES_DIR = path.resolve(__dirname, '../../examples');

beforeAll(async () => {
  if (!fs.existsSync(EXAMPLES_DIR)) {
    fs.mkdirSync(EXAMPLES_DIR, { recursive: true });
  }

  const imageNumbers = Array.from({ length: 6 }, (_, i) => i + 1);

  for (const imageNumber of imageNumbers) {
    const filePath = path.join(EXAMPLES_DIR, `${imageNumber}.png`);

    if (fs.existsSync(filePath)) continue;

    // Watermark region for 1536x2752: x=1290, y=2708, w=246, h=44
    // (matches detectWatermarkRegion: wmW=round(1536*0.16)=246, wmH=max(44,…)=44)
    // The dark badge is only 30px tall so cloneStamp's bottom reference band
    // (belowY = region.y + region.h - 8 = 2744) stays in clean background.
    await sharp({
      create: {
        width: 1536,
        height: 2752,
        channels: 3,
        background: { r: 248, g: 248, b: 246 },
      },
    })
      .composite([
        {
          input: Buffer.from(
            `<svg width="1536" height="2752">` +
              `<rect x="1290" y="2708" width="246" height="30" fill="#1a1a1a" opacity="0.4"/>` +
              `</svg>`
          ),
          top: 0,
          left: 0,
        },
      ])
      .png()
      .toFile(filePath);
  }
});
