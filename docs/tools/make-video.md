# make-video.mjs — デモB 用の短い動画を作る（ffmpeg が必要）

## 何をするか
静止画 2〜3 枚と字幕から、**5〜10 秒・720p・H.264・音声なし**の mp4 を作ります。
出力先: `assets/video/aruaru.mp4`

- 音声を入れない理由: iPhone は音付き動画の自動再生を制限するため。音なしなら「はじめる」の後、マーカー上で確実に再生できます
- 字幕は ffmpeg の文字機能ではなく、先に画像へ焼き込んでから動画にしています（フォント設定でつまずかないため）
- iPhone / Android で確実に再生できる設定（baseline プロファイル、yuv420p、faststart）で書き出します

## 使い方
### 既定のスライドで作る
```
node tools/make-video.mjs
```
`assets/images/ekimae-ima.png` → `ekimae-mukashi.png` → `ekimae-mirai.png` の順に、各 3 秒（計 9 秒）。字幕は「朝7時50分の駅前」「30年前はこうだった」「あるある展、はじめます」。

### 自分の画像と字幕で作る
画像と字幕を **交互に**並べます（字幕は `"…"` で囲む）。
```
node tools/make-video.mjs 写真1.jpg "字幕1" 写真2.jpg "字幕2" 写真3.jpg "字幕3"
```
字幕を付けたくない場合は `""`（空の引用符）にします。

### 1 枚あたりの秒数を変える
スクリプト冒頭の `SECONDS_PER_SLIDE = 3` を変えます。

## 実行後
- 5MB を超えると警告が出ます。画像を減らすか、スクリプト内の `-crf 26` を大きく（例 30）すると小さくなります
- できた mp4 を git にコミットして push すると、デモB の「動画」ボタンで再生されます
- 無い間は、`config.js` の `videoFallbackImages` の画像を順に切り替える「パラパラ表示」が自動で使われます

## ffmpeg が無いとき
```
ffmpeg が見つかりません。インストールするか、動画なし（パラパラ表示）で進めてください。
```
と表示されて終了します。入れ方:
- macOS: `brew install ffmpeg`
- Windows: `winget install ffmpeg`
ffmpeg を入れない場合は動画を作らず、パラパラ表示のままで OK です（デモの主旨は変わりません）。

## 音を付けたい場合
動画に音声トラックは入れず、デモB のページで別途 mp3 を鳴らす構成にしてください（`marker/info.html` の `startVideo()` で音声ファイルを再生する処理を足す）。動画自体に音を入れると iPhone で自動再生されなくなります。
