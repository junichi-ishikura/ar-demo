# tools/ の一覧と共通の準備

`tools/` には、サイトの表示そのものには不要だけれど、**素材（マーカー・QR・画像・音・動画・usdz）を作るための道具**が入っています。
すべて生成物はリポジトリにコミット済みなので、**素材を作り直したいときだけ**使います。

| ファイル | 何を作るか | 必要なもの | 説明ページ |
|---|---|---|---|
| `make-markers.mjs` | マーカー画像 3 枚（`assets/markers/`） | Node.js、`npm install` | [make-markers.md](make-markers.md) |
| `make-qr.mjs` | QR コード 4 枚（`assets/qr/`） | Node.js、`npm install`、公開 URL | [make-qr.md](make-qr.md) |
| `make-placeholders.mjs` | 仮の写真 3 枚・ポスター・効果音 2 つ | Node.js、`npm install` | [make-placeholders.md](make-placeholders.md) |
| `make-video.mjs` | デモB の動画（`assets/video/aruaru.mp4`） | Node.js、`npm install`、**ffmpeg** | [make-video.md](make-video.md) |
| `make-voice.sh` | セリフ音声（macOS） | macOS 標準の `say`（ffmpeg は任意） | [make-voice.md](make-voice.md) |
| `make-voice.ps1` | セリフ音声（Windows） | Windows 標準の読み上げ（ffmpeg は任意） | [make-voice.md](make-voice.md) |
| `usdz-convert.html` | glb → usdz 変換（iPhone 用） | ブラウザと `npx serve` | [usdz-convert.md](usdz-convert.md) |

## 共通の準備（初回だけ）

### 1. Node.js を入れる
https://nodejs.org/ から **LTS** 版をダウンロードしてインストールします（バージョン 18 以上。実装時は 22 で確認）。
入ったか確認:
```
node -v
npm -v
```
バージョン番号が出れば OK。

### 2. リポジトリのフォルダでパッケージを入れる
ターミナルでリポジトリのフォルダ（`package.json` がある場所）に移動して:
```
npm install
```
`node_modules/` というフォルダができます（git には入りません）。これで `@napi-rs/canvas`（画像を描く部品）と `qrcode`（QR を作る部品）が入ります。

### 3. 実行のしかた
```
node tools/スクリプト名.mjs  引数…
```
どのスクリプトも、**リポジトリのフォルダから**実行してください（出力先はスクリプトの場所から自動で決まるので、別の場所から実行しても壊れませんが、パスの指定が分かりやすいです）。

`package.json` に短縮コマンドも用意しています。
```
npm run markers        # = node tools/make-markers.mjs
npm run placeholders   # = node tools/make-placeholders.mjs
npm run qr -- https://…/   # = node tools/make-qr.mjs https://…/
npm run video          # = node tools/make-video.mjs
```

### 4. ffmpeg（動画・mp3 を作るときだけ）
- macOS: `brew install ffmpeg`
- Windows: `winget install ffmpeg`（または https://ffmpeg.org/ から）
入ったか確認: `ffmpeg -version`

## よくあるつまずき

| 症状 | 原因と対処 |
|---|---|
| `Cannot find module '@napi-rs/canvas'` | `npm install` をしていない。リポジトリのフォルダで実行する |
| `node: command not found` | Node.js が入っていない、またはターミナルを開き直していない |
| 日本語の文字が画像に出ない・豆腐になる | 画像を描くときに使う日本語フォントがパソコンに無い。Windows/macOS なら通常は大丈夫。Linux は IPA ゴシックや Noto Sans CJK を入れる |
| PowerShell で `.ps1` が実行できない | `powershell -ExecutionPolicy Bypass -File tools\make-voice.ps1 …` のように `-ExecutionPolicy Bypass` を付ける |
