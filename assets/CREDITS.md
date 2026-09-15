# アセットの出典と利用条件

取得したもの・生成したものはすべてここに記録する。差し替えたら行を書き換えること。
方針: CC0 を第一候補（学内デモ → 公開の企画展にそのまま持ち込めるように）。

## 3Dモデル（assets/models/）

| ファイル名 | 元の名前 / 取得元URL | 作者 | ライセンス | 加工 |
|---|---|---|---|---|
| `fox.glb` | Fox / https://github.com/KhronosGroup/glTF-Sample-Assets/tree/main/Models/Fox | モデル: PixelMannen（CC0）／リギング・アニメ: tomkranis（CC BY 4.0）／glTF変換: @AsoboStudio, @scurest（CC BY 4.0） | CC0 1.0 + CC BY 4.0（要クレジット表記） | 高さ 0.5 単位に縮小（gltf-transform）。アニメ Survey / Walk / Run 入り |
| `monument.glb` | Lantern / https://github.com/KhronosGroup/glTF-Sample-Assets/tree/main/Models/Lantern | Microsoft（2017） | CC0 1.0 | 高さ 3.0 m に縮小、テクスチャを 1024px JPEG に圧縮（9.5MB → 0.7MB） |
| `truck.glb` | Cesium Milk Truck / https://github.com/KhronosGroup/glTF-Sample-Assets/tree/main/Models/CesiumMilkTruck | Cesium | CC BY 4.0（Cesium のロゴを含む。要クレジット表記） | 高さ 2.6 m に縮小。デモCの差し替え候補（アニメ「Wheels」入り） |

※ `fox.glb` `truck.glb` は CC BY のため、展示で使う場合は上記の作者名を掲示物に書くこと。
※ `*.usdz` は上記 glb を `tools/usdz-convert.html` で変換したもの（同じライセンス）。

## 画像（assets/images/、assets/markers/）

| ファイル名 | 出典 | ライセンス |
|---|---|---|
| `ekimae-ima.png` `ekimae-mukashi.png` `ekimae-mirai.png` `monument-poster.png` | `tools/make-placeholders.mjs` で生成（仮のイラスト） | このリポジトリと同じ（自由に差し替え可） |
| `marker-1.png` 〜 `marker-3.png` | `tools/make-markers.mjs` で生成 | 同上 |

## 音声（assets/audio/）

| ファイル名 | 出典 | ライセンス |
|---|---|---|
| `chime.wav` `pon.wav` `hassha.wav` | `tools/make-placeholders.mjs` で生成（サイン波・ノイズの合成音） | 同上 |
| `serifu.mp3`（未作成） | `tools/make-voice.sh` / `.ps1` で OS の読み上げから生成する | 生成した本人 |
| 効果音（未取得） | [人手] 効果音ラボ https://soundeffect-lab.info/ など、利用条件が日本語で明記されたサイトから選ぶ。1ファイル数百KB以内 | 各サイトの規約に従う（取得したらここに追記） |

## 動画（assets/video/）

| ファイル名 | 出典 | ライセンス |
|---|---|---|
| `aruaru.mp4`（未作成） | `tools/make-video.mjs`（ffmpeg）で上記画像から生成する。無い間はパラパラ表示で代用 | 生成した本人 |
