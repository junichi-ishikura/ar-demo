# ドキュメント（docs/）

このフォルダは **git 管理に含めていません**（`.gitignore` に `docs/` を追加済み）。
手元に置いて読むための資料です。

| ファイル | 内容 |
|---|---|
| [glossary.md](glossary.md) | **用語解説**。A-Frame、`<a-text>`、MindAR、model-viewer、glb / usdz、マーカー、CDN など、README や仕様書に出てくる言葉を「知らない前提」で説明 |
| [tools/README.md](tools/README.md) | `tools/` 配下のスクリプト一覧と、共通の準備（Node.js のインストールなど） |
| [tools/make-markers.md](tools/make-markers.md) | マーカー画像（紙に印刷する絵）を作る |
| [tools/make-qr.md](tools/make-qr.md) | QRコードを作る |
| [tools/make-placeholders.md](tools/make-placeholders.md) | 仮の写真・ポスター・効果音を作る |
| [tools/make-video.md](tools/make-video.md) | デモB用の短い動画を作る（ffmpeg が必要） |
| [tools/make-voice.md](tools/make-voice.md) | セリフ音声を作る（macOS 用 `.sh` / Windows 用 `.ps1`） |
| [tools/usdz-convert.md](tools/usdz-convert.md) | iPhone 用の 3D ファイル（usdz）に変換するページの使い方 |

## まずどれを読めばいいか

- 「そもそも何の話か分からない」 → `glossary.md`
- 「スクリプトを動かしたい」 → `tools/README.md` の準備をしてから、各スクリプトのページへ
- 「スマホで動かして確認したい」 → リポジトリ直下の `README.md`（セットアップ手順と受け入れチェックリスト）
