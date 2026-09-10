// デモA・B 共通の処理（はじめる画面 / 音声の解錠 / 状態表示 / 吹き出し用の部品）
// ※ A-Frame と MindAR を読み込んだ後に読み込むこと

/* ---------- 日本語が書ける板（吹き出し・テキストパネル） ----------
   A-Frame 標準の <a-text> は日本語フォントを持っていないので、
   canvas に文字を描いて板(a-plane)に貼る。
   使い方: <a-plane text-board="text: こんにちは; style: bubble"></a-plane>
*/
AFRAME.registerComponent('text-board', {
  schema: {
    text:   { default: '' },
    title:  { default: '' },
    style:  { default: 'bubble' },   // bubble(吹き出し) / panel(掲示板) / label(帯)
    width:  { default: 1024 },       // canvas の横幅(px)
    height: { default: 512 },
    fontSize: { default: 64 },
  },
  init() { this.draw(); this.el.addEventListener('object3dset', () => this.apply()); },
  update(old) { if (old.text !== undefined && (old.text !== this.data.text || old.title !== this.data.title)) this.draw(); },
  draw() {
    const d = this.data;
    const c = document.createElement('canvas'); c.width = d.width; c.height = d.height;
    const g = c.getContext('2d');
    const FONT = '"BIZ UDPGothic","Hiragino Sans","Noto Sans JP","Yu Gothic",Meiryo,sans-serif';
    const pad = 40, border = 14, r = 40;
    g.clearRect(0, 0, c.width, c.height);

    if (d.style === 'bubble') {
      // 白い吹き出し + 黒枠 + しっぽ
      const w = c.width - pad * 2, h = c.height - pad * 2 - 70;
      g.beginPath();
      g.roundRect(pad, pad, w, h, r);
      g.moveTo(pad + w * 0.25, pad + h); g.lineTo(pad + w * 0.15, pad + h + 70); g.lineTo(pad + w * 0.4, pad + h);
      g.fillStyle = '#ffffff'; g.fill();
      g.lineWidth = border; g.strokeStyle = '#141414'; g.lineJoin = 'round'; g.stroke();
      // しっぽの継ぎ目を消す
      g.fillStyle = '#ffffff'; g.fillRect(pad + w * 0.15 + border, pad + h - border, w * 0.25 - border * 2, border * 2);
      g.fillStyle = '#141414';
      this.wrapText(g, d.text, pad + w / 2, pad + h / 2, w - pad * 2, d.fontSize, FONT, 'center');
    } else if (d.style === 'panel') {
      // 回覧板風: 生成り紙 + 赤いタイトル
      g.fillStyle = '#fff9e6'; g.fillRect(0, 0, c.width, c.height);
      g.lineWidth = border; g.strokeStyle = '#141414'; g.strokeRect(border / 2, border / 2, c.width - border, c.height - border);
      let top = pad;
      if (d.title) {
        g.font = `900 ${d.fontSize * 0.9}px ${FONT}`; g.textBaseline = 'middle'; g.textAlign = 'left';
        const tw = g.measureText(d.title).width + 60;
        g.fillStyle = '#d0342c'; g.fillRect(pad, pad, tw, d.fontSize * 1.3);
        g.fillStyle = '#fff'; g.fillText(d.title, pad + 30, pad + d.fontSize * 0.68);
        top = pad + d.fontSize * 1.3 + 30;
      }
      g.fillStyle = '#141414';
      this.wrapText(g, d.text, pad, top, c.width - pad * 2, d.fontSize * 0.8, FONT, 'left', true);
    } else {
      // label: 黒帯に白文字
      g.fillStyle = 'rgba(20,20,20,.9)'; g.fillRect(0, 0, c.width, c.height);
      g.fillStyle = '#f7c600'; g.fillRect(0, 0, c.width, 12);
      g.fillStyle = '#fff';
      this.wrapText(g, d.text, c.width / 2, c.height / 2, c.width - pad * 2, d.fontSize, FONT, 'center');
    }
    this.canvas = c;
    this.apply();
  },
  // 改行(\n)と自動折り返しに対応した文字描画
  wrapText(g, text, x, y, maxW, size, font, align, fromTop) {
    g.font = `900 ${size}px ${font}`; g.textAlign = align; g.textBaseline = 'middle';
    const lines = [];
    for (const para of String(text).split(/\\n|\n/)) {
      let line = '';
      for (const ch of para) {
        if (g.measureText(line + ch).width > maxW && line) { lines.push(line); line = ch; } else line += ch;
      }
      lines.push(line);
    }
    const lh = size * 1.35;
    const startY = fromTop ? y + lh / 2 : y - (lines.length - 1) * lh / 2;
    lines.forEach((l, i) => g.fillText(l, x, startY + i * lh));
  },
  apply() {
    const mesh = this.el.getObject3D('mesh');
    if (!mesh || !this.canvas) return;
    if (this.texture) this.texture.dispose();
    this.texture = new THREE.CanvasTexture(this.canvas);
    if ('colorSpace' in this.texture) this.texture.colorSpace = THREE.SRGBColorSpace; else this.texture.encoding = THREE.sRGBEncoding;
    const mat = new THREE.MeshBasicMaterial({ map: this.texture, transparent: true, side: THREE.DoubleSide });
    mesh.material = mat;
  },
});

/* ---------- 共通のAR起動まわり ---------- */
const AR = {
  sceneEl: null,
  found: false,

  // はじめる画面。タップの中で音声を解錠してから MindAR を start する（iOS対策・必須）
  setupGate({ onStart, audios = [] }) {
    const gate = document.getElementById('gate');
    const btn = document.getElementById('start-btn');
    this.sceneEl = document.querySelector('a-scene');
    btn.addEventListener('click', async () => {
      btn.disabled = true; btn.textContent = 'カメラを起動中…';
      // 音声の解錠: ユーザー操作の中で play → pause
      for (const a of audios) {
        try { a.muted = false; await a.play(); a.pause(); a.currentTime = 0; } catch (e) { /* 失敗しても続行 */ }
      }
      // 読み上げの解錠
      if (window.speechSynthesis) { try { speechSynthesis.cancel(); speechSynthesis.speak(new SpeechSynthesisUtterance('')); } catch (e) {} }
      const start = () => {
        const sys = this.sceneEl.systems['mindar-image-system'];
        try { sys.start(); } catch (e) { this.setStatus('起動に失敗しました: ' + e.message, 'error'); }
        gate.hidden = true;
        if (onStart) onStart();
      };
      if (this.sceneEl.hasLoaded) start(); else this.sceneEl.addEventListener('loaded', start, { once: true });
    });

    this.sceneEl.addEventListener('arReady', () => this.setStatus('パネルにかざしてください'));
    this.sceneEl.addEventListener('arError', (e) => {
      const code = e.detail && e.detail.error;
      this.setStatus(code === 'VIDEO_FAIL' ? 'カメラを使えませんでした。カメラを許可して再読み込みしてください' : 'ARの起動に失敗しました', 'error');
    });
    this.setStatus('「はじめる」を押してください');
  },

  setStatus(text, kind) {
    const s = document.getElementById('status');
    s.textContent = text;
    s.className = 'status' + (kind ? ' ' + kind : '');
  },

  // 3枚のマーカーすべてに同じ中身を出す。build(targetEl, index) で中身を作る
  attachToAllTargets(build, { onFound, onLost } = {}) {
    const targets = document.querySelectorAll('[mindar-image-target]');
    targets.forEach((t, i) => {
      build(t, i);
      t.addEventListener('targetFound', () => { this.found = true; this.setStatus('認識しました！', 'found'); if (onFound) onFound(t, i); });
      t.addEventListener('targetLost', () => { this.found = false; this.setStatus('パネルにかざしてください'); if (onLost) onLost(t, i); });
    });
  },

  // 認識したときに音を鳴らす / 外れたら止める
  playAudio(a) { if (!a) return; try { a.currentTime = 0; a.play().catch(() => {}); } catch (e) {} },
  stopAudio(a) { if (!a) return; try { a.pause(); a.currentTime = 0; } catch (e) {} },
  speak(text) {
    if (!window.speechSynthesis || !text) return;
    try {
      speechSynthesis.cancel();
      const u = new SpeechSynthesisUtterance(text); u.lang = 'ja-JP'; u.rate = 1.0;
      speechSynthesis.speak(u);
    } catch (e) {}
  },
  stopSpeak() { if (window.speechSynthesis) try { speechSynthesis.cancel(); } catch (e) {} },
};
