# セリフ音声を作る（Windows 用）。OS内蔵の読み上げで作るのでダウンロード不要。
#
#   powershell -ExecutionPolicy Bypass -File tools\make-voice.ps1 "この道、いつも自転車が逆走してくる"
#   powershell -ExecutionPolicy Bypass -File tools\make-voice.ps1 "セリフ" assets\audio\serifu2.mp3
#
# ・ffmpeg があれば mp3、無ければ wav のまま出す（wav もブラウザで再生できる）。
# ・できたファイルを config.js の  audio:  に指定する。
#     例)  audio: "../assets/audio/serifu.wav",
# ・日本語の声が入っていない場合は「設定 > 時刻と言語 > 音声認識」で日本語音声を追加する。
param(
  [string]$Text = "この道、いつも自転車が逆走してくる",
  [string]$Out  = "assets\audio\serifu.mp3"
)
$ErrorActionPreference = "Stop"
Set-Location (Join-Path $PSScriptRoot "..")

Add-Type -AssemblyName System.Speech
$synth = New-Object System.Speech.Synthesis.SpeechSynthesizer
# 日本語の声を探して選ぶ（Haruka など）
$ja = $synth.GetInstalledVoices() | Where-Object { $_.VoiceInfo.Culture.Name -like "ja*" } | Select-Object -First 1
if ($ja) { $synth.SelectVoice($ja.VoiceInfo.Name) } else { Write-Warning "日本語の音声が見つかりません。英語の声で読み上げます。" }
$synth.Rate = 0   # -10(遅い) 〜 10(速い)

New-Item -ItemType Directory -Force -Path (Split-Path $Out) | Out-Null
New-Item -ItemType Directory -Force -Path "tools\tmp" | Out-Null
$wav = "tools\tmp\voice.wav"
$synth.SetOutputToWaveFile($wav)
$synth.Speak($Text)
$synth.Dispose()

if (Get-Command ffmpeg -ErrorAction SilentlyContinue) {
  ffmpeg -y -loglevel error -i $wav -codec:a libmp3lame -q:a 4 $Out
  Remove-Item $wav
} else {
  $Out = [System.IO.Path]::ChangeExtension($Out, ".wav")
  Move-Item -Force $wav $Out
  Write-Host "(ffmpeg が無いので wav で出力しました。config.js のパスも .wav にしてください)"
}
Write-Host "できました: $Out"
Write-Host ("config.js の audio: を ""../" + ($Out -replace "\\","/") + """ にしてください。")
