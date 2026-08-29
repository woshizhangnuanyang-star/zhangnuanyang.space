import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { gsap } from 'gsap';
import './styles.css';

const siteBaseUrl = new URL(import.meta.env.BASE_URL, window.location.href);
const assetUrl = (path) => new URL(String(path).replace(/^\/+/, ''), siteBaseUrl).href;
const gouacheApiUrl = import.meta.env.VITE_IMAGE_API_URL || new URL('api/generate-gouache', siteBaseUrl).href;

const pageParams = new URLSearchParams(window.location.search);
const captureMode = pageParams.has('capture');
const captureAngle = pageParams.get('angle');
const captureOpen = pageParams.get('state') === 'open';
const captureAllOpen = pageParams.get('state') === 'all-open';
const captureLeftOpen = pageParams.get('state') === 'left-open';
const captureFlat = pageParams.has('flat');
if (captureMode) document.documentElement.classList.add('capture-mode');

const canvas = document.querySelector('#scene');
const toggleButton = document.querySelector('#door-toggle');
const resetButton = document.querySelector('#reset-view');
const loading = document.querySelector('#loading');
const doorStatus = document.querySelector('#door-status');
const panels = [...document.querySelectorAll('.artifact-panel')];
const panelScrim = document.querySelector('#panel-scrim');
const resumePanel = document.querySelector('#resume-panel');
const contactPanel = document.querySelector('#contact-panel');
const cameraPanel = document.querySelector('#camera-panel');
const internshipPanel = document.querySelector('#internship-panel');
const internshipImage = document.querySelector('#internship-image');
const internshipIndex = document.querySelector('#internship-index');
const internshipCode = document.querySelector('#internship-code');
const internshipWorkTitle = document.querySelector('#internship-work-title');
const internshipWorkSummary = document.querySelector('#internship-work-summary');
const internshipPrevButton = document.querySelector('#internship-prev');
const internshipNextButton = document.querySelector('#internship-next');
const photoUpload = document.querySelector('#photo-upload');
const uploadStatus = document.querySelector('#upload-status');
const projectDock = document.querySelector('#project-dock');
const projectDockButtons = [...document.querySelectorAll('[data-project-box]')];
const careerShortcutButtons = [...document.querySelectorAll('[data-career-shortcut]')];
const projectViewer = document.querySelector('#project-viewer');
const projectBackButton = document.querySelector('#project-back');
const projectScroll = document.querySelector('#project-scroll');
const projectMedia = document.querySelector('#project-media');
const projectViewerTitle = document.querySelector('#project-viewer-title');
const projectViewerIndex = document.querySelector('#project-viewer-index');
const projectPageIntro = document.querySelector('.project-page-intro');
const projectPageKicker = document.querySelector('#project-page-kicker');
const projectPageTitle = document.querySelector('#project-page-title');
const projectPageSummary = document.querySelector('#project-page-summary');
const projectRole = document.querySelector('#project-role');
const projectTasks = document.querySelector('#project-tasks');
const projectTools = document.querySelector('#project-tools');
const projectNextButton = document.querySelector('#project-next');
const projectOpenButtons = [...document.querySelectorAll('[data-project-open]')];
const projectTrail = document.querySelector('#project-trail');
const loadingProgress = document.querySelector('#loading-progress');
const loadingTrack = document.querySelector('.loading-track i');
const artStudio = document.querySelector('#art-studio');
const artStudioClose = document.querySelector('#studio-close');
const paintCanvas = document.querySelector('#paint-canvas');
const brushSizeInput = document.querySelector('#brush-size');
const brushSizeOutput = document.querySelector('#brush-size-output');
const paintUndoButton = document.querySelector('#paint-undo');
const paintClearButton = document.querySelector('#paint-clear');
const paintOptimizeButton = document.querySelector('#gouache-optimize');
const paintRestoreButton = document.querySelector('#paint-restore');
const paintDownloadButton = document.querySelector('#paint-download');
const paintStatus = document.querySelector('#paint-status');

const scene = new THREE.Scene();
const sceneBackground = captureMode ? 0x666555 : 0xe8e5cf;
scene.background = new THREE.Color(sceneBackground);
scene.fog = new THREE.Fog(sceneBackground, 10, 18);

const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: false, powerPreference: 'high-performance' });
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.08;

const camera = new THREE.PerspectiveCamera(35, window.innerWidth / window.innerHeight, 0.1, 60);
const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.dampingFactor = 0.065;
controls.enablePan = false;
controls.minDistance = 4.8;
controls.maxDistance = 12;
controls.minPolarAngle = Math.PI * 0.26;
controls.maxPolarAngle = Math.PI * 0.68;
controls.autoRotate = false;

const pmrem = new THREE.PMREMGenerator(renderer);
scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
pmrem.dispose();

const hemi = new THREE.HemisphereLight(0xfffde9, 0x77704e, 1.2);
scene.add(hemi);

const key = new THREE.RectAreaLight(0xfff5d6, 7.2, 5.2, 5.2);
key.position.set(-3.5, 5.5, 5.8);
key.lookAt(0, 0, 0);
scene.add(key);

const rim = new THREE.DirectionalLight(0xcfdcff, 1.6);
rim.position.set(5, 3.5, -2.8);
rim.castShadow = true;
rim.shadow.mapSize.set(2048, 2048);
rim.shadow.camera.left = -5;
rim.shadow.camera.right = 5;
rim.shadow.camera.top = 5;
rim.shadow.camera.bottom = -5;
scene.add(rim);

const groundMaterial = new THREE.MeshStandardMaterial({ color: captureMode ? 0x5b5a4b : 0xdedbc2, roughness: 0.9, metalness: 0 });
const ground = new THREE.Mesh(new THREE.PlaneGeometry(30, 30), groundMaterial);
ground.name = 'ground-shadow-plane';
ground.rotation.x = -Math.PI / 2;
ground.position.y = -1.72;
ground.receiveShadow = true;
scene.add(ground);

const backdrop = new THREE.Mesh(
  new THREE.PlaneGeometry(30, 18),
  new THREE.MeshBasicMaterial({ color: sceneBackground, depthWrite: false })
);
backdrop.name = 'background-plane';
backdrop.position.set(0, 3.8, -5.4);
scene.add(backdrop);
if (captureMode) {
  ground.visible = false;
  backdrop.visible = false;
}

const paint = new THREE.MeshPhysicalMaterial({
  color: 0xd2ca87,
  roughness: 0.53,
  metalness: 0.05,
  clearcoat: 0.25,
  clearcoatRoughness: 0.34,
  envMapIntensity: 0.6
});
const paintInner = new THREE.MeshPhysicalMaterial({
  color: 0xa99a57,
  roughness: 0.64,
  metalness: 0.03,
  clearcoat: 0.12,
  clearcoatRoughness: 0.48,
  envMapIntensity: 0.4
});
const holeMaterial = new THREE.MeshStandardMaterial({ color: 0x4c4728, roughness: 0.92, metalness: 0 });
const hardwareMaterial = new THREE.MeshPhysicalMaterial({ color: 0xbcb06e, roughness: 0.28, metalness: 0.35, clearcoat: 0.15 });
const handleMaterial = new THREE.MeshPhysicalMaterial({ color: 0xf0edd5, roughness: 0.38, metalness: 0.08 });
const mouthMaterial = new THREE.MeshBasicMaterial({ transparent: true, opacity: 0, depthWrite: false, side: THREE.DoubleSide });
const mintMaterial = new THREE.MeshPhysicalMaterial({ color: 0xa9c8c4, roughness: 0.38, metalness: 0.03, clearcoat: 0.42, clearcoatRoughness: 0.26 });
const mintDarkMaterial = new THREE.MeshPhysicalMaterial({ color: 0x6f9798, roughness: 0.43, metalness: 0.04, clearcoat: 0.35 });
const ivoryMaterial = new THREE.MeshPhysicalMaterial({ color: 0xeee9d8, roughness: 0.44, metalness: 0.02, clearcoat: 0.22 });
const burgundyMaterial = new THREE.MeshPhysicalMaterial({ color: 0x8b4052, roughness: 0.4, metalness: 0.02, clearcoat: 0.2 });
const charcoalMaterial = new THREE.MeshPhysicalMaterial({ color: 0x171917, roughness: 0.32, metalness: 0.12, clearcoat: 0.25 });
const chromeMaterial = new THREE.MeshStandardMaterial({ color: 0xc9cfcb, roughness: 0.18, metalness: 0.78 });
const paperMaterial = new THREE.MeshPhysicalMaterial({ color: 0xf4f0e6, roughness: 0.78, metalness: 0 });
const woodMaterial = new THREE.MeshPhysicalMaterial({ color: 0xa97745, roughness: 0.72, metalness: 0, clearcoat: 0.08, clearcoatRoughness: 0.65 });
const cordMaterial = new THREE.MeshPhysicalMaterial({ color: 0xd9c8a3, roughness: 0.86, metalness: 0 });
const brassMaterial = new THREE.MeshPhysicalMaterial({ color: 0xcaa44d, roughness: 0.27, metalness: 0.7, clearcoat: 0.2 });
const skyMaterial = new THREE.MeshPhysicalMaterial({ color: 0x6db7d8, roughness: 0.3, metalness: 0.02, clearcoat: 0.5, clearcoatRoughness: 0.22 });
const mailboxRedMaterial = new THREE.MeshPhysicalMaterial({ color: 0xb82f39, roughness: 0.34, metalness: 0.28, clearcoat: 0.42, clearcoatRoughness: 0.24 });
const mailboxDarkMaterial = new THREE.MeshPhysicalMaterial({ color: 0x6f1e27, roughness: 0.46, metalness: 0.22, clearcoat: 0.25 });
const appleRedMaterial = new THREE.MeshPhysicalMaterial({ color: 0xc63c43, roughness: 0.3, metalness: 0.02, clearcoat: 0.56, clearcoatRoughness: 0.2 });
const cardboardMaterials = [0xb98655, 0xc99563, 0xa97549, 0xd1a16d, 0xb77f4f].map((color) => new THREE.MeshPhysicalMaterial({
  color,
  roughness: 0.88,
  metalness: 0,
  clearcoat: 0.025,
  clearcoatRoughness: 0.92
}));
const cardboardInsideMaterial = new THREE.MeshStandardMaterial({ color: 0x725038, roughness: 0.95, metalness: 0 });

const locker = new THREE.Group();
locker.name = 'interactive-folding-locker';
locker.position.set(1.15, 0, 0);
scene.add(locker);

const partNodes = {};
const openables = [];
const stickers = [];
const interactiveProps = [];
const projectBoxes = [];
const projectBoxHitMeshes = [];

function registerPart(id, object, group = 'cabinet-assembly') {
  object.name = id;
  object.userData.componentId = id;
  object.userData.pickPart = id;
  partNodes[id] = object;
  object.userData.destructionGroup = group;
  return object;
}

function roundedMesh(name, width, height, depth, material, radius = 0.025) {
  const safeRadius = Math.min(radius, width * 0.22, height * 0.22, depth * 0.22);
  const geometry = new RoundedBoxGeometry(width, height, depth, 4, safeRadius);
  const mesh = new THREE.Mesh(geometry, material);
  mesh.name = name;
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  return mesh;
}

function addBox(parent, name, size, position, material = paint, radius = 0.025) {
  const mesh = roundedMesh(name, size[0], size[1], size[2], material, radius);
  mesh.position.set(...position);
  parent.add(mesh);
  return mesh;
}

function addPanelFrame(parent, width, height, z, material = paint, interior = false) {
  const frame = new THREE.Group();
  frame.name = `${parent.name}-${interior ? 'inner' : 'outer'}-stiffening-frame`;
  frame.userData.explodeWithParent = true;
  const inset = 0.075;
  const rail = 0.035;
  const depth = 0.018;
  [
    [width - inset * 2, rail, depth, 0, height / 2 - inset, z],
    [width - inset * 2, rail, depth, 0, -height / 2 + inset, z],
    [rail, height - inset * 2, depth, -width / 2 + inset, 0, z],
    [rail, height - inset * 2, depth, width / 2 - inset, 0, z]
  ].forEach(([w, h, d, x, y, zz], index) => {
    const strip = roundedMesh(`${frame.name}-rail-${index + 1}`, w, h, d, material, 0.008);
    strip.position.set(x, y, zz);
    strip.userData.explodeWithParent = true;
    frame.add(strip);
  });
  parent.add(frame);
  return frame;
}

function addVentGrid(parent, x, y, z, rows = 5, cols = 5, side = 1) {
  const count = rows * cols;
  const geometry = new THREE.CircleGeometry(0.0155, 14);
  const mesh = new THREE.InstancedMesh(geometry, holeMaterial, count);
  mesh.name = `${parent.name}-ventilation-grid-${Math.abs(y).toFixed(2)}`;
  mesh.userData.explodeWithParent = true;
  const dummy = new THREE.Object3D();
  let i = 0;
  const spacing = 0.058;
  for (let row = 0; row < rows; row += 1) {
    for (let col = 0; col < cols; col += 1) {
      dummy.position.set(x + (col - (cols - 1) / 2) * spacing, y + (row - (rows - 1) / 2) * spacing, z);
      dummy.rotation.set(0, side < 0 ? Math.PI : 0, 0);
      dummy.updateMatrix();
      mesh.setMatrixAt(i++, dummy.matrix);
    }
  }
  mesh.instanceMatrix.needsUpdate = true;
  parent.add(mesh);
  return mesh;
}

function addHandle(parent, x, y, z, width = 0.28, height = 0.11) {
  const group = new THREE.Group();
  group.name = `${parent.name}-handle-recess`;
  group.userData.explodeWithParent = true;
  const t = 0.028;
  addBox(group, `${group.name}-top`, [width, t, 0.034], [0, height / 2, 0], handleMaterial, 0.01);
  addBox(group, `${group.name}-bottom`, [width, t, 0.034], [0, -height / 2, 0], handleMaterial, 0.01);
  addBox(group, `${group.name}-left`, [t, height, 0.034], [-width / 2, 0, 0], handleMaterial, 0.01);
  addBox(group, `${group.name}-right`, [t, height, 0.034], [width / 2, 0, 0], handleMaterial, 0.01);
  const recess = addBox(group, `${group.name}-shadow`, [width - t, height - t, 0.012], [0, 0, -0.012], holeMaterial, 0.012);
  recess.userData.explodeWithParent = true;
  group.position.set(x, y, z);
  parent.add(group);
  return group;
}

function addHinge(parent, x, y, z, height = 0.2) {
  const hinge = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.035, height, 16), hardwareMaterial);
  hinge.name = `${parent.name}-hinge-${y.toFixed(2)}`;
  hinge.position.set(x, y, z);
  hinge.castShadow = true;
  hinge.userData.explodeWithParent = true;
  parent.add(hinge);
  return hinge;
}

function createLabelTexture({ width = 512, height = 512, background = '#f3efe4', accent = '#884456', title = '', lines = [], symbol = '' }) {
  const labelCanvas = document.createElement('canvas');
  labelCanvas.width = width;
  labelCanvas.height = height;
  const ctx = labelCanvas.getContext('2d');
  ctx.fillStyle = background;
  ctx.fillRect(0, 0, width, height);
  ctx.fillStyle = accent;
  ctx.fillRect(width * 0.76, 0, width * 0.24, height);
  ctx.fillStyle = '#252729';
  ctx.font = `800 ${Math.round(width * 0.075)}px Arial`;
  ctx.fillText(title, width * 0.08, height * 0.69);
  ctx.font = `600 ${Math.round(width * 0.032)}px Arial`;
  lines.forEach((line, index) => ctx.fillText(line, width * 0.08, height * (0.76 + index * 0.052)));
  if (symbol) {
    ctx.fillStyle = accent;
    ctx.font = `900 ${Math.round(width * 0.19)}px Georgia`;
    ctx.fillText(symbol, width * 0.09, height * 0.28);
  }
  ctx.strokeStyle = accent;
  ctx.lineWidth = Math.max(3, width * 0.009);
  ctx.strokeRect(width * 0.06, height * 0.06, width * 0.64, height * 0.86);
  const texture = new THREE.CanvasTexture(labelCanvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.anisotropy = renderer.capabilities.getMaxAnisotropy();
  return texture;
}

function createTextPlane(name, size, texture, position, parent) {
  const material = new THREE.MeshPhysicalMaterial({ map: texture, roughness: 0.64, metalness: 0, clearcoat: 0.08 });
  const plane = new THREE.Mesh(new THREE.PlaneGeometry(size[0], size[1]), material);
  plane.name = name;
  plane.position.set(...position);
  plane.castShadow = true;
  plane.userData.explodeWithParent = true;
  parent.add(plane);
  return plane;
}

function createTube(name, points, radius, material, segments = 48, radialSegments = 8, closed = false) {
  const curve = new THREE.CatmullRomCurve3(points.map((point) => new THREE.Vector3(...point)), closed, 'catmullrom', 0.55);
  const mesh = new THREE.Mesh(new THREE.TubeGeometry(curve, segments, radius, radialSegments, closed), material);
  mesh.name = name;
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  mesh.userData.explodeWithParent = true;
  return mesh;
}

function makePropInteractive(root, actionId, requiredDoor = 'left') {
  root.userData.actionId = actionId;
  root.userData.requiredDoor = requiredDoor;
  root.traverse((object) => {
    object.userData.explodeWithParent = true;
    if (object.isMesh) {
      object.userData.actionId = actionId;
      object.userData.requiredDoor = requiredDoor;
      interactiveProps.push(object);
    }
  });
  return root;
}

function createIdCardProp() {
  const root = registerPart('id-card', new THREE.Group(), 'left-door-interior');
  const cardGroup = new THREE.Group();
  cardGroup.name = 'id-card-elastic-rig';
  cardGroup.position.set(0, -0.18, 0);
  root.add(cardGroup);
  const acrylic = new THREE.MeshPhysicalMaterial({ color: 0xf7f6ef, transparent: true, opacity: 0.52, transmission: 0.1, roughness: 0.18, clearcoat: 0.5 });
  addBox(cardGroup, 'id-card-acrylic-shell', [0.43, 0.61, 0.045], [0, -0.04, 0], acrylic, 0.045);
  const cardTexture = createLabelTexture({ width: 512, height: 720, background: '#f4f0e8', accent: '#8c4055', title: 'YOUR NAME', lines: ['ID / PORTFOLIO', 'TEXTURE READY'], symbol: 'ID' });
  createTextPlane('id-card-replaceable-artwork', [0.38, 0.54], cardTexture, [0, -0.04, 0.026], cardGroup);
  const ring = new THREE.Mesh(new THREE.TorusGeometry(0.085, 0.018, 10, 28), chromeMaterial);
  ring.name = 'id-card-keyring';
  ring.position.set(0, 0.34, 0.01);
  ring.castShadow = true;
  cardGroup.add(ring);
  const clip = addBox(cardGroup, 'id-card-clip', [0.12, 0.08, 0.055], [0, 0.255, 0.01], chromeMaterial, 0.02);
  clip.rotation.z = 0.05;
  const anchor = new THREE.Mesh(new THREE.TorusGeometry(0.058, 0.014, 10, 28), chromeMaterial);
  anchor.name = 'id-card-door-anchor';
  anchor.position.set(0, 0.78, 0.005);
  anchor.castShadow = true;
  root.add(anchor);
  const anchorCap = addBox(root, 'id-card-anchor-cap', [0.15, 0.07, 0.045], [0, 0.84, -0.005], paintInner, 0.025);
  anchorCap.userData.explodeWithParent = true;

  const strap = createTube('id-card-fabric-strap', [[0, 0.78, 0], [-0.085, 0.65, 0.006], [-0.07, 0.38, 0.008], [0, 0.16, 0.01]], 0.016, ivoryMaterial, 46, 7);
  root.add(strap);
  root.position.set(-1.02, 0.34, -0.085);
  root.rotation.y = Math.PI;
  const restPosition = cardGroup.position.clone();
  makePropInteractive(root, 'id-card');
  return { root, cardGroup, ring, strap, anchor, restPosition };
}

function createResumeFolderProp() {
  const root = registerPart('resume-folder', new THREE.Group(), 'left-bay-portfolio');
  const clipboardMaterial = new THREE.MeshPhysicalMaterial({ color: 0x9a6237, roughness: 0.82, metalness: 0, clearcoat: 0.045 });
  const clipboard = addBox(root, 'resume-clipboard-board', [0.62, 0.78, 0.06], [0, 0, 0], clipboardMaterial, 0.045);
  const paperStack = new THREE.Group();
  paperStack.name = 'resume-paper-stack-rig';
  root.add(paperStack);
  [-0.012, 0, 0.012].forEach((x, index) => {
    const sheet = addBox(paperStack, `resume-paper-sheet-${index + 1}`, [0.52, 0.69, 0.012], [x, -0.012 + index * 0.004, 0.045 + index * 0.009], paperMaterial, 0.012);
    sheet.rotation.z = (index - 1) * 0.012;
  });

  const resumeTexture = new THREE.TextureLoader().load(assetUrl('assets/resume.png'), (texture) => {
    texture.colorSpace = THREE.SRGBColorSpace;
    texture.anisotropy = renderer.capabilities.getMaxAnisotropy();
  });
  resumeTexture.colorSpace = THREE.SRGBColorSpace;
  const resumePreview = new THREE.Mesh(
    new THREE.PlaneGeometry(0.485, 0.685),
    new THREE.MeshBasicMaterial({ map: resumeTexture, toneMapped: false })
  );
  resumePreview.name = 'resume-real-preview';
  resumePreview.position.set(0, -0.012, 0.079);
  paperStack.add(resumePreview);

  const photoCard = new THREE.Group();
  photoCard.name = 'resume-polaroid-card';
  photoCard.position.set(-0.12, 0.02, 0.093);
  photoCard.rotation.z = -0.035;
  paperStack.add(photoCard);
  addBox(photoCard, 'resume-polaroid-backing', [0.26, 0.31, 0.018], [0, 0, 0], charcoalMaterial, 0.01);
  createTextPlane(
    'resume-polaroid-profile',
    [0.225, 0.27],
    createLabelTexture({ width: 460, height: 550, background: '#d6c9b7', accent: '#784c35', title: 'ZHANG NUANYANG', lines: ['PRODUCT DESIGN', 'INTERACTION / UI'], symbol: 'ZN' }),
    [0, 0, 0.011],
    photoCard
  );

  const clip = new THREE.Group();
  clip.name = 'resume-clipboard-metal-clip';
  clip.position.set(0, 0.365, 0.105);
  root.add(clip);
  addBox(clip, 'resume-clip-base', [0.36, 0.095, 0.045], [0, -0.015, -0.02], chromeMaterial, 0.02);
  addBox(clip, 'resume-clip-pressure-bar', [0.3, 0.075, 0.055], [0, 0.025, 0.01], chromeMaterial, 0.025);
  const leftArm = createTube('resume-clip-left-arm', [[-0.13, 0.035, 0.025], [-0.15, 0.075, 0.04], [-0.15, 0.125, 0.04]], 0.012, charcoalMaterial, 22, 8);
  const rightArm = createTube('resume-clip-right-arm', [[0.13, 0.035, 0.025], [0.15, 0.075, 0.04], [0.15, 0.125, 0.04]], 0.012, charcoalMaterial, 22, 8);
  clip.add(leftArm, rightArm);

  const paperClip = createTube(
    'resume-side-paper-clip',
    [[-0.285, 0.2, 0.105], [-0.34, 0.16, 0.108], [-0.33, 0.055, 0.108], [-0.285, 0.02, 0.108], [-0.305, 0.13, 0.109]],
    0.01,
    chromeMaterial,
    34,
    7
  );
  root.add(paperClip);

  root.position.set(-1.31, 0.42, 0.005);
  root.rotation.z = -0.018;
  root.scale.setScalar(0.92);
  const rest = {
    position: root.position.clone(),
    scale: root.scale.clone(),
    paperPosition: paperStack.position.clone(),
    photoPosition: photoCard.position.clone(),
    clipPosition: clip.position.clone()
  };
  makePropInteractive(root, 'resume-folder');
  return { root, clipboard, paperStack, resumePreview, photoCard, clip, rest };
}

function createPhoneProp() {
  const root = registerPart('rotary-phone', new THREE.Group(), 'left-bay-portfolio');
  const base = addBox(root, 'phone-base', [0.62, 0.34, 0.24], [0, -0.035, 0], mintMaterial, 0.1);
  base.scale.set(1, 0.92, 1);
  addBox(root, 'phone-shoulder', [0.5, 0.22, 0.2], [0, 0.12, 0.015], mintMaterial, 0.075);
  const dial = new THREE.Group();
  dial.name = 'phone-rotary-dial';
  dial.position.set(0, 0.02, 0.145);
  root.add(dial);
  const dialPlate = new THREE.Mesh(new THREE.CylinderGeometry(0.175, 0.175, 0.028, 48), ivoryMaterial);
  dialPlate.rotation.x = Math.PI / 2;
  dialPlate.castShadow = true;
  dial.add(dialPlate);
  const dialRing = new THREE.Mesh(new THREE.TorusGeometry(0.125, 0.018, 12, 48), chromeMaterial);
  dialRing.position.z = 0.025;
  dial.add(dialRing);
  const numberGeometry = new THREE.CylinderGeometry(0.027, 0.027, 0.022, 18);
  for (let i = 0; i < 10; i += 1) {
    const angle = (i / 10) * Math.PI * 2 + Math.PI / 2;
    const button = new THREE.Mesh(numberGeometry, paperMaterial);
    button.name = `phone-dial-button-${i}`;
    button.rotation.x = Math.PI / 2;
    button.position.set(Math.cos(angle) * 0.108, Math.sin(angle) * 0.108, 0.032);
    button.castShadow = true;
    dial.add(button);
  }
  const dialHub = new THREE.Mesh(new THREE.CylinderGeometry(0.058, 0.058, 0.038, 32), charcoalMaterial);
  dialHub.rotation.x = Math.PI / 2;
  dialHub.position.z = 0.035;
  dial.add(dialHub);

  const handset = new THREE.Group();
  handset.name = 'phone-handset-lift-rig';
  handset.position.set(0, 0.27, 0.07);
  root.add(handset);
  const handsetBody = createTube('phone-handset-handle', [[-0.24, 0, 0], [-0.13, 0.055, 0], [0.13, 0.055, 0], [0.24, 0, 0]], 0.052, mintDarkMaterial, 44, 12);
  handset.add(handsetBody);
  addBox(handset, 'phone-handset-left-cap', [0.17, 0.15, 0.14], [-0.26, 0.005, 0], mintDarkMaterial, 0.07).rotation.z = -0.15;
  addBox(handset, 'phone-handset-right-cap', [0.17, 0.15, 0.14], [0.26, 0.005, 0], mintDarkMaterial, 0.07).rotation.z = 0.15;
  const cordPoints = [];
  for (let i = 0; i <= 36; i += 1) {
    const t = i / 36;
    cordPoints.push([-0.29 - t * 0.12 + Math.sin(t * Math.PI * 12) * 0.016, 0.22 - t * 0.35, 0.03 + Math.cos(t * Math.PI * 12) * 0.016]);
  }
  root.add(createTube('phone-coiled-cord', cordPoints, 0.011, mintDarkMaterial, 90, 6));
  root.position.set(-1.47, -1.15, 0.02);
  root.rotation.x = -0.04;
  makePropInteractive(root, 'rotary-phone');
  return { root, dial, handset };
}

function createFilmTexture(image = null) {
  const filmCanvas = document.createElement('canvas');
  filmCanvas.width = 768;
  filmCanvas.height = 500;
  const ctx = filmCanvas.getContext('2d');
  ctx.fillStyle = '#ece9dc';
  ctx.fillRect(0, 0, filmCanvas.width, filmCanvas.height);
  if (image) {
    const scale = Math.max(filmCanvas.width / image.width, filmCanvas.height / image.height);
    const width = image.width * scale;
    const height = image.height * scale;
    ctx.drawImage(image, (filmCanvas.width - width) / 2, (filmCanvas.height - height) / 2, width, height);
  } else {
    const gradient = ctx.createLinearGradient(0, 0, filmCanvas.width, filmCanvas.height);
    gradient.addColorStop(0, '#9fc3b4');
    gradient.addColorStop(0.5, '#e4c487');
    gradient.addColorStop(1, '#8b5361');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, filmCanvas.width, filmCanvas.height);
    ctx.fillStyle = 'rgba(250,248,228,.84)';
    ctx.font = '800 54px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('YOUR MEMORY', filmCanvas.width / 2, filmCanvas.height / 2 + 16);
  }
  const texture = new THREE.CanvasTexture(filmCanvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.anisotropy = renderer.capabilities.getMaxAnisotropy();
  return texture;
}

function createCameraProp() {
  const root = registerPart('instant-camera', new THREE.Group(), 'left-door-interior');
  const hangingCord = createTube(
    'camera-hanging-cord',
    [[-0.2, 0.24, -0.015], [-0.18, 0.43, -0.008], [0, 0.52, 0], [0.18, 0.43, -0.008], [0.2, 0.24, -0.015]],
    0.012,
    ivoryMaterial,
    54,
    7
  );
  root.add(hangingCord);
  addBox(root, 'camera-mint-body', [0.58, 0.4, 0.23], [0, 0.04, 0], mintMaterial, 0.075);
  addBox(root, 'camera-film-gate', [0.6, 0.13, 0.24], [0, -0.195, 0], charcoalMaterial, 0.025);
  addBox(root, 'camera-flash', [0.13, 0.16, 0.035], [-0.2, 0.105, 0.137], ivoryMaterial, 0.025);
  const flashFace = addBox(root, 'camera-flash-ribs', [0.1, 0.125, 0.012], [-0.2, 0.105, 0.159], chromeMaterial, 0.018);
  flashFace.material = new THREE.MeshStandardMaterial({ color: 0xdde1d8, roughness: 0.38, metalness: 0.25 });
  addBox(root, 'camera-viewfinder', [0.12, 0.13, 0.045], [0.205, 0.112, 0.14], charcoalMaterial, 0.022);
  const shutter = new THREE.Mesh(new THREE.CylinderGeometry(0.047, 0.047, 0.025, 28), ivoryMaterial);
  shutter.name = 'camera-shutter-button';
  shutter.rotation.x = Math.PI / 2;
  shutter.position.set(-0.205, -0.045, 0.15);
  root.add(shutter);
  const lens = new THREE.Group();
  lens.name = 'camera-lens-stack';
  lens.position.set(0, 0.065, 0.14);
  root.add(lens);
  [
    [0.155, 0.045, ivoryMaterial],
    [0.125, 0.062, charcoalMaterial],
    [0.084, 0.075, mintDarkMaterial],
    [0.05, 0.083, charcoalMaterial]
  ].forEach(([radius, z, material], index) => {
    const cylinder = new THREE.Mesh(new THREE.CylinderGeometry(radius, radius * 0.96, 0.04, 48), material);
    cylinder.name = `camera-lens-ring-${index + 1}`;
    cylinder.rotation.x = Math.PI / 2;
    cylinder.position.z = z;
    cylinder.castShadow = true;
    lens.add(cylinder);
  });

  const film = new THREE.Group();
  film.name = 'camera-film-strip-rig';
  film.position.set(0, -0.3, 0.02);
  root.add(film);
  const backing = addBox(film, 'film-strip-backing', [0.38, 0.9, 0.018], [0, -0.39, 0], charcoalMaterial, 0.016);
  backing.castShadow = false;
  const frameTexture = createFilmTexture();
  const filmFrames = [];
  [0, -0.205, -0.41, -0.615].forEach((y, index) => {
    const frameMaterial = new THREE.MeshPhysicalMaterial({ map: frameTexture, roughness: 0.42, clearcoat: 0.12 });
    const frame = new THREE.Mesh(new THREE.PlaneGeometry(0.27, 0.16), frameMaterial);
    frame.name = `film-image-frame-${index + 1}`;
    frame.position.set(0, y, 0.014);
    film.add(frame);
    filmFrames.push(frame);
  });
  const perforationGeometry = new THREE.BoxGeometry(0.035, 0.055, 0.012);
  const perforations = new THREE.InstancedMesh(perforationGeometry, paperMaterial, 24);
  perforations.name = 'film-strip-sprocket-holes';
  const dummy = new THREE.Object3D();
  let perforationIndex = 0;
  [-0.165, 0.165].forEach((x) => {
    for (let i = 0; i < 12; i += 1) {
      dummy.position.set(x, 0.01 - i * 0.073, 0.018);
      dummy.updateMatrix();
      perforations.setMatrixAt(perforationIndex++, dummy.matrix);
    }
  });
  perforations.instanceMatrix.needsUpdate = true;
  film.add(perforations);
  film.scale.y = 0.02;
  film.visible = false;
  root.position.set(-0.4, 0.84, -0.105);
  root.rotation.y = Math.PI;
  makePropInteractive(root, 'instant-camera');
  return { root, lens, film, filmFrames, hangingCord };
}

function createPostcardTexture(variant = 0) {
  const postcardCanvas = document.createElement('canvas');
  postcardCanvas.width = 720;
  postcardCanvas.height = 460;
  const ctx = postcardCanvas.getContext('2d');
  const palettes = [
    ['#edb7c2', '#8e5363', '#f8eee9'],
    ['#a9cfe0', '#405f78', '#f1eee4'],
    ['#eeeae0', '#7a8fa2', '#cfddeb']
  ];
  const [paper, ink, light] = palettes[variant % palettes.length];
  ctx.fillStyle = paper;
  ctx.fillRect(0, 0, 720, 460);
  ctx.fillStyle = light;
  ctx.fillRect(22, 22, 676, 152);
  ctx.strokeStyle = 'rgba(67,61,55,.24)';
  ctx.lineWidth = 3;
  ctx.strokeRect(20, 20, 680, 420);
  ctx.fillStyle = ink;
  ctx.font = '700 25px Georgia';
  ctx.fillText(variant === 0 ? 'POST FROM A SMALL DAY' : variant === 1 ? 'A NOTE FOR LATER' : 'MEMORY ARCHIVE', 42, 224);
  ctx.font = '600 17px ui-monospace, monospace';
  ctx.fillText('FROM: DREAM LOCKER', 42, 265);
  ctx.fillText('TO:', 430, 265);
  ctx.strokeStyle = ink;
  ctx.lineWidth = 2;
  [294, 328, 362].forEach((y) => {
    ctx.beginPath();
    ctx.moveTo(424, y);
    ctx.lineTo(660, y);
    ctx.stroke();
  });
  ctx.beginPath();
  ctx.arc(576, 104, 56, 0, Math.PI * 2);
  ctx.stroke();
  ctx.beginPath();
  ctx.arc(586, 103, 35, 0, Math.PI * 2);
  ctx.stroke();
  ctx.save();
  ctx.translate(580, 110);
  ctx.rotate(-0.28);
  ctx.font = '800 15px ui-monospace, monospace';
  ctx.textAlign = 'center';
  ctx.fillText('DREAM / 2026', 0, 0);
  ctx.restore();
  ctx.globalAlpha = 0.11;
  for (let i = 0; i < 1600; i += 1) {
    const x = (i * 83) % 720;
    const y = (i * 137) % 460;
    ctx.fillRect(x, y, 1, 1);
  }
  const texture = new THREE.CanvasTexture(postcardCanvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.anisotropy = renderer.capabilities.getMaxAnisotropy();
  return texture;
}

function createPostcardStack(parent) {
  const root = registerPart('postcard-stack', new THREE.Group(), 'left-bay-portfolio');
  parent.add(root);
  const layouts = [
    { x: -0.09, y: 0.08, z: 0, r: -0.11, variant: 1 },
    { x: 0.07, y: 0.035, z: 0.012, r: 0.075, variant: 2 },
    { x: 0, y: -0.035, z: 0.025, r: -0.018, variant: 0 }
  ];
  layouts.forEach(({ x, y, z, r, variant }, index) => {
    const card = addBox(root, `postcard-${index + 1}-paper`, [0.66, 0.42, 0.018], [x, y, z], paperMaterial, 0.018);
    card.rotation.z = r;
    const face = createTextPlane(`postcard-${index + 1}-face`, [0.635, 0.395], createPostcardTexture(variant), [x, y, z + 0.011], root);
    face.rotation.z = r;
  });
  const clip = createTube('postcard-paper-clip', [[0.23, 0.19, 0.05], [0.3, 0.17, 0.052], [0.31, 0.08, 0.052], [0.255, 0.055, 0.052], [0.235, 0.135, 0.052]], 0.008, chromeMaterial, 34, 7);
  root.add(clip);
  root.position.set(-1.42, -0.78, -0.326);
  root.rotation.x = -0.01;
  return root;
}

function createFishBellProp() {
  const root = registerPart('fish-bell', new THREE.Group(), 'left-bay-portfolio');
  const swingPivot = new THREE.Group();
  swingPivot.name = 'fish-bell-swing-pivot';
  swingPivot.position.set(0, 0.4, 0);
  root.add(swingPivot);

  const cord = createTube('fish-bell-hanging-cord', [[0, 0, 0], [0.004, -0.17, 0], [-0.01, -0.39, 0], [0, -0.67, 0]], 0.009, cordMaterial, 62, 7);
  swingPivot.add(cord);
  const bowLeft = createTube('fish-bell-bow-left', [[0, -0.27, 0.006], [-0.11, -0.18, 0.006], [-0.18, -0.27, 0.006], [-0.07, -0.34, 0.006], [0, -0.27, 0.006]], 0.008, cordMaterial, 42, 7);
  const bowRight = createTube('fish-bell-bow-right', [[0, -0.27, 0.006], [0.1, -0.17, 0.006], [0.18, -0.27, 0.006], [0.08, -0.35, 0.006], [0, -0.27, 0.006]], 0.008, cordMaterial, 42, 7);
  swingPivot.add(bowLeft, bowRight);

  const fishShape = new THREE.Shape();
  fishShape.moveTo(-0.34, -0.39);
  fishShape.lineTo(-0.25, -0.33);
  fishShape.quadraticCurveTo(-0.08, -0.27, 0.12, -0.32);
  fishShape.lineTo(0.23, -0.27);
  fishShape.lineTo(0.35, -0.32);
  fishShape.lineTo(0.31, -0.41);
  fishShape.lineTo(0.35, -0.5);
  fishShape.lineTo(0.21, -0.46);
  fishShape.quadraticCurveTo(-0.08, -0.52, -0.25, -0.46);
  fishShape.closePath();
  const fishGeometry = new THREE.ExtrudeGeometry(fishShape, { depth: 0.075, bevelEnabled: true, bevelSegments: 3, steps: 1, bevelSize: 0.012, bevelThickness: 0.012 });
  fishGeometry.translate(0, 0, -0.0375);
  const fish = new THREE.Mesh(fishGeometry, woodMaterial);
  fish.name = 'fish-bell-wooden-fish';
  fish.castShadow = true;
  fish.receiveShadow = true;
  swingPivot.add(fish);
  const eye = new THREE.Mesh(new THREE.SphereGeometry(0.018, 18, 12), charcoalMaterial);
  eye.name = 'fish-bell-fish-eye';
  eye.position.set(-0.25, -0.385, 0.052);
  eye.scale.z = 0.42;
  swingPivot.add(eye);
  [-0.035, 0.045].forEach((x, index) => {
    const wrap = addBox(swingPivot, `fish-bell-wrap-${index + 1}`, [0.055, 0.27, 0.105], [x, -0.4, 0], cordMaterial, 0.02);
    wrap.rotation.z = index ? -0.18 : 0.18;
  });
  const smile = createTube('fish-bell-smile-groove', [[-0.21, -0.39, 0.053], [-0.2, -0.43, 0.053], [-0.17, -0.45, 0.053]], 0.006, charcoalMaterial, 22, 6);
  swingPivot.add(smile);

  const bellPivot = new THREE.Group();
  bellPivot.name = 'fish-bell-brass-pivot';
  bellPivot.position.set(0, -0.7, 0);
  swingPivot.add(bellPivot);
  const bellProfile = [new THREE.Vector2(0.018, -0.09), new THREE.Vector2(0.09, -0.078), new THREE.Vector2(0.12, -0.02), new THREE.Vector2(0.105, 0.075), new THREE.Vector2(0.065, 0.11), new THREE.Vector2(0.025, 0.125)];
  const bell = new THREE.Mesh(new THREE.LatheGeometry(bellProfile, 40), brassMaterial);
  bell.name = 'fish-bell-brass-bell';
  bell.rotation.x = Math.PI;
  bell.castShadow = true;
  bellPivot.add(bell);
  const clapper = new THREE.Mesh(new THREE.SphereGeometry(0.034, 20, 14), brassMaterial);
  clapper.name = 'fish-bell-clapper';
  clapper.position.y = -0.12;
  clapper.scale.y = 1.35;
  bellPivot.add(clapper);
  root.position.set(-1.94, -0.46, -0.02);
  makePropInteractive(root, 'fish-bell');
  return { root, swingPivot, bellPivot, clapper };
}

function createAppleClockProp() {
  const root = registerPart('right-bay-clock', new THREE.Group(), 'right-bay-portfolio');
  const clockBody = new THREE.Mesh(new THREE.CylinderGeometry(0.39, 0.39, 0.075, 64), mailboxDarkMaterial);
  clockBody.name = 'right-clock-body';
  clockBody.rotation.x = Math.PI / 2;
  clockBody.castShadow = true;
  clockBody.receiveShadow = true;
  root.add(clockBody);

  const face = new THREE.Mesh(new THREE.CylinderGeometry(0.35, 0.35, 0.026, 64), ivoryMaterial);
  face.name = 'right-clock-ivory-face';
  face.rotation.x = Math.PI / 2;
  face.position.z = 0.05;
  face.castShadow = true;
  root.add(face);

  const rim = new THREE.Mesh(new THREE.TorusGeometry(0.37, 0.026, 14, 72), mailboxRedMaterial);
  rim.name = 'right-clock-red-rim';
  rim.position.z = 0.076;
  rim.castShadow = true;
  root.add(rim);

  for (let index = 0; index < 12; index += 1) {
    const angle = (index / 12) * Math.PI * 2;
    const marker = new THREE.Group();
    marker.name = `right-clock-apple-marker-${index + 1}`;
    marker.position.set(Math.sin(angle) * 0.282, Math.cos(angle) * 0.282, 0.091);
    marker.rotation.z = -angle;
    root.add(marker);
    const apple = new THREE.Mesh(new THREE.SphereGeometry(0.035, 18, 14), appleRedMaterial);
    apple.scale.set(1, 0.9, 0.35);
    apple.castShadow = true;
    marker.add(apple);
    const bite = new THREE.Mesh(new THREE.SphereGeometry(0.013, 12, 8), ivoryMaterial);
    bite.name = `right-clock-apple-bite-${index + 1}`;
    bite.position.set(0.028, 0.008, 0.009);
    bite.scale.z = 0.4;
    marker.add(bite);
    const stem = addBox(marker, `right-clock-apple-stem-${index + 1}`, [0.008, 0.025, 0.012], [0, 0.043, 0.004], woodMaterial, 0.003);
    stem.rotation.z = 0.16;
  }

  function createHand(name, length, width, material, z) {
    const pivot = new THREE.Group();
    pivot.name = name;
    pivot.position.z = z;
    root.add(pivot);
    addBox(pivot, `${name}-bar`, [width, length, 0.018], [0, length * 0.42, 0], material, width * 0.35);
    return pivot;
  }

  const hourHand = createHand('right-clock-hour-hand', 0.19, 0.032, mintDarkMaterial, 0.112);
  const minuteHand = createHand('right-clock-minute-hand', 0.265, 0.025, mailboxRedMaterial, 0.122);
  const secondHand = createHand('right-clock-second-hand', 0.29, 0.012, burgundyMaterial, 0.132);
  const pin = new THREE.Mesh(new THREE.SphereGeometry(0.035, 20, 14), brassMaterial);
  pin.name = 'right-clock-center-pin';
  pin.position.z = 0.148;
  pin.scale.z = 0.45;
  root.add(pin);

  const hanger = createTube('right-clock-hanger', [[-0.1, 0.34, -0.015], [0, 0.48, -0.02], [0.1, 0.34, -0.015]], 0.011, cordMaterial, 36, 7);
  root.add(hanger);
  root.position.set(1.5, 0.72, -0.28);
  return { root, hourHand, minuteHand, secondHand };
}

function createMailboxEnvelope(index) {
  const envelope = new THREE.Group();
  envelope.name = `right-mailbox-envelope-${index + 1}`;
  addBox(envelope, `right-mailbox-envelope-paper-${index + 1}`, [0.48, 0.3, 0.022], [0, 0, 0], paperMaterial, 0.018);
  const fold = createTube(
    `right-mailbox-envelope-fold-${index + 1}`,
    [[-0.22, 0.13, 0.014], [0, -0.035, 0.017], [0.22, 0.13, 0.014]],
    0.006,
    new THREE.MeshStandardMaterial({ color: 0xb49d79, roughness: 0.8 }),
    28,
    6
  );
  envelope.add(fold);
  const seal = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 0.012, 24), burgundyMaterial);
  seal.name = `right-mailbox-envelope-seal-${index + 1}`;
  seal.rotation.x = Math.PI / 2;
  seal.position.set(0, -0.038, 0.022);
  envelope.add(seal);
  envelope.visible = false;
  return envelope;
}

function createMailboxProp() {
  const root = registerPart('right-bay-mailbox', new THREE.Group(), 'right-bay-portfolio');
  const body = addBox(root, 'right-mailbox-lower-body', [0.82, 0.4, 0.5], [0, -0.07, 0], mailboxRedMaterial, 0.085);
  body.scale.y = 0.94;
  const roof = new THREE.Mesh(new THREE.CylinderGeometry(0.25, 0.25, 0.82, 48), mailboxRedMaterial);
  roof.name = 'right-mailbox-rounded-roof';
  roof.rotation.z = Math.PI / 2;
  roof.position.set(0, 0.16, 0);
  roof.castShadow = true;
  roof.receiveShadow = true;
  root.add(roof);
  addBox(root, 'right-mailbox-dark-mouth', [0.69, 0.29, 0.018], [0, 0.02, 0.264], charcoalMaterial, 0.045);

  const doorPivot = new THREE.Group();
  doorPivot.name = 'right-mailbox-door-pivot';
  doorPivot.position.set(0, -0.25, 0.277);
  root.add(doorPivot);
  const door = addBox(doorPivot, 'right-mailbox-front-door', [0.78, 0.43, 0.035], [0, 0.215, 0], mailboxRedMaterial, 0.065);
  const mailTexture = createLabelTexture({ width: 520, height: 220, background: '#b82f39', accent: '#f5ead8', title: 'MAIL', lines: ['PRESS TO SEND', 'PORTFOLIO POST'], symbol: '→' });
  createTextPlane('right-mailbox-mail-label', [0.45, 0.19], mailTexture, [0, 0.24, 0.02], doorPivot);

  const button = new THREE.Group();
  button.name = 'right-mailbox-press-button';
  button.position.set(0.31, 0.03, 0.305);
  root.add(button);
  const buttonBase = new THREE.Mesh(new THREE.CylinderGeometry(0.055, 0.055, 0.045, 28), mailboxDarkMaterial);
  buttonBase.rotation.x = Math.PI / 2;
  button.add(buttonBase);
  const buttonCap = new THREE.Mesh(new THREE.CylinderGeometry(0.036, 0.036, 0.052, 28), brassMaterial);
  buttonCap.name = 'right-mailbox-button-cap';
  buttonCap.rotation.x = Math.PI / 2;
  buttonCap.position.z = 0.015;
  button.add(buttonCap);

  const envelopes = Array.from({ length: 4 }, (_, index) => {
    const envelope = createMailboxEnvelope(index);
    envelope.position.set(0, 0.02, 0.31 + index * 0.006);
    envelope.rotation.z = (index - 1.5) * 0.035;
    root.add(envelope);
    return envelope;
  });
  makePropInteractive(root, 'mailbox-button', 'right');
  root.position.set(1.5, -0.82, -0.08);
  root.scale.setScalar(0.92);
  return { root, doorPivot, button, envelopes, envelopeCursor: 0 };
}

function createPaintingCharmProp() {
  const root = registerPart('painting-charm', new THREE.Group(), 'left-door-interior');
  const easel = new THREE.Group();
  easel.name = 'painting-charm-mini-easel';
  root.add(easel);
  [-0.17, 0.17].forEach((x, index) => {
    const leg = addBox(easel, `painting-charm-easel-leg-${index + 1}`, [0.045, 0.48, 0.045], [x, -0.03, -0.03], woodMaterial, 0.018);
    leg.rotation.z = x < 0 ? 0.08 : -0.08;
  });
  addBox(easel, 'painting-charm-easel-crossbar', [0.46, 0.05, 0.055], [0, -0.18, -0.025], woodMaterial, 0.018);
  addBox(easel, 'painting-charm-canvas', [0.39, 0.42, 0.055], [0.03, 0.08, 0.015], paperMaterial, 0.035);
  const splashMaterial = new THREE.MeshPhysicalMaterial({ color: 0x5daee0, roughness: 0.25, clearcoat: 0.5 });
  [[0.03, 0.07, 0.055, 0.09], [-0.05, 0.02, 0.058, 0.055], [0.1, 0.12, 0.057, 0.045], [0.08, -0.01, 0.057, 0.035]].forEach(([x, y, z, s], index) => {
    const drop = new THREE.Mesh(new THREE.SphereGeometry(s, 20, 14), splashMaterial);
    drop.name = `painting-charm-blue-paint-${index + 1}`;
    drop.position.set(x, y, z);
    drop.scale.set(1.4, 0.8, 0.22);
    easel.add(drop);
  });
  const paletteShape = new THREE.Shape();
  paletteShape.absellipse(-0.13, 0.08, 0.23, 0.18, 0, Math.PI * 2, false, 0);
  const thumbHole = new THREE.Path();
  thumbHole.absellipse(-0.04, 0.04, 0.045, 0.045, 0, Math.PI * 2, true, 0);
  paletteShape.holes.push(thumbHole);
  const paletteGeometry = new THREE.ExtrudeGeometry(paletteShape, { depth: 0.04, bevelEnabled: true, bevelSegments: 2, bevelSize: 0.012, bevelThickness: 0.01 });
  paletteGeometry.translate(0, 0, 0.065);
  const palette = new THREE.Mesh(paletteGeometry, new THREE.MeshPhysicalMaterial({ color: 0xc9af8e, roughness: 0.42, clearcoat: 0.28 }));
  palette.name = 'painting-charm-palette';
  palette.position.set(-0.16, 0.04, 0.035);
  palette.castShadow = true;
  root.add(palette);
  const paints = [0xf09bb2, 0xf0dc79, 0x93e0c2, 0xb390d6, 0x6ec4df];
  [[-0.3, 0.15], [-0.31, 0.04], [-0.26, -0.07], [-0.13, -0.1], [-0.07, 0.15]].forEach(([x, y], index) => {
    const blob = new THREE.Mesh(new THREE.SphereGeometry(0.037, 18, 12), new THREE.MeshPhysicalMaterial({ color: paints[index], roughness: 0.28, clearcoat: 0.55 }));
    blob.name = `painting-charm-paint-blob-${index + 1}`;
    blob.position.set(x, y, 0.125);
    blob.scale.z = 0.28;
    root.add(blob);
  });
  const brush = new THREE.Group();
  brush.name = 'painting-charm-brush';
  brush.position.set(-0.04, 0.18, 0.16);
  brush.rotation.z = -0.67;
  root.add(brush);
  addBox(brush, 'painting-charm-brush-handle', [0.09, 0.42, 0.065], [0, 0.13, 0], skyMaterial, 0.035);
  addBox(brush, 'painting-charm-brush-ferrule', [0.105, 0.115, 0.07], [0, -0.125, 0], chromeMaterial, 0.018);
  const bristles = new THREE.Mesh(new THREE.ConeGeometry(0.07, 0.16, 24), ivoryMaterial);
  bristles.name = 'painting-charm-bristles';
  bristles.position.y = -0.255;
  bristles.rotation.z = Math.PI;
  brush.add(bristles);
  const hook = new THREE.Mesh(new THREE.TorusGeometry(0.05, 0.012, 10, 28, Math.PI * 1.6), chromeMaterial);
  hook.name = 'painting-charm-door-hook';
  hook.position.set(0, 0.42, -0.02);
  hook.rotation.x = Math.PI / 2;
  root.add(hook);
  root.position.set(-1.0, -0.83, -0.09);
  root.rotation.y = Math.PI;
  root.scale.setScalar(0.78);
  makePropInteractive(root, 'painting-charm');
  return { root, brush, palette };
}

function createPlannerTexture(kind) {
  const textureCanvas = document.createElement('canvas');
  textureCanvas.width = kind === 'calendar' ? 640 : 420;
  textureCanvas.height = kind === 'calendar' ? 470 : 520;
  const ctx = textureCanvas.getContext('2d');
  const width = textureCanvas.width;
  const height = textureCanvas.height;

  ctx.fillStyle = kind === 'calendar' ? '#f4f0e7' : '#efe59a';
  ctx.fillRect(0, 0, width, height);
  ctx.strokeStyle = kind === 'calendar' ? '#7d8178' : '#393d35';
  ctx.fillStyle = '#33372f';
  ctx.lineCap = 'round';

  if (kind === 'calendar') {
    ctx.font = '700 38px Arial';
    ctx.fillText('MONTHLY PLAN', 34, 58);
    ctx.font = '600 20px Arial';
    ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'].forEach((day, index) => ctx.fillText(day, 28 + index * 86, 108));
    ctx.lineWidth = 3;
    const top = 126;
    const cellW = (width - 44) / 7;
    const cellH = (height - top - 26) / 5;
    for (let column = 0; column <= 7; column += 1) {
      ctx.beginPath();
      ctx.moveTo(22 + column * cellW, top);
      ctx.lineTo(22 + column * cellW, height - 26);
      ctx.stroke();
    }
    for (let row = 0; row <= 5; row += 1) {
      ctx.beginPath();
      ctx.moveTo(22, top + row * cellH);
      ctx.lineTo(width - 22, top + row * cellH);
      ctx.stroke();
    }
    ctx.font = '600 19px Arial';
    for (let day = 1; day <= 31; day += 1) {
      const index = day + 1;
      const column = index % 7;
      const row = Math.floor(index / 7);
      ctx.fillText(String(day), 31 + column * cellW, top + 24 + row * cellH);
    }
  } else {
    ctx.font = '800 46px Arial';
    ctx.fillText('CHECK LIST', 42, 76);
    ctx.font = '600 25px Arial';
    const labels = ['IDEA', 'BUILD', 'REVIEW', 'POLISH'];
    labels.forEach((label, index) => {
      const y = 148 + index * 78;
      ctx.lineWidth = 5;
      ctx.strokeRect(44, y - 27, 27, 27);
      if (index < 2) {
        ctx.beginPath();
        ctx.moveTo(47, y - 11);
        ctx.lineTo(57, y - 1);
        ctx.lineTo(75, y - 31);
        ctx.stroke();
      }
      ctx.fillText(label, 96, y);
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(96, y + 12);
      ctx.lineTo(width - 44, y + 12);
      ctx.stroke();
    });
  }

  const texture = new THREE.CanvasTexture(textureCanvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.anisotropy = renderer.capabilities.getMaxAnisotropy();
  return texture;
}

function createLeftBayDecor(parent) {
  const decor = registerPart('left-bay-decor', new THREE.Group(), 'left-bay-portfolio');
  parent.add(decor);

  const calendar = createTextPlane('left-bay-monthly-plan', [0.56, 0.41], createPlannerTexture('calendar'), [-1.29, 1.03, -0.346], decor);
  calendar.rotation.z = -0.018;
  const checklist = createTextPlane('left-bay-check-list', [0.34, 0.43], createPlannerTexture('checklist'), [-1.87, 1.08, -0.34], decor);
  checklist.rotation.z = 0.055;
  addBox(decor, 'planner-pin', [0.045, 0.045, 0.025], [-1.29, 1.265, -0.328], burgundyMaterial, 0.02);
  addBox(decor, 'checklist-pin', [0.045, 0.045, 0.025], [-1.87, 1.32, -0.322], mintDarkMaterial, 0.02);

  const bookColors = [
    new THREE.MeshPhysicalMaterial({ color: 0xc6ac79, roughness: 0.72, clearcoat: 0.08 }),
    new THREE.MeshPhysicalMaterial({ color: 0x2d302c, roughness: 0.68, clearcoat: 0.05 }),
    new THREE.MeshPhysicalMaterial({ color: 0xb8876e, roughness: 0.7, clearcoat: 0.08 }),
    new THREE.MeshPhysicalMaterial({ color: 0xd9a38d, roughness: 0.68, clearcoat: 0.08 }),
    new THREE.MeshPhysicalMaterial({ color: 0x80b8a7, roughness: 0.64, clearcoat: 0.12 }),
    new THREE.MeshPhysicalMaterial({ color: 0x8b4052, roughness: 0.66, clearcoat: 0.08 })
  ];
  const books = registerPart('left-bay-books', new THREE.Group(), 'left-bay-portfolio');
  decor.add(books);
  const specs = [
    [-2.075, 0.61, 0.105, bookColors[0], -0.018],
    [-1.925, 0.72, 0.1, bookColors[1], 0.012],
    [-1.775, 0.57, 0.105, bookColors[2], -0.012],
    [-1.62, 0.66, 0.105, bookColors[3], 0.014]
  ];
  specs.forEach(([x, height, width, material, rotation], index) => {
    const bookGroup = new THREE.Group();
    bookGroup.name = `left-bay-book-${index + 1}-rig`;
    bookGroup.position.set(x, -0.015, -0.135);
    bookGroup.rotation.z = rotation;
    books.add(bookGroup);
    addBox(bookGroup, `left-bay-book-${index + 1}`, [width, height, 0.29], [0, height / 2, 0], material, 0.012);
    addBox(bookGroup, `left-bay-book-${index + 1}-spine-band`, [width * 0.76, 0.025, 0.012], [0, height * 0.68, 0.151], ivoryMaterial, 0.004);
  });
  return decor;
}

function createStickerTexture(kind, palette) {
  const textureCanvas = document.createElement('canvas');
  textureCanvas.width = 256;
  textureCanvas.height = 256;
  const ctx = textureCanvas.getContext('2d');
  ctx.clearRect(0, 0, 256, 256);
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  const [a, b, c] = palette;

  if (kind === 'smile') {
    ctx.fillStyle = '#fff8df'; ctx.strokeStyle = '#343329'; ctx.lineWidth = 8;
    ctx.beginPath(); ctx.arc(128, 128, 92, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
    ctx.fillStyle = a; ctx.beginPath(); ctx.arc(128, 128, 76, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#343329'; ctx.beginPath(); ctx.arc(101, 111, 8, 0, Math.PI * 2); ctx.arc(155, 111, 8, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = '#343329'; ctx.lineWidth = 9; ctx.beginPath(); ctx.arc(128, 132, 39, 0.18, Math.PI - 0.18); ctx.stroke();
  } else if (kind === 'flower') {
    ctx.fillStyle = '#fff8df'; ctx.beginPath(); ctx.arc(128, 128, 105, 0, Math.PI * 2); ctx.fill();
    for (let i = 0; i < 8; i += 1) { const angle = i * Math.PI / 4; ctx.fillStyle = i % 2 ? b : a; ctx.beginPath(); ctx.ellipse(128 + Math.cos(angle) * 54, 128 + Math.sin(angle) * 54, 36, 22, angle, 0, Math.PI * 2); ctx.fill(); }
    ctx.fillStyle = c; ctx.beginPath(); ctx.arc(128, 128, 36, 0, Math.PI * 2); ctx.fill();
  } else if (kind === 'rainbow') {
    ctx.fillStyle = '#fff8df'; ctx.beginPath(); ctx.roundRect(12, 48, 232, 160, 46); ctx.fill();
    [a, b, c, '#f4d45f'].forEach((color, index) => { ctx.strokeStyle = color; ctx.lineWidth = 20; ctx.beginPath(); ctx.arc(128, 172, 78 - index * 17, Math.PI, Math.PI * 2); ctx.stroke(); });
    ctx.fillStyle = '#fff8df'; ctx.fillRect(34, 171, 188, 48);
  } else if (kind === 'heart') {
    ctx.fillStyle = '#fff8df'; ctx.beginPath(); ctx.arc(128, 128, 105, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = a; ctx.beginPath(); ctx.moveTo(128, 205); ctx.bezierCurveTo(112, 181, 48, 147, 48, 94); ctx.bezierCurveTo(48, 47, 106, 45, 128, 83); ctx.bezierCurveTo(150, 45, 208, 47, 208, 94); ctx.bezierCurveTo(208, 147, 144, 181, 128, 205); ctx.fill();
  } else if (['apple', 'coffee', 'cheese', 'milk', 'toast', 'pudding'].includes(kind)) {
    const line = '#5d625c';
    const drawFace = (x, y, width = 30) => {
      ctx.fillStyle = line;
      ctx.beginPath(); ctx.arc(x - width * 0.3, y, 3.5, 0, Math.PI * 2); ctx.arc(x + width * 0.3, y, 3.5, 0, Math.PI * 2); ctx.fill();
      ctx.strokeStyle = line; ctx.lineWidth = 4; ctx.beginPath(); ctx.arc(x, y + 8, width * 0.26, 0.22, Math.PI - 0.22); ctx.stroke();
    };
    ctx.shadowColor = 'rgba(51, 57, 47, .18)'; ctx.shadowBlur = 11; ctx.shadowOffsetY = 5;
    ctx.fillStyle = '#fffdf4'; ctx.strokeStyle = '#747b73'; ctx.lineWidth = 5;
    ctx.beginPath(); ctx.roundRect(20, 24, 216, 208, 46); ctx.fill(); ctx.stroke();
    ctx.shadowColor = 'transparent';
    if (kind === 'apple') {
      ctx.fillStyle = a; ctx.beginPath(); ctx.ellipse(128, 141, 61, 57, 0, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#6c7650'; ctx.beginPath(); ctx.roundRect(121, 64, 11, 37, 6); ctx.fill();
      ctx.fillStyle = b; ctx.beginPath(); ctx.ellipse(158, 75, 25, 13, -0.5, 0, Math.PI * 2); ctx.fill();
      drawFace(128, 140, 36);
    } else if (kind === 'coffee') {
      ctx.fillStyle = a; ctx.strokeStyle = line; ctx.lineWidth = 5; ctx.beginPath(); ctx.roundRect(68, 92, 110, 77, 23); ctx.fill(); ctx.stroke();
      ctx.beginPath(); ctx.arc(181, 124, 24, -1.1, 1.1); ctx.stroke();
      ctx.fillStyle = '#9b795b'; ctx.beginPath(); ctx.ellipse(123, 101, 47, 12, 0, 0, Math.PI * 2); ctx.fill();
      ctx.strokeStyle = '#a5cbd5'; ctx.lineWidth = 5; [[98, 75], [127, 65], [154, 76]].forEach(([x, y]) => { ctx.beginPath(); ctx.arc(x, y, 11, Math.PI * 1.12, Math.PI * 1.86); ctx.stroke(); });
      drawFace(122, 133, 31);
    } else if (kind === 'cheese') {
      ctx.fillStyle = a; ctx.strokeStyle = line; ctx.lineWidth = 5; ctx.beginPath(); ctx.moveTo(68, 174); ctx.lineTo(177, 169); ctx.lineTo(153, 79); ctx.closePath(); ctx.fill(); ctx.stroke();
      ctx.fillStyle = '#fff4a6'; [[120, 126, 13], [143, 148, 10], [101, 154, 8]].forEach(([x, y, radius]) => { ctx.beginPath(); ctx.arc(x, y, radius, 0, Math.PI * 2); ctx.fill(); });
      drawFace(121, 151, 27);
    } else if (kind === 'milk') {
      ctx.fillStyle = '#eaf3f6'; ctx.strokeStyle = line; ctx.lineWidth = 5; ctx.beginPath(); ctx.roundRect(80, 76, 90, 112, 22); ctx.fill(); ctx.stroke();
      ctx.fillStyle = a; ctx.beginPath(); ctx.roundRect(83, 76, 84, 28, 15); ctx.fill();
      ctx.strokeStyle = b; ctx.lineWidth = 7; ctx.beginPath(); ctx.moveTo(112, 64); ctx.lineTo(119, 77); ctx.lineTo(143, 77); ctx.lineTo(150, 64); ctx.stroke();
      drawFace(125, 141, 28);
    } else if (kind === 'toast') {
      ctx.fillStyle = '#e1b37d'; ctx.strokeStyle = line; ctx.lineWidth = 5; ctx.beginPath(); ctx.moveTo(84, 183); ctx.lineTo(75, 118); ctx.bezierCurveTo(70, 66, 101, 53, 128, 67); ctx.bezierCurveTo(155, 53, 187, 66, 181, 118); ctx.lineTo(172, 183); ctx.closePath(); ctx.fill(); ctx.stroke();
      ctx.fillStyle = '#fff4dc'; ctx.beginPath(); ctx.moveTo(96, 174); ctx.lineTo(89, 119); ctx.bezierCurveTo(85, 84, 108, 76, 128, 86); ctx.bezierCurveTo(148, 76, 171, 84, 167, 119); ctx.lineTo(160, 174); ctx.closePath(); ctx.fill();
      drawFace(128, 139, 30);
    } else {
      ctx.fillStyle = a; ctx.strokeStyle = line; ctx.lineWidth = 5; ctx.beginPath(); ctx.roundRect(70, 116, 116, 64, 24); ctx.fill(); ctx.stroke();
      ctx.fillStyle = b; ctx.beginPath(); ctx.ellipse(128, 112, 58, 25, 0, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = c; ctx.beginPath(); ctx.arc(105, 91, 8, 0, Math.PI * 2); ctx.arc(132, 83, 8, 0, Math.PI * 2); ctx.arc(153, 96, 8, 0, Math.PI * 2); ctx.fill();
      drawFace(128, 145, 30);
    }
  } else {
    ctx.fillStyle = '#fff8df'; ctx.strokeStyle = '#343329'; ctx.lineWidth = 7; ctx.beginPath(); ctx.roundRect(13, 45, 230, 166, 34); ctx.fill(); ctx.stroke();
    ctx.fillStyle = a; ctx.beginPath(); ctx.roundRect(28, 60, 200, 136, 25); ctx.fill();
    ctx.fillStyle = '#343329'; ctx.font = '900 37px Arial'; ctx.textAlign = 'center'; ctx.fillText('DREAM', 128, 121); ctx.fillText('A LITTLE', 128, 163);
  }

  const texture = new THREE.CanvasTexture(textureCanvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.anisotropy = renderer.capabilities.getMaxAnisotropy();
  return texture;
}

function addSticker(parent, name, kind, palette, position, size = 0.22, rotation = 0) {
  const material = new THREE.MeshPhysicalMaterial({
    map: createStickerTexture(kind, palette),
    transparent: true,
    alphaTest: 0.05,
    side: THREE.DoubleSide,
    roughness: 0.34,
    metalness: 0,
    clearcoat: 0.18,
    clearcoatRoughness: 0.3,
    depthWrite: true
  });
  const mesh = new THREE.Mesh(new THREE.PlaneGeometry(size, size), material);
  mesh.name = name;
  mesh.position.set(...position);
  mesh.rotation.z = rotation;
  mesh.castShadow = true;
  mesh.userData.draggable = true;
  mesh.userData.explodeWithParent = true;
  mesh.userData.bounds = { xMin: -0.67, xMax: -0.08, yMin: -1.35, yMax: 1.35 };
  parent.add(mesh);
  stickers.push(mesh);
  return mesh;
}

function addDoorInteriorSticker(parent, name, kind, palette, position, size = 0.19, rotation = 0, flipToDoor = true) {
  const root = new THREE.Group();
  root.name = name;
  root.position.set(...position);
  root.rotation.set(0, flipToDoor ? Math.PI : 0, rotation);
  root.userData.explodeWithParent = true;

  const backing = new THREE.Mesh(
    new RoundedBoxGeometry(size * 0.94, size * 0.94, 0.016, 5, size * 0.11),
    new THREE.MeshPhysicalMaterial({ color: 0xfffdf2, roughness: 0.55, metalness: 0, clearcoat: 0.08, clearcoatRoughness: 0.38 })
  );
  backing.name = `${name}-paper-rim`;
  backing.position.z = 0.007;
  backing.castShadow = true;
  backing.receiveShadow = true;

  const face = new THREE.Mesh(
    new THREE.PlaneGeometry(size, size),
    new THREE.MeshPhysicalMaterial({ map: createStickerTexture(kind, palette), transparent: true, alphaTest: 0.05, side: THREE.DoubleSide, roughness: 0.36, clearcoat: 0.2, clearcoatRoughness: 0.27 })
  );
  face.name = `${name}-illustration`;
  face.position.z = 0.018;
  face.castShadow = true;
  root.add(backing, face);
  parent.add(root);
  return root;
}

const projectBoxDefinitions = [
  {
    id: 'gugu-island',
    name: '咕咕岛',
    code: 'PROJECT 01',
    accent: '#d96643',
    position: [-0.14, -1.28, -0.12],
    size: [0.96, 0.33, 0.52],
    rotation: -0.045,
    images: [assetUrl('assets/projects/gugu-island-01.png'), assetUrl('assets/projects/gugu-island-02.png')]
  },
  {
    id: 'goodboy',
    name: 'GOODBOY',
    code: 'PROJECT 04',
    accent: '#595b5c',
    position: [0.18, -0.84, -0.05],
    size: [0.82, 0.31, 0.47],
    rotation: 0.055,
    images: [assetUrl('assets/projects/goodboy-01.png'), assetUrl('assets/projects/goodboy-02.png')]
  },
  {
    id: 'tooth-squad',
    name: '牙芽奇兵局',
    code: 'PROJECT 02',
    accent: '#a88ce0',
    position: [-0.15, -0.42, -0.13],
    size: [0.98, 0.33, 0.52],
    rotation: -0.028,
    images: [assetUrl('assets/projects/tooth-squad-01.png'), assetUrl('assets/projects/tooth-squad-02.png'), assetUrl('assets/projects/tooth-squad-03.png')]
  },
  {
    id: 'kunqu-motion',
    name: '昆曲韵动',
    code: 'PROJECT 03',
    accent: '#e5a5b5',
    position: [0.17, 0, -0.05],
    size: [0.8, 0.31, 0.46],
    rotation: 0.048,
    images: [assetUrl('assets/projects/kunqu-motion-01.png')]
  },
  {
    id: 'lingfu',
    name: '灵馥',
    code: 'PROJECT 05',
    accent: '#9fc8bd',
    position: [-0.06, 0.42, -0.12],
    size: [0.92, 0.33, 0.5],
    rotation: -0.018,
    images: [assetUrl('assets/projects/lingfu-01.png'), assetUrl('assets/projects/lingfu-02.png'), assetUrl('assets/projects/lingfu-03.png')]
  }
];

const projectPageDefinitions = {
  'gugu-island': {
    index: '01',
    name: '咕咕岛',
    kicker: 'CULTURAL GAME EXPERIENCE',
    summary: '以传统文化视觉语言为线索构建岛屿探索体验，将叙事、收集与互动任务组织成清晰的产品闭环。',
    role: '产品经理 · 交互设计',
    tasks: '用户场景梳理、核心玩法规划、信息架构、交互原型与视觉协同',
    tools: ['Figma', 'ChatGPT', 'Blender', 'PS'],
    accent: '#d96643',
    ink: '#28241e',
    trail: 'feather',
    layout: 'long'
  },
  'tooth-squad': {
    index: '02',
    name: '牙芽奇兵局',
    kicker: 'CHILDREN ORAL-CARE SYSTEM',
    summary: '围绕儿童刷牙依从性设计的软硬件体验，通过角色激励、即时反馈与成长记录降低使用门槛。',
    role: '产品经理 · UX / UI 设计',
    tasks: '亲子用户研究、服务流程、功能优先级、硬件交互与游戏化反馈设计',
    tools: ['Figma', 'ChatGPT', 'Blender', 'Codex', '即梦'],
    accent: '#a88ce0',
    ink: '#302b3d',
    trail: 'bubble',
    layout: 'tooth'
  },
  'kunqu-motion': {
    index: '03',
    name: '昆曲韵动',
    kicker: 'INTANGIBLE HERITAGE · MOTION',
    summary: '把昆曲身段、节奏与数字互动结合，以年轻化运动体验建立传统文化进入日常生活的新路径。',
    role: '产品策划 · 体验设计',
    tasks: '文化内容转译、体验流程、动作交互、原型验证与视觉叙事',
    tools: ['Figma', 'ChatGPT', 'PS', '即梦', 'Blender'],
    accent: '#e5a5b5',
    ink: '#3a2830',
    trail: 'fan',
    layout: 'long'
  },
  goodboy: {
    index: '04',
    name: 'GOODBOY',
    kicker: 'PET SERVICE PRODUCT',
    summary: '从真实养宠行为出发梳理问题链路，以轻量服务、行为提醒与陪伴式反馈形成可持续的养宠体验。',
    role: '视觉设计',
    tasks: '需求洞察、产品策略、用户旅程、功能原型与品牌触点设计',
    tools: ['Figma', 'Rive', 'AE', 'Claude', 'ChatGPT'],
    accent: '#5c5d5e',
    ink: '#252526',
    trail: 'bone',
    layout: 'long'
  },
  lingfu: {
    index: '05',
    name: '灵馥',
    kicker: 'DIGITAL FRAGRANCE EXPERIENCE',
    summary: '围绕气味、情绪与空间营造构建多终端香氛体验，让实体装置、内容与数字服务形成连续交互。',
    role: '产品经理 · 体验策略',
    tasks: '机会点定义、产品生态、场景流程、交互原型与多端体验设计',
    tools: ['Figma', 'PS', 'Blender', '即梦', 'ChatGPT'],
    accent: '#9fc8bd',
    ink: '#25433d',
    trail: 'smoke',
    layout: 'long'
  }
};
const projectOrder = ['gugu-island', 'tooth-squad', 'kunqu-motion', 'goodboy', 'lingfu'];
let projectPageManifest = null;
const projectManifestPromise = fetch(assetUrl('project-pages/manifest.json'))
  .then((response) => {
    if (!response.ok) throw new Error(`项目素材清单加载失败：${response.status}`);
    return response.json();
  })
  .then((manifest) => {
    projectPageManifest = manifest;
    return manifest;
  })
  .catch((error) => {
    console.error(error);
    return null;
  });

function createProjectLabelTexture(definition) {
  const labelCanvas = document.createElement('canvas');
  labelCanvas.width = 760;
  labelCanvas.height = 250;
  const ctx = labelCanvas.getContext('2d');
  ctx.fillStyle = '#f5efdf';
  ctx.fillRect(0, 0, labelCanvas.width, labelCanvas.height);
  ctx.fillStyle = definition.accent;
  ctx.fillRect(0, 0, 25, labelCanvas.height);
  ctx.strokeStyle = 'rgba(66,54,39,.22)';
  ctx.lineWidth = 6;
  ctx.strokeRect(16, 16, labelCanvas.width - 32, labelCanvas.height - 32);
  ctx.fillStyle = '#4b3a2d';
  ctx.font = '800 35px ui-monospace, Menlo, monospace';
  ctx.fillText(definition.code, 62, 68);
  ctx.font = definition.name === 'GOODBOY' ? '900 78px Arial' : '900 76px "Microsoft YaHei", Arial';
  ctx.fillText(definition.name, 60, 163);
  ctx.fillStyle = 'rgba(75,58,45,.58)';
  ctx.font = '700 24px ui-monospace, Menlo, monospace';
  ctx.fillText('ARCHIVE BOX / HOVER TO UNPACK', 62, 211);
  const texture = new THREE.CanvasTexture(labelCanvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.anisotropy = renderer.capabilities.getMaxAnisotropy();
  return texture;
}

function createOutlinedStickerTexture(url) {
  const output = document.createElement('canvas');
  output.width = 512;
  output.height = 512;
  const outputContext = output.getContext('2d');
  const texture = new THREE.CanvasTexture(output);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.anisotropy = renderer.capabilities.getMaxAnisotropy();

  const image = new Image();
  image.decoding = 'async';
  image.onload = () => {
    const source = document.createElement('canvas');
    source.width = 512;
    source.height = 512;
    const sourceContext = source.getContext('2d', { willReadFrequently: true });
    const inset = 42;
    const scale = Math.min((512 - inset * 2) / image.width, (512 - inset * 2) / image.height);
    const drawWidth = Math.max(1, Math.round(image.width * scale));
    const drawHeight = Math.max(1, Math.round(image.height * scale));
    const drawX = Math.round((512 - drawWidth) / 2);
    const drawY = Math.round((512 - drawHeight) / 2);
    sourceContext.drawImage(image, drawX, drawY, drawWidth, drawHeight);

    const frame = sourceContext.getImageData(0, 0, 512, 512);
    const pixels = frame.data;
    const cornerPoints = [
      [drawX + 2, drawY + 2],
      [drawX + drawWidth - 3, drawY + 2],
      [drawX + 2, drawY + drawHeight - 3],
      [drawX + drawWidth - 3, drawY + drawHeight - 3]
    ];
    const opaqueCorners = cornerPoints.map(([x, y]) => {
      const index = (y * 512 + x) * 4;
      return [pixels[index], pixels[index + 1], pixels[index + 2], pixels[index + 3]];
    }).filter((color) => color[3] > 20);

    if (opaqueCorners.length) {
      const background = opaqueCorners.reduce((result, color) => result.map((value, index) => value + color[index]), [0, 0, 0, 0]).map((value) => value / opaqueCorners.length);
      const visited = new Uint8Array(512 * 512);
      const queueX = new Int16Array(512 * 512);
      const queueY = new Int16Array(512 * 512);
      let head = 0;
      let tail = 0;
      const backgroundLuminance = background[0] * 0.299 + background[1] * 0.587 + background[2] * 0.114;
      const isBackground = (x, y) => {
        const index = (y * 512 + x) * 4;
        if (pixels[index + 3] < 22) return true;
        const red = pixels[index];
        const green = pixels[index + 1];
        const blue = pixels[index + 2];
        const distance = Math.hypot(red - background[0], green - background[1], blue - background[2]);
        const luminance = red * 0.299 + green * 0.587 + blue * 0.114;
        const spread = Math.max(red, green, blue) - Math.min(red, green, blue);
        return distance < 58 || (backgroundLuminance > 222 && luminance > 246 && spread < 18);
      };
      const enqueue = (x, y) => {
        if (x < drawX || x >= drawX + drawWidth || y < drawY || y >= drawY + drawHeight) return;
        const index = y * 512 + x;
        if (visited[index] || !isBackground(x, y)) return;
        visited[index] = 1;
        queueX[tail] = x;
        queueY[tail] = y;
        tail += 1;
      };
      for (let x = drawX; x < drawX + drawWidth; x += 1) {
        enqueue(x, drawY);
        enqueue(x, drawY + drawHeight - 1);
      }
      for (let y = drawY; y < drawY + drawHeight; y += 1) {
        enqueue(drawX, y);
        enqueue(drawX + drawWidth - 1, y);
      }
      while (head < tail) {
        const x = queueX[head];
        const y = queueY[head];
        head += 1;
        const pixelIndex = (y * 512 + x) * 4;
        pixels[pixelIndex + 3] = 0;
        enqueue(x + 1, y);
        enqueue(x - 1, y);
        enqueue(x, y + 1);
        enqueue(x, y - 1);
      }
      sourceContext.putImageData(frame, 0, 0);
    }

    const mask = document.createElement('canvas');
    mask.width = 512;
    mask.height = 512;
    const maskContext = mask.getContext('2d');
    maskContext.drawImage(source, 0, 0);
    maskContext.globalCompositeOperation = 'source-in';
    maskContext.fillStyle = '#fffdf4';
    maskContext.fillRect(0, 0, 512, 512);

    outputContext.clearRect(0, 0, 512, 512);
    outputContext.save();
    outputContext.globalAlpha = 0.3;
    outputContext.filter = 'blur(13px)';
    outputContext.drawImage(mask, 12, 18);
    outputContext.restore();
    outputContext.save();
    for (let index = 0; index < 36; index += 1) {
      const angle = (index / 36) * Math.PI * 2;
      outputContext.drawImage(mask, Math.cos(angle) * 13, Math.sin(angle) * 13);
    }
    outputContext.restore();
    outputContext.drawImage(source, 0, 0);
    texture.needsUpdate = true;
  };
  image.src = url;
  return texture;
}

function createProjectStickerMesh(projectId, url, index, total) {
  const material = new THREE.MeshBasicMaterial({
    map: createOutlinedStickerTexture(url),
    transparent: true,
    alphaTest: 0.015,
    side: THREE.DoubleSide,
    depthWrite: false,
    toneMapped: false
  });
  const size = total === 1 ? 0.43 : total === 2 ? 0.38 : 0.34;
  const mesh = new THREE.Mesh(new THREE.PlaneGeometry(size, size), material);
  mesh.name = `${projectId}-project-sticker-${index + 1}`;
  mesh.castShadow = true;
  mesh.renderOrder = 12 + index;
  mesh.userData.projectSticker = true;
  mesh.userData.projectBoxId = projectId;
  return mesh;
}

function createProjectBoxes(parent) {
  const stack = registerPart('center-project-boxes', new THREE.Group(), 'center-project-boxes');
  parent.add(stack);

  projectBoxDefinitions.forEach((definition, definitionIndex) => {
    const root = registerPart(`project-box-${definition.id}`, new THREE.Group(), 'center-project-boxes');
    root.position.set(...definition.position);
    root.rotation.z = definition.rotation;
    stack.add(root);
    const [width, height, depth] = definition.size;
    const material = cardboardMaterials[definitionIndex % cardboardMaterials.length];
    const body = addBox(root, `${definition.id}-box-body`, [width, height, depth], [0, 0, 0], material, 0.035);
    body.userData.projectBoxSurface = true;
    addBox(root, `${definition.id}-box-mouth`, [width * 0.84, 0.034, depth * 0.74], [0, height / 2 + 0.012, -0.005], cardboardInsideMaterial, 0.012);
    const frontFlap = addBox(root, `${definition.id}-front-flap`, [width * 0.86, 0.145, 0.025], [0, height / 2 + 0.065, depth / 2 - 0.025], material, 0.012);
    frontFlap.rotation.x = -0.48;
    const backFlap = addBox(root, `${definition.id}-back-flap`, [width * 0.82, 0.13, 0.025], [0, height / 2 + 0.057, -depth / 2 + 0.028], material, 0.012);
    backFlap.rotation.x = 0.42;
    const leftFlap = addBox(root, `${definition.id}-left-flap`, [0.14, 0.13, depth * 0.66], [-width / 2 + 0.045, height / 2 + 0.045, 0], material, 0.012);
    leftFlap.rotation.z = 0.47;
    const rightFlap = addBox(root, `${definition.id}-right-flap`, [0.14, 0.13, depth * 0.66], [width / 2 - 0.045, height / 2 + 0.045, 0], material, 0.012);
    rightFlap.rotation.z = -0.47;

    const label = new THREE.Mesh(
      new THREE.PlaneGeometry(width * 0.76, Math.min(0.21, height * 0.54)),
      new THREE.MeshBasicMaterial({ map: createProjectLabelTexture(definition), toneMapped: false })
    );
    label.name = `${definition.id}-box-project-label`;
    label.position.set(0, -height * 0.07, depth / 2 + 0.006);
    label.renderOrder = 3;
    root.add(label);

    const stickerGroup = new THREE.Group();
    stickerGroup.name = `${definition.id}-sticker-reveal-rig`;
    stickerGroup.position.set(0, height / 2 + 0.015, depth * 0.12);
    root.add(stickerGroup);
    const stickerRigs = definition.images.map((url, index) => {
      const sticker = createProjectStickerMesh(definition.id, url, index, definition.images.length);
      const centerIndex = (definition.images.length - 1) / 2;
      const fan = index - centerIndex;
      sticker.position.set(fan * 0.13, -0.13 + Math.abs(fan) * 0.012, 0.105 + index * 0.008);
      sticker.rotation.z = fan * 0.16;
      stickerGroup.add(sticker);
      return {
        mesh: sticker,
        restPosition: sticker.position.clone(),
        restRotation: sticker.rotation.clone(),
        revealPosition: new THREE.Vector3(fan * 0.2, 0.16 + (index % 2) * 0.07, 0.255 + index * 0.016),
        revealRotation: new THREE.Euler(0, fan * -0.13, fan * 0.27)
      };
    });

    const rig = {
      id: definition.id,
      name: definition.name,
      root,
      body,
      label,
      stickerGroup,
      stickerRigs,
      pinned: false,
      revealed: false,
      restPosition: root.position.clone(),
      restScale: root.scale.clone()
    };
    root.traverse((object) => {
      if (!object.isMesh) return;
      object.userData.projectBoxId = definition.id;
      projectBoxHitMeshes.push(object);
    });
    projectBoxes.push(rig);
  });

  return stack;
}

function createDoorLeaf(name, width, height, pivotSide = 'right') {
  const pivot = registerPart(name, new THREE.Group(), 'door-assembly');
  const offset = pivotSide === 'right' ? -width / 2 : width / 2;
  const panel = addBox(pivot, `${name}-panel`, [width, height, 0.055], [offset, 0, 0], paint, 0.018);
  panel.userData.explodeWithParent = true;
  panel.userData.doorSurface = true;
  panel.userData.doorId = 'center';
  openables.push(panel);
  addPanelFrame(panel, width - 0.02, height - 0.02, 0.038, paint, false);
  addPanelFrame(panel, width - 0.02, height - 0.02, -0.038, paintInner, true);
  addVentGrid(pivot, offset, 1.23, 0.032, 3, 4, 1);
  addVentGrid(pivot, offset, -1.23, 0.032, 3, 4, 1);
  return { pivot, panel, offset };
}

function createLocker() {
  const W = 4.65;
  const H = 3.25;
  const D = 0.82;
  const bay = 1.44;
  const frame = registerPart('carcass', new THREE.Group());
  locker.add(frame);

  addBox(frame, 'carcass-back-panel', [W - 0.16, H - 0.14, 0.075], [0, 0, -D / 2], paintInner, 0.02);
  addBox(frame, 'carcass-left-side', [0.12, H, D], [-W / 2, 0, 0], paint, 0.025);
  addBox(frame, 'carcass-right-side', [0.12, H, D], [W / 2, 0, 0], paint, 0.025);
  addBox(frame, 'carcass-top', [W + 0.05, 0.14, D], [0, H / 2, 0], paint, 0.03);
  addBox(frame, 'carcass-bottom', [W + 0.05, 0.14, D], [0, -H / 2, 0], paint, 0.03);
  addBox(frame, 'carcass-plinth', [W + 0.12, 0.17, D + 0.05], [0, -H / 2 - 0.13, -0.01], paint, 0.035);

  const dividers = registerPart('dividers', new THREE.Group());
  locker.add(dividers);
  [-0.76, 0.76].forEach((x, index) => addBox(dividers, `divider-post-${index + 1}`, [0.12, H - 0.16, D - 0.03], [x, 0, -0.005], paint, 0.02));

  const interior = registerPart('interior-bay', new THREE.Group());
  locker.add(interior);
  addBox(interior, 'interior-bay-rear', [bay - 0.1, H - 0.26, 0.04], [0, 0, -D / 2 + 0.055], paintInner, 0.01);
  addBox(interior, 'interior-bay-top-rail', [bay - 0.09, 0.09, D - 0.12], [0, H / 2 - 0.17, -0.02], paintInner, 0.015);

  const shelves = registerPart('shelves', new THREE.Group());
  locker.add(shelves);
  const leftShelfY = -0.05;
  const leftShelf = addBox(shelves, 'left-bay-shelf', [bay - 0.12, 0.065, D - 0.13], [-1.5, leftShelfY, -0.015], paintInner, 0.012);
  leftShelf.userData.explodeWithParent = true;
  const leftShelfLip = addBox(shelves, 'left-bay-shelf-front-lip', [bay - 0.1, 0.055, 0.04], [-1.5, leftShelfY + 0.015, D / 2 - 0.07], paint, 0.01);
  leftShelfLip.userData.explodeWithParent = true;

  const projectBoxStack = createProjectBoxes(locker);

  const leftBayPortfolio = registerPart('left-bay-portfolio', new THREE.Group(), 'left-bay-portfolio');
  locker.add(leftBayPortfolio);
  const resumeFolder = createResumeFolderProp();
  const rotaryPhone = createPhoneProp();
  const fishBell = createFishBellProp();
  leftBayPortfolio.add(resumeFolder.root, rotaryPhone.root, fishBell.root);
  const postcardStack = createPostcardStack(leftBayPortfolio);
  const leftBayDecor = createLeftBayDecor(leftBayPortfolio);
  addDoorInteriorSticker(leftBayDecor, 'left-cabinet-apple-sticker', 'apple', ['#e95e4f', '#f2cf58', '#7fae86'], [-2.03, 1.16, -0.342], 0.28, -0.08, false);
  addDoorInteriorSticker(leftBayDecor, 'left-cabinet-cheese-sticker', 'cheese', ['#f1d66c', '#a8d3df', '#c89176'], [-0.99, 0.72, -0.342], 0.25, 0.1, false);
  addDoorInteriorSticker(leftBayDecor, 'left-cabinet-coffee-sticker', 'coffee', ['#a8d3df', '#f1d66c', '#c89176'], [-2.04, -1.12, -0.342], 0.27, 0.07, false);

  const rightBayPortfolio = registerPart('right-bay-portfolio', new THREE.Group(), 'right-bay-portfolio');
  locker.add(rightBayPortfolio);
  const appleClock = createAppleClockProp();
  const mailbox = createMailboxProp();
  rightBayPortfolio.add(appleClock.root, mailbox.root);
  addDoorInteriorSticker(rightBayPortfolio, 'right-cabinet-toast-sticker', 'toast', ['#f2cf58', '#e95e4f', '#7fae86'], [1.02, 1.18, -0.342], 0.29, -0.09, false);
  addDoorInteriorSticker(rightBayPortfolio, 'right-cabinet-milk-sticker', 'milk', ['#a8d3df', '#f1d66c', '#c89176'], [2.05, 0.66, -0.342], 0.26, 0.08, false);
  addDoorInteriorSticker(rightBayPortfolio, 'right-cabinet-pudding-sticker', 'pudding', ['#f2cf58', '#e95e4f', '#7fae86'], [2.03, -1.18, -0.342], 0.28, -0.07, false);

  function createSwingDoor(doorId, centerX, handleOffsetX) {
    const pivot = registerPart(`${doorId}-door`, new THREE.Group(), 'door-assembly');
    pivot.position.set(centerX + bay / 2, 0, D / 2 + 0.045);
    locker.add(pivot);

    const panelOffset = -bay / 2;
    const panel = addBox(pivot, `${doorId}-door-panel`, [bay, H - 0.22, 0.06], [panelOffset, 0, 0], paint, 0.018);
    panel.userData.explodeWithParent = true;
    panel.userData.doorSurface = true;
    panel.userData.doorId = doorId;
    openables.push(panel);
    addPanelFrame(panel, bay - 0.03, H - 0.25, 0.04, paint, false);
    addPanelFrame(panel, bay - 0.03, H - 0.25, -0.04, paintInner, true);
    addVentGrid(pivot, panelOffset + 0.46, 1.22, 0.033, 5, 5, 1);
    addVentGrid(pivot, panelOffset + 0.46, -1.22, 0.033, 4, 5, 1);
    addHandle(pivot, panelOffset + handleOffsetX, 0.94, 0.055, 0.27, 0.12);
    [-1.08, 0, 1.08].forEach((y) => addHinge(pivot, 0.025, y, 0.01));
    return { pivot, panel };
  }

  const leftDoor = createSwingDoor('left', -1.5, 0.02);
  const rightDoor = createSwingDoor('right', 1.5, -0.46);
  const leftDoorInterior = registerPart('left-door-interior', new THREE.Group(), 'door-assembly');
  leftDoor.pivot.add(leftDoorInterior);
  const idCard = createIdCardProp();
  const instantCamera = createCameraProp();
  const paintingCharm = createPaintingCharmProp();
  leftDoorInterior.add(idCard.root, instantCamera.root, paintingCharm.root);
  const foodPaletteWarm = ['#e95e4f', '#f2cf58', '#7fae86'];
  const foodPaletteCool = ['#a8d3df', '#f1d66c', '#c89176'];
  const leftDoorStickerCluster = registerPart('left-door-sticker-cluster', new THREE.Group(), 'door-assembly');
  leftDoorInterior.add(leftDoorStickerCluster);
  addDoorInteriorSticker(leftDoorStickerCluster, 'left-door-apple-sticker', 'apple', foodPaletteWarm, [-0.13, 1.18, -0.047], 0.2, 0.1);
  addDoorInteriorSticker(leftDoorStickerCluster, 'left-door-cheese-sticker', 'cheese', foodPaletteCool, [-1.24, -0.34, -0.047], 0.18, -0.12);
  addDoorInteriorSticker(leftDoorStickerCluster, 'left-door-coffee-sticker', 'coffee', foodPaletteCool, [-0.17, -0.44, -0.047], 0.2, 0.08);
  addDoorInteriorSticker(leftDoorStickerCluster, 'left-door-toast-sticker', 'toast', foodPaletteWarm, [-0.18, -1.18, -0.047], 0.18, -0.08);
  const cameraHook = new THREE.Mesh(new THREE.TorusGeometry(0.055, 0.013, 10, 28, Math.PI * 1.55), chromeMaterial);
  cameraHook.name = 'camera-door-hook';
  cameraHook.position.set(-0.4, 1.385, -0.055);
  cameraHook.rotation.set(Math.PI / 2, 0, -0.22);
  cameraHook.castShadow = true;
  cameraHook.userData.explodeWithParent = true;
  leftDoorInterior.add(cameraHook);

  const rightDoorInterior = registerPart('right-door-interior', new THREE.Group(), 'door-assembly');
  rightDoor.pivot.add(rightDoorInterior);
  const rightDoorStickerCluster = registerPart('right-door-sticker-cluster', new THREE.Group(), 'door-assembly');
  rightDoorInterior.add(rightDoorStickerCluster);
  addDoorInteriorSticker(rightDoorStickerCluster, 'right-door-apple-sticker', 'apple', foodPaletteWarm, [-1.17, 1.0, -0.047], 0.23, -0.08);
  addDoorInteriorSticker(rightDoorStickerCluster, 'right-door-coffee-sticker', 'coffee', foodPaletteCool, [-0.31, 0.78, -0.047], 0.21, 0.11);
  addDoorInteriorSticker(rightDoorStickerCluster, 'right-door-cheese-sticker', 'cheese', foodPaletteWarm, [-1.06, 0.29, -0.047], 0.2, 0.12);
  addDoorInteriorSticker(rightDoorStickerCluster, 'right-door-milk-sticker', 'milk', foodPaletteCool, [-0.35, 0.03, -0.047], 0.22, -0.1);
  addDoorInteriorSticker(rightDoorStickerCluster, 'right-door-pudding-sticker', 'pudding', foodPaletteWarm, [-1.12, -0.55, -0.047], 0.22, -0.08);
  addDoorInteriorSticker(rightDoorStickerCluster, 'right-door-toast-sticker', 'toast', foodPaletteCool, [-0.32, -0.91, -0.047], 0.21, 0.09);

  const doorSystem = registerPart('door-system', new THREE.Group(), 'door-assembly');
  doorSystem.position.set(0.72, 0, D / 2 + 0.055);
  locker.add(doorSystem);

  const leafWidth = bay / 2;
  const outer = createDoorLeaf('right-outer-door', leafWidth, H - 0.22, 'right');
  doorSystem.add(outer.pivot);
  const inner = createDoorLeaf('right-inner-door', leafWidth, H - 0.22, 'right');
  inner.pivot.position.x = -leafWidth;
  outer.pivot.add(inner.pivot);

  [-1.05, 0, 1.05].forEach((y) => {
    addHinge(outer.pivot, 0.02, y, -0.005, 0.18);
    addHinge(inner.pivot, 0.02, y, -0.005, 0.18);
  });

  const palettes = [
    ['#f2d757', '#f58ba1', '#8ed9c2'],
    ['#f58ba1', '#7ec9e9', '#f2d757'],
    ['#82d3b4', '#f3a5bb', '#7ec9e9'],
    ['#f58ba1', '#f2d757', '#82d3b4']
  ];
  addSticker(outer.pivot, 'sticker-smile', 'smile', palettes[0], [-0.38, 0.9, 0.041], 0.22, -0.12);
  addSticker(outer.pivot, 'sticker-rainbow', 'rainbow', palettes[1], [-0.23, 0.25, 0.041], 0.25, 0.08);
  addSticker(outer.pivot, 'sticker-heart', 'heart', palettes[2], [-0.51, -0.6, 0.041], 0.18, 0.15);
  addSticker(outer.pivot, 'sticker-label', 'label', palettes[3], [-0.31, -1.05, 0.041], 0.26, -0.08);
  addSticker(inner.pivot, 'sticker-flower', 'flower', palettes[1], [-0.42, 0.72, 0.041], 0.21, 0.12);
  addSticker(inner.pivot, 'sticker-smile-small', 'smile', palettes[2], [-0.25, -0.1, 0.041], 0.17, -0.15);
  addSticker(inner.pivot, 'sticker-dream', 'label', palettes[0], [-0.48, -0.72, 0.041], 0.27, 0.06);
  addSticker(inner.pivot, 'sticker-rainbow-small', 'rainbow', palettes[3], [-0.23, -1.14, 0.041], 0.18, -0.09);

  function createMouthTarget(doorId, centerX) {
    const mouth = new THREE.Mesh(new THREE.PlaneGeometry(bay - 0.12, H - 0.32), mouthMaterial);
    mouth.name = `${doorId}-cabinet-mouth-click-target`;
    mouth.position.set(centerX, 0, D / 2 + 0.015);
    mouth.userData.doorSurface = true;
    mouth.userData.doorId = doorId;
    locker.add(mouth);
    openables.push(mouth);
    return mouth;
  }

  const leftMouth = createMouthTarget('left', -1.5);
  const centerMouth = createMouthTarget('center', 0);
  const rightMouth = createMouthTarget('right', 1.5);

  return {
    leftPivot: leftDoor.pivot,
    rightPivot: rightDoor.pivot,
    outerPivot: outer.pivot,
    innerPivot: inner.pivot,
    mouths: { left: leftMouth, center: centerMouth, right: rightMouth },
    props: { idCard, resumeFolder, rotaryPhone, instantCamera, fishBell, paintingCharm, appleClock, mailbox },
    decor: { leftBayDecor, leftDoorInterior, leftDoorStickerCluster, rightDoorInterior, rightDoorStickerCluster, postcardStack, projectBoxStack, rightBayPortfolio },
    revealGroups: {
      left: [leftBayDecor, postcardStack, resumeFolder.root, rotaryPhone.root, fishBell.root, idCard.root, instantCamera.root, paintingCharm.root, leftDoorStickerCluster],
      center: projectBoxes.map((box) => box.root),
      right: [appleClock.root, mailbox.root, rightDoorStickerCluster]
    }
  };
}

const doorRig = createLocker();
stickers.forEach((sticker) => { sticker.visible = false; });

function updateIdCardStrap() {
  const { cardGroup, strap } = doorRig.props.idCard;
  const end = cardGroup.position.clone().add(new THREE.Vector3(0, 0.34, 0.01));
  const start = new THREE.Vector3(0, 0.78, 0);
  const points = [
    start,
    new THREE.Vector3(-0.075 + end.x * 0.18, THREE.MathUtils.lerp(start.y, end.y, 0.28), 0.006),
    new THREE.Vector3(end.x * 0.78 - 0.025, THREE.MathUtils.lerp(start.y, end.y, 0.68) - 0.025, 0.009),
    end
  ];
  const curve = new THREE.CatmullRomCurve3(points, false, 'catmullrom', 0.55);
  const nextGeometry = new THREE.TubeGeometry(curve, 42, 0.016, 7, false);
  strap.geometry.dispose();
  strap.geometry = nextGeometry;
}

if (captureFlat) {
  const flatMaterial = new THREE.MeshBasicMaterial({ color: 0xd4cc86, side: THREE.DoubleSide });
  locker.traverse((object) => {
    if (object.isMesh) object.material = flatMaterial;
  });
}
const raycaster = new THREE.Raycaster();
const pointer = new THREE.Vector2();
const dragPlane = new THREE.Plane();
const dragOffset = new THREE.Vector3();
const idCardDragPlane = new THREE.Plane();
const idCardDragOffset = new THREE.Vector3();
let selectedSticker = null;
let selectedIdCard = null;
let pointerDownPosition = null;
let pointerMoved = false;
let hoveredProjectBox = null;
let pinnedProjectBox = null;
const doorStates = { left: false, center: false, right: false };
const doorTimelines = { left: null, center: null, right: null };
let lastFocusedDoor = null;

const cameraState = {
  desktop: { position: new THREE.Vector3(5.9, 1.9, 8.7), target: new THREE.Vector3(1.05, 0.02, 0) },
  tablet: { position: new THREE.Vector3(6.4, 2.0, 9.5), target: new THREE.Vector3(0.8, 0, 0) },
  mobile: { position: new THREE.Vector3(8.2, 1.75, 14.8), target: new THREE.Vector3(1.05, 0.5, 0) },
  openCenter: { position: new THREE.Vector3(1.25, 0.55, 6.35), target: new THREE.Vector3(1.15, -0.05, 0.06) },
  openLeft: { position: new THREE.Vector3(-3.45, 0.95, 7.45), target: new THREE.Vector3(-0.32, 0.02, 0.08) },
  openRight: { position: new THREE.Vector3(2.68, 0.68, 6.3), target: new THREE.Vector3(2.5, -0.04, 0.05) },
  openCenterMobile: { position: new THREE.Vector3(1.25, 0.8, 11.8), target: new THREE.Vector3(1.15, 0.05, 0.08) },
  openLeftMobile: { position: new THREE.Vector3(-2.25, 1.08, 12.9), target: new THREE.Vector3(-0.18, 0.26, 0.08) },
  openRightMobile: { position: new THREE.Vector3(2.7, 0.92, 11.75), target: new THREE.Vector3(2.48, 0.12, 0.08) }
};

function currentClosedCamera() {
  if (window.innerWidth < 620) return cameraState.mobile;
  if (window.innerWidth < 1000) return cameraState.tablet;
  return cameraState.desktop;
}

function currentOpenCamera(doorId = 'center') {
  const suffix = doorId[0].toUpperCase() + doorId.slice(1);
  return window.innerWidth < 620 ? cameraState[`open${suffix}Mobile`] : cameraState[`open${suffix}`];
}

function focusedDoorId() {
  if (lastFocusedDoor && doorStates[lastFocusedDoor]) return lastFocusedDoor;
  return ['center', 'left', 'right'].find((doorId) => doorStates[doorId]) || null;
}

function currentFocusCamera() {
  const doorId = focusedDoorId();
  return doorId ? currentOpenCamera(doorId) : currentClosedCamera();
}

function setCamera(cameraPose, immediate = true) {
  if (immediate) {
    camera.position.copy(cameraPose.position);
    controls.target.copy(cameraPose.target);
    controls.update();
    return;
  }
  gsap.to(camera.position, { x: cameraPose.position.x, y: cameraPose.position.y, z: cameraPose.position.z, duration: 1, ease: 'power3.inOut', overwrite: 'auto' });
  gsap.to(controls.target, { x: cameraPose.target.x, y: cameraPose.target.y, z: cameraPose.target.z, duration: 1, ease: 'power3.inOut', overwrite: 'auto', onUpdate: () => controls.update() });
}

setCamera(currentClosedCamera());
if (captureMode && captureAngle) {
  const captureTarget = new THREE.Vector3(1.15, 0, 0);
  const capturePositions = {
    front: new THREE.Vector3(1.15, 0.35, 8.5),
    right: new THREE.Vector3(9.1, 0.45, 0),
    rear: new THREE.Vector3(1.15, 0.35, -8.5),
    left: new THREE.Vector3(-6.8, 0.45, 0)
  };
  camera.position.copy(capturePositions[captureAngle] || capturePositions.front);
  controls.target.copy(captureTarget);
  controls.update();
}

const reduceMotionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
let reduceMotion = reduceMotionQuery.matches;
reduceMotionQuery.addEventListener('change', (event) => { reduceMotion = event.matches; });

let activePanel = null;
let lastPanelFocus = null;
let propTimeline = null;
let bellTimeline = null;
let bellAudioContext = null;
let studioLastFocus = null;

function setPanelHidden(panel, hidden) {
  panel.hidden = hidden;
  panel.setAttribute('aria-hidden', String(hidden));
}

function showPanel(panel) {
  if (activePanel && activePanel !== panel) setPanelHidden(activePanel, true);
  activePanel = panel;
  lastPanelFocus = document.activeElement;
  setPanelHidden(panel, false);
  gsap.set(panelScrim, { visibility: 'visible', pointerEvents: 'auto' });
  gsap.to(panelScrim, { opacity: 1, duration: reduceMotion ? 0 : 0.32, overwrite: 'auto' });
  gsap.fromTo(
    panel,
    {
      autoAlpha: 0,
      x: panel === resumePanel || window.innerWidth < 620 ? 0 : 28,
      y: panel === resumePanel ? 28 : window.innerWidth < 620 ? 28 : 0,
      scale: panel === resumePanel ? 0.91 : 0.965
    },
    { autoAlpha: 1, x: 0, y: 0, scale: 1, duration: reduceMotion ? 0 : panel === resumePanel ? 0.66 : 0.48, ease: 'power3.out', overwrite: 'auto', onComplete: () => panel.querySelector('.panel-close')?.focus() }
  );
}

function resetResumeFolder(animate = true) {
  const { root, paperStack, photoCard, clip, rest } = doorRig.props.resumeFolder;
  const duration = animate && !reduceMotion ? 0.58 : 0;
  gsap.to(root.position, { x: rest.position.x, y: rest.position.y, z: rest.position.z, duration, ease: 'power3.inOut', overwrite: 'auto' });
  gsap.to(root.rotation, { z: -0.018, duration, ease: 'power3.inOut', overwrite: 'auto' });
  gsap.to(root.scale, { x: rest.scale.x, y: rest.scale.y, z: rest.scale.z, duration, ease: 'power3.inOut', overwrite: 'auto' });
  gsap.to(paperStack.position, { x: rest.paperPosition.x, y: rest.paperPosition.y, z: rest.paperPosition.z, duration: duration * 0.86, ease: 'power3.inOut', overwrite: 'auto' });
  gsap.to(photoCard.position, { x: rest.photoPosition.x, y: rest.photoPosition.y, z: rest.photoPosition.z, duration: duration * 0.82, ease: 'power3.inOut', overwrite: 'auto' });
  gsap.to(photoCard.rotation, { z: -0.035, duration: duration * 0.82, ease: 'power3.inOut', overwrite: 'auto' });
  gsap.to(clip.position, { x: rest.clipPosition.x, y: rest.clipPosition.y, z: rest.clipPosition.z, duration: duration * 0.76, ease: 'power3.inOut', overwrite: 'auto' });
}

function resetPhone(animate = true) {
  const { root, dial, handset } = doorRig.props.rotaryPhone;
  const duration = animate && !reduceMotion ? 0.58 : 0;
  gsap.to(root.position, { x: -1.47, y: -1.15, z: 0.02, duration, ease: 'power3.inOut', overwrite: 'auto' });
  gsap.to(root.scale, { x: 1, y: 1, z: 1, duration, overwrite: 'auto' });
  gsap.to(dial.rotation, { z: 0, duration: duration * 0.8, ease: 'power3.inOut', overwrite: 'auto' });
  gsap.to(handset.position, { x: 0, y: 0.27, z: 0.07, duration, ease: 'power3.inOut', overwrite: 'auto' });
  gsap.to(handset.rotation, { x: 0, y: 0, z: 0, duration, ease: 'power3.inOut', overwrite: 'auto' });
}

function resetCamera(animate = true, retractFilm = false) {
  const { root, film, lens } = doorRig.props.instantCamera;
  const duration = animate && !reduceMotion ? 0.5 : 0;
  gsap.to(root.position, { x: -0.4, y: 0.84, z: -0.105, duration, ease: 'power3.inOut', overwrite: 'auto' });
  gsap.to(root.scale, { x: 1, y: 1, z: 1, duration, overwrite: 'auto' });
  gsap.to(lens.rotation, { z: 0, duration, overwrite: 'auto' });
  if (retractFilm) {
    gsap.to(film.scale, { y: 0.02, duration, ease: 'power3.inOut', overwrite: 'auto', onComplete: () => { film.visible = false; } });
  }
}

function closePanel({ animate = true, resetArtifact = true, restoreFocus = true } = {}) {
  if (!activePanel) return;
  const closingPanel = activePanel;
  activePanel = null;
  const duration = animate && !reduceMotion ? 0.32 : 0;
  gsap.to(closingPanel, {
    autoAlpha: 0,
    x: window.innerWidth < 620 ? 0 : 22,
    y: window.innerWidth < 620 ? 22 : 0,
    scale: 0.975,
    duration,
    ease: 'power2.in',
    overwrite: 'auto',
    onComplete: () => setPanelHidden(closingPanel, true)
  });
  gsap.to(panelScrim, { opacity: 0, duration, overwrite: 'auto', onComplete: () => gsap.set(panelScrim, { visibility: 'hidden', pointerEvents: 'none' }) });
  if (resetArtifact) {
    if (closingPanel === resumePanel) resetResumeFolder(animate);
    if (closingPanel === contactPanel) resetPhone(animate);
    if (closingPanel === cameraPanel) resetCamera(animate, false);
  }
  if (restoreFocus && lastPanelFocus instanceof HTMLElement) lastPanelFocus.focus({ preventScroll: true });
}

function resetLeftArtifacts(animate = true) {
  propTimeline?.kill();
  bellTimeline?.kill();
  closeArtStudio({ animate, restoreFocus: false });
  closePanel({ animate, resetArtifact: false, restoreFocus: false });
  resetResumeFolder(animate);
  resetPhone(animate);
  resetCamera(animate, true);
  const { cardGroup, ring, restPosition } = doorRig.props.idCard;
  const duration = animate && !reduceMotion ? 0.72 : 0;
  gsap.to(cardGroup.position, {
    x: restPosition.x,
    y: restPosition.y,
    z: restPosition.z,
    duration,
    ease: 'elastic.out(1, .32)',
    overwrite: 'auto',
    onUpdate: updateIdCardStrap
  });
  gsap.to(cardGroup.rotation, { z: 0, duration, ease: 'elastic.out(1, .35)', overwrite: 'auto' });
  gsap.to(ring.rotation, { z: 0, duration: animate && !reduceMotion ? 0.35 : 0, overwrite: 'auto' });
  const { swingPivot, bellPivot } = doorRig.props.fishBell;
  gsap.to(swingPivot.rotation, { x: 0, y: 0, z: 0, duration, ease: 'elastic.out(1, .35)', overwrite: 'auto' });
  gsap.to(bellPivot.rotation, { x: 0, y: 0, z: 0, duration, ease: 'elastic.out(1, .35)', overwrite: 'auto' });
}

function animateIdCard() {
  closePanel({ resetArtifact: true, restoreFocus: false });
  const { cardGroup, ring, restPosition } = doorRig.props.idCard;
  propTimeline?.kill();
  propTimeline = gsap.timeline({ defaults: { overwrite: 'auto' } })
    .to(cardGroup.position, { x: restPosition.x + 0.08, y: restPosition.y - 0.04, duration: reduceMotion ? 0 : 0.2, ease: 'power2.out', onUpdate: updateIdCardStrap })
    .to(cardGroup.position, { x: restPosition.x - 0.055, y: restPosition.y - 0.015, duration: reduceMotion ? 0 : 0.32, ease: 'sine.inOut', onUpdate: updateIdCardStrap })
    .to(cardGroup.position, { x: restPosition.x, y: restPosition.y, duration: reduceMotion ? 0 : 0.46, ease: 'elastic.out(1, .38)', onUpdate: updateIdCardStrap })
    .to(cardGroup.rotation, { z: 0.11, duration: reduceMotion ? 0 : 0.22, ease: 'power2.out' }, 0)
    .to(cardGroup.rotation, { z: 0, duration: reduceMotion ? 0 : 0.58, ease: 'elastic.out(1, .4)' }, 0.22)
    .to(ring.rotation, { z: Math.PI * 2, duration: reduceMotion ? 0 : 0.75, ease: 'power2.inOut' }, 0);
}

function openResumeArtifact() {
  closePanel({ animate: false, resetArtifact: true, restoreFocus: false });
  resetPhone(false);
  const { root, paperStack, photoCard, clip } = doorRig.props.resumeFolder;
  propTimeline?.kill();
  propTimeline = gsap.timeline({ defaults: { overwrite: 'auto' } })
    .to(root.position, { x: -1.2, y: 0.4, z: 0.48, duration: reduceMotion ? 0 : 0.58, ease: 'power3.out' }, 0)
    .to(root.rotation, { z: 0.035, duration: reduceMotion ? 0 : 0.58, ease: 'power3.out' }, 0)
    .to(root.scale, { x: 1.16, y: 1.16, z: 1.16, duration: reduceMotion ? 0 : 0.58, ease: 'power3.out' }, 0)
    .to(paperStack.position, { y: 0.015, z: 0.14, duration: reduceMotion ? 0 : 0.54, ease: 'back.out(1.35)' }, 0.18)
    .to(photoCard.position, { x: -0.04, y: 0.055, z: 0.205, duration: reduceMotion ? 0 : 0.5, ease: 'back.out(1.7)' }, 0.24)
    .to(photoCard.rotation, { z: -0.105, duration: reduceMotion ? 0 : 0.5, ease: 'power3.out' }, 0.24)
    .to(clip.position, { y: 0.39, z: 0.16, duration: reduceMotion ? 0 : 0.46, ease: 'back.out(1.4)' }, 0.12)
    .call(() => showPanel(resumePanel), [], reduceMotion ? 0 : 0.52);
}

function openPhoneArtifact() {
  closePanel({ animate: false, resetArtifact: true, restoreFocus: false });
  resetResumeFolder(false);
  const { root, dial, handset } = doorRig.props.rotaryPhone;
  propTimeline?.kill();
  propTimeline = gsap.timeline({ defaults: { overwrite: 'auto' } })
    .to(dial.rotation, { z: Math.PI * 1.82, duration: reduceMotion ? 0 : 0.44, ease: 'power3.in' }, 0)
    .to(dial.rotation, { z: 0, duration: reduceMotion ? 0 : 0.58, ease: 'elastic.out(1, .5)' }, reduceMotion ? 0 : 0.44)
    .to(handset.position, { y: 0.52, z: 0.24, duration: reduceMotion ? 0 : 0.52, ease: 'back.out(1.35)' }, 0.28)
    .to(handset.rotation, { x: -0.24, z: -0.18, duration: reduceMotion ? 0 : 0.52, ease: 'power3.out' }, 0.28)
    .to(root.position, { x: -2.12, y: -0.82, z: 0.62, duration: reduceMotion ? 0 : 0.72, ease: 'power3.inOut' }, 0.58)
    .to(root.scale, { x: 1.16, y: 1.16, z: 1.16, duration: reduceMotion ? 0 : 0.72, ease: 'power3.inOut' }, 0.58)
    .call(() => showPanel(contactPanel), [], reduceMotion ? 0 : 0.86);
}

function openCameraArtifact() {
  closePanel({ animate: false, resetArtifact: true, restoreFocus: false });
  resetResumeFolder(false);
  resetPhone(false);
  const { root, lens } = doorRig.props.instantCamera;
  propTimeline?.kill();
  propTimeline = gsap.timeline({ defaults: { overwrite: 'auto' } })
    .to(root.scale, { x: 1.18, y: 1.18, z: 1.18, duration: reduceMotion ? 0 : 0.5, ease: 'back.out(1.65)' }, 0)
    .to(lens.rotation, { z: Math.PI * 0.25, duration: reduceMotion ? 0 : 0.4, ease: 'power2.inOut' }, 0)
    .to(lens.rotation, { z: 0, duration: reduceMotion ? 0 : 0.35, ease: 'power2.inOut' }, reduceMotion ? 0 : 0.4)
    .call(() => showPanel(cameraPanel), [], reduceMotion ? 0 : 0.36);
}

function playBellSound() {
  const AudioContextClass = window.AudioContext || window.webkitAudioContext;
  if (!AudioContextClass) return;
  bellAudioContext ||= new AudioContextClass();
  if (bellAudioContext.state === 'suspended') bellAudioContext.resume();
  const now = bellAudioContext.currentTime;
  const master = bellAudioContext.createGain();
  master.gain.setValueAtTime(0.0001, now);
  master.gain.exponentialRampToValueAtTime(0.2, now + 0.012);
  master.gain.exponentialRampToValueAtTime(0.0001, now + 2.1);
  master.connect(bellAudioContext.destination);
  [1320, 1760, 2375].forEach((frequency, index) => {
    const oscillator = bellAudioContext.createOscillator();
    const partialGain = bellAudioContext.createGain();
    oscillator.type = index === 1 ? 'triangle' : 'sine';
    oscillator.frequency.setValueAtTime(frequency, now);
    oscillator.frequency.exponentialRampToValueAtTime(frequency * 0.992, now + 1.8);
    partialGain.gain.value = [0.7, 0.33, 0.18][index];
    oscillator.connect(partialGain);
    partialGain.connect(master);
    oscillator.start(now + index * 0.003);
    oscillator.stop(now + 2.15);
  });
}

function ringFishBell() {
  const { swingPivot, bellPivot, clapper } = doorRig.props.fishBell;
  bellTimeline?.kill();
  playBellSound();
  doorStatus.textContent = '木鱼铃铛响起 · 清脆回声';
  if (reduceMotion) return;
  bellTimeline = gsap.timeline({ defaults: { overwrite: 'auto' }, onComplete: () => updateDoorUi() })
    .to(swingPivot.rotation, { z: 0.28, y: -0.09, duration: 0.16, ease: 'power2.out' })
    .to(swingPivot.rotation, { z: -0.23, y: 0.07, duration: 0.24, ease: 'sine.inOut' })
    .to(swingPivot.rotation, { z: 0.15, y: -0.04, duration: 0.22, ease: 'sine.inOut' })
    .to(swingPivot.rotation, { z: -0.08, y: 0.02, duration: 0.24, ease: 'sine.inOut' })
    .to(swingPivot.rotation, { z: 0, y: 0, duration: 0.55, ease: 'elastic.out(1, .33)' })
    .to(bellPivot.rotation, { z: -0.52, duration: 0.12, ease: 'power2.out' }, 0)
    .to(bellPivot.rotation, { z: 0.44, duration: 0.18, ease: 'sine.inOut', repeat: 4, yoyo: true }, 0.12)
    .to(bellPivot.rotation, { z: 0, duration: 0.5, ease: 'elastic.out(1, .3)' }, 0.86)
    .to(clapper.position, { x: 0.045, duration: 0.1, ease: 'sine.inOut', repeat: 7, yoyo: true }, 0.05)
    .to(clapper.position, { x: 0, duration: 0.3, ease: 'power2.out' }, 0.85);
}

const internshipWorks = [
  {
    code: 'CAMPUS WEB 01',
    title: '健康治理研究院',
    summary: '围绕医疗研究机构的资讯发布与学术活动，重构清晰、可信且易于维护的校园官网首页。',
    image: assetUrl('assets/internship/health-governance.jpg'),
    alt: '上海健康医学院健康治理研究院校园网页设计'
  },
  {
    code: 'CAMPUS WEB 02',
    title: '东南大学自动化学院',
    summary: '以理性蓝色系统组织学院新闻、科研与教学入口，通过模块化布局提升多语言官网的浏览效率。',
    image: assetUrl('assets/internship/automation.jpg'),
    alt: '东南大学自动化学院校园网页设计'
  },
  {
    code: 'CAMPUS WEB 03',
    title: '东南大学物理学院',
    summary: '用深色学术气质与轻量信息卡片呈现学院动态、研究方向和学术活动，兼顾品牌感与可读性。',
    image: assetUrl('assets/internship/physics.jpg'),
    alt: '东南大学物理学院校园网页设计'
  },
  {
    code: 'CAMPUS WEB 04',
    title: '南京机电职业技术学院信息工程学院',
    summary: '围绕新闻、教学科研、实习就业与党建工作重组首页层级，建立清楚稳定的院系信息门户。',
    image: assetUrl('assets/internship/nanjing-info.jpg'),
    alt: '南京机电职业技术学院信息工程学院校园网页设计'
  },
  {
    code: 'CAMPUS WEB 05',
    title: '南京林业大学现代分析测试中心',
    summary: '以精密仪器共享与科研服务为核心，使用自然绿色系统组织中心要闻、设备展示和科研动态。',
    image: assetUrl('assets/internship/nanjing-forestry.png'),
    alt: '南京林业大学现代分析测试中心校园网页设计'
  },
  {
    code: 'CAMPUS WEB 06',
    title: '黑龙江农业职业技术学院',
    summary: '结合学院建筑与农业文化意象，重构要闻、通知、基层动态、媒体矩阵和办学数据的浏览路径。',
    image: assetUrl('assets/internship/heilongjiang-agri.png'),
    alt: '黑龙江农业职业技术学院校园网页设计'
  }
];
let internshipCurrentIndex = -1;

function showInternshipWork(index) {
  const normalizedIndex = (index + internshipWorks.length) % internshipWorks.length;
  const work = internshipWorks[normalizedIndex];
  internshipCurrentIndex = normalizedIndex;
  internshipIndex.textContent = `LETTER ${String(normalizedIndex + 1).padStart(2, '0')} / ${String(internshipWorks.length).padStart(2, '0')}`;
  internshipCode.textContent = work.code;
  internshipWorkTitle.textContent = work.title;
  internshipWorkSummary.textContent = work.summary;
  internshipImage.src = work.image;
  internshipImage.alt = work.alt;
  showPanel(internshipPanel);
  if (!reduceMotion) {
    gsap.fromTo('.internship-letter > *', { autoAlpha: 0, y: 18 }, { autoAlpha: 1, y: 0, duration: 0.52, ease: 'power3.out', stagger: 0.065, overwrite: 'auto' });
  }
}

function triggerMailbox(direction = 1) {
  if (!doorStates.right) return;
  const rig = doorRig.props.mailbox;
  const nextIndex = internshipCurrentIndex < 0 ? 0 : (internshipCurrentIndex + direction + internshipWorks.length) % internshipWorks.length;
  const envelope = rig.envelopes[rig.envelopeCursor % rig.envelopes.length];
  rig.envelopeCursor += 1;
  gsap.killTweensOf([rig.doorPivot.rotation, rig.button.scale, envelope.position, envelope.rotation, envelope.scale]);
  envelope.visible = true;
  envelope.position.set(0, 0.02, 0.31);
  envelope.rotation.set(-0.04, 0, -0.06 + (rig.envelopeCursor % 3) * 0.05);
  envelope.scale.setScalar(0.72);
  doorStatus.textContent = '右柜邮箱已投递 · 信封正在送出';
  const timeline = gsap.timeline({ defaults: { overwrite: 'auto' }, onComplete: () => updateDoorUi() });
  timeline
    .to(rig.button.scale, { x: 0.72, y: 0.72, z: 0.72, duration: reduceMotion ? 0 : 0.12, ease: 'power2.in' }, 0)
    .to(rig.button.scale, { x: 1, y: 1, z: 1, duration: reduceMotion ? 0 : 0.3, ease: 'back.out(2.4)' }, reduceMotion ? 0 : 0.12)
    .to(rig.doorPivot.rotation, { x: 1.22, duration: reduceMotion ? 0 : 0.44, ease: 'back.out(1.35)' }, 0)
    .to(envelope.scale, { x: 1, y: 1, z: 1, duration: reduceMotion ? 0 : 0.34, ease: 'back.out(1.8)' }, reduceMotion ? 0 : 0.22)
    .to(envelope.position, { y: 0.08, z: 0.98, duration: reduceMotion ? 0 : 0.76, ease: 'power3.out' }, reduceMotion ? 0 : 0.22)
    .to(envelope.rotation, { x: -0.18, z: envelope.rotation.z + 0.09, duration: reduceMotion ? 0 : 0.76, ease: 'sine.inOut' }, reduceMotion ? 0 : 0.22)
    .to(envelope.position, { y: -0.23, z: 1.32, duration: reduceMotion ? 0 : 0.72, ease: 'power2.in' }, reduceMotion ? 0 : 0.9)
    .call(() => showInternshipWork(nextIndex), [], reduceMotion ? 0 : 0.72)
    .to(envelope.scale, { x: 0.12, y: 0.12, z: 0.12, duration: reduceMotion ? 0 : 0.32, ease: 'power2.in', onComplete: () => { envelope.visible = false; } }, reduceMotion ? 0 : 1.34)
    .to(rig.doorPivot.rotation, { x: 0, duration: reduceMotion ? 0 : 0.52, ease: 'power3.inOut' }, reduceMotion ? 0 : 1.18);
}

function requestInternshipLetter(direction = 1) {
  closePanel({ animate: true, resetArtifact: false, restoreFocus: false });
  const openAndDeliver = () => {
    const doorTimeline = toggleCabinetDoor('right', true);
    if (doorTimeline) doorTimeline.call(() => triggerMailbox(direction), [], '+=0.08');
    else triggerMailbox(direction);
  };
  window.setTimeout(openAndDeliver, reduceMotion ? 0 : 180);
}

const paintContext = paintCanvas.getContext('2d', { willReadFrequently: true });
let activePaintColor = '#315f72';
let isPainting = false;
let previousPaintPoint = null;
let paintHistory = [];
let preOptimizationImage = null;

function blobToDataUrl(blob) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = () => reject(new Error('画布编码失败'));
    reader.readAsDataURL(blob);
  });
}

async function secureGouacheTransform(blob) {
  const image = await blobToDataUrl(blob);
  const response = await fetch(gouacheApiUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      image,
      prompt: 'Preserve the original composition, subjects and color relationships. Refine this sketch into a polished soft gouache painting on warm cotton paper, with layered opaque pigment, delicate dry-brush edges, subtle paper grain and an editorial illustration finish. Do not add text, frames or watermarks.'
    })
  });
  const payload = await response.json().catch(() => ({}));
  if (!response.ok || !payload.image) throw new Error(payload.error || `图像模型请求失败：${response.status}`);
  return payload;
}

let gouacheModelTransform = secureGouacheTransform;

function fillPaintPaper() {
  paintContext.save();
  paintContext.setTransform(1, 0, 0, 1, 0, 0);
  paintContext.globalCompositeOperation = 'source-over';
  paintContext.globalAlpha = 1;
  paintContext.fillStyle = '#f8f5ea';
  paintContext.fillRect(0, 0, paintCanvas.width, paintCanvas.height);
  const wash = paintContext.createRadialGradient(600, 350, 80, 600, 350, 760);
  wash.addColorStop(0, 'rgba(255,255,255,.12)');
  wash.addColorStop(1, 'rgba(164,137,88,.055)');
  paintContext.fillStyle = wash;
  paintContext.fillRect(0, 0, paintCanvas.width, paintCanvas.height);
  paintContext.restore();
}

function savePaintHistory() {
  paintHistory.push(paintContext.getImageData(0, 0, paintCanvas.width, paintCanvas.height));
  if (paintHistory.length > 14) paintHistory.shift();
}

function paintPointFromEvent(event) {
  const rect = paintCanvas.getBoundingClientRect();
  return {
    x: (event.clientX - rect.left) * (paintCanvas.width / rect.width),
    y: (event.clientY - rect.top) * (paintCanvas.height / rect.height),
    scale: paintCanvas.width / rect.width
  };
}

function drawPaintSegment(event) {
  const next = paintPointFromEvent(event);
  const pressure = event.pressure > 0 ? THREE.MathUtils.clamp(event.pressure, 0.25, 1) : 0.62;
  const width = Number(brushSizeInput.value) * next.scale * (0.72 + pressure * 0.52);
  paintContext.save();
  paintContext.globalCompositeOperation = 'source-over';
  paintContext.globalAlpha = 0.9;
  paintContext.strokeStyle = activePaintColor;
  paintContext.lineWidth = width;
  paintContext.lineCap = 'round';
  paintContext.lineJoin = 'round';
  paintContext.shadowColor = activePaintColor;
  paintContext.shadowBlur = width * 0.05;
  paintContext.beginPath();
  if (previousPaintPoint) paintContext.moveTo(previousPaintPoint.x, previousPaintPoint.y);
  else paintContext.moveTo(next.x, next.y);
  paintContext.lineTo(next.x, next.y);
  paintContext.stroke();
  paintContext.restore();
  previousPaintPoint = next;
}

function openArtStudio() {
  if (!artStudio.hidden) return;
  closePanel({ animate: false, resetArtifact: true, restoreFocus: false });
  studioLastFocus = document.activeElement;
  artStudio.hidden = false;
  artStudio.setAttribute('aria-hidden', 'false');
  controls.enabled = false;
  gsap.fromTo(
    artStudio,
    { autoAlpha: 0 },
    { autoAlpha: 1, duration: reduceMotion ? 0 : 0.34, ease: 'power2.out', overwrite: 'auto' }
  );
  gsap.fromTo(
    artStudio.querySelector('.studio-shell'),
    { y: reduceMotion ? 0 : 28, scale: reduceMotion ? 1 : 0.985 },
    { y: 0, scale: 1, duration: reduceMotion ? 0 : 0.55, ease: 'power3.out', overwrite: 'auto', onComplete: () => artStudioClose.focus() }
  );
}

function closeArtStudio({ animate = true, restoreFocus = true } = {}) {
  if (artStudio.hidden) return;
  const duration = animate && !reduceMotion ? 0.28 : 0;
  gsap.to(artStudio, {
    autoAlpha: 0,
    duration,
    ease: 'power2.in',
    overwrite: 'auto',
    onComplete: () => {
      artStudio.hidden = true;
      artStudio.setAttribute('aria-hidden', 'true');
      controls.enabled = true;
    }
  });
  if (restoreFocus && studioLastFocus instanceof HTMLElement) studioLastFocus.focus({ preventScroll: true });
}

function clearPaintCanvas({ record = true } = {}) {
  if (record) savePaintHistory();
  fillPaintPaper();
  preOptimizationImage = null;
  paintRestoreButton.disabled = true;
  paintStatus.textContent = '画布已清空，可以重新开始';
}

function localGouacheStylize() {
  const sample = document.createElement('canvas');
  sample.width = 300;
  sample.height = 200;
  const sampleContext = sample.getContext('2d', { willReadFrequently: true });
  sampleContext.imageSmoothingEnabled = true;
  sampleContext.imageSmoothingQuality = 'high';
  sampleContext.drawImage(paintCanvas, 0, 0, sample.width, sample.height);
  const pixels = sampleContext.getImageData(0, 0, sample.width, sample.height);
  const data = pixels.data;
  for (let y = 0; y < sample.height; y += 1) {
    for (let x = 0; x < sample.width; x += 1) {
      const index = (y * sample.width + x) * 4;
      const r = data[index];
      const g = data[index + 1];
      const b = data[index + 2];
      const luma = r * 0.299 + g * 0.587 + b * 0.114;
      const grain = ((((x * 17 + y * 29) * 13) % 19) - 9) * 0.72;
      const step = luma > 224 ? 12 : 20;
      data[index] = THREE.MathUtils.clamp(Math.round((luma + (r - luma) * 1.13 + grain) / step) * step, 0, 255);
      data[index + 1] = THREE.MathUtils.clamp(Math.round((luma + (g - luma) * 1.13 + grain) / step) * step, 0, 255);
      data[index + 2] = THREE.MathUtils.clamp(Math.round((luma + (b - luma) * 1.13 + grain) / step) * step, 0, 255);
    }
  }
  sampleContext.putImageData(pixels, 0, 0);
  paintContext.save();
  paintContext.clearRect(0, 0, paintCanvas.width, paintCanvas.height);
  paintContext.imageSmoothingEnabled = true;
  paintContext.imageSmoothingQuality = 'high';
  paintContext.drawImage(sample, 0, 0, paintCanvas.width, paintCanvas.height);
  paintContext.globalCompositeOperation = 'multiply';
  paintContext.globalAlpha = 0.055;
  paintContext.fillStyle = '#806f4d';
  for (let i = 0; i < 2400; i += 1) {
    const x = (i * 137) % paintCanvas.width;
    const y = (i * 83 + (i % 7) * 31) % paintCanvas.height;
    const size = 0.7 + (i % 4) * 0.55;
    paintContext.fillRect(x, y, size * 2.4, size);
  }
  paintContext.globalAlpha = 0.035;
  paintContext.strokeStyle = '#6f624a';
  paintContext.lineWidth = 1;
  for (let y = 8; y < paintCanvas.height; y += 11) {
    paintContext.beginPath();
    paintContext.moveTo(0, y + (y % 3));
    paintContext.lineTo(paintCanvas.width, y);
    paintContext.stroke();
  }
  paintContext.restore();
}

async function drawGouacheModelResult(result) {
  const source = result?.image || result;
  if (!source) throw new Error('模型没有返回图像');
  let drawable = source;
  let shouldClose = false;
  if (source instanceof Blob) {
    drawable = await createImageBitmap(source);
    shouldClose = true;
  } else if (typeof source === 'string') {
    drawable = await new Promise((resolve, reject) => {
      const image = new Image();
      image.onload = () => resolve(image);
      image.onerror = reject;
      image.src = source;
    });
  }
  if (!(drawable instanceof HTMLCanvasElement) && !(drawable instanceof HTMLImageElement) && !(drawable instanceof ImageBitmap)) throw new Error('不支持的模型图像格式');
  paintContext.clearRect(0, 0, paintCanvas.width, paintCanvas.height);
  paintContext.drawImage(drawable, 0, 0, paintCanvas.width, paintCanvas.height);
  if (shouldClose) drawable.close();
}

async function optimizeGouache() {
  if (paintOptimizeButton.disabled) return;
  preOptimizationImage = paintContext.getImageData(0, 0, paintCanvas.width, paintCanvas.height);
  savePaintHistory();
  paintOptimizeButton.disabled = true;
  paintRestoreButton.disabled = true;
  paintStatus.textContent = gouacheModelTransform ? '正在连接水粉图像模型…' : '正在调和色块与棉纸颗粒…';
  try {
    if (gouacheModelTransform) {
      const blob = await new Promise((resolve, reject) => paintCanvas.toBlob((value) => value ? resolve(value) : reject(new Error('画布导出失败')), 'image/jpeg', 0.9));
      const result = await gouacheModelTransform(blob, { style: 'soft gouache on cotton paper', width: paintCanvas.width, height: paintCanvas.height });
      await drawGouacheModelResult(result);
      paintStatus.textContent = '图像模型已完成水粉优化';
    } else {
      await new Promise((resolve) => window.setTimeout(resolve, reduceMotion ? 0 : 360));
      localGouacheStylize();
      paintStatus.textContent = '本地水粉优化完成 · 可恢复原始笔触';
    }
    paintRestoreButton.disabled = false;
    gsap.fromTo(paintCanvas, { scale: 0.992 }, { scale: 1, duration: reduceMotion ? 0 : 0.45, ease: 'back.out(1.5)' });
  } catch (error) {
    console.warn('Gouache model adapter failed, using local engine.', error);
    localGouacheStylize();
    paintRestoreButton.disabled = false;
    paintStatus.textContent = '在线模型不可用，已用本地水粉引擎完成优化';
  } finally {
    paintOptimizeButton.disabled = false;
  }
}

window.registerGouacheModelAdapter = (transformer) => {
  if (typeof transformer !== 'function') throw new TypeError('水粉模型适配器必须是函数');
  gouacheModelTransform = transformer;
  paintStatus.textContent = '外部水粉图像模型已连接';
};

fillPaintPaper();

paintCanvas.addEventListener('pointerdown', (event) => {
  event.preventDefault();
  savePaintHistory();
  isPainting = true;
  previousPaintPoint = null;
  paintCanvas.setPointerCapture(event.pointerId);
  drawPaintSegment(event);
  paintStatus.textContent = '正在记录你的笔触…';
});
paintCanvas.addEventListener('pointermove', (event) => {
  if (!isPainting) return;
  event.preventDefault();
  drawPaintSegment(event);
});
const finishPainting = (event) => {
  if (!isPainting) return;
  isPainting = false;
  previousPaintPoint = null;
  if (paintCanvas.hasPointerCapture(event.pointerId)) paintCanvas.releasePointerCapture(event.pointerId);
  paintStatus.textContent = '笔触已保存 · 完成后可一键水粉优化';
};
paintCanvas.addEventListener('pointerup', finishPainting);
paintCanvas.addEventListener('pointercancel', finishPainting);
document.querySelectorAll('.paint-swatch').forEach((swatch) => {
  swatch.addEventListener('click', () => {
    activePaintColor = swatch.dataset.color;
    document.querySelectorAll('.paint-swatch').forEach((item) => {
      const selected = item === swatch;
      item.classList.toggle('is-selected', selected);
      item.setAttribute('aria-pressed', String(selected));
    });
  });
});
brushSizeInput.addEventListener('input', () => { brushSizeOutput.textContent = brushSizeInput.value; });
paintUndoButton.addEventListener('click', () => {
  const previous = paintHistory.pop();
  if (!previous) {
    paintStatus.textContent = '暂时没有可以撤销的笔触';
    return;
  }
  paintContext.putImageData(previous, 0, 0);
  paintStatus.textContent = '已撤销上一步';
});
paintClearButton.addEventListener('click', () => clearPaintCanvas());
paintOptimizeButton.addEventListener('click', optimizeGouache);
paintRestoreButton.addEventListener('click', () => {
  if (!preOptimizationImage) return;
  savePaintHistory();
  paintContext.putImageData(preOptimizationImage, 0, 0);
  preOptimizationImage = null;
  paintRestoreButton.disabled = true;
  paintStatus.textContent = '已恢复优化前的原始笔触';
});
paintDownloadButton.addEventListener('click', () => {
  paintCanvas.toBlob((blob) => {
    if (!blob) return;
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `dream-locker-gouache-${new Date().toISOString().slice(0, 10)}.png`;
    link.click();
    window.setTimeout(() => URL.revokeObjectURL(link.href), 1000);
    paintStatus.textContent = '作品已导出为 PNG';
  }, 'image/png');
});
artStudioClose.addEventListener('click', () => closeArtStudio());

function projectBoxById(projectId) {
  return projectBoxes.find((box) => box.id === projectId) || null;
}

function syncProjectDockState() {
  projectDockButtons.forEach((button) => {
    const rig = projectBoxById(button.dataset.projectBox);
    button.setAttribute('aria-pressed', String(Boolean(rig?.pinned)));
    button.classList.toggle('is-active', Boolean(rig?.revealed));
  });
}

function setProjectDockVisible(visible) {
  if (!projectDock) return;
  projectDock.hidden = !visible;
  projectDock.setAttribute('aria-hidden', String(!visible));
  if (!visible) {
    gsap.set(projectDock, { autoAlpha: 0, y: 12 });
    return;
  }
  gsap.fromTo(
    projectDock,
    { autoAlpha: 0, y: reduceMotion ? 0 : 12 },
    { autoAlpha: 1, y: 0, duration: reduceMotion ? 0 : 0.42, ease: 'power3.out', overwrite: 'auto' }
  );
}

function setProjectBoxReveal(rig, revealed, announce = false) {
  if (!rig || rig.revealed === revealed) return;
  rig.revealed = revealed;
  const duration = reduceMotion ? 0 : revealed ? 0.52 : 0.38;
  gsap.to(rig.root.position, {
    x: rig.restPosition.x,
    y: rig.restPosition.y + (revealed ? 0.035 : 0),
    z: rig.restPosition.z + (revealed ? 0.075 : 0),
    duration,
    ease: revealed ? 'power3.out' : 'power2.inOut',
    overwrite: 'auto'
  });
  gsap.to(rig.root.scale, {
    x: revealed ? 1.035 : rig.restScale.x,
    y: revealed ? 1.035 : rig.restScale.y,
    z: revealed ? 1.035 : rig.restScale.z,
    duration,
    ease: revealed ? 'back.out(1.7)' : 'power2.inOut',
    overwrite: 'auto'
  });
  rig.stickerRigs.forEach((stickerRig, index) => {
    const targetPosition = revealed ? stickerRig.revealPosition : stickerRig.restPosition;
    const targetRotation = revealed ? stickerRig.revealRotation : stickerRig.restRotation;
    gsap.to(stickerRig.mesh.position, {
      x: targetPosition.x,
      y: targetPosition.y,
      z: targetPosition.z,
      duration,
      delay: reduceMotion ? 0 : index * 0.035,
      ease: revealed ? 'back.out(1.55)' : 'power2.inOut',
      overwrite: 'auto'
    });
    gsap.to(stickerRig.mesh.rotation, {
      x: targetRotation.x,
      y: targetRotation.y,
      z: targetRotation.z,
      duration: duration * 0.9,
      delay: reduceMotion ? 0 : index * 0.035,
      ease: 'power3.out',
      overwrite: 'auto'
    });
  });
  syncProjectDockState();
  if (announce) doorStatus.textContent = revealed ? `${rig.name} · 贴纸已浮出箱体` : '中柜已打开 · 悬浮项目箱查看贴纸';
}

function setHoveredProjectBox(rig) {
  if (hoveredProjectBox === rig) return;
  if (hoveredProjectBox && !hoveredProjectBox.pinned) setProjectBoxReveal(hoveredProjectBox, false);
  hoveredProjectBox = rig;
  if (rig) setProjectBoxReveal(rig, true);
}

function togglePinnedProjectBox(rig) {
  if (!rig) return;
  if (pinnedProjectBox && pinnedProjectBox !== rig) {
    pinnedProjectBox.pinned = false;
    if (hoveredProjectBox !== pinnedProjectBox) setProjectBoxReveal(pinnedProjectBox, false);
  }
  rig.pinned = !rig.pinned;
  pinnedProjectBox = rig.pinned ? rig : null;
  setProjectBoxReveal(rig, rig.pinned || hoveredProjectBox === rig, true);
  doorStatus.textContent = rig.pinned ? `${rig.name} · 贴纸已固定展开` : `${rig.name} · 松开后自动收回`;
  syncProjectDockState();
}

function resetProjectBoxes(animate = true) {
  const previousReduceMotion = reduceMotion;
  if (!animate) reduceMotion = true;
  hoveredProjectBox = null;
  pinnedProjectBox = null;
  projectBoxes.forEach((rig) => {
    rig.pinned = false;
    if (rig.revealed) setProjectBoxReveal(rig, false);
  });
  reduceMotion = previousReduceMotion;
  syncProjectDockState();
}

let activeProjectId = null;
let projectLastFocus = null;
let lastTrailPoint = { x: 0, y: 0, time: 0 };

function projectTrailMarkup(type) {
  if (type === 'feather') return '<svg viewBox="0 0 48 48"><path d="M39 7C26 8 14 16 10 31c7 1 17-2 24-10 4-5 5-10 5-14Z"/><path d="M8 41c8-10 16-17 27-26" fill="none"/></svg>';
  if (type === 'bone') return '<svg viewBox="0 0 48 48"><path d="M14 13c-4-4-10-1-9 4 .4 2 2 3 4 3-2 1-2 5 0 7 3 3 7 1 8-2l14 9c-1 3 1 7 5 7 3 0 5-3 4-6 3 1 6-1 6-4 0-4-5-6-8-3L22 18c2-3 0-7-3-8-2-1-4 0-5 3Z"/></svg>';
  if (type === 'fan') return '<svg viewBox="0 0 48 48"><path d="M7 31C12 15 28 8 42 12c-2 15-12 26-27 29L7 31Z"/><path d="M10 32 39 14M14 36l20-20M19 38l11-20M25 35l2-17" fill="none"/></svg>';
  return '';
}

function spawnProjectTrail(event) {
  if (!activeProjectId || reduceMotion || event.pointerType === 'touch') return;
  const now = performance.now();
  const distance = Math.hypot(event.clientX - lastTrailPoint.x, event.clientY - lastTrailPoint.y);
  if (now - lastTrailPoint.time < 42 || distance < 20) return;
  lastTrailPoint = { x: event.clientX, y: event.clientY, time: now };
  while (projectTrail.childElementCount > 24) projectTrail.firstElementChild?.remove();
  const definition = projectPageDefinitions[activeProjectId];
  const particle = document.createElement('span');
  particle.className = `trail-particle ${definition.trail}`;
  particle.innerHTML = projectTrailMarkup(definition.trail);
  const size = definition.trail === 'smoke' ? gsap.utils.random(42, 74) : definition.trail === 'bubble' ? gsap.utils.random(18, 44) : gsap.utils.random(24, 38);
  particle.style.width = `${size}px`;
  particle.style.height = `${size}px`;
  projectTrail.append(particle);
  const driftX = gsap.utils.random(-26, 28);
  const driftY = definition.trail === 'smoke' ? gsap.utils.random(-76, -38) : gsap.utils.random(-34, 18);
  gsap.fromTo(
    particle,
    { x: event.clientX, y: event.clientY, xPercent: -50, yPercent: -50, autoAlpha: definition.trail === 'smoke' ? 0.34 : 0.72, scale: 0.45, rotation: gsap.utils.random(-35, 35) },
    {
      x: event.clientX + driftX,
      y: event.clientY + driftY,
      autoAlpha: 0,
      scale: definition.trail === 'bubble' ? 1.42 : 1.08,
      rotation: `+=${gsap.utils.random(-42, 42)}`,
      duration: definition.trail === 'smoke' ? 1.55 : 1.05,
      ease: 'power2.out',
      overwrite: false,
      onComplete: () => particle.remove()
    }
  );
}

function syncProjectViewerNavigation(projectId) {
  projectOpenButtons.forEach((button) => button.classList.toggle('is-current', button.dataset.projectOpen === projectId));
}

const projectVideoEmbeds = {
  'kunqu-motion': {
    order: 7,
    src: 'assets/videos/kunqu-demo.mp4',
    poster: 'assets/videos/kunqu-demo-poster.jpg',
    className: 'is-kunqu-demo',
    label: '播放昆曲韵动服务系统演示视频'
  },
  lingfu: {
    order: 21,
    src: 'assets/videos/lingfu-vr-concept.mp4',
    poster: 'assets/videos/lingfu-vr-poster.jpg',
    className: 'is-lingfu-vr',
    label: '播放灵馥 VR 概念设计视频'
  }
};

async function renderProjectMedia(projectId) {
  const manifest = projectPageManifest || await projectManifestPromise;
  const definition = projectPageDefinitions[projectId];
  const images = manifest?.[projectId] || [];
  projectMedia.querySelectorAll('video').forEach((video) => video.pause());
  projectMedia.className = `project-media ${definition.layout === 'tooth' ? 'is-tooth' : 'is-long'}`;
  projectMedia.replaceChildren();
  projectMedia.setAttribute('aria-busy', 'true');
  if (!images.length) {
    const message = document.createElement('p');
    message.className = 'project-media-error';
    message.textContent = '项目页面素材暂时无法读取，请返回后重试。';
    projectMedia.append(message);
    projectMedia.setAttribute('aria-busy', 'false');
    return;
  }
  const fragment = document.createDocumentFragment();
  images.forEach((item, index) => {
    const figure = document.createElement('figure');
    figure.dataset.order = String(item.order);
    const image = document.createElement('img');
    image.src = assetUrl(item.src);
    image.width = item.width;
    image.height = item.height;
    image.alt = `${definition.name}项目展示页面 ${item.order}`;
    image.loading = index < 2 ? 'eager' : 'lazy';
    image.decoding = 'async';
    if (index === 0) image.fetchPriority = 'high';
    figure.append(image);
    const videoDefinition = projectVideoEmbeds[projectId];
    if (videoDefinition?.order === item.order) {
      figure.classList.add('has-project-video', videoDefinition.className);
      const videoShell = document.createElement('div');
      videoShell.className = 'project-video-shell';
      const video = document.createElement('video');
      video.src = assetUrl(videoDefinition.src);
      video.poster = assetUrl(videoDefinition.poster);
      video.controls = true;
      video.preload = 'metadata';
      video.playsInline = true;
      video.setAttribute('aria-label', videoDefinition.label);
      const badge = document.createElement('span');
      badge.className = 'project-video-badge';
      badge.textContent = projectId === 'lingfu' ? 'VR CONCEPT / PLAY' : 'DEMO / PLAY';
      video.addEventListener('play', () => {
        projectMedia.querySelectorAll('video').forEach((otherVideo) => {
          if (otherVideo !== video) otherVideo.pause();
        });
        badge.hidden = true;
      });
      video.addEventListener('pause', () => { badge.hidden = video.currentTime > 0; });
      videoShell.append(video, badge);
      figure.append(videoShell);
    }
    fragment.append(figure);
  });
  projectMedia.append(fragment);
  projectMedia.setAttribute('aria-busy', 'false');
  if (!reduceMotion) {
    const openingFigures = [...projectMedia.querySelectorAll('figure')].slice(0, 6);
    gsap.from(openingFigures, { autoAlpha: 0, y: 26, duration: 0.68, ease: 'power3.out', stagger: 0.055, clearProps: 'transform,opacity,visibility' });
  }
}

async function openProjectPage(projectId) {
  const definition = projectPageDefinitions[projectId];
  if (!definition) return;
  const isFirstOpen = projectViewer.hidden;
  projectLastFocus = isFirstOpen ? document.activeElement : projectLastFocus;
  activeProjectId = projectId;
  projectViewer.style.setProperty('--project-accent', definition.accent);
  projectViewer.style.setProperty('--project-ink', definition.ink);
  projectViewerTitle.textContent = definition.name;
  projectViewerIndex.textContent = `PROJECT ${definition.index} / 05`;
  projectPageIntro.dataset.index = definition.index;
  projectPageKicker.textContent = definition.kicker;
  projectPageTitle.textContent = definition.name;
  projectPageSummary.textContent = definition.summary;
  projectRole.textContent = definition.role;
  projectTasks.textContent = definition.tasks;
  projectTools.replaceChildren(...definition.tools.map((tool) => {
    const item = document.createElement('li');
    item.textContent = tool;
    return item;
  }));
  syncProjectViewerNavigation(projectId);
  projectViewer.hidden = false;
  projectViewer.setAttribute('aria-hidden', 'false');
  if (isFirstOpen) gsap.set(projectViewer, { autoAlpha: 0, yPercent: reduceMotion ? 0 : 5 });
  document.body.classList.add('project-open');
  controls.enabled = false;
  projectScroll.scrollTop = 0;
  projectTrail.replaceChildren();
  await renderProjectMedia(projectId);
  if (activeProjectId !== projectId) return;
  const timeline = gsap.timeline({ defaults: { overwrite: 'auto' } });
  timeline
    .fromTo(projectViewer, { autoAlpha: 0, yPercent: reduceMotion ? 0 : 5 }, { autoAlpha: 1, yPercent: 0, duration: reduceMotion ? 0 : 0.62, ease: 'expo.out' }, 0)
    .fromTo('.project-page-heading > *', { autoAlpha: 0, y: reduceMotion ? 0 : 28 }, { autoAlpha: 1, y: 0, duration: reduceMotion ? 0 : 0.7, stagger: 0.07, ease: 'power3.out' }, reduceMotion ? 0 : 0.18)
    .fromTo('.project-brief > div', { autoAlpha: 0, x: reduceMotion ? 0 : 24 }, { autoAlpha: 1, x: 0, duration: reduceMotion ? 0 : 0.55, stagger: 0.06, ease: 'power3.out' }, reduceMotion ? 0 : 0.28)
    .call(() => projectBackButton.focus({ preventScroll: true }));
}

function closeProjectPage({ restoreFocus = true } = {}) {
  if (projectViewer.hidden) return;
  projectMedia.querySelectorAll('video').forEach((video) => video.pause());
  const finish = () => {
    projectViewer.hidden = true;
    projectViewer.setAttribute('aria-hidden', 'true');
    document.body.classList.remove('project-open');
    projectTrail.replaceChildren();
    activeProjectId = null;
    controls.enabled = true;
    if (restoreFocus && projectLastFocus instanceof HTMLElement) projectLastFocus.focus({ preventScroll: true });
  };
  gsap.to(projectViewer, { autoAlpha: 0, yPercent: reduceMotion ? 0 : 3, duration: reduceMotion ? 0 : 0.38, ease: 'power2.in', overwrite: 'auto', onComplete: finish });
}

function openNextProject() {
  const currentIndex = projectOrder.indexOf(activeProjectId);
  openProjectPage(projectOrder[(currentIndex + 1) % projectOrder.length]);
}

function revealCabinetContents(doorId) {
  const groups = doorRig.revealGroups[doorId] || [];
  if (!groups.length || reduceMotion) return;
  const timeline = gsap.timeline({ defaults: { duration: 0.58, ease: 'back.out(1.65)', overwrite: 'auto' } });
  groups.forEach((group, index) => {
    const targetScale = group.userData.revealScale || group.scale.clone();
    const targetY = group.userData.revealY ?? group.position.y;
    if (!group.userData.revealScale) {
      group.userData.revealScale = targetScale.clone();
      group.userData.revealY = targetY;
    }
    timeline.fromTo(
      group.scale,
      { x: targetScale.x * 0.62, y: targetScale.y * 0.62, z: targetScale.z * 0.62 },
      { x: targetScale.x, y: targetScale.y, z: targetScale.z, immediateRender: false },
      index * 0.095
    );
    timeline.fromTo(
      group.position,
      { y: targetY - 0.07 },
      { y: targetY, duration: 0.52, ease: 'power3.out', immediateRender: false },
      index * 0.095
    );
  });
}

function handlePropAction(actionId) {
  if (doorStates.left) {
    if (actionId === 'id-card') animateIdCard();
    if (actionId === 'resume-folder') openResumeArtifact();
    if (actionId === 'rotary-phone') openPhoneArtifact();
    if (actionId === 'instant-camera') openCameraArtifact();
    if (actionId === 'fish-bell') ringFishBell();
    if (actionId === 'painting-charm') openArtStudio();
  }
  if (doorStates.right && actionId === 'mailbox-button') triggerMailbox();
}

function updateDoorUi(busyDoor = null, busyOpening = false) {
  const labels = { left: '左柜', center: '中柜', right: '右柜' };
  const openedDoors = Object.keys(doorStates).filter((doorId) => doorStates[doorId]);
  const anyOpen = openedDoors.length > 0;
  toggleButton.setAttribute('aria-pressed', String(doorStates.center));
  toggleButton.querySelector('.button-copy b').textContent = doorStates.center ? '关闭项目柜' : '打开项目柜';
  document.body.classList.toggle('center-open', doorStates.center);
  if (busyDoor) {
    doorStatus.textContent = `${labels[busyDoor]}${busyOpening ? '正在开启' : '正在关闭'}`;
  } else if (!anyOpen) {
    doorStatus.textContent = '等待开启';
  } else {
    const names = openedDoors.map((doorId) => labels[doorId]).join('、');
    doorStatus.textContent = doorStates.center ? `${names}已打开 · 悬浮项目箱查看贴纸` : `${names}已打开`;
  }
  const light = document.querySelector('.status-light');
  gsap.to(light, { backgroundColor: anyOpen ? '#91c876' : '#f0b867', boxShadow: anyOpen ? '0 0 0 5px rgba(145,200,118,.16)' : '0 0 0 5px rgba(240,184,103,.16)', duration: reduceMotion ? 0 : 0.35 });
}

function toggleCabinetDoor(doorId, force, options = {}) {
  if (!(doorId in doorStates)) return;
  const { moveCamera = true, exclusive = true } = options;
  const nextOpen = typeof force === 'boolean' ? force : !doorStates[doorId];
  if (nextOpen === doorStates[doorId] && !doorTimelines[doorId]?.isActive()) return;
  if (nextOpen && exclusive) {
    Object.keys(doorStates).forEach((otherDoorId) => {
      if (otherDoorId !== doorId && doorStates[otherDoorId]) toggleCabinetDoor(otherDoorId, false, { moveCamera: false, exclusive: false });
    });
  }
  doorStates[doorId] = nextOpen;
  doorTimelines[doorId]?.kill();
  if (nextOpen) lastFocusedDoor = doorId;
  else if (lastFocusedDoor === doorId) lastFocusedDoor = focusedDoorId();

  const duration = reduceMotion ? 0 : 1;
  const cameraPose = nextOpen ? currentOpenCamera(doorId) : currentFocusCamera();
  updateDoorUi(doorId, nextOpen);
  if (doorId === 'left' && !nextOpen) resetLeftArtifacts(!reduceMotion);
  if (doorId === 'center') {
    setProjectDockVisible(nextOpen);
    if (!nextOpen) resetProjectBoxes(!reduceMotion);
  }
  if (doorId === 'center' && nextOpen) {
    stickers.forEach((sticker) => {
      sticker.visible = true;
      sticker.material.opacity = 0;
    });
  }

  const timeline = gsap.timeline({
    defaults: { duration, ease: 'power3.inOut', overwrite: 'auto' },
    onComplete: () => {
      doorTimelines[doorId] = null;
      updateDoorUi();
      if (doorId === 'center' && nextOpen && !reduceMotion) {
        gsap.fromTo(
          stickers.map((sticker) => sticker.scale),
          { x: 0.92, y: 0.92, z: 0.92 },
          { x: 1, y: 1, z: 1, duration: 0.55, ease: 'back.out(1.8)', stagger: { amount: 0.25, from: 'random' }, overwrite: 'auto' }
        );
        const idleProjectBoxes = projectBoxes.filter((box) => !box.revealed);
        gsap.fromTo(
          idleProjectBoxes.map((box) => box.root.scale),
          { x: 0.92, y: 0.92, z: 0.92 },
          { x: 1, y: 1, z: 1, duration: 0.58, ease: 'back.out(1.65)', stagger: 0.075, overwrite: 'auto' }
        );
      }
      if ((doorId === 'left' || doorId === 'right') && nextOpen) revealCabinetContents(doorId);
    }
  });
  doorTimelines[doorId] = timeline;
  timeline.addLabel('door-motion', 0);

  if (doorId === 'center') {
    timeline
      .to(doorRig.outerPivot.rotation, { y: nextOpen ? 1.52 : 0 }, 'door-motion')
      .to(doorRig.innerPivot.rotation, { y: nextOpen ? -2.72 : 0, duration: duration * 0.92 }, 'door-motion+=0.12')
      .to(stickers.map((sticker) => sticker.material), {
        opacity: nextOpen ? 1 : 0,
        duration: duration * 0.38,
        stagger: nextOpen ? 0.035 : 0,
        onComplete: () => {
          if (!nextOpen) stickers.forEach((sticker) => { sticker.visible = false; });
        }
      }, nextOpen ? 'door-motion+=0.52' : 'door-motion');
  } else {
    const pivot = doorId === 'left' ? doorRig.leftPivot : doorRig.rightPivot;
    const openAngle = doorId === 'left' ? 1.47 : 1.58;
    timeline.to(pivot.rotation, {
      y: nextOpen ? openAngle : 0,
      duration: duration * 0.94,
      ease: nextOpen ? 'back.out(1.08)' : 'power3.inOut'
    }, 'door-motion');
  }

  if (moveCamera) {
    timeline
      .to(camera.position, { x: cameraPose.position.x, y: cameraPose.position.y, z: cameraPose.position.z, duration: duration * 1.05 }, 'door-motion')
      .to(controls.target, { x: cameraPose.target.x, y: cameraPose.target.y, z: cameraPose.target.z, duration: duration * 1.05, onUpdate: () => controls.update() }, 'door-motion');
  }
  return timeline;
}

function toggleDoor(force) {
  toggleCabinetDoor('center', force);
}

function setAllDoors(open) {
  ['left', 'center', 'right'].forEach((doorId) => toggleCabinetDoor(doorId, open, { moveCamera: false, exclusive: false }));
  lastFocusedDoor = open ? 'center' : null;
  setCamera(open ? currentOpenCamera('center') : currentClosedCamera(), false);
}

function updatePointer(event) {
  const rect = canvas.getBoundingClientRect();
  pointer.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
  pointer.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
  raycaster.setFromCamera(pointer, camera);
}

function availablePropMeshes() {
  return interactiveProps.filter((mesh) => {
    const requiredDoor = mesh.userData.requiredDoor || 'left';
    if (!doorStates[requiredDoor]) return false;
    let node = mesh;
    while (node) {
      if (!node.visible) return false;
      node = node.parent;
    }
    return true;
  });
}

function idCardMeshes() {
  return availablePropMeshes().filter((mesh) => mesh.userData.actionId === 'id-card');
}

function beginIdCardDrag(event) {
  const rig = doorRig.props.idCard;
  selectedIdCard = rig;
  propTimeline?.kill();
  gsap.killTweensOf(rig.cardGroup.position);
  gsap.killTweensOf(rig.cardGroup.rotation);
  controls.enabled = false;
  pointerMoved = false;
  canvas.setPointerCapture(event.pointerId);
  const normal = new THREE.Vector3(0, 0, 1).applyQuaternion(rig.root.getWorldQuaternion(new THREE.Quaternion())).normalize();
  const worldPosition = rig.cardGroup.getWorldPosition(new THREE.Vector3());
  idCardDragPlane.setFromNormalAndCoplanarPoint(normal, worldPosition);
  const worldHit = raycaster.ray.intersectPlane(idCardDragPlane, new THREE.Vector3());
  if (worldHit) {
    const localHit = rig.root.worldToLocal(worldHit.clone());
    idCardDragOffset.copy(rig.cardGroup.position).sub(localHit);
  }
  canvas.classList.add('is-dragging');
  gsap.to(rig.cardGroup.scale, { x: 1.045, y: 1.045, z: 1.045, duration: reduceMotion ? 0 : 0.18, ease: 'power2.out', overwrite: 'auto' });
}

function releaseIdCard(event, cancelled = false) {
  if (!selectedIdCard) return;
  const rig = selectedIdCard;
  selectedIdCard = null;
  controls.enabled = true;
  canvas.classList.remove('is-dragging');
  if (event && canvas.hasPointerCapture(event.pointerId)) canvas.releasePointerCapture(event.pointerId);
  const duration = reduceMotion ? 0 : 1.05;
  gsap.to(rig.cardGroup.position, {
    x: rig.restPosition.x,
    y: rig.restPosition.y,
    z: rig.restPosition.z,
    duration,
    ease: 'elastic.out(1, .27)',
    overwrite: 'auto',
    onUpdate: updateIdCardStrap
  });
  gsap.to(rig.cardGroup.rotation, { z: 0, duration, ease: 'elastic.out(1, .3)', overwrite: 'auto' });
  gsap.to(rig.cardGroup.scale, { x: 1, y: 1, z: 1, duration: reduceMotion ? 0 : 0.34, ease: 'back.out(2)', overwrite: 'auto' });
  if (cancelled) pointerMoved = false;
}

function beginStickerDrag(event, hit) {
  selectedSticker = hit.object;
  controls.enabled = false;
  pointerMoved = false;
  canvas.setPointerCapture(event.pointerId);
  const normal = new THREE.Vector3(0, 0, 1).applyQuaternion(selectedSticker.parent.getWorldQuaternion(new THREE.Quaternion())).normalize();
  const worldPosition = selectedSticker.getWorldPosition(new THREE.Vector3());
  dragPlane.setFromNormalAndCoplanarPoint(normal, worldPosition);
  const worldHit = raycaster.ray.intersectPlane(dragPlane, new THREE.Vector3());
  if (worldHit) {
    const localHit = selectedSticker.parent.worldToLocal(worldHit.clone());
    dragOffset.copy(selectedSticker.position).sub(localHit);
  }
  canvas.classList.add('is-dragging');
  gsap.to(selectedSticker.scale, { x: 1.12, y: 1.12, z: 1.12, duration: reduceMotion ? 0 : 0.2, ease: 'power2.out', overwrite: 'auto' });
}

canvas.addEventListener('pointerdown', (event) => {
  updatePointer(event);
  pointerDownPosition = { x: event.clientX, y: event.clientY };
  pointerMoved = false;
  if (doorStates.left && raycaster.intersectObjects(idCardMeshes(), false)[0]) {
    beginIdCardDrag(event);
    return;
  }
  if (doorStates.center) {
    const stickerHit = raycaster.intersectObjects(stickers, false)[0];
    if (stickerHit) beginStickerDrag(event, stickerHit);
  }
});

canvas.addEventListener('pointermove', (event) => {
  updatePointer(event);
  if (pointerDownPosition && Math.hypot(event.clientX - pointerDownPosition.x, event.clientY - pointerDownPosition.y) > 5) pointerMoved = true;

  if (selectedSticker) {
    const worldHit = raycaster.ray.intersectPlane(dragPlane, new THREE.Vector3());
    if (!worldHit) return;
    const local = selectedSticker.parent.worldToLocal(worldHit.clone()).add(dragOffset);
    const b = selectedSticker.userData.bounds;
    selectedSticker.position.x = THREE.MathUtils.clamp(local.x, b.xMin, b.xMax);
    selectedSticker.position.y = THREE.MathUtils.clamp(local.y, b.yMin, b.yMax);
    return;
  }

  if (selectedIdCard) {
    const worldHit = raycaster.ray.intersectPlane(idCardDragPlane, new THREE.Vector3());
    if (!worldHit) return;
    const local = selectedIdCard.root.worldToLocal(worldHit.clone()).add(idCardDragOffset);
    selectedIdCard.cardGroup.position.x = THREE.MathUtils.clamp(local.x, -0.28, 0.28);
    selectedIdCard.cardGroup.position.y = THREE.MathUtils.clamp(local.y, -0.72, 0.04);
    selectedIdCard.cardGroup.position.z = selectedIdCard.restPosition.z;
    selectedIdCard.cardGroup.rotation.z = THREE.MathUtils.clamp(-selectedIdCard.cardGroup.position.x * 0.62, -0.17, 0.17);
    updateIdCardStrap();
    return;
  }

  const projectHit = doorStates.center ? raycaster.intersectObjects(projectBoxHitMeshes, false)[0] : null;
  const projectRig = projectHit ? projectBoxById(projectHit.object.userData.projectBoxId) : null;
  setHoveredProjectBox(projectRig);
  const stickerHover = doorStates.center && raycaster.intersectObjects(stickers, false).length > 0;
  const propHover = raycaster.intersectObjects(availablePropMeshes(), false).length > 0;
  const doorHover = raycaster.intersectObjects(openables, false).length > 0;
  canvas.classList.toggle('is-actionable', Boolean(projectHit || stickerHover || propHover || doorHover));
});

canvas.addEventListener('pointerup', (event) => {
  updatePointer(event);
  if (selectedIdCard) {
    const wasTap = !pointerMoved;
    releaseIdCard(event);
    if (wasTap) animateIdCard();
    pointerDownPosition = null;
    return;
  }
  if (selectedSticker) {
    gsap.to(selectedSticker.scale, { x: 1, y: 1, z: 1, duration: reduceMotion ? 0 : 0.32, ease: 'back.out(2)', overwrite: 'auto' });
    selectedSticker = null;
    controls.enabled = true;
    canvas.classList.remove('is-dragging');
    if (canvas.hasPointerCapture(event.pointerId)) canvas.releasePointerCapture(event.pointerId);
    pointerDownPosition = null;
    return;
  }

  if (!pointerMoved) {
    const projectHit = doorStates.center && raycaster.intersectObjects(projectBoxHitMeshes, false)[0];
    if (projectHit) {
      const rig = projectBoxById(projectHit.object.userData.projectBoxId);
      setProjectBoxReveal(rig, true, true);
      openProjectPage(rig.id);
      pointerDownPosition = null;
      return;
    }
    const propHit = raycaster.intersectObjects(availablePropMeshes(), false)[0];
    if (propHit) {
      handlePropAction(propHit.object.userData.actionId);
      pointerDownPosition = null;
      return;
    }
    const doorHit = raycaster.intersectObjects(openables, false)[0];
    if (doorHit) toggleCabinetDoor(doorHit.object.userData.doorId || 'center');
  }
  pointerDownPosition = null;
});

canvas.addEventListener('pointercancel', (event) => {
  releaseIdCard(event, true);
  selectedSticker = null;
  setHoveredProjectBox(null);
  controls.enabled = true;
  pointerDownPosition = null;
  canvas.classList.remove('is-dragging');
});
canvas.addEventListener('pointerleave', () => {
  if (!selectedSticker && !selectedIdCard) setHoveredProjectBox(null);
  canvas.classList.remove('is-actionable');
});

toggleButton.addEventListener('click', () => toggleDoor());
resetButton.addEventListener('click', () => setCamera(currentFocusCamera(), false));
projectDockButtons.forEach((button) => {
  const getRig = () => projectBoxById(button.dataset.projectBox);
  button.addEventListener('pointerenter', () => setHoveredProjectBox(getRig()));
  button.addEventListener('pointerleave', () => setHoveredProjectBox(null));
  button.addEventListener('focus', () => setHoveredProjectBox(getRig()));
  button.addEventListener('blur', () => setHoveredProjectBox(null));
  button.addEventListener('click', () => {
    const rig = getRig();
    setProjectBoxReveal(rig, true, true);
    openProjectPage(rig.id);
  });
});
careerShortcutButtons.forEach((button) => {
  button.addEventListener('click', () => {
    const shortcut = button.dataset.careerShortcut;
    if (shortcut === 'resume') {
      const doorTimeline = toggleCabinetDoor('left', true);
      if (doorTimeline) doorTimeline.call(() => openResumeArtifact(), [], '+=0.08');
      else openResumeArtifact();
    }
    if (shortcut === 'projects') toggleCabinetDoor('center', true);
    if (shortcut === 'internship') {
      const doorTimeline = toggleCabinetDoor('right', true);
      if (doorTimeline) doorTimeline.call(() => triggerMailbox(1), [], '+=0.08');
      else triggerMailbox(1);
    }
    if (shortcut === 'contact') {
      const doorTimeline = toggleCabinetDoor('left', true);
      if (doorTimeline) doorTimeline.call(() => openPhoneArtifact(), [], '+=0.08');
      else openPhoneArtifact();
    }
  });
});
internshipPrevButton.addEventListener('click', () => requestInternshipLetter(-1));
internshipNextButton.addEventListener('click', () => requestInternshipLetter(1));
projectBackButton.addEventListener('click', () => closeProjectPage());
projectNextButton.addEventListener('click', openNextProject);
projectOpenButtons.forEach((button) => button.addEventListener('click', () => openProjectPage(button.dataset.projectOpen)));
projectViewer.addEventListener('pointermove', spawnProjectTrail, { passive: true });
panels.forEach((panel) => panel.querySelector('[data-close-panel]')?.addEventListener('click', () => closePanel()));
panelScrim.addEventListener('click', () => closePanel());
photoUpload.addEventListener('change', () => {
  const file = photoUpload.files?.[0];
  if (!file) return;
  if (!file.type.startsWith('image/')) {
    uploadStatus.textContent = '请选择有效的图片文件';
    return;
  }
  if (file.size > 15 * 1024 * 1024) {
    uploadStatus.textContent = '图片请控制在 15MB 以内';
    return;
  }
  uploadStatus.textContent = '正在显影…';
  const reader = new FileReader();
  reader.onload = () => {
    const image = new Image();
    image.onload = () => {
      const { film, filmFrames, root, lens } = doorRig.props.instantCamera;
      const oldTexture = filmFrames[0].material.map;
      const nextTexture = createFilmTexture(image);
      filmFrames.forEach((frame) => {
        frame.material.map = nextTexture;
        frame.material.needsUpdate = true;
      });
      oldTexture?.dispose();
      film.visible = true;
      gsap.set(film.scale, { y: 0.02 });
      const reveal = gsap.timeline({ defaults: { overwrite: 'auto' } })
        .to(lens.scale, { x: 1.08, y: 1.08, z: 1.08, duration: reduceMotion ? 0 : 0.15, yoyo: true, repeat: 1, ease: 'power2.inOut' })
        .to(root.scale, { x: 1.22, y: 1.22, z: 1.22, duration: reduceMotion ? 0 : 0.28, ease: 'back.out(1.45)' }, 0)
        .to(film.scale, { y: 1, duration: reduceMotion ? 0 : 1.05, ease: 'power3.out' }, reduceMotion ? 0 : 0.16)
        .fromTo(film.rotation, { z: -0.025 }, { z: 0.018, duration: reduceMotion ? 0 : 0.75, ease: 'sine.inOut', yoyo: true, repeat: 1 }, reduceMotion ? 0 : 0.25);
      reveal.call(() => { uploadStatus.textContent = `已冲印：${file.name}`; });
    };
    image.onerror = () => { uploadStatus.textContent = '图片读取失败，请换一张试试'; };
    image.src = reader.result;
  };
  reader.onerror = () => { uploadStatus.textContent = '图片读取失败，请换一张试试'; };
  reader.readAsDataURL(file);
});

document.addEventListener('keydown', (event) => {
  if (!projectViewer.hidden) {
    if (event.key === 'Escape') {
      event.preventDefault();
      closeProjectPage();
      return;
    }
    if (event.key === 'Tab') {
      const projectFocusable = [...projectViewer.querySelectorAll('button:not([disabled]), [href], [tabindex]:not([tabindex="-1"])')];
      if (!projectFocusable.length) return;
      const first = projectFocusable[0];
      const last = projectFocusable[projectFocusable.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
      return;
    }
  }
  if (event.key === 'Escape' && !artStudio.hidden) {
    event.preventDefault();
    closeArtStudio();
    return;
  }
  if (event.key === 'Tab' && !artStudio.hidden) {
    const studioFocusable = [...artStudio.querySelectorAll('button:not([disabled]), input:not([disabled]), canvas, [href], [tabindex]:not([tabindex="-1"])')];
    if (!studioFocusable.length) return;
    const first = studioFocusable[0];
    const last = studioFocusable[studioFocusable.length - 1];
    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
    return;
  }
  if (event.key === 'Escape' && activePanel) {
    event.preventDefault();
    closePanel();
    return;
  }
  if (event.key !== 'Tab' || !activePanel) return;
  const focusable = [...activePanel.querySelectorAll('button:not([disabled]), input:not([disabled]), [href], [tabindex]:not([tabindex="-1"])')];
  if (!focusable.length) return;
  const first = focusable[0];
  const last = focusable[focusable.length - 1];
  if (event.shiftKey && document.activeElement === first) {
    event.preventDefault();
    last.focus();
  } else if (!event.shiftKey && document.activeElement === last) {
    event.preventDefault();
    first.focus();
  }
});
document.querySelector('.brand').addEventListener('click', (event) => {
  event.preventDefault();
  if (Object.values(doorStates).some(Boolean)) setAllDoors(false);
  else setCamera(currentClosedCamera(), false);
});

function onResize() {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.setSize(window.innerWidth, window.innerHeight);
  if (!Object.values(doorTimelines).some((timeline) => timeline?.isActive())) setCamera(currentFocusCamera());
}
window.addEventListener('resize', onResize);

window.sculptRuntime = {
  nodes: partNodes,
  destructionGroups: {
    'cabinet-assembly': ['carcass', 'dividers', 'interior-bay', 'shelves'],
    'door-assembly': ['door-system', 'left-door', 'left-door-interior', 'left-door-sticker-cluster', 'id-card', 'instant-camera', 'painting-charm', 'right-door', 'right-door-interior', 'right-door-sticker-cluster', 'right-outer-door', 'right-inner-door'],
    'left-bay-portfolio': ['left-bay-portfolio', 'left-bay-decor', 'left-bay-books', 'resume-folder', 'rotary-phone', 'postcard-stack', 'fish-bell'],
    'center-project-boxes': ['center-project-boxes', 'project-box-gugu-island', 'project-box-tooth-squad', 'project-box-kunqu-motion', 'project-box-goodboy', 'project-box-lingfu'],
    'right-bay-portfolio': ['right-bay-portfolio', 'right-bay-clock', 'right-bay-mailbox']
  },
  interactions: {
    toggleDoor,
    toggleCabinetDoor,
    setAllDoors,
    getDoorStates: () => ({ ...doorStates }),
    draggableStickers: stickers,
    interactiveProps,
    projectBoxes,
    setProjectBoxReveal,
    togglePinnedProjectBox,
    openResumeArtifact,
    openPhoneArtifact,
    openCameraArtifact,
    ringFishBell,
    triggerMailbox,
    openProjectPage,
    closeProjectPage,
    openArtStudio,
    closeArtStudio,
    optimizeGouache,
    resetLeftArtifacts
  },
  model: locker
};
locker.userData.sculptRuntime = window.sculptRuntime;

gsap.set(locker.scale, { x: 0.94, y: 0.94, z: 0.94 });
const introDuration = captureMode || reduceMotion ? 0 : 1;
const loadingState = { value: 0 };
const atLoader = (offset) => introDuration ? `loader+=${offset}` : 'loader';
const atPortfolio = (offset) => introDuration ? `portfolio+=${offset}` : 'portfolio';
const intro = gsap.timeline({ defaults: { ease: 'power3.out' } });
intro
  .addLabel('loader', 0)
  .fromTo('.loading-kicker > *', { autoAlpha: 0, y: 10 }, { autoAlpha: 1, y: 0, duration: introDuration * 0.42, stagger: introDuration ? 0.055 : 0 }, 'loader')
  .fromTo('.loading h2 > *', { autoAlpha: 0, y: 34, rotation: -2 }, { autoAlpha: 1, y: 0, rotation: 0, duration: introDuration * 0.72, stagger: introDuration ? 0.08 : 0, ease: 'power4.out' }, atLoader(0.08))
  .fromTo('.loading-caption', { autoAlpha: 0, y: 14 }, { autoAlpha: 1, y: 0, duration: introDuration * 0.46 }, atLoader(0.28))
  .to(loadingState, {
    value: 100,
    duration: introDuration * 1.35,
    ease: 'power2.inOut',
    roundProps: 'value',
    onUpdate: () => { loadingProgress.textContent = `${loadingState.value}%`; }
  }, atLoader(0.12))
  .to(loadingTrack, { scaleX: 1, duration: introDuration * 1.35, ease: 'power2.inOut' }, atLoader(0.12))
  .to('.loading-content', { y: -18, autoAlpha: 0, duration: introDuration * 0.34, ease: 'power2.in' }, atLoader(1.38))
  .to(loading, { yPercent: -100, duration: introDuration * 0.62, ease: 'expo.inOut' }, atLoader(1.42))
  .set(loading, { display: 'none' })
  .addLabel('portfolio')
  .to(locker.scale, { x: 1, y: 1, z: 1, duration: introDuration * 1.05 }, 'portfolio')
  .from('.hero-copy > *', { y: 18, autoAlpha: 0, duration: introDuration * 0.68, stagger: introDuration ? 0.075 : 0 }, atPortfolio(0.06))
  .from('.actions', { y: 14, autoAlpha: 0, duration: introDuration * 0.58 }, atPortfolio(0.16))
  .from('.career-shortcuts > *', { y: 10, autoAlpha: 0, duration: introDuration * 0.48, stagger: introDuration ? 0.045 : 0 }, atPortfolio(0.2))
  .call(() => {
    if (!captureMode) toggleCabinetDoor('left', true);
  }, [], atPortfolio(0.55));

if (captureMode && captureAllOpen) {
  window.setTimeout(() => {
    setAllDoors(true);
  }, 250);
} else if (captureMode && captureOpen) {
  window.setTimeout(() => toggleDoor(true), 250);
} else if (captureMode && captureLeftOpen) {
  window.setTimeout(() => toggleCabinetDoor('left', true, { moveCamera: false }), 250);
}

const clock = new THREE.Clock();
function render() {
  const elapsed = clock.getElapsedTime();
  paint.clearcoat = 0.23 + Math.sin(elapsed * 0.35) * 0.015;
  const now = new Date();
  const seconds = now.getSeconds() + (reduceMotion ? 0 : now.getMilliseconds() / 1000);
  const minutes = now.getMinutes() + seconds / 60;
  const hours = (now.getHours() % 12) + minutes / 60;
  doorRig.props.appleClock.secondHand.rotation.z = -(seconds / 60) * Math.PI * 2;
  doorRig.props.appleClock.minuteHand.rotation.z = -(minutes / 60) * Math.PI * 2;
  doorRig.props.appleClock.hourHand.rotation.z = -(hours / 12) * Math.PI * 2;
  controls.update();
  renderer.render(scene, camera);
  requestAnimationFrame(render);
}
render();
