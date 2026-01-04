# AGENTS.md - scroll-capture

## Goal
- Webページをスクロールしながらスクリーンショットを連番で保存し、最後に縦結合して1枚にする。
- 無限スクロール / lazy load にできるだけ強くする。

## Tech
- Node.js (ESM)
- Playwright
- sharp

## Commands
- Install: npm ci (or npm i)
- Capture: node capture.js <url>
- Stitch:  node stitch.js
- If you add a CLI entry: npm run capture -- <args>

## Coding rules
- 破壊的変更は避け、READMEに使い方を必ず反映する
- オプション追加は後方互換（既存の引数でも動く）
- 画像結合はメモリ消費に注意（可能ならストリーム/タイルも検討）
- 変更後は最低1回、サンプルURLで動作確認する（可能なら）
