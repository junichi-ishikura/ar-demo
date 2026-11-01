// サイトのバージョン番号。更新して push するたびに数字を上げる（画面の右下に小さく出る）
//   スマホで「新しい版が読み込まれているか」を確かめるためのもの。古い番号のままなら、少し待って再読み込み。
const APP_VERSION = "v1.7.0 (2026-11-01)";

document.addEventListener('DOMContentLoaded', function () {
  var el = document.createElement('div');
  el.className = 'app-version';
  el.textContent = APP_VERSION;
  document.body.appendChild(el);
});
