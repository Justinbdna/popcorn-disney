import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import resize from "./resize.js";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import GUI from "lil-gui";
import { TransformControls } from 'three/examples/jsm/controls/TransformControls.js';

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

// 6. CHARGEMENT DES OBJETS
const loader = new GLTFLoader();
const objetsCliquables = []; // La liste de tes cibles

// Objet 1 : La Robe
loader.load("/assets/princess_snow_white_dress.glb", (gltf) => {
  const robe = gltf.scene;
  scene.add(robe);
  robe.visible = true; // Correction : on affiche la robe
  robe.name = "Robe"; 
  objetsCliquables.push(robe);

});

// Objet 2 : Le Sabre
loader.load("/assets/low_poly_lightsaber.glb", (gltf) => {
  const sabre = gltf.scene;
  scene.add(sabre);
  sabreRef = sabre;
  sabre.visible = true;
  sabre.name = "Sabre"; 
  objetsCliquables.push(sabre);

  sabre.scale.set(0.03, 0.03, 0.03);
  sabre.position.set(-10, 0, 0);

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
const hemiLight = new THREE.HemisphereLight(0xffffff, 0x444444, 3);
scene.add(hemiLight);
const dirLight = new THREE.DirectionalLight(0xffffff, 5);
dirLight.position.set(5, 10, 7);
scene.add(dirLight);

// 1. Éclairage (Fixe)
const lumiereDossier = gui.addFolder('Éclairage');
lumiereDossier.add(dirLight, 'intensity').min(0).max(10).step(0.1).name('Soleil');

// 2. Dossier dynamique (Vide au départ)
let dossierSelection = gui.addFolder('Aucun objet sélectionné');

// 8. AIDES VISUELLES
const gridHelper = new THREE.GridHelper(60, 60);
scene.add(gridHelper);

const axesHelper = new THREE.AxesHelper(3);
scene.add(axesHelper);

// Resize
resize(camera, renderer);

// --- LE LASER (RAYCASTER V3 - Le Clic Intelligent) ---
const raycaster = new THREE.Raycaster();
const souris = new THREE.Vector2();

window.addEventListener('click', (event) => {
  // Sécurité : On ignore le clic si on clique sur le menu noir GUI pour ne pas tout désélectionner
  if (event.target !== canvas) return;

  // 1. Convertir la position de la souris
  souris.x = (event.clientX / window.innerWidth) * 2 - 1;
  souris.y = -(event.clientY / window.innerHeight) * 2 + 1;
  
  // 2. Tirer le laser
  raycaster.setFromCamera(souris, camera);

  // 3. Vérifier les collisions avec les objets de ta liste
  const intersections = raycaster.intersectObjects(objetsCliquables, true);

  if (intersections.length > 0) {
    // On a touché quelque chose ! On remonte pour trouver l'objet principal
    let cible = intersections[0].object;
    while (cible.parent && cible.parent.type !== 'Scene') {
      if (cible.name) break; 
      cible = cible.parent;
    }

    // --- LA MAGIE OPÈRE ICI ---
    
    // A. On accroche les flèches 3D à l'objet cliqué
    transformControls.attach(cible);

    // B. On met à jour le menu dynamiquement
    dossierSelection.destroy(); // On efface l'ancien menu
    dossierSelection = gui.addFolder('Taille : ' + cible.name); 
    
    // On relie les curseurs à l'échelle de l'objet cliqué
 dossierSelection.add(cible.scale, 'x').min(0.001).max(20).step(0.01).name('Largeur').listen();
dossierSelection.add(cible.scale, 'y').min(0.001).max(20).step(0.01).name('Hauteur').listen();
dossierSelection.add(cible.scale, 'z').min(0.001).max(20).step(0.01).name('Profondeur').listen();
    dossierSelection.open();

  } else {
    // Si on clique dans le vide
    transformControls.detach(); // On cache les flèches
    dossierSelection.destroy(); // On vide le menu
    dossierSelection = gui.addFolder('Aucun objet sélectionné');
  }
});
// 7. LA BOUCLE D'ANIMATION (Le coeur du jeu)
const animate = () => {
  controls.update();
  renderer.render(scene, camera);
  window.requestAnimationFrame(animate);
};

animate();
