/**
 * debug-detection.mjs
 *
 * Development utility: processes every image in /examples/ and saves a copy
 * to /debug-output/ with a red rectangle drawn over the detected watermark region.
 *
 * Usage:
 *   npm run debug:detection
 *
 * Place NotebookLM exported images (PNG/JPG) inside the /examples/ folder.
 * Results land in /debug-output/ — that folder is git-ignored.
 */

import sharp from "sharp";
import { readdir, mkdir, access } from "fs/promises";
import { join, extname, basename } from "path";
import { fileURLToPath } from "url";

const __dirname = fileURLToPath(new URL(".", import.meta.url));
const ROOT = join(__dirname, "..");
const EXAMPLES_DIR = join(ROOT, "examples");
const OUTPUT_DIR = join(ROOT, "debug-output");

// ---------------------------------------------------------------------------
// Detection logic (mirrors notebooklm-detector.ts)
// ---------------------------------------------------------------------------

const DEFAULT_BADGE_WIDTH = 200;
const DEFAULT_IMAGE_WIDTH = 1536;
const DEFAULT_IMAGE_HEIGHT = 2752;
const DEFAULT_HORIZONTAL_IMAGE_WIDTH = 2752;
const DEFAULT_HORIZONTAL_IMAGE_HEIGHT = 1536;
const WIDTH_PERCENTAGE = 0.16;
const MIN_HEIGHT_PIXELS = 44;
const HEIGHT_PERCENTAGE = 0.009;

// Calibrated fixed pixel size for the badge (same on portrait and landscape).
const BADGE_REGION_WIDTH = DEFAULT_BADGE_WIDTH + 16; // 216: badge + 16px left padding
const BADGE_REGION_HEIGHT = MIN_HEIGHT_PIXELS; // 44

function anchorRegion(width, height) {
  const wmW = Math.round(width * WIDTH_PERCENTAGE);
  const wmH = Math.max(
    MIN_HEIGHT_PIXELS,
    Math.round(height * HEIGHT_PERCENTAGE),
  );
  return { x: width - wmW, y: height - wmH, width: wmW, height: wmH };
}

function fallbackPreciseRegion(width, height) {
  const a = anchorRegion(width, height);
  const extraTop = Math.round(height * 0.003);
  const newY = Math.max(0, a.y - extraTop);
  return { x: a.x, y: newY, width: a.width, height: height - newY };
}

function sampleRegionAvgLuma(data, imageWidth, rx, ry, rw, rh) {
  let sum = 0,
    count = 0;
  for (let py = Math.max(0, ry); py < ry + rh; py++) {
    for (let px = Math.max(0, rx); px < rx + rw; px++) {
      const idx = (py * imageWidth + px) * 4;
      if (idx + 2 < data.length) {
        sum += (data[idx] + data[idx + 1] + data[idx + 2]) / 3;
        count++;
      }
    }
  }
  return count > 0 ? sum / count : 0;
}

function isNoisyBackground(data, width, anchor) {
  const probeH = 16;
  const probeY = Math.max(0, anchor.y - probeH);
  const actualH = anchor.y - probeY;
  if (actualH <= 0) return false;

  const lumas = [];
  for (let py = probeY; py < anchor.y; py++) {
    for (let px = anchor.x; px < anchor.x + anchor.width; px += 2) {
      const idx = (py * width + px) * 4;
      lumas.push(
        0.299 * data[idx] + 0.587 * data[idx + 1] + 0.114 * data[idx + 2],
      );
    }
  }
  if (lumas.length < 4) return false;

  const mean = lumas.reduce((a, b) => a + b, 0) / lumas.length;
  const variance =
    lumas.reduce((s, v) => s + (v - mean) ** 2, 0) / lumas.length;

  let edgeCount = 0;
  const totalPx = actualH * (anchor.width - 2);
  for (let py = probeY; py < anchor.y; py++) {
    for (let px = anchor.x + 1; px < anchor.x + anchor.width - 1; px++) {
      const idx = (py * width + px) * 4;
      const idxL = (py * width + px - 1) * 4;
      const diff =
        Math.abs(data[idx] - data[idxL]) +
        Math.abs(data[idx + 1] - data[idxL + 1]) +
        Math.abs(data[idx + 2] - data[idxL + 2]);
      if (diff > 30) edgeCount++;
    }
  }
  const edgeDensity = edgeCount / Math.max(1, totalPx);
  return variance > 300 || edgeDensity > 0.08;
}

function detectContourRegion(data, width, height, anchor) {
  const vScanY = Math.max(0, anchor.y - 20);
  const vScanLeft = anchor.x;
  const vScanW = width - vScanLeft;
  if (vScanW <= 0) return null;

  const rowLumas = [];
  for (let py = vScanY; py < height; py++) {
    let sum = 0;
    for (let px = vScanLeft; px < width; px++) {
      const idx = (py * width + px) * 4;
      sum += (data[idx] + data[idx + 1] + data[idx + 2]) / 3;
    }
    rowLumas.push(sum / vScanW);
  }

  let maxRowGrad = 0,
    peakRowOffset = -1;
  for (let i = 1; i < rowLumas.length; i++) {
    const g = Math.abs(rowLumas[i] - rowLumas[i - 1]);
    if (g > maxRowGrad) {
      maxRowGrad = g;
      peakRowOffset = i;
    }
  }
  if (maxRowGrad < 5 || peakRowOffset < 0) return null;
  const badgeTopY = vScanY + peakRowOffset;

  const hScanLeft = Math.max(0, anchor.x - 60);
  const hScanH = Math.max(1, height - badgeTopY);
  const colLumas = [];
  for (let px = hScanLeft; px < width; px++) {
    let sum = 0;
    for (let py = badgeTopY; py < height; py++) {
      const idx = (py * width + px) * 4;
      sum += (data[idx] + data[idx + 1] + data[idx + 2]) / 3;
    }
    colLumas.push(sum / hScanH);
  }

  let maxColGrad = 0,
    peakColOffset = 0;
  for (let i = 1; i < colLumas.length; i++) {
    const g = Math.abs(colLumas[i] - colLumas[i - 1]);
    if (g > maxColGrad) {
      maxColGrad = g;
      peakColOffset = i;
    }
  }

  const badgeLeftX = maxColGrad >= 5 ? hScanLeft + peakColOffset : anchor.x;
  return {
    x: Math.max(0, badgeLeftX),
    y: Math.max(0, badgeTopY),
    width: Math.max(1, width - badgeLeftX),
    height: Math.max(1, height - badgeTopY),
  };
}

/**
 * Main detection function — mirrors detectFromRgbaData in notebooklm-detector.ts.
 * Returns { region, method } where method describes how the region was found.
 */
function detectRegion(data, width, height) {
  // Known default resolutions: fixed position, no pixel analysis needed
  const isPortrait =
    width === DEFAULT_IMAGE_WIDTH && height === DEFAULT_IMAGE_HEIGHT;
  const isLandscape =
    width === DEFAULT_HORIZONTAL_IMAGE_WIDTH &&
    height === DEFAULT_HORIZONTAL_IMAGE_HEIGHT;

  if (isPortrait || isLandscape) {
    return {
      region: {
        x: width - BADGE_REGION_WIDTH,
        y: height - BADGE_REGION_HEIGHT,
        width: BADGE_REGION_WIDTH,
        height: BADGE_REGION_HEIGHT,
      },
      method: "fixed (default resolution)",
    };
  }

  const anchor = anchorRegion(width, height);
  const fallback = fallbackPreciseRegion(width, height);

  if (isNoisyBackground(data, width, anchor)) {
    const DEFAULT_BADGE_HEIGHT = 20;
    const targetH = Math.min(fallback.height, DEFAULT_BADGE_HEIGHT + 16);
    return {
      region: {
        x: fallback.x,
        y: height - targetH,
        width: fallback.width,
        height: targetH,
      },
      method: "noisy background → trimmed fallback",
    };
  }

  const contour = detectContourRegion(data, width, height, anchor);
  if (contour) {
    const refined = { ...contour };
    const maxLeftReach = Math.max(0, refined.x - anchor.x);
    if (maxLeftReach > 10) {
      const probeW = Math.min(84, maxLeftReach);
      const probeX = Math.max(0, refined.x - probeW);
      const probeY = Math.max(0, refined.y - 12);
      const probeH = Math.max(
        8,
        Math.min(height - probeY, refined.height + 12),
      );
      const probeLuma = sampleRegionAvgLuma(
        data,
        width,
        probeX,
        probeY,
        probeW,
        probeH,
      );
      const bgLuma = sampleRegionAvgLuma(
        data,
        width,
        probeX,
        Math.max(0, probeY - 16),
        probeW,
        Math.min(16, probeY),
      );
      if (Math.abs(probeLuma - bgLuma) > 10) {
        refined.width += refined.x - probeX;
        refined.x = probeX;
      }
    }
    return { region: refined, method: "edge detection (contour)" };
  }

  return { region: fallback, method: "proportional fallback" };
}

// ---------------------------------------------------------------------------
// Script entry point
// ---------------------------------------------------------------------------

async function ensureDir(dir) {
  try {
    await access(dir);
  } catch {
    await mkdir(dir, { recursive: true });
  }
}

async function processImage(inputPath, outputPath) {
  const img = sharp(inputPath);
  const { width, height, format } = await img.metadata();

  // Get raw RGBA data for pixel-based detection
  const rawBuffer = await img.clone().ensureAlpha().raw().toBuffer();
  const data = new Uint8ClampedArray(
    rawBuffer.buffer,
    rawBuffer.byteOffset,
    rawBuffer.byteLength,
  );

  const { region, method } = detectRegion(data, width, height);

  console.log(`  ${width}×${height} | method: ${method}`);
  console.log(
    `  region: x=${region.x} y=${region.y} w=${region.width} h=${region.height}`,
  );

  // Draw red rectangle as SVG overlay
  const BORDER = 3;
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}">
  <rect
    x="${region.x + BORDER / 2}"
    y="${region.y + BORDER / 2}"
    width="${region.width - BORDER}"
    height="${region.height - BORDER}"
    fill="rgba(255,0,0,0.15)"
    stroke="red"
    stroke-width="${BORDER}"
  />
  <text
    x="${region.x + 4}"
    y="${region.y - 6}"
    font-family="monospace"
    font-size="14"
    fill="red"
  >${method} — ${region.width}×${region.height} @ (${region.x},${region.y})</text>
</svg>`;

  await sharp(inputPath)
    .composite([{ input: Buffer.from(svg), gravity: "northwest" }])
    .toFile(outputPath);
}

async function main() {
  await ensureDir(EXAMPLES_DIR);
  await ensureDir(OUTPUT_DIR);

  let files;
  try {
    files = await readdir(EXAMPLES_DIR);
  } catch {
    console.error(`Could not read examples/ folder.`);
    process.exit(1);
  }

  const images = files.filter((f) => /\.(png|jpe?g)$/i.test(f));

  if (images.length === 0) {
    console.log("No images found in examples/");
    console.log(
      "Add NotebookLM exported PNG/JPG files to the examples/ folder and re-run.",
    );
    return;
  }

  console.log(`Found ${images.length} image(s) in examples/\n`);

  for (const file of images) {
    const inputPath = join(EXAMPLES_DIR, file);
    const outputName = basename(file, extname(file)) + "_debug.png";
    const outputPath = join(OUTPUT_DIR, outputName);
    console.log(`Processing: ${file}`);
    try {
      await processImage(inputPath, outputPath);
      console.log(`  → saved: debug-output/${outputName}\n`);
    } catch (err) {
      console.error(`  Error processing ${file}:`, err.message, "\n");
    }
  }

  console.log("Done. Check the debug-output/ folder.");
}

main();
