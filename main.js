import * as THREE from 'https://unpkg.com/three@0.161.0/build/three.module.js';
import { OrbitControls } from 'https://unpkg.com/three@0.161.0/examples/jsm/controls/OrbitControls.js';
import { GLTFLoader } from 'https://unpkg.com/three@0.161.0/examples/jsm/loaders/GLTFLoader.js';

// 0_ 取得畫布與按鈕元素
const canvas = document.querySelector('#c');
const toggleConesBtn = document.querySelector('#toggleCones');
const resetBtn = document.querySelector('#resetBtn');
const topViewBtn = document.querySelector('#topViewBtn');

if (!canvas) {
  throw new Error('找不到 #c 畫布元素，請確認 index.html 內有 <canvas id="c"></canvas>');
}

// 1_ 建立提示文字區塊（用來顯示載入中 / 失敗）
const statusEl = document.createElement('div');
statusEl.style.position = 'absolute';
statusEl.style.left = '50%';
statusEl.style.top = '50%';
statusEl.style.transform = 'translate(-50%, -50%)';
statusEl.style.padding = '12px 16px';
statusEl.style.borderRadius = '12px';
statusEl.style.background = 'rgba(8, 14, 28, 0.82)';
statusEl.style.color = '#eef3ff';
statusEl.style.fontSize = '14px';
statusEl.style.lineHeight = '1.6';
statusEl.style.zIndex = '20';
statusEl.style.pointerEvents = 'none';
statusEl.style.whiteSpace = 'pre-wrap';
statusEl.textContent = '3D 模型載入中...';
if (canvas.parentElement) {
  canvas.parentElement.style.position = 'relative';
  canvas.parentElement.appendChild(statusEl);
}

// 2_ 建立 Renderer
const renderer = new THREE.WebGLRenderer({
  canvas,
  antialias: true,
  alpha: true,
});
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.outputColorSpace = THREE.SRGBColorSpace;

// 3_ 建立場景
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x060b16);

// 4_ 建立相機
const camera = new THREE.PerspectiveCamera(48, 2, 0.1, 100);
camera.position.set(9, 7, 11);

// 5_ 建立控制器
const controls = new OrbitControls(camera, canvas);
controls.target.set(2.8, 0.8, 1.8);
controls.enableDamping = true;
controls.maxDistance = 35;
controls.minDistance = 2;

// 6_ 燈光
scene.add(new THREE.AmbientLight(0xffffff, 1.25));

const dirLight = new THREE.DirectionalLight(0xffffff, 1.1);
dirLight.position.set(5, 8, 6);
scene.add(dirLight);

// 7_ 地板格線與座標軸
const grid = new THREE.GridHelper(24, 24, 0x2c457e, 0x1b2747);
grid.position.y = -0.02;
scene.add(grid);

const axes = new THREE.AxesHelper(1.4);
axes.position.set(-0.5, 0, -0.5);
scene.add(axes);

// 8_ 值班桌近似區域
const deskGroup = new THREE.Group();
scene.add(deskGroup);

function createDeskZone() {
  const geo = new THREE.BoxGeometry(3.8, 0.78, 1.7);
  const mat = new THREE.MeshStandardMaterial({
    color: 0xffd96b,
    transparent: true,
    opacity: 0.28,
  });
  const mesh = new THREE.Mesh(geo, mat);
  mesh.position.set(5.0, 0.38, 1.1);
  deskGroup.add(mesh);

  const edge = new THREE.LineSegments(
    new THREE.EdgesGeometry(geo),
    new THREE.LineBasicMaterial({ color: 0xffd96b })
  );
  edge.position.copy(mesh.position);
  deskGroup.add(edge);
}
createDeskZone();

// 9_ 產生攝影機標籤
function makeCameraLabel(text, color) {
  const c = document.createElement('canvas');
  c.width = 256;
  c.height = 96;

  const ctx = c.getContext('2d');
  if (!ctx) return new THREE.Sprite();

  ctx.fillStyle = 'rgba(10,16,32,0.88)';
  ctx.fillRect(0, 0, c.width, c.height);

  ctx.strokeStyle = color;
  ctx.lineWidth = 6;
  ctx.strokeRect(3, 3, c.width - 6, c.height - 6);

  ctx.fillStyle = '#eef3ff';
  ctx.font = 'bold 34px sans-serif';
  ctx.fillText(text, 24, 58);

  const tex = new THREE.CanvasTexture(c);
  const mat = new THREE.SpriteMaterial({ map: tex, transparent: true });
  const sprite = new THREE.Sprite(mat);
  sprite.scale.set(1.6, 0.6, 1);
  return sprite;
}

// 10_ 建立攝影機覆蓋模型
function makeCameraRig({ name, color, pos, target, range = 6.5, fov = 100 }) {
  const group = new THREE.Group();
  group.position.copy(pos);

  const body = new THREE.Mesh(
    new THREE.SphereGeometry(0.08, 20, 20),
    new THREE.MeshStandardMaterial({ color })
  );
  group.add(body);

  const mount = new THREE.Mesh(
    new THREE.CylinderGeometry(0.018, 0.018, 0.18, 12),
    new THREE.MeshStandardMaterial({ color: 0xd9e7ff })
  );
  mount.rotation.z = Math.PI / 2;
  mount.position.set(-0.09, 0.03, 0);
  group.add(mount);

  const label = makeCameraLabel(name, `#${new THREE.Color(color).getHexString()}`);
  label.position.set(0, 0.22, 0);
  group.add(label);

  const dir = target.clone().sub(pos).normalize();
  const coneRadius = Math.tan(THREE.MathUtils.degToRad(fov / 2)) * range;

  const coneGeo = new THREE.ConeGeometry(coneRadius, range, 40, 1, true);
  coneGeo.translate(0, -range / 2, 0);

  const coneMat = new THREE.MeshBasicMaterial({
    color,
    transparent: true,
    opacity: 0.16,
    depthWrite: false,
    side: THREE.DoubleSide,
  });

  const cone = new THREE.Mesh(coneGeo, coneMat);
  const axis = new THREE.Vector3(0, -1, 0);
  cone.quaternion.setFromUnitVectors(axis, dir);
  cone.position.copy(pos);

  const outline = new THREE.LineSegments(
    new THREE.EdgesGeometry(coneGeo),
    new THREE.LineBasicMaterial({
      color,
      transparent: true,
      opacity: 0.65,
    })
  );
  outline.quaternion.copy(cone.quaternion);
  outline.position.copy(pos);

  const sight = new THREE.ArrowHelper(dir, pos, 1.1, color, 0.16, 0.08);

  scene.add(group, cone, outline, sight);

  return { group, cone, outline, sight };
}

// 11_ 兩支攝影機
const rigA = makeCameraRig({
  name: 'Camera A',
  color: 0x3fe0a5,
  pos: new THREE.Vector3(0.2, 1.85, 5.15),
  target: new THREE.Vector3(1.4, 0.9, 1.7),
});

const rigB = makeCameraRig({
  name: 'Camera B',
  color: 0xff8f6b,
  pos: new THREE.Vector3(3.95, 1.85, 5.12),
  target: new THREE.Vector3(5.4, 0.9, 0.8),
});

const coverageObjects = [
  rigA.cone, rigA.outline, rigA.sight,
  rigB.cone, rigB.outline, rigB.sight,
];

let conesVisible = true;

// 12_ 按鈕功能
if (toggleConesBtn) {
  toggleConesBtn.addEventListener('click', () => {
    conesVisible = !conesVisible;
    coverageObjects.forEach((obj) => {
      obj.visible = conesVisible;
    });
    toggleConesBtn.textContent = conesVisible ? '關閉覆蓋錐體' : '開啟覆蓋錐體';
  });
}

if (resetBtn) {
  resetBtn.addEventListener('click', () => {
    camera.position.set(9, 7, 11);
    controls.target.set(2.8, 0.8, 1.8);
    controls.update();
  });
}

if (topViewBtn) {
  topViewBtn.addEventListener('click', () => {
    camera.position.set(2.8, 15.5, 1.8);
    controls.target.set(2.8, 0.0, 1.8);
    controls.update();
  });
}

// 13_ 載入 GLB 模型
const loader = new GLTFLoader();

loader.load(
  './scene.glb',
  (gltf) => {
    const root = gltf.scene;

    root.traverse((obj) => {
      if (obj.isMesh) {
        obj.castShadow = false;
        obj.receiveShadow = false;

        if (obj.material) {
          if (Array.isArray(obj.material)) {
            obj.material.forEach((m) => {
              m.side = THREE.FrontSide;
            });
          } else {
            obj.material.side = THREE.FrontSide;
          }
        }
      }
    });

    scene.add(root);
    statusEl.textContent = '';
    statusEl.style.display = 'none';
  },
  undefined,
  (err) => {
    console.error('GLB 載入失敗：', err);
    statusEl.style.display = 'block';
    statusEl.textContent =
      '3D 模型載入失敗。\n請確認 scene.glb 是否和 index.html、main.js 放在同一層。';
  }
);

// 14_ 尺寸調整
function resizeRendererToDisplaySize() {
  const width = Math.max(1, canvas.clientWidth);
  const height = Math.max(1, canvas.clientHeight);

  const needResize = canvas.width !== width || canvas.height !== height;
  if (needResize) {
    renderer.setSize(width, height, false);
  }
  return needResize;
}

window.addEventListener('resize', () => {
  if (resizeRendererToDisplaySize()) {
    camera.aspect = canvas.clientWidth / canvas.clientHeight;
    camera.updateProjectionMatrix();
  }
});

// 15_ 渲染迴圈
function render() {
  if (resizeRendererToDisplaySize()) {
    camera.aspect = canvas.clientWidth / canvas.clientHeight;
    camera.updateProjectionMatrix();
  }

  controls.update();
  renderer.render(scene, camera);
  requestAnimationFrame(render);
}

render();
