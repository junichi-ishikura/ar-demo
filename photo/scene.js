// デモD 共通: config.js の photoDemo.models を読み込んで、1つのまとまり（Group）に並べる
//   ・buildGroup()  … three.js の Group を作る（撮影モードでそのまま使う）
//   ・toGlbUrl()    … Group を 1つの glb にまとめて blob URL にする（<model-viewer> に渡して床に置く）
import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { GLTFExporter } from 'three/addons/exporters/GLTFExporter.js';

const AXIS = { width: 'x', height: 'y', depth: 'z' };

// 1モデルを読み込み → 足元を床(y=0)・中心を原点に → 指定の大きさ・向き・場所へ
async function loadOne(m, loader) {
  const gltf = await loader.loadAsync(m.glb);
  const model = gltf.scene;
  const box = new THREE.Box3().setFromObject(model);
  const size = box.getSize(new THREE.Vector3());
  const center = box.getCenter(new THREE.Vector3());
  model.position.set(-center.x, -box.min.y, -center.z);   // 足元・中心をそろえる

  const axis = AXIS[m.sizeAxis] || 'y';
  const s = (m.size || 1) / (size[axis] || 1);

  const holder = new THREE.Group();
  holder.name = m.name || 'model';
  holder.add(model);
  holder.scale.setScalar(s);
  holder.rotation.y = THREE.MathUtils.degToRad(m.turn || 0);
  const [x = 0, z = 0] = m.position || [];
  holder.position.set(x, 0, z);
  holder.traverse((o) => { if (o.isMesh) { o.castShadow = true; o.receiveShadow = false; } });
  return holder;
}

export async function buildGroup(models, onProgress) {
  const loader = new GLTFLoader();
  const group = new THREE.Group();
  group.name = 'photo-demo';
  let done = 0;
  const holders = await Promise.all(models.map(async (m) => {
    try {
      const h = await loadOne(m, loader);
      onProgress && onProgress(++done, models.length);
      return h;
    } catch (e) {
      throw new Error(`「${m.name || m.glb}」を読み込めませんでした（${m.glb}）`);
    }
  }));
  holders.forEach((h) => group.add(h));

  // 全体の横・奥行きの中心を原点に（床に置いたとき、全体が真ん中に来るように）
  const box = new THREE.Box3().setFromObject(group);
  const c = box.getCenter(new THREE.Vector3());
  holders.forEach((h) => { h.position.x -= c.x; h.position.z -= c.z; });
  return group;
}

export async function toGlbUrl(group) {
  const glb = await new GLTFExporter().parseAsync(group, { binary: true, onlyVisible: true });
  return URL.createObjectURL(new Blob([glb], { type: 'model/gltf-binary' }));
}
