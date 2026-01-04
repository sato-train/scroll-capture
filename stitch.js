// stitch.js
import fs from "fs";
import path from "path";
import sharp from "sharp";

const inDir = path.resolve("shots");
const outFile = path.resolve("stitched.png");

const files = fs
  .readdirSync(inDir)
  .filter((f) => f.toLowerCase().endsWith(".png"))
  .sort();

if (files.length === 0) {
  console.error("No screenshots found in shots/");
  process.exit(1);
}

(async () => {
  // まず各画像のサイズを集める
  const metas = [];
  for (const f of files) {
    const p = path.join(inDir, f);
    const meta = await sharp(p).metadata();
    metas.push({ file: p, width: meta.width, height: meta.height });
  }

  const width = Math.max(...metas.map((m) => m.width));
  const height = metas.reduce((sum, m) => sum + m.height, 0);

  // 真っ白キャンバス
  let canvas = sharp({
    create: { width, height, channels: 4, background: { r: 255, g: 255, b: 255, alpha: 1 } },
  });

  // 上から順に貼り付け
  let top = 0;
  const composites = [];
  for (const m of metas) {
    composites.push({ input: m.file, top, left: 0 });
    top += m.height;
  }

  await canvas.composite(composites).png().toFile(outFile);
  console.log(`Stitched -> ${outFile}`);
})();
