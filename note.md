git init
git add .
git commit -m "init: scroll capture tool"
git remote add origin https://github.com/sato-train/scroll-capture.git
git branch -M main
git push -u origin main

# npm run capture examples
npm run capture -- "https://www.river.go.jp/kawabou/pc/tm?zm=13&clat=35.589261111&clon=139.665769444"
npm run capture -- --hide-fixed --delay 500 "https://example.com/search?q=playwright&lang=ja"
:: cmd.exe でも引用符でOK（-- を付けること）
npm run capture -- "https://www.river.go.jp/kawabou/pc/tm?zm=13&clat=35.589261111&clon=139.665769444"
:: via env var (cmd) - recommended when & causes issues
set "CAPTURE_URL=https://www.river.go.jp/kawabou/pc/tm?zm=13&clat=35.589261111&clon=139.665769444"
npm run capture --
