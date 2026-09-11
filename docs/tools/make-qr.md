# make-qr.mjs — QR コードを作る

## 何をするか
公開 URL から、4 つのページへの QR コード PNG を作ります。
出力先: `assets/qr/`

| ファイル | 中身の URL |
|---|---|
| `index.png` | トップ `…/` |
| `marker.png` | デモA `…/marker/` |
| `info.png` | デモB `…/marker/info.html` |
| `plane.png` | デモC `…/plane/` |

印刷用ページ `print/index.html` がこれらの PNG を読み込みます。

## 使い方
```
node tools/make-qr.mjs https://ユーザー名.github.io/リポジトリ名/
```
または環境変数で:
```
SITE_URL=https://ユーザー名.github.io/リポジトリ名/ node tools/make-qr.mjs
```
（Windows PowerShell の場合: `$env:SITE_URL="https://…/"; node tools/make-qr.mjs`）

URL の最後の `/` は無くても補います。URL を渡さないと「使い方」を表示して終了します。

## いつ実行するか
- GitHub Pages で公開した **後**（URL が確定してから）
- 公開 URL が変わったとき

作った PNG は git にコミットして push してください（印刷ページが読みに行きます）。

## 実行しなくても困らない理由
印刷ページは、`assets/qr/*.png` が無い（404）と、**いま開いている URL から JavaScript でその場で QR を描きます**。
なので、手元で `npx serve .` を使って印刷するだけならこのスクリプトは不要です。ただしその場合、QR の中身はローカルの URL（`http://localhost:3000/…`）になるので、会場で配る紙には使えません。会場用は必ず公開 URL で作ってください。

## 設定を変えたいとき
スクリプト内の `QRCode.toFile(...)` のオプション:
- `width: 600` … 画像の大きさ（px）
- `margin: 2` … 周囲の余白
- `errorCorrectionLevel: 'M'` … 誤り訂正の強さ（L < M < Q < H。汚れに強くしたいなら Q や H。QR が細かくなる）
