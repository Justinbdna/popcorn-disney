import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import resize from "./resize.js";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader";
import GUI from "lil-gui";


// 1. LA SCÈNE (Le monde 3D)
const scene = new THREE.Scene();

// 2. LA CAMÉRA (Tes yeux)
const camera = new THREE.PerspectiveCamera(
  75,
  window.innerWidth / window.innerHeight,
  0.1,
  1000,
);
camera.position.z = 5;

// 3. LE RENDERER (Le moteur qui dessine)
const canvas = document.querySelector("#webgl");
const renderer = new THREE.WebGLRenderer({ canvas: canvas, antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;

// --- INITIALISATION DU MENU (GUI) ---
const gui = new GUI();

// 4. LES OBJETS
const loader = new GLTFLoader();
const objetsCliquables = []; // La liste de tes cibles

// Objet 1 : La Robe
loader.load("/assets/princess_snow_white_dress.glb", (gltf) => {
  const robe = gltf.scene;
  scene.add(robe);
  robe.visible = true; // Correction : on affiche la robe
  robe.name = "Robe"; 
  objetsCliquables.push(robe);

  // On crée le dossier de taille dans le menu et on le relie à la robe
  const tailleDossier = gui.addFolder("Taille de la Robe");
  tailleDossier
    .add(robe.scale, "x")
    .min(0.1)
    .max(10)
    .step(0.1)
    .name("Largeur (X)");
  tailleDossier
    .add(robe.scale, "y")
    .min(0.1)
    .max(10)
    .step(0.1)
    .name("Hauteur (Y)");
  tailleDossier
    .add(robe.scale, "z")
    .min(0.1)
    .max(10)
    .step(0.1)
    .name("Profondeur (Z)");
});

// Objet 2 : Le Sabre
loader.load("/assets/low_poly_lightsaber.glb", (gltf) => {
  const sabre = gltf.scene; // Correction : on utilise la bonne variable
  scene.add(sabre);
  sabre.visible = true;
  sabre.name = "Sabre"; 
  objetsCliquables.push(sabre);

  // On fixe l'échelle exacte du sabre
  sabre.scale.set(0.03, 0.03, 0.03);

  // On fixe la position exacte du sabre
  sabre.position.set(-10, 0, 0);

  const tailleDossier = gui.addFolder("Taille du Sabre");
  tailleDossier
    .add(sabre.scale, "x")
    .min(0.001)
    .max(10)
    .step(0.001)
    .name("Largeur (X)");
  tailleDossier
    .add(sabre.scale, "y")
    .min(0.001)
    .max(10)
    .step(0.001)
    .name("Hauteur (Y)");
  tailleDossier
    .add(sabre.scale, "z")
    .min(0.001)
    .max(10)
    .step(0.001)
    .name("Profondeur (Z)");

  const positionDossier = gui.addFolder("Position du Sabre");

  positionDossier
    .add(sabre.position, "x")
    .min(-20)
    .max(20)
    .step(0.1)
    .name("Déplacement X");

  positionDossier
    .add(sabre.position, "y")
    .min(-10)
    .max(10)
    .step(0.1)
    .name("Hauteur Y");

  positionDossier
    .add(sabre.position, "z")
    .min(-20)
    .max(20)
    .step(0.1)
    .name("Profondeur Z");
});

// Objet 3 : Lampe d'Aladdin
loader.load("/assets/Aladdin_lamp.glb", (gltf) => {
  const lampe = gltf.scene;
  lampe.name = "Lampe";
  scene.add(lampe);
  objetsCliquables.push(lampe);
  lampe.position.set(5, 0, 0); // On la décale à droite
});

// Objet 4 : Chapeau de Cowboy
loader.load("/assets/lowpoly_cowboy_hat.glb", (gltf) => {
  const chapeau = gltf.scene;
  chapeau.name = "Chapeau";
  scene.add(chapeau);
  objetsCliquables.push(chapeau);
  chapeau.position.set(-5, 0, 0); // On le décale à gauche
});

// Objet 5 : Drapeau Cars
loader.load("/assets/drapeau_cars.glb", (gltf) => {
  const drapeau = gltf.scene;
  drapeau.name = "Drapeau";
  scene.add(drapeau);
  objetsCliquables.push(drapeau);
  drapeau.position.set(0, 0, -5); // On le décale au fond
});

// 5. LA LUMIÈRE
const hemiLight = new THREE.HemisphereLight(0xffffff, 0x444444, 3); // Ciel blanc, sol gris foncé
scene.add(hemiLight);

const dirLight = new THREE.DirectionalLight(0xffffff, 5); // Soleil puissant
dirLight.position.set(5, 10, 7);
scene.add(dirLight);
// --- CONTRÔLE DE LA LUMIÈRE (GUI) ---
const lumiereDossier = gui.addFolder("Éclairage");
lumiereDossier
  .add(dirLight, "intensity")
  .min(0)
  .max(10)
  .step(0.1)
  .name("Intensité Soleil");

// 6. LES AIDES VISUELLES (Le chantier)
// On ajoute la grille au sol et les flèches directionnelles
const gridHelper = new THREE.GridHelper(60, 60);
scene.add(gridHelper);

const axesHelper = new THREE.AxesHelper(3);
scene.add(axesHelper);

// Appel du fichier resize.js (le musicien externe)
resize(camera, renderer);

// 7. LA BOUCLE D'ANIMATION (Le coeur du jeu)
const animate = () => {
  controls.update();

  renderer.render(scene, camera);
  window.requestAnimationFrame(animate);
};

// On allume le moteur !
animate();
