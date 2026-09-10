#!/usr/bin/env bash
# セリフ音声を作る（macOS 用）。OS内蔵の読み上げ(say)で作るのでダウンロード不要。
#
#   bash tools/make-voice.sh "この道、いつも自転車が逆走してくる"
#   bash tools/make-voice.sh "セリフ" assets/audio/serifu2.mp3     # 出力先を変える
#
# ・ffmpeg があれば mp3、無ければ m4a(AAC) を出す。どちらもブラウザで再生できる。
# ・できたファイルを config.js の  audio:  に指定する。
#     例)  audio: "../assets/audio/serifu.mp3",
# ・声を変えたいときは VOICE を変える（ say -v '?' | grep ja_JP で一覧）
set -euo pipefail
cd "$(dirname "$0")/.."

TEXT="${1:-この道、いつも自転車が逆走してくる}"
OUT="${2:-assets/audio/serifu.mp3}"
VOICE="${VOICE:-Kyoko}"          # 日本語の声。Kyoko / Otoya など
RATE="${RATE:-180}"              # 読む速さ（words per minute 相当。150〜220くらい）

mkdir -p "$(dirname "$OUT")" tools/tmp
TMP=tools/tmp/voice.aiff

say -v "$VOICE" -r "$RATE" "$TEXT" -o "$TMP"

if command -v ffmpeg >/dev/null 2>&1; then
  ffmpeg -y -loglevel error -i "$TMP" -codec:a libmp3lame -q:a 4 "$OUT"
else
  # ffmpeg が無い場合は macOS 標準の afconvert で m4a にする（ブラウザで再生可）
  OUT="${OUT%.*}.m4a"
  afconvert -f m4af -d aac "$TMP" "$OUT"
  echo "(ffmpeg が無いので m4a で出力しました。config.js のパスも .m4a にしてください)"
fi
rm -f "$TMP"
echo "できました: $OUT"
echo "config.js の audio: を \"../${OUT}\" にしてください。"
