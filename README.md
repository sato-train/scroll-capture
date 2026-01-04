# scroll-capture

Playwright でページをスクロールしながらキャプチャし、`sharp` で縦結合するツールです。ESM で動作します。

## 使い方
- インストール: `npm ci`（初回のみ）
- キャプチャ: `npm run capture -- [--hide-fixed] [--delay ms] [--overlap ratio] [--max-shots n] <URL>` （`https://` などスキーム省略時は自動で `https://` を付与）
  - npm scripts は `--` 以降が引数になる。クエリに `&` がある場合も `-- "https://example.com?a=1&b=2"` のように `--` と二重引用符で渡せばOK。`cmd.exe` でうまくいかない場合は `set "CAPTURE_URL=...&..."` → `npm run capture --` のように環境変数経由で渡せます。
  - `--hide-fixed` : position: fixed / sticky の要素を一時的に非表示にして撮影
  - `--delay` : スクロール後の待機ms（デフォルト 400）
  - `--overlap` : スクロール時の重複率（0以上1未満、0.1=10%重複。デフォルト 0.1）
  - `--max-shots` : 撮影枚数の上限（デフォルト 500）
- 結合: `npm run stitch`

生成物は `shots/` に連番PNG、結合画像は `stitched.png` に出力されます。
