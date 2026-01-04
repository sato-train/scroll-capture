// capture.js
import fs from "fs";
import path from "path";
import { chromium } from "playwright";

const args = process.argv.slice(2);
let hideFixed = false;
let inputUrl;
let delayMs = 400;
let overlap = 0.1; // overlap ratio of viewport (0-<1)
let maxShots = 500;

for (let i = 0; i < args.length; i++) {
  const arg = args[i];
  if (arg === "--hide-fixed") {
    hideFixed = true;
  } else if (arg === "--delay") {
    delayMs = Number(args[i + 1]);
    i++;
  } else if (arg === "--overlap") {
    overlap = Number(args[i + 1]);
    i++;
  } else if (arg === "--max-shots") {
    maxShots = Number(args[i + 1]);
    i++;
  } else if (!inputUrl) {
    inputUrl = arg;
  } else {
    console.error(`Unknown argument: ${arg}`);
    process.exit(1);
  }
}

// fallback: accept URL from env var (helps on Windows cmd with &)
if (!inputUrl) inputUrl = process.env.CAPTURE_URL || process.env.URL;

if (!inputUrl) {
  console.error("Usage: npm run capture -- [--hide-fixed] [--delay ms] [--overlap ratio] [--max-shots n] <URL>");
  console.error("   or: node src/capture.js [--hide-fixed] [--delay ms] [--overlap ratio] [--max-shots n] <URL>");
  console.error("   or: set CAPTURE_URL=<URL> && npm run capture --");
  process.exit(1);
}

if (!Number.isFinite(delayMs) || delayMs < 0) {
  console.error("Invalid --delay (ms must be >= 0)");
  process.exit(1);
}

if (!Number.isFinite(overlap) || overlap < 0 || overlap >= 1) {
  console.error("Invalid --overlap (ratio must be 0 <= x < 1, e.g. 0.1 for 10%)");
  process.exit(1);
}

if (!Number.isInteger(maxShots) || maxShots <= 0) {
  console.error("Invalid --max-shots (must be a positive integer)");
  process.exit(1);
}

// URLを検証し、スキーム省略時は https:// を補完する
const normalizeUrl = (raw) => {
  try {
    new URL(raw);
    return raw;
  } catch {
    try {
      const prefixed = `https://${raw}`;
      new URL(prefixed);
      return prefixed;
    } catch {
      console.error(`Invalid URL: ${raw}`);
      process.exit(1);
    }
  }
};

const url = normalizeUrl(inputUrl);

const outDir = path.resolve("shots");
fs.mkdirSync(outDir, { recursive: true });

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({
    viewport: { width: 1280, height: 720 },
    deviceScaleFactor: 1,
  });

  await page.goto(url, { waitUntil: "networkidle" });

  if (hideFixed) {
    await page.addStyleTag({
      content: `
        /* Hide common fixed/sticky bars while capturing */
        [style*="position:fixed"],
        [style*="position: fixed"],
        [style*="position:sticky"],
        [style*="position: sticky"],
        [class*="sticky"],
        [class*="fixed"],
        header,
        nav {
          visibility: hidden !important;
          pointer-events: none !important;
        }
      `,
    });
  }

  // ページの高さ・ビューポート高さ
  const viewportH = page.viewportSize().height;
  const scrollStep = Math.max(1, Math.floor(viewportH * (1 - overlap)));

  // 無限スクロールも想定して「高さが伸びなくなるまで」ループ
  let lastHeight = 0;
  let stableCount = 0;

  let i = 0;
  while (true) {
    // 可視領域を撮影
    const filename = path.join(outDir, String(i).padStart(4, "0") + ".png");
    await page.screenshot({ path: filename });
    i++;

    if (i >= maxShots) break;

    // 下へスクロール（重複率 overlap を適用）
    await page.evaluate((dy) => window.scrollBy(0, dy), scrollStep);

    // lazy load待ち
    await sleep(delayMs);

    // 高さが伸びているかチェック（無限スクロール対策）
    const newHeight = await page.evaluate(() => document.documentElement.scrollHeight);
    if (newHeight === lastHeight) stableCount++;
    else stableCount = 0;

    lastHeight = newHeight;

    // もう下まで行ったっぽい判定：スクロールが進まない or 高さが変わらない状態が続く
    const atBottom = await page.evaluate(() => {
      const y = window.scrollY + window.innerHeight;
      const h = document.documentElement.scrollHeight;
      return y >= h - 2;
    });

    if (atBottom && stableCount >= 3) break;
  }

  await browser.close();
  console.log(`Saved ${i} screenshots to ${outDir}`);
})();
