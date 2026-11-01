# 地域のあるある展 WebARデモ

高校の課題研究「地域のあるある展」の企画づくりで、生徒にARを触らせて発想を広げてもらうための使い捨てデモです。
素の HTML / CSS / JS だけで、ライブラリは CDN から読みます。ビルド不要。

| デモ | 何が起きるか | 技術 |
|---|---|---|
| **A** `marker/` | パネル(マーカー)にかざすと 3D が出て、動いて、音が鳴る。タップで跳ねる | MindAR（画像トラッキング）+ A-Frame |
| **B** `marker/info.html` | **同じパネル**で「文字 / いま⇄むかしの写真 / 動画」が出る | 同上 |
| **C** `plane/` | 床を映すと**実物大**のモデルが自動で立つ（マーカー不要） | `<model-viewer>`（Scene Viewer / AR Quick Look） |
| **D** `photo/` | 大きな「だんだん」の立体文字と等身大の白鳥を**床に並べる** + **記念撮影** | `<model-viewer>`（WebXR / AR Quick Look）+ three.js |

- トップ `index.html` … 3デモへの入口、端末チェック、注意、マーカー画像
- 印刷 `print/index.html` … A4 × 3枚（マーカー + QR + 手順）
- **生徒が触るのは `config.js` だけ**（→ 「遊び方」）

---

## 1. セットアップ

### 1-1. 手元で動かす（HTTPS が必要）

カメラAPIの制約で **https でないとデモA・Bは動きません**。`npx serve` だけでは PC 上の `localhost` でしか開けず、スマホの実機確認ができません。次のどれかを使います。

**方法1: トンネル（いちばん簡単）**
```bash
npx serve .                      # 別ターミナルで。 http://localhost:3000 が立つ
npx localtunnel --port 3000      # https://xxxx.loca.lt のURLが出る → スマホで開く
```
（`cloudflared tunnel --url http://localhost:3000` でも同じ。初回はトンネル側の確認画面が出ることがあります）

**方法2: 自己署名の https サーバ**
```bash
npx http-server . -S -C cert.pem -K key.pem -p 8443
# cert.pem / key.pem は  openssl req -x509 -newkey rsa:2048 -nodes -keyout key.pem -out cert.pem -days 30 -subj "/CN=localhost"
```
スマホで `https://<PCのIPアドレス>:8443/` を開き、「安全でない」警告を承諾して進みます（同じ Wi-Fi に接続）。

**PCだけで見る場合**は `npx serve .` → `http://localhost:3000/` で十分です（localhost は https 扱いになるのでカメラも使えます。デモCのARボタンは出ません）。

### 1-2. GitHub Pages で公開する

1. このリポジトリを GitHub に push
2. リポジトリの **Settings → Pages → Build and deployment → Source: Deploy from a branch**、Branch: `main` / `/ (root)` → Save
3. 数分後 `https://<ユーザー名>.github.io/<リポジトリ名>/` で開けます
4. QRコードを作る: `node tools/make-qr.mjs https://<ユーザー名>.github.io/<リポジトリ名>/` → push

`.usdz` は GitHub Pages が正しい MIME (`model/vnd.usdz+zip`) で配信します。別のサーバに置く場合は要設定。

### 1-3. 生成スクリプトを使うとき（任意）

```bash
npm install            # @napi-rs/canvas と qrcode が入る（マーカー / 仮画像 / QR / 動画の生成に使う）
node tools/make-markers.mjs        # マーカー画像 3枚（assets/markers/）
node tools/make-placeholders.mjs   # 仮の写真・ポスター・効果音
node tools/make-train.mjs          # 簡易な電車の 3D モデル（assets/models/train.glb）
node tools/optimize-models.mjs     # 重い glb をスマホ向けに軽くする（dandan.glb → dandan-web.glb など）
node tools/make-qr.mjs <公開URL>    # QR（assets/qr/）
node tools/make-video.mjs          # デモBの動画（要 ffmpeg）
bash tools/make-voice.sh "セリフ"   # セリフ音声（macOS）  / Windows は tools/make-voice.ps1
```
どれも**サイトの表示には不要**です（生成物は既にコミット済み）。

---

## 2. `[人手]` の作業（3つ + 検証）

### 2-1. `[人手]` `marker/targets.mind` のコンパイル

**現状: 3枚まとめた `marker/targets.mind` はコミット済み**（Claude Code がヘッドレス Chromium 上で MindAR 1.2.5 のコンパイラを実行して生成。各画像の特徴点は最大スケールで 400〜470 点、追跡点 25〜36 点）。
**マーカー画像を作り直したときは**、次の手順で再コンパイルしてください。

1. https://hiukim.github.io/mind-ar-js-doc/tools/compile を開く
2. `assets/markers/marker-1.png` `marker-2.png` `marker-3.png` を**3枚まとめて**アップロード → Start
3. 表示される特徴点（緑の点）が画像全体に散らばっていれば OK。少ない・偏っている画像は `tools/make-markers.mjs` のシードを変えて作り直す（`node tools/make-markers.mjs 3 12345`）
4. Download → `marker/targets.mind` として保存（上書き）

デモA・Bはどのマーカー（1〜3）でも同じ内容が出ます。

### 2-2. `[人手]` USDZ変換（iPhone対応に必須）

**現状: `assets/models/monument.usdz` と `truck.usdz` をコミット済み**（`tools/usdz-convert.html` をヘッドレス Chromium で実行して変換）。
**ただし iPhone 実機での検証はまだです。** 下の「検証手順」を必ず行ってください。モデルを差し替えたときも同様です。

#### 手段1（推奨・インストール不要）: 変換ページ
1. ターミナルで `npx serve .`（`file://` で直接開くと CDN の読み込みに失敗します）
2. 表示された URL に `/tools/usdz-convert.html` を足してブラウザで開く
3. `assets/models/` の glb をドラッグ＆ドロップ
4. ダウンロードされた usdz を、**元の glb と同じ名前**で `assets/models/` に置く（例: `monument.glb` → `monument.usdz`）

制約: **アニメーションは書き出されません**（デモCは静止モデルなので問題なし）。Draco / KTX2 圧縮の glb は読めません。

#### 手段2: Blender（3.5以降）
初期の立方体を削除 → `File > Import > glTF 2.0` → `File > Export > Universal Scene Description (.usd*)` → **ファイル名の拡張子を `.usdz` にする**。テクスチャが重ければ `USDZ Texture Downsampling` を 1024 か 512 に。
Blender の USDZ は AR Quick Look で開けないことがあるので、検証で NG なら手段1へ。

#### 手段3: Reality Converter（Mac）
Apple Developer の Downloads から。見つからなければ深追いせず手段1へ。

#### `[人手]` 検証手順（ここまでやって完了）
1. usdz を GitHub Pages に push
2. **iPhone の Safari で usdz の URL を直接開く**（例: `https://<ユーザー名>.github.io/<リポジトリ名>/assets/models/monument.usdz`）
3. AR Quick Look が起動してモデルが表示されれば成功
4. 何も起きない / 真っ白 / ダウンロードになる → 変換失敗。別の手段で作り直す
5. 表示されるがテクスチャが白い・黒い → マテリアルが落ちている。手段を変えるかモデルを変える

### 2-3. `[人手]` QRコード生成
```bash
node tools/make-qr.mjs https://<ユーザー名>.github.io/<リポジトリ名>/
```
`assets/qr/index.png, marker.png, info.png, plane.png` ができます。
※ `print/` は PNG が無いとき **開いている URL からその場で QR を作る**ので、ローカル確認だけなら不要です。

### 2-4. `[人手]` 3Dモデルの選定（差し替え）
今入っているのは Khronos glTF-Sample-Assets からの**暫定モデル**です（`assets/CREDITS.md`）。Poly Pizza / Quaternius はこの実装環境からアクセスできなかったので、候補は人が選んでください。

| 用途 | 今のモデル | 差し替え候補の探し方 |
|---|---|---|
| デモA（机の上サイズ） | `train.glb` 簡易な電車（`tools/make-train.mjs` で生成、発車モード用）。`fox.glb` キツネ（Survey/Walk/Run のアニメ入り）も同梱 | Poly Pizza で「animated」+ CC0 で絞る。Khronos の `CesiumMan`（人・歩く）も可 |
| デモC（等身大で映える） | `monument.glb` 高さ3mの古い街灯（CC0） | Poly Pizza で「vending machine」「post box」「statue」「sign」。同梱の `truck.glb`（ミルクトラック・CC BY）も可 |

差し替え手順: glb を `assets/models/` に置く → `config.js` のパスを変える → デモCなら usdz も作る → `CREDITS.md` に追記。1モデル 5MB 以内（超えたら `npx @gltf-transform/cli optimize in.glb out.glb --texture-size 1024`）。

### 2-5. `[人手]` 効果音
効果音ラボ https://soundeffect-lab.info/ など、利用条件が日本語で明記されたサイトから選んで `assets/audio/` に置き、`config.js` の `tapSound` / `audio` を変更、`CREDITS.md` に追記（1ファイル数百KB以内）。今は合成音の `chime.wav` `pon.wav` が仮で入っています。

---

## デモD: 床に並べて記念撮影

`config.js` の `photoDemo.models` に書いたモデルを**並べて1つにまとめ**、床に置きます。モデルは何個でも足せます。

| | ① ARで床に置く | ② 撮影モード |
|---|---|---|
| しくみ | `<model-viewer>`（Android: WebXR / iPhone: AR Quick Look） | ページ内でカメラ映像に three.js の 3D を重ねる |
| 床への固定 | ◎ 本物の床に固定・実物大 | △ 固定されない。指でずらして床に合わせる |
| 写真 | iPhone: Quick Look の**白いシャッターボタン**（長押しで動画）／ Android: **スクショ**（電源＋音量下） | **シャッターボタン → 保存**（iPhone は共有シートの「画像を保存」で写真アプリへ） |

- 撮った写真には右下に `photo.stamp` の文字が入ります（`""` で消える）
- ① は、2つのモデルを並べて 1つにまとめた `dandan-swan.glb`（Android 用・4.4MB）/ `dandan-swan.usdz`（iPhone 用・19MB）を開きます。Android は **Scene Viewer（Google の AR アプリ）を優先**し、使えなければ WebXR、iPhone は AR Quick Look（Pixel の WebXR ではモデルが出ないことがあったため、デモCと順番を変えている）
- 「▶ ARで床に置く」ボタンは常に表示し、AR が使えない環境（PC、LINE などのアプリ内ブラウザ、iPhone の Chrome、ARCore 非対応機種）では押すと理由と対処が出ます
- **`config.js` の `photoDemo.models`（大きさ・位置・向き・モデル）を変えたら、`dandan-swan.glb/.usdz` を作り直す**:
  `npx serve .` → `/tools/make-photo-ar.html` を開く → 出てきた 2 つのリンクを保存 → `assets/models/` に上書き。
  作り直していない（ファイルが無い）ときは、ページの中でその場でまとめて表示します（Scene Viewer が使えないので、AR に入れる機種が減る）

### モデルの軽量化（`tools/optimize-models.mjs`）
持ち込みの `dandan.glb`（59MB）`swan.glb`（77MB）は各 200 万ポリゴンあり、スマホではまず開けません。`node tools/optimize-models.mjs` で
三角形を 8 万に間引き・テクスチャを 1024px にした `dandan-web.glb`（2.0MB）`swan-web.glb`（2.4MB）を作り、こちらを使っています。
同時に向きも直しています（文字は床に寝ていたので起こす／白鳥は骨入りだったので今のポーズで焼き込み、正面を手前に）。
モデルを作り直したら、同じ名前で置いてこのスクリプトを再実行してください。別のモデルは `node tools/optimize-models.mjs in.glb out.glb 80000`。

## 3. 遊び方（生徒向け）― `config.js` を書き換える

`config.js` をテキストエディタで開く → 書き換える → 保存 → スマホでページを再読み込み。それだけ。

| 変えたいこと | 触る場所 | 例 |
|---|---|---|
| 3Dの大きさ | `markerDemo.scale` | `1.0` → `2` で2倍、`0.5` で半分 |
| 3Dの高さ | `markerDemo.yOffset` | `0.2` で少し浮く |
| 画面下の文字 | `markerDemo.caption` | `"この坂、自転車を降りる人が多い"` |
| 吹き出しの文字 | `markerDemo.bubble` | `"また逆走!?"` |
| 認識したときの音 | `markerDemo.audio` | `tools/make-voice.sh "セリフ"` で作った `../assets/audio/serifu.mp3` |
| セリフを読み上げる | `markerDemo.speakCaption` | `true` なら caption をスマホが読み上げる（音声ファイル不要） |
| 動き | `markerDemo.animation` | `"Walk"` `"Run"` `"Survey"`、`"none"` で回転だけ |
| 回転の速さ | `markerDemo.rotationSpeed` | `0` で止まる（アニメが無いモデルのとき） |
| パネルの置き方 | `markerDemo.placement` | `"table"`(机に置く・既定) / `"wall"`(壁に貼る) |
| **発車モード**（認識したら走り去る） | `markerDemo.departure.enabled` | `true` にする。`delay`(発車までの秒数) `distance`(距離) `duration`(秒数) `direction`(`"away"` 奥へ / `"toward"` / `"left"` / `"right"`) `facing`(モデルの向き。逆向きなら `180`) `sound`(発車音) `message`(走り出したときの文字) を調整。モデルにアニメが無くても動く |
| 3Dモデルそのもの | `markerDemo.model` | 自分で作った `.glb` を `assets/models/` に入れてパスを書く |
| 文字パネルの中身 | `infoDemo.text.title` / `.body` | `\n` で改行 |
| いま／むかしの写真 | `infoDemo.photoNow` / `photoOld` | `assets/images/` に写真を入れてパスを書く |
| 動画 | `infoDemo.video` | 無ければ `videoFallbackImages` をパラパラ表示 |
| 床に出すモデル | `planeDemo.modelGlb` / `modelUsdz` | glb と usdz を**同じ名前**で |
| 床デモの説明文 | `planeDemo.caption` / `description` | ARに入る前に読ませたいこと |

「"」で囲まれたものは文字、囲まれていないものは数字。行末の「,」は消さない。

---

## 4. 動作確認できた環境

| 項目 | バージョン / 状態 |
|---|---|
| A-Frame | 1.4.2（`https://aframe.io/releases/1.4.2/aframe.min.js`） |
| MindAR | 1.2.5（`mind-ar@1.2.5/dist/mindar-image-aframe.prod.js`。最終リリース 2024-01） |
| aframe-extras（animation-mixer） | 7.7.0 |
| model-viewer | 4.3.1（`ajax.googleapis.com/ajax/libs/model-viewer/4.3.1/`） |
| three.js（usdz-convert のみ） | 0.186.0（`USDZExporter.parseAsync(scene, options)`） |
| qrcode-generator（ブラウザ側QR） | 2.0.4 |
| qrcode（`tools/make-qr.mjs`） | 1.5.4 |

**確認済み（ヘッドレス Chromium 141 / 実装時）**: 全ページが JS エラーなしで読み込める。デモA・Bは「はじめる」→ MindAR 起動（カメラが無い環境なので `VIDEO_FAIL` の表示まで）。モデル読込・`animation-mixer` の適用・吹き出しのテクスチャ生成・モード切替を確認。デモCは model-viewer がモデルを読み込んで表示。印刷ページは A4 3ページで PDF 化できた。MindAR コンパイラで `targets.mind` 生成、USDZExporter で `monument.usdz` `truck.usdz` 生成。

**未確認（実機が必要）**: iPhone Safari / Android Chrome での実動作、USDZ の AR Quick Look 表示。下のチェックリストで確認してください。

## 5. 受け入れチェックリスト

**iPhone (Safari) で**
- [ ] トップからデモAに入り、カメラ許可 → マーカーで3Dが出る
- [ ] 「はじめる」を押したあと、認識時に**音が鳴る**
- [ ] デモBで動画（無ければパラパラ表示）がマーカー上で再生される
- [ ] デモCで「ARで床に置く」を押すと標準ビューアが開き、**床に自動で出る**
- [ ] デモCのモデルにテクスチャが正しく乗っている（＝USDZ変換が成功している）

**Android (Chrome) で**
- [ ] 同様にデモA・B・Cが動く

**共通**
- [ ] `config.js` の `scale` と `caption` を書き換えると、リロードで反映される
- [ ] マーカーを外すと3Dが消え、音が止まる
- [ ] 印刷ページがA4に収まる

## 6. 既知の制約（生徒への説明用）

- **平面配置（デモC）は「その場所」を認識していない。どこでかざしても同じものが出る。** 「駅前でこれを出す」は、駅前に貼ったQRコードで決めている
- 平面配置ARに入ると画面がスマホ標準のビューアに切り替わるので、**説明文や再生ボタンを重ねられない**。伝えたいことは入る前のページで伝える
- 平面配置では来場者が指でモデルを動かせてしまう。これは止められない
- マーカー認識は**暗い場所・光の反射・紙のテカり**に弱い。マット紙に印刷し、明るい場所で
- iPhone は Safari、Android は Chrome 以外だとカメラが使えないことがある
- 音は「はじめる」のタップで解錠している。マナーモードでは鳴らないことがある

## 7. 仕様との違い・補足

- A-Frame の `<a-text>` は日本語フォントを持たないため、吹き出し・テキストパネルは canvas に描いた文字を板に貼る自作コンポーネント `text-board`（`marker/ar-common.js`）で実装
- `[人手]` の `.mind` コンパイルと USDZ 変換は、ヘッドレス Chromium で同じライブラリを動かして**暫定的に生成済み**。ただし **iPhone 実機検証は未実施**（2-2）
- 実装環境から Poly Pizza / Quaternius / 各CDN にアクセスできなかったため、モデルは Khronos glTF-Sample-Assets からの暫定品。CDN の URL はバージョンを固定し、npm レジストリの実ファイルで存在を確認
- デモA・Bは 3 枚のマーカーすべてに反応する（印刷した 3 枚のどれでも A・B が動く）
- 音声ファイルに加えて Web Speech API で `caption` を読み上げる `speakCaption` を追加（音声ファイルを作らなくてもセリフを変えられる）
- 電車の glb は配布サイトに到達できなかったため、箱と円柱で組んだ簡易モデルを `tools/make-train.mjs` で生成している（色・寸法はスクリプト冒頭の `COLORS` / `SIZE` で変更可）
- デモA に「発車モード」（`markerDemo.departure`）を追加。認識 → `delay` 秒後に発車音 → モデルが位置と大きさのアニメーションで走り去る。マーカーを外すと出発位置に戻り、再びかざすと繰り返す。アニメ内蔵モデルでなくても動く（「乗り遅れた電車」の表現用）
- ディレクトリは仕様の `webar-demo/` をリポジトリ直下に展開している

## ファイル構成

```
├── index.html          トップ
├── config.js           ★生徒が書き換える唯一のファイル
├── style.css
├── marker/             デモA index.html / デモB info.html / 共通 ar-common.js / targets.mind
├── plane/index.html    デモC
├── photo/              デモD index.html / scene.js（モデルを並べる・glb にまとめる）。AR用まとめファイルは tools/make-photo-ar.html で作る
├── print/index.html    印刷用（A4 × 3）
├── check/index.html    AR 診断ページ（Scene Viewer / WebXR を個別に試す。Android で出ないときに使う）
├── assets/             models(glb+usdz) / audio / video / images / markers / qr / CREDITS.md
└── tools/              make-markers.mjs / make-qr.mjs / make-video.mjs / make-placeholders.mjs
                        make-voice.sh / make-voice.ps1 / usdz-convert.html
```
