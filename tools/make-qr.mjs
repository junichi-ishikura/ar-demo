// QRコードを生成する  →  assets/qr/*.png
//
//   node tools/make-qr.mjs https://ユーザー名.github.io/webar-demo/
//   または  SITE_URL=https://... node tools/make-qr.mjs
//
// 公開URLはハードコードしない（引数 or 環境変数で受ける）。
// 生成したPNGは print/index.html（印刷用ページ）が読み込む。
// ※ 印刷ページはPNGが無い場合、開いているURLからその場でQRを作るので、
//    ローカル確認だけならこのスクリプトを実行しなくてもよい。

import QRCode from 'qrcode';
import { mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const OUT = join(ROOT, 'assets', 'qr');

let base = process.argv[2] || process.env.SITE_URL;
if (!base) {
  console.error('使い方: node tools/make-qr.mjs https://ユーザー名.github.io/リポジトリ名/');
  process.exit(1);
}
if (!base.endsWith('/')) base += '/';

const PAGES = {
  index:  '',                   // トップ
  marker: 'marker/',            // デモA
  info:   'marker/info.html',   // デモB
  plane:  'plane/',             // デモC
};

mkdirSync(OUT, { recursive: true });
for (const [name, path] of Object.entries(PAGES)) {
  const url = base + path;
  const file = join(OUT, `${name}.png`);
  await QRCode.toFile(file, url, { width: 600, margin: 2, errorCorrectionLevel: 'M' });
  console.log('wrote', file, '->', url);
}
