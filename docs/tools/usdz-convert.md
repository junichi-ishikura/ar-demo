# usdz-convert.html — iPhone 用の 3D ファイル（usdz）に変換する

## 何をするか
ブラウザで開いて **glb をドラッグ＆ドロップすると、usdz がダウンロードされる**だけのページです。
iPhone で「床に置く」AR（デモC）をするには usdz が必須なので、そのために使います。

内部では three.js（3D ライブラリ）の 2 つの部品を CDN から読み込んで動かしています。
1. 落とされた glb を読み込む（GLTFLoader）
2. usdz 形式に書き出す（USDZExporter）。床に置く設定（水平面に固定）と、iPhone の AR Quick Look 向けの互換設定を付けています
3. できたデータをファイルとして保存

インストールは不要ですが、**インターネット接続が必要**です（three.js を CDN から読むため）。

## 使い方
1. ターミナルでリポジトリのフォルダに移動し、簡易サーバを立てる
   ```
   npx serve .
   ```
   `http://localhost:3000` のような URL が表示されます。
   ※ `.html` をダブルクリックして開く（`file://`）と CDN の読み込みに失敗して動きません
2. ブラウザで `http://localhost:3000/tools/usdz-convert.html` を開く
3. 「ここに .glb をドロップ」の枠に `assets/models/monument.glb` などをドラッグ＆ドロップ（枠をクリックしてファイルを選んでも OK）
4. 画面下の黒いログに「完了: monument.usdz … をダウンロードしました」と出て、ブラウザのダウンロードフォルダに usdz が保存される
5. その usdz を、**元の glb と同じ名前**で `assets/models/` に置く（`monument.glb` → `monument.usdz`）
6. git にコミットして push

画面の途中にある 3D プレビューは確認用です。表示されなくても変換は続きます。

## 必ずやる検証（ここまでで完了）
「変換できた」と「iPhone で見られる」は別です。
1. push して GitHub Pages に反映されるのを待つ
2. **iPhone の Safari で usdz の URL を直接開く**
   例: `https://ユーザー名.github.io/リポジトリ名/assets/models/monument.usdz`
3. AR Quick Look（3D がくるくる回る画面）が開き、色・質感が付いていれば成功
4. 開かない／真っ白／ダウンロードになる → 変換失敗。Blender など別の手段（リポジトリの README 2-2）で作り直す
5. 形はあるが真っ白・真っ黒 → テクスチャが落ちている。モデルを変えるか別の手段で

## 制約
- **アニメーションは書き出されません。** デモC（静止モデル）用です。デモA のキツネのような動くモデルを通しても、iPhone では動きません
- **Draco / KTX2 / WebP で圧縮された glb は読めません。** その場合は先に展開します:
  ```
  npx @gltf-transform/cli dequantize in.glb out.glb   # 量子化を戻す
  npx @gltf-transform/cli optimize in.glb out.glb --texture-size 1024 --compress false
  ```
- テクスチャは最大 1024px に縮小されます（AR Quick Look の安定のため）。元が 4096px でも 1024 になります
- ファイル名に日本語やスペースが入っていると、ブラウザによっては保存名が変わることがあります。英数字にしてください

## 今の状態
`assets/models/monument.usdz` と `truck.usdz` は、このページと同じ処理をヘッドレスのブラウザで動かして作成済みです。**ただし iPhone 実機での確認はまだ**なので、上の「検証」を行ってください。モデルを差し替えたときは、そのモデルでも同様に変換と検証をします。

## うまくいかないとき
| 症状 | 対処 |
|---|---|
| ページが真っ白 / 「待機中…」のまま | `file://` で開いている、またはネット未接続。`npx serve .` 経由で開く |
| `エラー: …` がログに出る | glb が圧縮形式（上記）、または壊れている。別のビューア（https://gltf-viewer.donmccurdy.com/ ）で開けるか確認 |
| ダウンロードが始まらない | ブラウザのダウンロード許可（複数ファイルのダウンロードをブロックしていないか）を確認 |
| 巨大な usdz になる | 元のテクスチャが多い。`gltf-transform optimize --texture-size 1024` で先に縮小 |
