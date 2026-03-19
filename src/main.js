import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import resize from './resize.js';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader';
import { scales } from 'chart.js';
import { objectDirection, objectScale } from 'three/tsl';

// 1. LA SCÈNE (Le monde 3D)
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

// 4. LES OBJETS (La Robe)
const loader = new GLTFLoader(); 

loader.load(
  '/assets/princess_snow_white_dress.glb', 
  (gltf) => {
    scene.add(gltf.scene); 
    object.visibility = false
  }
);
loader.load(
  '/assets/low_poly_lightsaber.glb', 
  (gltf) => {
    scene.add(gltf.scene); 
    object.visibility = true
    object.scales = 0,1; 0,1; 0,1
  }
);


// 5. LA LUMIÈRE
const hemiLight = new THREE.HemisphereLight(0xffffff, 0x444444, 3); // Ciel blanc, sol gris foncé
scene.add(hemiLight);

const dirLight = new THREE.DirectionalLight(0xffffff,5); // Soleil puissant
dirLight.position.set(5, 10, 7);
scene.add(dirLight);

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