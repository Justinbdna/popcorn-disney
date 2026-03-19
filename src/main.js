import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import resize from './resize.js';

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

// 4. UN OBJET DE TEST (Le cube)
const geometry = new THREE.BoxGeometry(1, 1, 1);
const material = new THREE.MeshStandardMaterial({ color: 0xff0000 });
const mesh = new THREE.Mesh(geometry, material);
scene.add(mesh); // Ça marche maintenant car 'scene' s'écrit pareil partout !

// 5. LA LUMIÈRE
const light = new THREE.AmbientLight(0xffffff, 1);
scene.add(light);
const pointLight = new THREE.PointLight(0xffffff, 15);
pointLight.position.set(2, 3, 4);
scene.add(pointLight);

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
  mesh.rotation.x += 0.01;
  mesh.rotation.y += 0.01;

  controls.update();

  renderer.render(scene, camera);
  window.requestAnimationFrame(animate);
};

// On allume le moteur !
animate();