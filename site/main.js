import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';

document.getElementById('yr').textContent = new Date().getFullYear();

// Each Blender model (root node name in electrical.glb) and the part of the CV it represents
const COMPONENTS = [
  { key: 'RailSignal', label: 'Rail Signal', spec: 'SIG · CBTC', tag: 'Railway Systems · Hitachi Rail',
    title: 'Signalling, APS & CBTC',
    body: 'Deputy Construction Manager on Etihad Rail Stage 2 & Passenger Service COSPA, leading installation and commissioning of line-side systems.',
    list: ['SIG, TLC, Power, MEP, APS, SEC & RFD systems', 'Subsystem interface & integration management', 'PTW and track possession planning', 'CBTC, ATS & SCADA on Dubai Metro Route 2020'] },
  { key: 'Transformer', label: 'Power Transformer', spec: '160 MVA', tag: 'HV Power · China Energy HPCC',
    title: 'Transformers & Generation',
    body: 'MBR Solar Park Phase IV — a 750 MW CSP + 250 MW PV hybrid plant in Dubai.',
    list: ['160 MVA HV transformer, 400/15.75 kV', '28 MVA MV & excitation transformers', 'Siemens SST-700 108.5 MW steam turbine', '380 kV substation transformer erection (KSA)'] },
  { key: 'Tower', label: 'Transmission Tower', spec: '400 kV', tag: 'Transmission · FESCO & KSA',
    title: 'Grid & Substations',
    body: 'From a 132 kV grid station in Jhang to 380 kV substations and 400 kV switchyards.',
    list: ['Load sharing between grid stations', '380 kV & 132 kV GIS switchgear', 'Grounding, lightning & protection systems', 'Preventive & corrective maintenance'] },
  { key: 'Switchgear', label: 'MV Switchgear', spec: '33 kV', tag: 'Distribution · Alstom Transport',
    title: 'Switchgear & Traction Power',
    body: 'Dubai Metro Red Line Extension — 15.7 km across viaduct, stations and tunnels.',
    list: ['33 kV switchgear, LV & control systems', 'Traction power & HESOP installation', 'Cable terminations, Megger & VLF testing', 'MCCs, VSDs & VFDs at MBR Solar Park'] },
  { key: 'SolarArray', label: 'Solar PV Array', spec: '250 MW', tag: 'Renewables · Tesla Industries',
    title: 'Solar PV Systems',
    body: 'Site engineering and delivery of PV systems for residential, commercial and industrial customers.',
    list: ['Grid-tied, off-grid & hybrid PV', 'Net-metering installations', 'Energy-efficiency evaluation', '250 MW PV at MBR Solar Park'] },
];

const RING = 9, PAD = 2.75;
const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
const canvas = document.getElementById('scene');

const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });   // white page shows through
renderer.setClearColor(0x000000, 0);
renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.05;
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;

const scene = new THREE.Scene();
scene.fog = new THREE.Fog(0xF8FAFC, 24, 60);   // matches the page background; fog is applied after tone mapping so the colour is exact
scene.environment = new THREE.PMREMGenerator(renderer).fromScene(new RoomEnvironment(), 0.04).texture;
scene.environmentIntensity = 0.55;

const camera = new THREE.PerspectiveCamera(38, 1, 0.1, 200);
const controls = new OrbitControls(camera, canvas);
controls.enableDamping = true;
controls.enablePan = false;
controls.enableZoom = false;   // wheel must scroll the page past the hero
controls.minDistance = 6;
controls.maxDistance = 120;
controls.maxPolarAngle = Math.PI * 0.47;

// lights
scene.add(new THREE.HemisphereLight(0xFFFFFF, 0xDDE3EA, 0.7));
const sun = new THREE.DirectionalLight(0xFFF1DE, 1.8);
sun.position.set(10, 18, 8);
sun.castShadow = true;
sun.shadow.mapSize.set(2048, 2048);
Object.assign(sun.shadow.camera, { left: -15, right: 15, top: 15, bottom: -15 });
sun.shadow.bias = -0.0005;
scene.add(sun);

// ground
const ground = new THREE.Mesh(new THREE.CircleGeometry(40, 96), new THREE.ShadowMaterial({ opacity: 0.16 }));   // shadows only, floor stays white
ground.rotation.x = -Math.PI / 2;
ground.receiveShadow = true;
scene.add(ground);
const grid = new THREE.GridHelper(80, 80, 0xCBD5E1, 0xE6EBF1);
grid.position.y = 0.002;
scene.add(grid);

// everything that rotates together
const ring = new THREE.Group();
scene.add(ring);

// central hub
const steel = new THREE.MeshStandardMaterial({ color: 0x1E2733, metalness: 0.7, roughness: 0.4 });
const glowCyan = new THREE.MeshStandardMaterial({ color: 0x22D3EE, emissive: 0x22D3EE, emissiveIntensity: 2 });
const hub = new THREE.Mesh(new THREE.CylinderGeometry(1.3, 1.5, 0.5, 48), steel);
hub.position.y = 0.25; hub.castShadow = hub.receiveShadow = true;
ring.add(hub);
const hubRing = new THREE.Mesh(new THREE.TorusGeometry(1.0, 0.04, 12, 96), glowCyan);
hubRing.rotation.x = Math.PI / 2; hubRing.position.y = 0.52;
ring.add(hubRing);
const core = new THREE.Mesh(new THREE.OctahedronGeometry(0.35), new THREE.MeshStandardMaterial({ color: 0xA78BFA, emissive: 0xA78BFA, emissiveIntensity: 2.5, metalness: 0.3, roughness: 0.3 }));
core.position.y = 1.3;
ring.add(core);

// per-component pedestal ring, cable and pulses
const pulseGeo = new THREE.SphereGeometry(0.07, 12, 12);
const pulseMat = new THREE.MeshBasicMaterial({ color: 0x0EA5E9 });
const cableMat = new THREE.MeshStandardMaterial({ color: 0x1B6E8C, emissive: 0x22D3EE, emissiveIntensity: 0.6, roughness: 0.4 });
const pulses = [];
COMPONENTS.forEach((c, i) => {
  const a = (i / COMPONENTS.length) * Math.PI * 2;
  c.dir = new THREE.Vector3(Math.sin(a), 0, Math.cos(a));
  c.angle = a;

  c.padMat = new THREE.MeshStandardMaterial({ color: 0x2A3446, emissive: 0xA78BFA, emissiveIntensity: 0.25, side: THREE.DoubleSide });
  const pad = new THREE.Mesh(new THREE.RingGeometry(PAD - 0.08, PAD, 96), c.padMat);
  pad.rotation.x = -Math.PI / 2;
  pad.position.copy(c.dir).multiplyScalar(RING).setY(0.01);
  ring.add(pad);

  const start = c.dir.clone().multiplyScalar(1.45).setY(0.3);
  const end = c.dir.clone().multiplyScalar(RING - PAD).setY(0.05);
  const mid = start.clone().lerp(end, 0.5).setY(0.9);
  const curve = new THREE.CatmullRomCurve3([start, mid, end]);
  ring.add(new THREE.Mesh(new THREE.TubeGeometry(curve, 48, 0.035, 8), cableMat));
  for (let k = 0; k < 3; k++) {
    const p = new THREE.Mesh(pulseGeo, pulseMat);
    ring.add(p);
    pulses.push({ p, curve, t: k / 3 });
  }
});

// camera framing: pull back until the whole ring fits the canvas, whatever its aspect ratio
const home = { pos: new THREE.Vector3(), target: new THREE.Vector3() };
const aspect = () => canvas.clientWidth / Math.max(canvas.clientHeight, 1);
function setHome() {
  const a = aspect();
  const R = RING + PAD + 1;                                        // ring radius incl. pedestal pads
  const vTan = Math.tan(THREE.MathUtils.degToRad(camera.fov / 2));
  // landscape: fit the ring to the height; portrait: fit to the width, letting it overflow ~30% (phones)
  const dist = a >= 1 ? R / vTan : (R / (vTan * a)) * 0.7;
  home.target.set(0, a > 1.2 ? -1.5 : -2.5, 0);
  home.pos.copy(home.target).add(new THREE.Vector3(0, dist * 0.38, dist * 0.92));
  scene.fog.near = dist * 0.65;
  scene.fog.far = dist * 1.7;
}

let fly = null;            // { pos, target } the camera eases towards
let selected = null;
controls.addEventListener('start', () => { fly = null; });

function resize() {
  const w = canvas.clientWidth, h = canvas.clientHeight;
  renderer.setSize(w, h, false);
  camera.aspect = w / h;
  camera.updateProjectionMatrix();
}
addEventListener('resize', () => { resize(); setHome(); if (!selected) fly = { ...home }; });
resize();
setHome();
camera.position.copy(home.pos);
controls.target.copy(home.target);

// ---- UI: equipment cards, mission panel, system chips ----
const cards = document.getElementById('cards');
COMPONENTS.forEach((c, i) => {
  const b = document.createElement('button');
  b.setAttribute('aria-pressed', 'false');
  b.innerHTML = `<span class="tag"><b>${c.spec}</b><span>#${i + 1}</span></span><img alt="" width="96" height="96"><span class="name">${c.label}</span>`;
  b.onclick = () => select(selected === c ? null : c);
  cards.append(b);
  c.button = b;
  c.img = b.querySelector('img');
});
document.getElementById('close').onclick = () => select(null);
addEventListener('keydown', e => { if (e.key === 'Escape') select(null); });

const intro = document.getElementById('intro'), detail = document.getElementById('detail');
function select(c) {
  selected = c;
  COMPONENTS.forEach(o => {
    o.button.setAttribute('aria-pressed', String(o === c));
    o.padMat.emissiveIntensity = o === c ? 2 : 0.25;
  });
  intro.hidden = !!c;
  detail.hidden = !c;
  if (!c) { fly = { pos: home.pos.clone(), target: home.target.clone() }; return; }

  document.getElementById('dTag').textContent = c.tag;
  document.getElementById('dTitle').textContent = c.title;
  document.getElementById('dBody').textContent = c.body;
  document.getElementById('dList').replaceChildren(...c.list.map(t => Object.assign(document.createElement('li'), { textContent: t })));

  if (!c.object) return;
  const box = new THREE.Box3().setFromObject(c.object);
  const center = box.getCenter(new THREE.Vector3());
  const size = box.getSize(new THREE.Vector3()).length();
  const out = center.clone().setY(0).normalize();
  const dist = Math.max(size * 1.35, 7) * Math.max(1, 0.85 / aspect());   // further back on portrait screens
  const pos = center.clone().addScaledVector(out, dist).add(new THREE.Vector3(0, dist * 0.35, 0));
  // nudge the model left of centre so the mission panel doesn't cover it
  const right = new THREE.Vector3().crossVectors(out, new THREE.Vector3(0, 1, 0)).multiplyScalar(-1);
  const shift = innerWidth > 860 ? dist * 0.22 : 0;
  fly = { pos: pos.addScaledVector(right, shift), target: center.clone().addScaledVector(right, shift) };
}

// system chips filter the lineside markers on the live map
const map = document.getElementById('map');
document.querySelectorAll('#chips button').forEach(b => {
  b.setAttribute('aria-pressed', 'false');
  b.onclick = () => {
    const on = b.getAttribute('aria-pressed') !== 'true';
    document.querySelectorAll('#chips button').forEach(o => o.setAttribute('aria-pressed', 'false'));
    b.setAttribute('aria-pressed', String(on));
    map.querySelectorAll('.sys').forEach(g => g.classList.toggle('on', on && g.dataset.sys === b.dataset.sys));
    if (on) map.dataset.sys = b.dataset.sys; else delete map.dataset.sys;
  };
});

// picking
const ray = new THREE.Raycaster();
const ndc = new THREE.Vector2();
const pickables = [];
function pick(e) {
  const r = canvas.getBoundingClientRect();
  ndc.set(((e.clientX - r.left) / r.width) * 2 - 1, -((e.clientY - r.top) / r.height) * 2 + 1);
  ray.setFromCamera(ndc, camera);
  const hit = ray.intersectObjects(pickables, true)[0];
  if (!hit) return null;
  let o = hit.object;
  while (o && !o.userData.component) o = o.parent;
  return o?.userData.component ?? null;
}
let hovered = null, downAt = null;
canvas.addEventListener('pointermove', e => {
  const c = pick(e);
  if (c === hovered) return;
  if (hovered && hovered !== selected) hovered.padMat.emissiveIntensity = 0.25;
  hovered = c;
  if (c && c !== selected) c.padMat.emissiveIntensity = 1.2;
  canvas.style.cursor = c ? 'pointer' : 'grab';
});
canvas.addEventListener('pointerdown', e => { downAt = [e.clientX, e.clientY]; });
canvas.addEventListener('pointerup', e => {
  if (!downAt || Math.hypot(e.clientX - downAt[0], e.clientY - downAt[1]) > 5) return; // was a drag
  const c = pick(e);
  if (c) select(c);
});

// render each model once, alone, into a small canvas for the equipment card thumbnails
function thumbnails(comps) {
  const c = document.createElement('canvas');
  const r = new THREE.WebGLRenderer({ canvas: c, antialias: true, alpha: true, preserveDrawingBuffer: true });
  r.setSize(192, 192);
  r.toneMapping = THREE.ACESFilmicToneMapping;
  const s = new THREE.Scene();
  s.environment = new THREE.PMREMGenerator(r).fromScene(new RoomEnvironment(), 0.04).texture;
  s.add(new THREE.HemisphereLight(0xffffff, 0x223344, 1));
  const d = new THREE.DirectionalLight(0xfff1de, 2); d.position.set(3, 5, 4); s.add(d);
  const cam = new THREE.PerspectiveCamera(30, 1, 0.1, 100);
  for (const comp of comps) {
    comp.object.userData = {};                 // clone() JSON-copies userData; the component link is circular
    const o = comp.object.clone();
    comp.object.userData = { component: comp };
    o.position.set(0, 0, 0); o.rotation.set(0, 0, 0);
    s.add(o);
    const box = new THREE.Box3().setFromObject(o);
    const ctr = box.getCenter(new THREE.Vector3()), size = box.getSize(new THREE.Vector3()).length();
    cam.position.copy(ctr).add(new THREE.Vector3(1, 0.6, 1.2).normalize().multiplyScalar(size * 1.05));
    cam.lookAt(ctr);
    r.render(s, cam);
    comp.img.src = c.toDataURL();
    s.remove(o);
  }
  r.dispose();
}

// load the Blender models
new GLTFLoader().load('assets/electrical.glb', gltf => {
  const loaded = [];
  COMPONENTS.forEach(c => {
    const obj = gltf.scene.getObjectByName(c.key);
    if (!obj) return console.warn('missing model', c.key);
    obj.position.copy(c.dir).multiplyScalar(RING);
    obj.rotation.set(0, c.angle, 0);
    obj.userData.component = c;
    obj.traverse(m => { if (m.isMesh) m.castShadow = m.receiveShadow = true; });
    ring.add(obj);
    pickables.push(obj);
    c.object = obj;
    loaded.push(c);
  });
  thumbnails(loaded);
  document.getElementById('loader').classList.add('done');
}, undefined, err => {
  console.error(err);
  document.getElementById('loader').textContent = 'Could not load 3D models.';
});

// loop
const clock = new THREE.Clock();
renderer.setAnimationLoop(() => {
  const dt = Math.min(clock.getDelta(), 0.05);
  const t = clock.elapsedTime;
  if (!selected && !reduceMotion) ring.rotation.y += dt * 0.06;
  core.rotation.y = t * 0.8;
  core.position.y = 1.3 + Math.sin(t * 1.6) * 0.08;
  for (const p of pulses) {
    p.t = (p.t + dt * (reduceMotion ? 0 : 0.35)) % 1;
    p.curve.getPointAt(p.t, p.p.position);
  }
  if (fly) {
    const k = 1 - Math.pow(0.02, dt);
    camera.position.lerp(fly.pos, k);
    controls.target.lerp(fly.target, k);
    if (camera.position.distanceTo(fly.pos) < 0.02) fly = null;
  }
  controls.update();
  renderer.render(scene, camera);
});
