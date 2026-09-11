# make-voice.sh / make-voice.ps1 — セリフ音声を作る

## 何をするか
テキストを渡すと、**パソコンに最初から入っている読み上げ機能**で音声ファイルを作ります。素材サイトから探す必要がなく、生徒が考えたセリフをその場で音にできます。

- macOS → `tools/make-voice.sh`（`say` コマンドを使う）
- Windows → `tools/make-voice.ps1`（`System.Speech` を使う）

できたファイルを `config.js` の `markerDemo.audio` に指定すると、デモA でマーカーを認識した瞬間に鳴ります。

> 補足: `config.js` の `speakCaption: true` にすると、音声ファイルを作らなくても **スマホ自身が `caption` の文字を読み上げます**。手軽に試すならこちら。声質を選びたい・確実に同じ音を鳴らしたいときはファイルを作ってください。

## macOS: make-voice.sh
```
bash tools/make-voice.sh "この道、いつも自転車が逆走してくる"
bash tools/make-voice.sh "セリフ" assets/audio/serifu2.mp3       # 出力先を指定
VOICE=Otoya RATE=160 bash tools/make-voice.sh "セリフ"              # 声と速さを変える
```
| 項目 | 意味 | 既定値 |
|---|---|---|
| 1 つ目の引数 | 読み上げる文章 | 「この道、いつも自転車が逆走してくる」 |
| 2 つ目の引数 | 出力ファイル | `assets/audio/serifu.mp3` |
| 環境変数 `VOICE` | 声の名前（`say -v '?' | grep ja_JP` で一覧。Kyoko / Otoya など） | Kyoko |
| 環境変数 `RATE` | 速さ（150〜220 くらい） | 180 |

- ffmpeg があれば mp3、無ければ macOS 標準の `afconvert` で **m4a** を出します（ブラウザで再生できます）。m4a になったときは `config.js` のパスも `.m4a` にしてください
- 日本語の声が無い場合: システム設定 → アクセシビリティ → 読み上げコンテンツ → システムの声 → 管理 で日本語（Kyoko など）をダウンロード

## Windows: make-voice.ps1
PowerShell で:
```
powershell -ExecutionPolicy Bypass -File tools\make-voice.ps1 "この道、いつも自転車が逆走してくる"
powershell -ExecutionPolicy Bypass -File tools\make-voice.ps1 "セリフ" assets\audio\serifu2.mp3
```
| 項目 | 意味 | 既定値 |
|---|---|---|
| `-Text`（1 つ目） | 読み上げる文章 | 同上 |
| `-Out`（2 つ目） | 出力ファイル | `assets\audio\serifu.mp3` |

- ffmpeg があれば mp3、無ければ **wav** のまま出します（ブラウザで再生できます）。wav になったときは `config.js` のパスも `.wav` にしてください
- 日本語の声（Haruka など）が入っていないと英語の声で読まれます。設定 → 時刻と言語 → 音声認識（または「言語」）で日本語の音声パックを追加してください
- 速さはスクリプト内の `$synth.Rate = 0`（-10 〜 10）で変えられます

## 実行後
1. 表示されたパス（例 `assets/audio/serifu.mp3`）を確認
2. `config.js` を開き、`audio: "../assets/audio/chime.wav"` を `audio: "../assets/audio/serifu.mp3"` に変える
3. 保存 → git にコミットして push → スマホで再読み込み

## つまずき
| 症状 | 対処 |
|---|---|
| macOS で `say: Voice 'Kyoko' not found` | 日本語の声をダウンロードする（上記）か、`VOICE=` に入っている声を指定 |
| 音が鳴らない | スマホのマナーモード／音量を確認。ブラウザは「はじめる」を押した後でないと音を出せない仕様なので、押した後にマーカーをかざす |
| ファイルが大きい | 1 文なら数十 KB〜数百 KB。長文は分ける |
