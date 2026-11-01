# アセットの出典と利用条件

取得したもの・生成したものはすべてここに記録する。差し替えたら行を書き換えること。
方針: CC0 を第一候補（学内デモ → 公開の企画展にそのまま持ち込めるように）。

## 3Dモデル（assets/models/）

| ファイル名 | 元の名前 / 取得元URL | 作者 | ライセンス | 加工 |
|---|---|---|---|---|
| `fox.glb` | Fox / https://github.com/KhronosGroup/glTF-Sample-Assets/tree/main/Models/Fox | モデル: PixelMannen（CC0）／リギング・アニメ: tomkranis（CC BY 4.0）／glTF変換: @AsoboStudio, @scurest（CC BY 4.0） | CC0 1.0 + CC BY 4.0（要クレジット表記） | 高さ 0.5 単位に縮小（gltf-transform）。アニメ Survey / Walk / Run 入り |
| `monument.glb` | Lantern / https://github.com/KhronosGroup/glTF-Sample-Assets/tree/main/Models/Lantern | Microsoft（2017） | CC0 1.0 | 高さ 3.0 m に縮小、テクスチャを 1024px JPEG に圧縮（9.5MB → 0.7MB） |
| `train.glb` | `tools/make-train.mjs` で生成（箱と円柱だけの簡易な電車・1両・テクスチャ無し） | このリポジトリ | 自由に改変・差し替え可。前が -Z 方向 |
| `truck.glb` | Cesium Milk Truck / https://github.com/KhronosGroup/glTF-Sample-Assets/tree/main/Models/CesiumMilkTruck | Cesium | CC BY 4.0（Cesium のロゴを含む。要クレジット表記） | 高さ 2.6 m に縮小。デモCの差し替え候補（アニメ「Wheels」入り） |
| `dandan.glb` `swan.glb` | 持ち込み（ノード名から Tripo AI で生成したモデルと思われる） | — | 生成サービスの利用規約を確認すること（Tripo は無料プランだと CC BY 4.0 扱いの場合あり） | 元ファイル（約60MB / 77MB・各200万ポリゴン）。そのままではスマホで重すぎるので下の -web 版を使う |
| `dandan-web.glb` `swan-web.glb` | 上の2つを `tools/optimize-models.mjs` で軽量化 | 同上 | 同上 | 8万ポリゴン・テクスチャ1024px（2.0MB / 2.4MB）。文字は起こして正面を +Z に、白鳥は骨を今のポーズで焼き込み正面を +Z に |
| `dandan-swan.glb` `dandan-swan.usdz` | 上の -web 版を `config.js` の配置で並べ、`tools/make-photo-ar.html` で 1 ファイルにまとめたもの（デモD の「ARで床に置く」用） | 同上 | 同上 | 幅 4.65m × 高さ 1.3m |

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
