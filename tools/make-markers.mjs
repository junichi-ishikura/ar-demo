// マーカー画像を生成する  →  assets/markers/marker-1.png 〜 marker-3.png
//
//   npm install            (初回のみ。@napi-rs/canvas を入れる)
//   node tools/make-markers.mjs [枚数] [シード]
//
// 画像トラッキング(MindAR)は「特徴点が多く、高コントラストで、非対称」な画像でないと
// 認識しないので、ランダムな幾何学模様で条件を満たすように作る。
//  ・非対称 / 繰り返しパターンでない
//  ・白黒だけでなく中間調も含む
//  ・画面いっぱいに情報があり、余白が広すぎない
//  ・3枚が互いに似ていない（シードを変え、色のテーマも変える）
// 生成後は MindAR のコンパイラが出すスコアで確認する（README 参照）。

import { createCanvas } from '@napi-rs/canvas';
import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const OUT = join(ROOT, 'assets', 'markers');
const SIZE = 1024;
const COUNT = Number(process.argv[2] || 3);
const SEED = Number(process.argv[3] || 20260910);

// 再現できる乱数（同じシードなら同じ画像）
function rng(seed) {
  let s = seed >>> 0;
  return () => { s = (s * 1664525 + 1013904223) >>> 0; return s / 4294967296; };
}

// 3枚それぞれの色テーマ（標識っぽい色）。各テーマに中間調グレーを混ぜる
const THEMES = [
  { name: 'マーカー1', accent: ['#0b57a4', '#f7c600', '#ffffff'], label: '1' },
  { name: 'マーカー2', accent: ['#d0342c', '#f7c600', '#ffffff'], label: '2' },
  { name: 'マーカー3', accent: ['#1f7a3f', '#f7c600', '#ffffff'], label: '3' },
];
const GLYPHS = ['あ', 'る', 'ま', 'ち', '駅', '道', '坂', '橋', '↑', '→', '↗', '7', '3', '5', '9', '※', '〒', '#'];

function gray(r) { const v = Math.round(40 + r() * 180); return `rgb(${v},${v},${v})`; }

function drawMarker(index) {
  const r = rng(SEED + index * 7919);
  const theme = THEMES[index % THEMES.length];
  const c = createCanvas(SIZE, SIZE);
  const g = c.getContext('2d');

  // 下地: 少しずつ明るさの違うタイル（中間調を確保しつつ均一にしない）
  const cols = 6 + Math.floor(r() * 3);
  const rows = 6 + Math.floor(r() * 3);
  for (let y = 0; y < rows; y++) for (let x = 0; x < cols; x++) {
    g.fillStyle = gray(r);
    g.fillRect(x * SIZE / cols, y * SIZE / rows, SIZE / cols + 1, SIZE / rows + 1);
  }

  // 太い斜め帯（非対称にするため中心をずらす）
  g.save();
  g.translate(SIZE * (0.3 + r() * 0.4), SIZE * (0.3 + r() * 0.4));
  g.rotate(r() * Math.PI);
  g.fillStyle = theme.accent[0];
  g.fillRect(-SIZE, -60 - r() * 80, SIZE * 2, 120 + r() * 160);
  g.restore();

  // ランダム図形をたくさん
  const n = 70 + Math.floor(r() * 30);
  for (let i = 0; i < n; i++) {
    const kind = Math.floor(r() * 5);
    const x = r() * SIZE, y = r() * SIZE;
    const s = 30 + r() * 180;
    const pick = r();
    g.fillStyle = pick < 0.55 ? gray(r) : theme.accent[Math.floor(r() * theme.accent.length)];
    g.strokeStyle = r() < 0.5 ? '#141414' : '#ffffff';
    g.lineWidth = 4 + r() * 14;
    g.globalAlpha = 0.75 + r() * 0.25;
    g.beginPath();
    if (kind === 0) {               // 円
      g.arc(x, y, s / 2, 0, Math.PI * 2);
      g.fill(); if (r() < 0.6) g.stroke();
    } else if (kind === 1) {        // 多角形
      const k = 3 + Math.floor(r() * 4);
      const rot = r() * Math.PI * 2;
      for (let j = 0; j < k; j++) {
        const a = rot + j / k * Math.PI * 2;
        const rr = s / 2 * (0.6 + r() * 0.4);
        g[j ? 'lineTo' : 'moveTo'](x + Math.cos(a) * rr, y + Math.sin(a) * rr);
      }
      g.closePath(); g.fill(); if (r() < 0.6) g.stroke();
    } else if (kind === 2) {        // 太線
      g.moveTo(x, y); g.lineTo(x + (r() - 0.5) * s * 3, y + (r() - 0.5) * s * 3);
      g.stroke();
    } else if (kind === 3) {        // 弧
      g.arc(x, y, s, r() * Math.PI * 2, r() * Math.PI * 2);
      g.stroke();
    } else {                        // 四角
      g.save(); g.translate(x, y); g.rotate(r() * Math.PI);
      g.fillRect(-s / 2, -s / 4, s, s / 2); if (r() < 0.5) g.strokeRect(-s / 2, -s / 4, s, s / 2);
      g.restore();
    }
  }
  g.globalAlpha = 1;

  // 文字（特徴点が増える。標識・地図記号の雰囲気）
  for (let i = 0; i < 10; i++) {
    const t = GLYPHS[Math.floor(r() * GLYPHS.length)];
    g.save();
    g.translate(r() * SIZE, r() * SIZE);
    g.rotate((r() - 0.5) * 1.2);
    g.font = `900 ${80 + r() * 160}px "IPAGothic","Noto Sans CJK JP","Hiragino Sans",sans-serif`;
    g.fillStyle = r() < 0.5 ? '#141414' : '#ffffff';
    g.strokeStyle = r() < 0.5 ? '#ffffff' : '#141414';
    g.lineWidth = 8;
    g.strokeText(t, 0, 0); g.fillText(t, 0, 0);
    g.restore();
  }

  // 番号バッジ（隅。どのマーカーか分かるように。位置は毎回ずらす）
  const bx = r() < 0.5 ? 110 : SIZE - 110, by = r() < 0.5 ? 110 : SIZE - 110;
  g.fillStyle = '#ffffff'; g.beginPath(); g.arc(bx, by, 80, 0, Math.PI * 2); g.fill();
  g.lineWidth = 10; g.strokeStyle = '#141414'; g.stroke();
  g.fillStyle = '#141414'; g.font = '900 110px "IPAGothic","Noto Sans CJK JP",sans-serif';
  g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText(theme.label, bx, by + 6);

  // 外枠（印刷時の切り取り目安。細め）
  g.lineWidth = 16; g.strokeStyle = '#141414'; g.strokeRect(8, 8, SIZE - 16, SIZE - 16);

  return c.toBuffer('image/png');
}

mkdirSync(OUT, { recursive: true });
for (let i = 0; i < COUNT; i++) {
  const file = join(OUT, `marker-${i + 1}.png`);
  writeFileSync(file, drawMarker(i));
  console.log('wrote', file);
}
console.log('\n次: marker/targets.mind を作る（README「[人手] .mind のコンパイル」を参照）');
