// 自作の「床に置く」AR（WebXR + three.js）
//   model-viewer の WebXR では Pixel でモデルが出ないことがあったため、Android ではこちらを使う。
//
//   使い方:
//     import { isXRSupported, startFloorAR } from '../lib/xr-place.js';
//     if (await isXRSupported()) await startFloorAR({ object, log });
//
//   ・object : 床に置く three.js の Object3D（足元が y=0、正面が +Z）
//   ・AR に入ると、床を探す → 見つかったら白い輪（レティクル）とモデルが床に出る
//   ・画面をタップ → その場所に固定。もう一度タップ → 輪の場所に置き直す
//   ・モデルの正面は、置いたときのスマホの方を向く
import * as THREE from 'three';

export async function isXRSupported() {
  try { return !!(navigator.xr && await navigator.xr.isSessionSupported('immersive-ar')); }
  catch (e) { return false; }
}

let busy = false;

//   オプション（診断ページ用）:
//   ・layers   : false（既定）= 古くからある描画方式 XRWebGLLayer を使う / true = 新しい WebXR Layers を使う（使えれば）
//   ・overlay  : true（既定）= AR 画面にボタンや案内を重ねる / false = 重ねない（Android の戻るボタンで終了）
//   ・testCube : true = 目の前にピンクの箱（光も影も使わない一番単純な3D）を出す
export async function startFloorAR({ object, log = () => {}, firstDistance = 4, layers = false, overlay: useOverlay = true, testCube = false }) {
  if (busy) return;
  busy = true;

  // ---- AR 中に画面に重ねる UI（DOM オーバーレイ） ----
  const overlay = document.createElement('div');
  overlay.className = 'xr-overlay';
  overlay.innerHTML = `
    <button class="btn white xr-close" type="button">✕ とじる</button>
    <div class="xr-hint">床を映して、スマホをゆっくり左右に動かしてください</div>
    <div class="xr-ver">${typeof APP_VERSION !== 'undefined' ? APP_VERSION : ''}</div>`;
  if (useOverlay) document.body.appendChild(overlay);
  const hint = overlay.querySelector('.xr-hint');
  const setHint = (t) => { hint.textContent = t; hint.hidden = !t; };
  // ボタンを押したときに「床をタップ」扱いにしない
  overlay.querySelectorAll('button').forEach((b) => b.addEventListener('beforexrselect', (e) => e.preventDefault()));

  // ---- three.js ----
  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
  renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
  renderer.setSize(innerWidth, innerHeight);
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.xr.enabled = true;
  renderer.domElement.className = 'xr-canvas';
  document.body.appendChild(renderer.domElement);

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(70, innerWidth / innerHeight, 0.01, 100);
  scene.add(new THREE.HemisphereLight(0xffffff, 0x777777, 1.8));

  // 置く台: モデル + 影を受ける透明な床 + 影を落とす光
  const stage = new THREE.Group();
  stage.visible = false;
  object = object || new THREE.Group();   // 箱だけのテストでは空
  stage.add(object);
  object.traverse((o) => { if (o.isMesh) o.castShadow = true; });
  const size = new THREE.Box3().setFromObject(object).getSize(new THREE.Vector3());
  const span = Math.max(size.x, size.z, 1);
  const shadowFloor = new THREE.Mesh(new THREE.PlaneGeometry(span * 2.5, span * 2.5), new THREE.ShadowMaterial({ opacity: 0.3 }));
  shadowFloor.rotation.x = -Math.PI / 2;
  shadowFloor.receiveShadow = true;
  stage.add(shadowFloor);
  const sun = new THREE.DirectionalLight(0xffffff, 1.6);
  sun.position.set(-span, span * 2, span);
  sun.castShadow = true;
  sun.shadow.mapSize.set(2048, 2048);
  Object.assign(sun.shadow.camera, { left: -span, right: span, top: span, bottom: -span, near: 0.1, far: span * 6 });
  stage.add(sun, sun.target);
  scene.add(stage);

  // テスト用のピンクの箱（MeshBasicMaterial = 光が無くても必ず色が出る）
  const cube = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.3, 0.3), new THREE.MeshBasicMaterial({ color: 0xff00aa }));
  cube.visible = false;
  scene.add(cube);

  // レティクル（床が見つかった場所に出る白い輪）
  const reticle = new THREE.Mesh(
    new THREE.RingGeometry(0.15, 0.2, 40).rotateX(-Math.PI / 2),
    new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.9 }));
  reticle.matrixAutoUpdate = false;
  reticle.visible = false;
  scene.add(reticle);

  // ---- セッション開始 ----
  let session;
  try {
    session = await navigator.xr.requestSession('immersive-ar', useOverlay ? {
      requiredFeatures: ['hit-test'],
      optionalFeatures: ['dom-overlay', 'local-floor'],
      domOverlay: { root: overlay },
    } : { requiredFeatures: ['hit-test'] });
  } catch (e) {
    log('AR を開始できませんでした: ' + e.message);
    cleanup();
    throw e;
  }
  log('AR 開始');

  renderer.xr.setReferenceSpaceType('local');
  // three.js は、ブラウザが WebXR Layers に対応していると自動でそちらを使う。
  // Pixel（Chrome 157）ではその方式で 3D が描かれない疑いがあるので、既定では使わせない（古い XRWebGLLayer にする）
  const layersDesc = window.XRRenderState && Object.getOwnPropertyDescriptor(XRRenderState.prototype, 'layers');
  if (!layers && layersDesc) Object.defineProperty(XRRenderState.prototype, 'layers', { get: () => undefined, configurable: true });
  try {
    await renderer.xr.setSession(session);
  } finally {
    if (!layers && layersDesc) Object.defineProperty(XRRenderState.prototype, 'layers', layersDesc);
  }
  const base = renderer.xr.getBaseLayer();
  log(`描画方式: ${base ? base.constructor.name : '?'}（Layers対応: ${layersDesc ? 'あり' : 'なし'}）`
    + ` / 合成: ${session.environmentBlendMode || '?'} / 重ね表示: ${session.domOverlayState ? session.domOverlayState.type : 'なし'}`);
  const refSpace = renderer.xr.getReferenceSpace();
  const viewerSpace = await session.requestReferenceSpace('viewer');
  let hitSource = null;
  session.requestHitTestSource({ space: viewerSpace })
    .then((s) => { hitSource = s; log('床さがし開始'); })
    .catch((e) => log('床さがしを開始できませんでした: ' + e.message));

  let placed = false, floorFound = false, frames = 0;
  const camPos = new THREE.Vector3(), camDir = new THREE.Vector3(), hitPos = new THREE.Vector3();

  function faceCamera() {
    stage.rotation.y = Math.atan2(camPos.x - stage.position.x, camPos.z - stage.position.z);
  }

  session.addEventListener('select', () => {
    if (!reticle.visible) return;
    stage.position.copy(hitPos);
    faceCamera();
    stage.visible = true;
    placed = true;
    setHint('置きました。もう一度タップすると、白い輪の場所に置き直します');
    setTimeout(() => { if (placed) setHint(''); }, 3000);
    log('タップで固定');
  });

  renderer.setAnimationLoop((t, frame) => {
    if (!frame) return;
    frames++;
    const xrCam = renderer.xr.getCamera();
    xrCam.getWorldPosition(camPos);
    xrCam.getWorldDirection(camDir);

    // 最初のコマ: 床が見つかる前でも、とりあえず目の前（少し下）に出しておく
    if (frames === 2) {
      const views = frame.getViewerPose(refSpace);
      log(`1コマ目: 視点 ${views ? views.views.length : 0} 個 / 画面 ${base && base.framebufferWidth ? base.framebufferWidth + '×' + base.framebufferHeight : '?'}`);
      if (testCube) {
        const d = camDir.clone(); d.y = 0; d.normalize();
        cube.position.copy(camPos).addScaledVector(d, 1.2);
        cube.visible = true;
        log('ピンクの箱を目の前 1.2m に表示');
      }
    }
    if (frames === 2 && !stage.visible && object) {
      camDir.y = 0; camDir.normalize();
      stage.position.copy(camPos).addScaledVector(camDir, firstDistance);
      stage.position.y = camPos.y - 1.4;
      faceCamera();
      stage.visible = true;
      log('仮の位置に表示（床はまだ見つかっていない）');
    }

    if (hitSource) {
      const hits = frame.getHitTestResults(hitSource);
      if (hits.length) {
        const pose = hits[0].getPose(refSpace);
        reticle.visible = true;
        reticle.matrix.fromArray(pose.transform.matrix);
        hitPos.setFromMatrixPosition(reticle.matrix);
        if (!floorFound) {
          floorFound = true;
          setHint('床が見つかりました。置きたい場所をタップ');
          log('床が見つかった');
        }
        if (!placed) { stage.position.copy(hitPos); faceCamera(); }
      } else {
        reticle.visible = false;
      }
    }
    renderer.render(scene, camera);
  });

  overlay.querySelector('.xr-close').addEventListener('click', () => session.end());
  session.addEventListener('end', () => { log('AR 終了'); cleanup(); });

  function cleanup() {
    renderer.setAnimationLoop(null);
    if (hitSource) hitSource.cancel();
    stage.remove(object);           // モデルは呼び出し側で使い回せるように外しておく
    renderer.dispose();
    renderer.domElement.remove();
    overlay.remove();
    busy = false;
  }
}
