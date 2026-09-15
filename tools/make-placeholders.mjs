// 仮の写真・ポスター画像と、仮の効果音(wav)を生成する（ダウンロード不要）
//   node tools/make-placeholders.mjs
//
//  assets/images/ekimae-ima.png      いまの駅前（イラスト）
//  assets/images/ekimae-mukashi.png  むかしの駅前（セピア）
//  assets/images/ekimae-mirai.png    「こうなったら」の駅前
//  assets/images/monument-poster.png デモC 読み込み中の画像
//  assets/audio/chime.wav            認識したときの「ピンポーン」（セリフ音声ができるまでの仮）
//  assets/audio/pon.wav              タップしたときの「ポン」
//
// 本物の写真に差し替えるときは、同じファイル名で上書きするか config.js のパスを変える。

import { createCanvas } from '@napi-rs/canvas';
import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const IMG = join(ROOT, 'assets', 'images');
const AUD = join(ROOT, 'assets', 'audio');
mkdirSync(IMG, { recursive: true }); mkdirSync(AUD, { recursive: true });
const FONT = '"IPAGothic","Noto Sans CJK JP","Hiragino Sans","Yu Gothic",sans-serif';

// ---------- 駅前イラスト ----------
function ekimae({ file, label, sky, ground, building, bikes, sepia, extra }) {
  const W = 1024, H = 768;
  const c = createCanvas(W, H); const g = c.getContext('2d');
  // 空
  const grad = g.createLinearGradient(0, 0, 0, H * .6); grad.addColorStop(0, sky[0]); grad.addColorStop(1, sky[1]);
  g.fillStyle = grad; g.fillRect(0, 0, W, H);
  // 遠景の山
  g.fillStyle = sepia ? '#a08c6a' : '#6f9b7a';
  g.beginPath(); g.moveTo(0, 430); g.lineTo(180, 300); g.lineTo(360, 400); g.lineTo(520, 280); g.lineTo(700, 390); g.lineTo(860, 320); g.lineTo(W, 420); g.lineTo(W, 470); g.lineTo(0, 470); g.fill();
  // 地面・ロータリー
  g.fillStyle = ground; g.fillRect(0, 460, W, H - 460);
  g.fillStyle = sepia ? '#7a6a52' : '#4a4a4a'; g.fillRect(0, 560, W, 130);
  g.strokeStyle = '#f7f1d8'; g.lineWidth = 6; g.setLineDash([40, 30]); g.beginPath(); g.moveTo(0, 625); g.lineTo(W, 625); g.stroke(); g.setLineDash([]);
  // 駅舎
  g.fillStyle = building; g.fillRect(300, 250, 440, 220);
  g.fillStyle = sepia ? '#5a4a36' : '#2b3d55'; g.fillRect(280, 220, 480, 40);
  g.fillStyle = '#fff'; g.fillRect(340, 300, 360, 60);
  g.fillStyle = '#141414'; g.font = `900 40px ${FONT}`; g.textAlign = 'center'; g.textBaseline = 'middle';
  g.fillText(sepia ? 'ま ち 駅' : 'まち駅', 520, 330);
  for (let i = 0; i < 4; i++) { g.fillStyle = sepia ? '#d8c8a0' : '#cfe3ff'; g.fillRect(330 + i * 95, 390, 60, 70); }
  // 自転車
  for (const [x, y, s] of bikes) {
    g.strokeStyle = '#141414'; g.lineWidth = 5 * s;
    g.beginPath(); g.arc(x, y, 22 * s, 0, Math.PI * 2); g.stroke();
    g.beginPath(); g.arc(x + 60 * s, y, 22 * s, 0, Math.PI * 2); g.stroke();
    g.beginPath(); g.moveTo(x, y); g.lineTo(x + 25 * s, y - 35 * s); g.lineTo(x + 60 * s, y); g.lineTo(x + 30 * s, y); g.lineTo(x + 25 * s, y - 35 * s); g.lineTo(x + 45 * s, y - 45 * s); g.stroke();
  }
  if (extra) extra(g);
  // セピア加工
  if (sepia) { g.globalCompositeOperation = 'multiply'; g.fillStyle = 'rgba(150,110,60,.45)'; g.fillRect(0, 0, W, H); g.globalCompositeOperation = 'source-over'; }
  // ラベル帯
  g.fillStyle = 'rgba(20,20,20,.85)'; g.fillRect(0, H - 90, W, 90);
  g.fillStyle = '#f7c600'; g.fillRect(0, H - 90, W, 6);
  g.fillStyle = '#fff'; g.font = `900 44px ${FONT}`; g.textAlign = 'left'; g.fillText(label, 30, H - 44);
  // 仮画像の注意書き（左上に小さく）
  g.font = `700 24px ${FONT}`; g.textAlign = 'left';
  const note = '仮の画像です。本物の写真に差し替えてください';
  g.fillStyle = 'rgba(20,20,20,.75)'; g.fillRect(16, 16, g.measureText(note).width + 24, 40);
  g.fillStyle = '#fff'; g.fillText(note, 28, 36);
  writeFileSync(join(IMG, file), c.toBuffer('image/png'));
  console.log('wrote', join(IMG, file));
}

ekimae({
  file: 'ekimae-ima.png', label: 'いま（2026）  朝7:50 自転車の壁',
  sky: ['#8fc3ff', '#e6f2ff'], ground: '#8f8f8f', building: '#e8e4dc',
  bikes: [[80, 540, 1], [180, 545, 1.1], [290, 540, 1], [400, 548, 1.05], [520, 540, 1], [640, 546, 1.1], [760, 540, 1], [880, 545, 1.05], [140, 690, 1.2], [700, 700, 1.2]],
});
ekimae({
  file: 'ekimae-mukashi.png', label: 'むかし（1996）  木造の駅舎',
  sky: ['#d9c9a5', '#f2e6c8'], ground: '#b9a888', building: '#c9a97a', sepia: true,
  bikes: [[200, 545, 1], [820, 700, 1.2]],
});
ekimae({
  file: 'ekimae-mirai.png', label: 'こうなったら（想像図）  あるある展 会場',
  sky: ['#ffd27a', '#ffe9c2'], ground: '#9a9a9a', building: '#e8e4dc',
  bikes: [[120, 700, 1.2]],
  extra(g) {   // 街灯と横断幕
    g.fillStyle = '#3b2a1a'; g.fillRect(900, 330, 14, 240);
    g.fillStyle = '#f7c600'; g.beginPath(); g.arc(907, 320, 26, 0, Math.PI * 2); g.fill();
    g.fillStyle = '#d0342c'; g.fillRect(120, 150, 780, 70);
    g.fillStyle = '#fff'; g.font = `900 40px ${FONT}`; g.textAlign = 'center'; g.textBaseline = 'middle';
    g.fillText('地域のあるある展 開催中', 510, 186);
  },
});

// ---------- デモC ポスター ----------
{
  const W = 800, H = 600; const c = createCanvas(W, H); const g = c.getContext('2d');
  g.fillStyle = '#e9eef5'; g.fillRect(0, 0, W, H);
  g.fillStyle = '#3b2a1a'; g.fillRect(392, 200, 16, 320);
  g.fillStyle = '#5a4a36'; g.fillRect(360, 500, 80, 30);
  g.fillStyle = '#f7c600'; g.beginPath(); g.arc(400, 180, 48, 0, Math.PI * 2); g.fill();
  g.strokeStyle = '#141414'; g.lineWidth = 8; g.stroke();
  g.fillStyle = '#141414'; g.font = `900 36px ${FONT}`; g.textAlign = 'center'; g.textBaseline = 'middle';
  g.fillText('3Dモデルを読み込み中…', 400, 80);
  writeFileSync(join(IMG, 'monument-poster.png'), c.toBuffer('image/png'));
  console.log('wrote', join(IMG, 'monument-poster.png'));
}

// ---------- 効果音 (wav, 22050Hz mono 16bit) ----------
function wav(samples, rate = 22050) {
  const buf = Buffer.alloc(44 + samples.length * 2);
  buf.write('RIFF', 0); buf.writeUInt32LE(36 + samples.length * 2, 4); buf.write('WAVE', 8);
  buf.write('fmt ', 12); buf.writeUInt32LE(16, 16); buf.writeUInt16LE(1, 20); buf.writeUInt16LE(1, 22);
  buf.writeUInt32LE(rate, 24); buf.writeUInt32LE(rate * 2, 28); buf.writeUInt16LE(2, 32); buf.writeUInt16LE(16, 34);
  buf.write('data', 36); buf.writeUInt32LE(samples.length * 2, 40);
  samples.forEach((v, i) => buf.writeInt16LE(Math.max(-1, Math.min(1, v)) * 32767, 44 + i * 2));
  return buf;
}
function tone(freqs, seconds, rate = 22050, decay = 4) {
  const n = Math.floor(seconds * rate); const out = new Float32Array(n);
  for (let i = 0; i < n; i++) {
    const t = i / rate; let v = 0;
    for (const [f, start, amp] of freqs) if (t >= start) v += amp * Math.sin(2 * Math.PI * f * (t - start)) * Math.exp(-decay * (t - start));
    out[i] = v * 0.6;
  }
  return out;
}
// ピンポーン（E5 → C5）
writeFileSync(join(AUD, 'chime.wav'), wav(tone([[659.25, 0, 1], [523.25, 0.28, 1]], 1.4, 22050, 3)));
// ポン
writeFileSync(join(AUD, 'pon.wav'), wav(tone([[880, 0, 1], [1320, 0, 0.3]], 0.25, 22050, 18)));
// 発車（ドアが閉まるチャイム「ピンポン」×3 → 低い走行音が立ち上がる）
{
  const chime = [];
  for (let k = 0; k < 3; k++) chime.push([987.77, k * 0.45, 0.7], [783.99, k * 0.45 + 0.2, 0.7]);
  const a = tone(chime, 1.6, 22050, 10);
  const rate = 22050, n = Math.floor(2.2 * rate), rumble = new Float32Array(n);
  let ph = 0;
  for (let i = 0; i < n; i++) {
    const t = i / rate; const f = 40 + t * 60;  ph += 2 * Math.PI * f / rate;   // 徐々に高く（加速）
    const env = Math.min(1, t / 0.8) * Math.max(0, 1 - Math.max(0, t - 1.4) / 0.8);
    rumble[i] = (Math.sin(ph) * 0.5 + (Math.random() - 0.5) * 0.35) * env * 0.5;
  }
  const out = new Float32Array(a.length + n - Math.floor(0.4 * rate));
  a.forEach((v, i) => out[i] += v);
  rumble.forEach((v, i) => { const j = i + a.length - Math.floor(0.4 * rate); if (j < out.length) out[j] += v; });
  writeFileSync(join(AUD, 'hassha.wav'), wav(out));
}
console.log('wrote', join(AUD, 'chime.wav'), join(AUD, 'pon.wav'), join(AUD, 'hassha.wav'));
