// ローポリの電車 3D モデル（glb）を生成する  →  assets/models/train.glb
//
//   node tools/make-train.mjs
//
// ・箱と円柱だけで作った簡易な電車（1両）。テクスチャ無し・単色マテリアル
// ・前が -Z 方向。config.js の departure.direction: "away" でそのまま前進する
// ・長さ 1.3 = パネル横幅の 1.3 倍。config.js の scale で調整
// ・下の COLORS / SIZE を変えると色や大きさが変わる

import { Document, NodeIO } from '@gltf-transform/core';
import { mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const OUT = join(ROOT, 'assets', 'models', 'train.glb');

const COLORS = {           // sRGB (0〜1)
  body:    [0.93, 0.90, 0.82],   // 車体（クリーム）
  stripe:  [0.90, 0.35, 0.10],   // 帯（オレンジ）
  window:  [0.10, 0.16, 0.28],   // 窓（濃紺）
  roof:    [0.55, 0.57, 0.60],   // 屋根（グレー）
  chassis: [0.20, 0.20, 0.22],   // 床下（黒に近い）
  wheel:   [0.08, 0.08, 0.08],   // 車輪
  light:   [1.00, 0.90, 0.40],   // ヘッドライト
  tail:    [0.85, 0.10, 0.10],   // テールライト
  door:    [0.80, 0.77, 0.70],   // ドア（少し暗いクリーム）
};
const SIZE = { length: 1.3, width: 0.32, bodyBottom: 0.10, bodyTop: 0.40 };

// ---------- 形の部品 ----------
const parts = {};   // 材質ごとに頂点をためる
function add(mat, pos, nor, idx) {
  const p = parts[mat] || (parts[mat] = { pos: [], nor: [], idx: [] });
  const base = p.pos.length / 3;
  p.pos.push(...pos); p.nor.push(...nor); p.idx.push(...idx.map(i => i + base));
}
function box(mat, w, h, d, cx, cy, cz) {
  const x = w / 2, y = h / 2, z = d / 2;
  const faces = [
    [[1, 0, 0], [[x, -y, -z], [x, y, -z], [x, y, z], [x, -y, z]]],
    [[-1, 0, 0], [[-x, -y, z], [-x, y, z], [-x, y, -z], [-x, -y, -z]]],
    [[0, 1, 0], [[-x, y, -z], [-x, y, z], [x, y, z], [x, y, -z]]],
    [[0, -1, 0], [[-x, -y, z], [-x, -y, -z], [x, -y, -z], [x, -y, z]]],
    [[0, 0, 1], [[-x, -y, z], [x, -y, z], [x, y, z], [-x, y, z]]],
    [[0, 0, -1], [[x, -y, -z], [-x, -y, -z], [-x, y, -z], [x, y, -z]]],
  ];
  const pos = [], nor = [], idx = [];
  faces.forEach(([n, vs], f) => {
    vs.forEach(v => { pos.push(v[0] + cx, v[1] + cy, v[2] + cz); nor.push(...n); });
    idx.push(f * 4, f * 4 + 1, f * 4 + 2, f * 4, f * 4 + 2, f * 4 + 3);
  });
  add(mat, pos, nor, idx);
}
// X 軸方向に厚みのある円柱（車輪）
function wheel(mat, r, t, cx, cy, cz, seg = 16) {
  const pos = [], nor = [], idx = [];
  for (const side of [-1, 1]) {           // 側面の円盤
    const cIdx = pos.length / 3;
    pos.push(cx + side * t / 2, cy, cz); nor.push(side, 0, 0);
    for (let i = 0; i < seg; i++) {
      const a = i / seg * Math.PI * 2;
      pos.push(cx + side * t / 2, cy + Math.cos(a) * r, cz + Math.sin(a) * r); nor.push(side, 0, 0);
    }
    for (let i = 0; i < seg; i++) {
      const a = cIdx + 1 + i, b = cIdx + 1 + (i + 1) % seg;
      if (side > 0) idx.push(cIdx, a, b); else idx.push(cIdx, b, a);
    }
  }
  const rIdx = pos.length / 3;            // 外周
  for (let i = 0; i < seg; i++) {
    const a = i / seg * Math.PI * 2, ny = Math.cos(a), nz = Math.sin(a);
    for (const side of [-1, 1]) { pos.push(cx + side * t / 2, cy + ny * r, cz + nz * r); nor.push(0, ny, nz); }
  }
  for (let i = 0; i < seg; i++) {
    const a = rIdx + i * 2, b = rIdx + ((i + 1) % seg) * 2;
    idx.push(a, b, a + 1, b, b + 1, a + 1);
  }
  add(mat, pos, nor, idx);
}

// ---------- 電車を組み立てる ----------
const L = SIZE.length, W = SIZE.width, B = SIZE.bodyBottom, T = SIZE.bodyTop, H = T - B, CY = (B + T) / 2;
box('body', W, H, L, 0, CY, 0);                                  // 車体
box('roof', W - 0.04, 0.05, L - 0.06, 0, T + 0.025, 0);           // 屋根
box('chassis', W - 0.02, 0.04, L - 0.10, 0, B - 0.02, 0);         // 床下
for (const x of [-1, 1]) {                                        // 帯（両側面と前後）
  box('stripe', 0.004, 0.04, L, x * (W / 2 + 0.002), B + 0.10, 0);      // 外面 = +0.004
}
box('stripe', W, 0.04, 0.006, 0, B + 0.10, -(L / 2 + 0.002));
box('stripe', W, 0.04, 0.006, 0, B + 0.10, L / 2 + 0.002);
// 側面の窓（片側 5 枚）とドア（2 枚）
const winY = B + 0.20, winH = 0.11, winW = 0.13;
for (const x of [-1, 1]) {
  const sx = x * (W / 2 + 0.006);                                   // 帯より外側に出す（重なりのチラつき防止）
  for (const z of [-0.45, -0.10, 0.10, 0.45]) box('window', 0.006, winH, winW, sx, winY, z);
  for (const z of [-0.275, 0.275]) {                                // ドア（床から屋根近くまで）
    box('door', 0.006, H - 0.04, 0.12, sx, CY - 0.01, z);
    box('window', 0.006, 0.09, 0.08, x * (W / 2 + 0.011), winY, z);  // ドアの窓（ドアの外側）
  }
}
// 前面: 大きな窓・ヘッドライト、後面: 窓・テールライト
box('window', W - 0.08, winH, 0.006, 0, winY, -(L / 2 + 0.003));
for (const x of [-0.10, 0.10]) box('light', 0.05, 0.035, 0.008, x, B + 0.05, -(L / 2 + 0.004));
box('window', W - 0.10, winH - 0.02, 0.006, 0, winY, L / 2 + 0.003);
for (const x of [-0.10, 0.10]) box('tail', 0.04, 0.03, 0.008, x, B + 0.05, L / 2 + 0.004);
// 車輪（片側 4 つ × 2）
for (const x of [-1, 1]) for (const z of [-0.50, -0.36, 0.36, 0.50]) wheel('wheel', 0.055, 0.03, x * (W / 2 - 0.05), 0.055, z);
// 連結器
box('chassis', 0.04, 0.03, 0.05, 0, B - 0.02, -(L / 2 + 0.02));
box('chassis', 0.04, 0.03, 0.05, 0, B - 0.02, L / 2 + 0.02);

// ---------- glb に書き出す ----------
const doc = new Document();
const buffer = doc.createBuffer();
const mesh = doc.createMesh('Train');
for (const [name, p] of Object.entries(parts)) {
  const mat = doc.createMaterial(name).setBaseColorFactor([...COLORS[name], 1]).setMetallicFactor(0).setRoughnessFactor(name === 'window' ? 0.3 : 0.8);
  const prim = doc.createPrimitive()
    .setAttribute('POSITION', doc.createAccessor().setType('VEC3').setArray(new Float32Array(p.pos)).setBuffer(buffer))
    .setAttribute('NORMAL', doc.createAccessor().setType('VEC3').setArray(new Float32Array(p.nor)).setBuffer(buffer))
    .setIndices(doc.createAccessor().setType('SCALAR').setArray(new Uint16Array(p.idx)).setBuffer(buffer))
    .setMaterial(mat);
  mesh.addPrimitive(prim);
}
const node = doc.createNode('Train').setMesh(mesh);
doc.createScene('Scene').addChild(node);
mkdirSync(dirname(OUT), { recursive: true });
await new NodeIO().write(OUT, doc);
const tris = Object.values(parts).reduce((n, p) => n + p.idx.length / 3, 0);
console.log(`できました: ${OUT}（三角形 ${tris} 枚、長さ ${L} × 幅 ${W} × 高さ ${(T + 0.05).toFixed(2)}）`);
