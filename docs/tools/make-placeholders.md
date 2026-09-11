# make-placeholders.mjs — 仮の写真・ポスター・効果音を作る

## 何をするか
本物の素材ができるまでの **「仮」の画像と音**を、ダウンロードなしで生成します。
本物ができたら、同じファイル名で上書きするか、`config.js` のパスを変えてください。

| 出力ファイル | 用途 | 中身 |
|---|---|---|
| `assets/images/ekimae-ima.png` | デモB「写真」の“いま” | 駅前のイラスト（自転車がたくさん） |
| `assets/images/ekimae-mukashi.png` | デモB「写真」の“むかし” | セピア色の駅前 |
| `assets/images/ekimae-mirai.png` | デモB パラパラ表示 3 枚目 / 動画の 3 枚目 | 「こうなったら」の想像図（横断幕と街灯） |
| `assets/images/monument-poster.png` | デモC の読み込み中に見せる画像 | 街灯のシルエット |
| `assets/audio/chime.wav` | デモA 認識したときの音（セリフができるまでの仮） | 「ピンポーン」（サイン波の合成音、1.4 秒） |
| `assets/audio/pon.wav` | デモA モデルをタップしたときの音 | 「ポン」（0.25 秒） |

画像には「仮の画像です。本物の写真に差し替えてください」という注意書きが左上に入ります。

## 使い方
```
node tools/make-placeholders.mjs
```
引数はありません。実行するたびに同じものが上書きされます。

## 本物に差し替えるとき
- **写真**: スマホで撮った写真を `assets/images/` に入れて、`config.js` の `infoDemo.photoNow` / `photoOld` / `videoFallbackImages` のパスを変える。横長（4:3 くらい）が板の形に合います。1 枚 500KB 以下を目安に（スマホ写真は大きいので縮小する）
- **認識したときの音**: `tools/make-voice.sh` / `.ps1` でセリフを作り、`config.js` の `markerDemo.audio` を差し替える
- **タップ音**: 効果音ラボなどから取得して `assets/audio/` に置き、`markerDemo.tapSound` を差し替え。`assets/CREDITS.md` に出典を書く

## 中身を変えたいとき
スクリプトの `ekimae({...})` 呼び出しを編集すると、ラベル文字（`label`）、空や建物の色、自転車の位置（`bikes`）を変えられます。
効果音は `tone([[周波数, 開始秒, 音量], ...], 長さ秒)` で作っています。周波数を変えると音の高さが変わります。
