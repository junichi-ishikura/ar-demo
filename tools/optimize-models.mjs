// 重い 3D モデル（AI生成など）をスマホ向けに軽くする
//
//   node tools/optimize-models.mjs                       … 下の JOBS をまとめて処理
//   node tools/optimize-models.mjs in.glb out.glb 60000  … 1ファイルだけ（最後の数字 = 目標の三角形数）
//
// やっていること
//   1. スキン（骨）が入っていたら、今のポーズのまま普通のメッシュに焼き込む
//      （アニメが無いモデルの骨は不要。USDZ 変換や AR Quick Look でのトラブルの元になる）
//   2. 三角形を減らす（meshoptimizer）。200万枚 → 数万枚
//   3. テクスチャを 1024px の JPEG にする
//   4. 向きを直す（ROTATE_X）・足元を y=0 に、横と奥行きの中心を原点にそろえる
//
// 必要なもの: npm install（@gltf-transform/* と meshoptimizer、@napi-rs/canvas を使う）

import { NodeIO, getBounds } from '@gltf-transform/core';
import { ALL_EXTENSIONS } from '@gltf-transform/extensions';
import { dedup, weld, simplify, prune, compactPrimitive } from '@gltf-transform/functions';
import { MeshoptSimplifier } from 'meshoptimizer';
import { createCanvas, loadImage } from '@napi-rs/canvas';
import { statSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const M = (f) => join(ROOT, 'assets', 'models', f);

// 元ファイル → 軽量版。tris = 目標の三角形数、rotateX / rotateY = 向きを直す角度（度）
const JOBS = [
  //   dandan.glb … 床に寝た文字 → X軸で 90° 起こして、文字の正面を手前(+Z)に向ける
  //   swan.glb   … 頭が -X 向き → Y軸で 90° 回して、正面を手前(+Z)に向ける
  { in: M('dandan.glb'), out: M('dandan-web.glb'), tris: 80000, rotateX: 90 },
  { in: M('swan.glb'),   out: M('swan-web.glb'),   tris: 80000, rotateY: 90 },
];
const TEXTURE_SIZE = 1024;
const JPEG_QUALITY = 85;

// ---------- 4x4 行列（列優先） ----------
function mul(a, b) {
  const o = new Array(16).fill(0);
  for (let c = 0; c < 4; c++) for (let r = 0; r < 4; r++)
    for (let k = 0; k < 4; k++) o[c * 4 + r] += a[k * 4 + r] * b[c * 4 + k];
  return o;
}
const xfPoint = (m, x, y, z) => [
  m[0] * x + m[4] * y + m[8] * z + m[12],
  m[1] * x + m[5] * y + m[9] * z + m[13],
  m[2] * x + m[6] * y + m[10] * z + m[14],
];
const xfDir = (m, x, y, z) => [m[0] * x + m[4] * y + m[8] * z, m[1] * x + m[5] * y + m[9] * z, m[2] * x + m[6] * y + m[10] * z];

// ---------- 1. スキンを焼き込む ----------
function bakeSkins(doc) {
  const root = doc.getRoot();
  const scene = root.listScenes()[0];
  for (const node of root.listNodes()) {
    const skin = node.getSkin(); const mesh = node.getMesh();
    if (!skin || !mesh) continue;
    const joints = skin.listJoints();
    const ibm = skin.getInverseBindMatrices();
    const jm = joints.map((j, i) => {
      const inv = ibm ? ibm.getElement(i, new Array(16)) : [1,0,0,0, 0,1,0,0, 0,0,1,0, 0,0,0,1];
      return mul(j.getWorldMatrix(), inv);
    });
    for (const prim of mesh.listPrimitives()) {
      const pos = prim.getAttribute('POSITION'), nor = prim.getAttribute('NORMAL');
      const J = prim.getAttribute('JOINTS_0'), W = prim.getAttribute('WEIGHTS_0');
      if (!J || !W) continue;
      const p = [], n = [], j = [], w = [];
      for (let i = 0; i < pos.getCount(); i++) {
        pos.getElement(i, p); J.getElement(i, j); W.getElement(i, w);
        if (nor) nor.getElement(i, n);
        let px = 0, py = 0, pz = 0, nx = 0, ny = 0, nz = 0;
        for (let k = 0; k < 4; k++) {
          if (!w[k]) continue;
          const m = jm[j[k]];
          const tp = xfPoint(m, p[0], p[1], p[2]);
          px += tp[0] * w[k]; py += tp[1] * w[k]; pz += tp[2] * w[k];
          if (nor) { const tn = xfDir(m, n[0], n[1], n[2]); nx += tn[0] * w[k]; ny += tn[1] * w[k]; nz += tn[2] * w[k]; }
        }
        pos.setElement(i, [px, py, pz]);
        if (nor) { const l = Math.hypot(nx, ny, nz) || 1; nor.setElement(i, [nx / l, ny / l, nz / l]); }
      }
      prim.setAttribute('JOINTS_0', null); prim.setAttribute('WEIGHTS_0', null);
    }
    // 焼き込んだメッシュはワールド座標そのまま → 変換なしのノードでシーン直下に置く
    const baked = doc.createNode(node.getName() || 'baked').setMesh(mesh);
    node.setMesh(null).setSkin(null);
    scene.addChild(baked);
    console.log(`  スキンを焼き込み: ${joints.length} 本の骨`);
  }
  // 骨のノードは不要になるので消す（シーン直下にメッシュだけ残す）
  for (const child of scene.listChildren()) if (!child.getMesh()) child.dispose();
  for (const s of root.listSkins()) s.dispose();
}

// ---------- 3. テクスチャ縮小 ----------
async function shrinkTextures(doc) {
  for (const tex of doc.getRoot().listTextures()) {
    const img = await loadImage(Buffer.from(tex.getImage()));
    const s = Math.min(1, TEXTURE_SIZE / Math.max(img.width, img.height));
    const w = Math.round(img.width * s), h = Math.round(img.height * s);
    const cv = createCanvas(w, h);
    cv.getContext('2d').drawImage(img, 0, 0, w, h);
    tex.setImage(new Uint8Array(cv.toBuffer('image/jpeg', JPEG_QUALITY))).setMimeType('image/jpeg');
  }
}

// ---------- 4. 向き・原点 ----------
function normalize(doc, rotateXDeg, rotateYDeg) {
  const scene = doc.getRoot().listScenes()[0];
  const wrapper = doc.createNode('root');
  for (const c of scene.listChildren()) { scene.removeChild(c); wrapper.addChild(c); }
  scene.addChild(wrapper);
  // 先に X、次に Y で回す（q = qY * qX）
  const ax = (rotateXDeg * Math.PI) / 360, ay = (rotateYDeg * Math.PI) / 360;
  const [sx, cx, sy, cy] = [Math.sin(ax), Math.cos(ax), Math.sin(ay), Math.cos(ay)];
  wrapper.setRotation([cy * sx, sy * cx, -sy * sx, cy * cx]);
  const b = getBounds(scene);
  const t = wrapper.getTranslation();
  wrapper.setTranslation([t[0] - (b.min[0] + b.max[0]) / 2, t[1] - b.min[1], t[2] - (b.min[2] + b.max[2]) / 2]);
  const b2 = getBounds(scene);
  return b2.max.map((v, i) => +(v - b2.min[i]).toFixed(3));
}

const triCount = (doc) => doc.getRoot().listMeshes().flatMap(m => m.listPrimitives())
  .reduce((s, p) => s + (p.getIndices() ? p.getIndices().getCount() : p.getAttribute('POSITION').getCount()) / 3, 0);

async function run(job) {
  const io = new NodeIO().registerExtensions(ALL_EXTENSIONS);
  console.log(`▶ ${job.in}`);
  const doc = await io.read(job.in);
  bakeSkins(doc);
  const before = triCount(doc);
  await MeshoptSimplifier.ready;
  await doc.transform(
    dedup(),
    weld(),
    simplify({ simplifier: MeshoptSimplifier, ratio: Math.min(1, job.tris / before), error: 0.02, lockBorder: false }),
  );
  // 縫い目(UVの切れ目)が多いメッシュは上の simplify が途中で止まる → 形だけ見て間引く simplifySloppy で仕上げる
  if (triCount(doc) > job.tris * 1.2) {
    for (const mesh of doc.getRoot().listMeshes()) for (const prim of mesh.listPrimitives()) {
      const idx = prim.getIndices(); if (!idx) continue;
      const target = Math.round((idx.getCount() / 3) * job.tris / triCount(doc)) * 3;
      const [out] = MeshoptSimplifier.simplifySloppy(new Uint32Array(idx.getArray()),
        prim.getAttribute('POSITION').getArray(), 3, null, target, 0.01);
      idx.setArray(out);
      compactPrimitive(prim);
    }
    console.log('  （simplifySloppy で追加の間引き）');
  }
  await doc.transform(prune());
  await shrinkTextures(doc);
  const size = normalize(doc, job.rotateX || 0, job.rotateY || 0);
  await io.write(job.out, doc);
  console.log(`  三角形 ${Math.round(before).toLocaleString()} → ${Math.round(triCount(doc)).toLocaleString()}`);
  console.log(`  大きさ(幅×高さ×奥行き) ${size.join(' × ')}  /  ${(statSync(job.in).size / 1e6).toFixed(1)}MB → ${(statSync(job.out).size / 1e6).toFixed(1)}MB  → ${job.out}`);
}

const [inArg, outArg, trisArg] = process.argv.slice(2);
const jobs = inArg ? [{ in: inArg, out: outArg || inArg.replace(/\.glb$/, '-web.glb'), tris: +trisArg || 80000 }] : JOBS;
for (const j of jobs) await run(j);
