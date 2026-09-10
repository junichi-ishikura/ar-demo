// デモB用の短い動画を ffmpeg で作る  →  assets/video/aruaru.mp4
//
//   node tools/make-video.mjs
//   node tools/make-video.mjs 画像1.png "字幕1" 画像2.png "字幕2" ...
//
// ・静止画 2〜3 枚 + 字幕 → 5〜10秒 / 720p / H.264 / 音声トラック無し / 5MB以内
// ・音声を付けない理由: iOS の自動再生制限を避け、マーカー上で確実に動かすため
// ・ffmpeg が無い環境では作れない。その場合デモBは config.js の
//   videoFallbackImages を順に切り替える「パラパラ表示」で代用する（自動）。
//
// 字幕は canvas で画像に焼き込む（ffmpeg の drawtext はフォント設定でつまずきやすいので使わない）。

import { createCanvas, loadImage } from '@napi-rs/canvas';
import { execFileSync } from 'node:child_process';
import { mkdirSync, writeFileSync, rmSync, existsSync, statSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const OUT = join(ROOT, 'assets', 'video', 'aruaru.mp4');
const TMP = join(ROOT, 'tools', 'tmp', 'video');
const W = 1280, H = 720;
const SECONDS_PER_SLIDE = 3;   // 1枚あたりの秒数（3枚なら9秒）

// 既定のスライド（引数が無いとき）
let slides = [
  [join(ROOT, 'assets/images/ekimae-ima.png'),     '朝7時50分の駅前'],
  [join(ROOT, 'assets/images/ekimae-mukashi.png'), '30年前はこうだった'],
  [join(ROOT, 'assets/images/ekimae-mirai.png'),   'あるある展、はじめます'],
];
if (process.argv.length > 2) {
  const a = process.argv.slice(2);
  slides = [];
  for (let i = 0; i < a.length; i += 2) slides.push([resolve(a[i]), a[i + 1] || '']);
}

try { execFileSync('ffmpeg', ['-version'], { stdio: 'ignore' }); }
catch {
  console.error('ffmpeg が見つかりません。インストールするか、動画なし（パラパラ表示）で進めてください。');
  console.error('  macOS: brew install ffmpeg   /  Windows: winget install ffmpeg');
  process.exit(1);
}

rmSync(TMP, { recursive: true, force: true });
mkdirSync(TMP, { recursive: true });

let i = 0;
for (const [img, text] of slides) {
  const c = createCanvas(W, H);
  const g = c.getContext('2d');
  g.fillStyle = '#141414'; g.fillRect(0, 0, W, H);
  if (existsSync(img)) {
    const im = await loadImage(img);
    const s = Math.min(W / im.width, H / im.height);
    const w = im.width * s, h = im.height * s;
    g.drawImage(im, (W - w) / 2, (H - h) / 2, w, h);
  }
  if (text) {   // 字幕帯
    g.fillStyle = 'rgba(20,20,20,.85)'; g.fillRect(0, H - 120, W, 120);
    g.fillStyle = '#f7c600'; g.fillRect(0, H - 120, W, 6);
    g.fillStyle = '#fff'; g.textAlign = 'center'; g.textBaseline = 'middle';
    g.font = '900 52px "IPAGothic","Noto Sans CJK JP","Hiragino Sans","Yu Gothic",sans-serif';
    g.fillText(text, W / 2, H - 60);
  }
  writeFileSync(join(TMP, `slide-${String(i++).padStart(3, '0')}.png`), c.toBuffer('image/png'));
}

mkdirSync(dirname(OUT), { recursive: true });
execFileSync('ffmpeg', [
  '-y', '-loglevel', 'error',
  '-framerate', `1/${SECONDS_PER_SLIDE}`, '-i', join(TMP, 'slide-%03d.png'),
  '-vf', `scale=${W}:${H},format=yuv420p`,
  '-r', '30',
  '-c:v', 'libx264', '-profile:v', 'baseline', '-level', '3.1', '-pix_fmt', 'yuv420p',
  '-crf', '26', '-an', '-movflags', '+faststart',
  OUT,
], { stdio: 'inherit' });
rmSync(TMP, { recursive: true, force: true });

const mb = statSync(OUT).size / 1024 / 1024;
console.log(`できました: ${OUT} (${mb.toFixed(2)} MB, ${slides.length * SECONDS_PER_SLIDE}秒)`);
if (mb > 5) console.warn('5MB を超えています。画像を減らすか -crf を上げてください。');
