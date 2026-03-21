import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import resize from "./resize.js";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import GUI from "lil-gui";
import { TransformControls } from "three/examples/jsm/controls/TransformControls.js";

// 🔹 Références globales pour les objets
let robeRef = null;
let sabreRef = null;

// 1. LA SCÈNE
const scene = new THREE.Scene();

// 2. LA CAMÉRA
const camera = new THREE.PerspectiveCamera(
  75,
  window.innerWidth / window.innerHeight,
  0.1,
  1000,
);
camera.position.z = 5;

// 3. LE RENDERER
const canvas = document.querySelector("#webgl");
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

// 4. ORBIT CONTROLS
const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;

// 5. TRANSFORM CONTROLS
const transformControls = new TransformControls(camera, renderer.domElement);
scene.add(transformControls.getHelper());

// Désactiver OrbitControls quand on manipule un objet
transformControls.addEventListener("dragging-changed", (event) => {
  controls.enabled = !event.value;
});

// Mode par défaut
transformControls.setMode("translate");

// 🎮 Contrôles clavier
window.addEventListener("keydown", (e) => {
  if (e.key === "g") transformControls.setMode("translate");
  if (e.key === "r") transformControls.setMode("rotate");
  if (e.key === "s") transformControls.setMode("scale");
});

// --- INITIALISATION DU MENU (GUI) ---
const gui = new GUI();

// 1️⃣ GUI pour switch d'objet
const params = {
  objet: "robe",
};
gui.add(params, "objet", ["robe", "sabre"]).onChange((value) => {
  if (value === "robe" && robeRef) transformControls.attach(robeRef);
  if (value === "sabre" && sabreRef) transformControls.attach(sabreRef);
});

// 2️⃣ GUI pour changer l'outil de modification
const modeParams = { outil: "translate" };
gui
  .add(modeParams, "outil", ["translate", "rotate", "scale"])
  .name("Mode de modification")
  .onChange((mode) => {
    transformControls.setMode(mode);
  });

// 6. CHARGEMENT DES OBJETS
const loader = new GLTFLoader();

// Objet 1 : La Robe
loader.load("/assets/princess_snow_white_dress.glb", (gltf) => {
  const robe = gltf.scene;
  scene.add(robe);
  robeRef = robe;
  robe.visible = true;

  // GUI taille robe
  const tailleDossier = gui.addFolder("Taille de la Robe");
  tailleDossier
    .add(robe.scale, "x")
    .min(0.1)
    .max(10)
    .step(0.1)
    .name("Largeur (X)")
    .listen();
  tailleDossier
    .add(robe.scale, "y")
    .min(0.1)
    .max(10)
    .step(0.1)
    .name("Hauteur (Y)")
    .listen();
  tailleDossier
    .add(robe.scale, "z")
    .min(0.1)
    .max(10)
    .step(0.1)
    .name("Profondeur (Z)")
    .listen();

  // GUI position robe
  const positionDossier = gui.addFolder("Position de la Robe");
  positionDossier .add(robe.position, "x")
    .min(-20)
    .max(20)  
    .step(0.1)
    .name("Déplacement X")
    .listen();  
  positionDossier
    .add(robe.position, "y")
    .min(-10) 
    .max(10)
    .step(0.1)
    .name("Hauteur Y")
    .listen();
  positionDossier
    .add(robe.position, "z")
    .min(-20) 
    .max(20)
    .step(0.1)
    .name("Profondeur Z")
    .listen();


  // Attach si objet actif
  if (params.objet === "robe") transformControls.attach(robe);
});

// Objet 2 : Le Sabre
loader.load("/assets/low_poly_lightsaber.glb", (gltf) => {
  const sabre = gltf.scene;
  scene.add(sabre);
  sabreRef = sabre;
  sabre.visible = true;

  sabre.scale.set(0.03, 0.03, 0.03);
  sabre.position.set(-10, 0, 0);

  // GUI taille sabre
  const tailleDossier = gui.addFolder("Taille du Sabre");
  tailleDossier
    .add(sabre.scale, "x")
    .min(0.001)
    .max(10)
    .step(0.001)
    .name("Largeur (X)")
    .listen();
  tailleDossier
    .add(sabre.scale, "y")
    .min(0.001)
    .max(10)
    .step(0.001)
    .name("Hauteur (Y)")
    .listen();
  tailleDossier
    .add(sabre.scale, "z")
    .min(0.001)
    .max(10)
    .step(0.001)
    .name("Profondeur (Z)")
    .listen();

  // GUI position sabre
  const positionDossier = gui.addFolder("Position du Sabre");
  positionDossier
    .add(sabre.position, "x")
    .min(-20)
    .max(20)
    .step(0.1)
    .name("Déplacement X")
    .listen();
  positionDossier
    .add(sabre.position, "y")
    .min(-10)
    .max(10)
    .step(0.1)
    .name("Hauteur Y")
    .listen();
  positionDossier
    .add(sabre.position, "z")
    .min(-20)
    .max(20)
    .step(0.1)
    .name("Profondeur Z")
    .listen();

  // Attach si objet actif
  if (params.objet === "sabre") transformControls.attach(sabre);
});

// 7. LUMIÈRE
const hemiLight = new THREE.HemisphereLight(0xffffff, 0x444444, 3);
scene.add(hemiLight);

const dirLight = new THREE.DirectionalLight(0xffffff, 5);
dirLight.position.set(5, 10, 7);
scene.add(dirLight);

// GUI lumière
const lumiereDossier = gui.addFolder("Éclairage");
lumiereDossier
  .add(dirLight, "intensity")
  .min(0)
  .max(10)
  .step(0.1)
  .name("Intensité Soleil");

// 8. AIDES VISUELLES
const gridHelper = new THREE.GridHelper(60, 60);
scene.add(gridHelper);

const axesHelper = new THREE.AxesHelper(3);
scene.add(axesHelper);

// Resize
resize(camera, renderer);

// 9. BOUCLE D'ANIMATION
const animate = () => {
  controls.update();
  renderer.render(scene, camera);
  window.requestAnimationFrame(animate);
};

animate();
