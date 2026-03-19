import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import resize from './resize.js';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader';

// 1. LA SCÈNE (Le monde 3D)
// Correction : Tout en minuscules, sans accent
const scene = new THREE.Scene();

// 2. LA CAMÉRA (Tes yeux)
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
camera.position.z = 5; 

// 3. LE RENDERER (Le moteur qui dessine)
const canvas = document.querySelector('#webgl');
const renderer = new THREE.WebGLRenderer({ canvas: canvas, antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;

// 4. LES OBJETS DE TEST (La Robe)
// Dès que tu colles cette ligne, ton import tout en haut ne sera plus grisé !
const loader = new GLTFLoader(); 

loader.load(
  '/assets/princess_snow_white_dress.glb', // Assure-toi que c'est bien le nom de ton fichier
  (gltf) => {
    scene.add(gltf.scene);
  }
);

// 5. LA LUMIÈRE
const hemiLight = new THREE.HemisphereLight(0xffffff, 0x444444, 2); // Ciel blanc, sol gris foncé
scene.add(hemiLight);

const dirLight = new THREE.DirectionalLight(0xffffff, 3); // Soleil puissant
dirLight.position.set(5, 10, 7);
scene.add(dirLight);

// 6. LES AIDES VISUELLES (Le chantier)
// On ajoute la grille au sol et les flèches directionnelles
const gridHelper = new THREE.GridHelper(20, 20); 
scene.add(gridHelper);

const axesHelper = new THREE.AxesHelper(3);
scene.add(axesHelper); // Correction : Le 's' est bien là !

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