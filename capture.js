// capture.js
import fs from "fs";
import path from "path";
import { chromium } from "playwright";

const url = process.argv[2];
if (!url) {
  console.error("Usage: node capture.js <URL>");
  process.exit(1);
}

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

  // 固定ヘッダが毎回写り込む場合は、必要に応じて非表示（サイトにより調整）
  await page.addStyleTag({
    content: `
      /* 例: ありがちな固定要素を消す（必要なければ削除） */
      header, [style*="position:fixed"], [style*="position: sticky"] { }
    `,
  });

  // ページの高さ・ビューポート高さ
  const viewportH = page.viewportSize().height;

  // 無限スクロールも想定して「高さが伸びなくなるまで」ループ
  let lastHeight = 0;
  let stableCount = 0;

  let i = 0;
  while (true) {
    const doc = await page.evaluate(() => ({
      scrollY: window.scrollY,
      innerH: window.innerHeight,
      scrollH: document.documentElement.scrollHeight,
    }));

    // 可視領域を撮影
    const filename = path.join(outDir, String(i).padStart(4, "0") + ".png");
    await page.screenshot({ path: filename });
    i++;

    // 下へスクロール（重複を減らすなら 0.9倍など）
    await page.evaluate((dy) => window.scrollBy(0, dy), Math.floor(viewportH * 0.9));

    // lazy load待ち
    await sleep(400);

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

    // 保険：無限ループ防止
    if (i > 500) break;
  }

  await browser.close();
  console.log(`Saved ${i} screenshots to ${outDir}`);
})();
