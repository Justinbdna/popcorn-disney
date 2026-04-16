import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import resize from './resize.js';
import { disneyData } from './data.js';
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
//  LOGIQUE CHARGEMENT DATA MOHAMED 

const loader = new GLTFLoader();

disneyData.forEach((item) => {
  // On va chercher chaque modèle dans le dossier public/assets/models/
  loader.load(`./assets/models/${item.id}.glb`, (gltf) => {
    const model = gltf.scene;
    
    // On donne l'id au modèle pour que le clic (Raycaster) fonctionne plus tard
    model.name = item.id; 
    
    // Positionnement aléatoire pour ne pas qu'ils soient tous au même endroit (0,0,0)
    model.position.set(Math.random() * 10 - 5, 0, Math.random() * 10 - 5);
    
    scene.add(model);
    console.log(`✅ Objet chargé : ${item.nom}`);
  }, undefined, (error) => {
    console.error(`❌ Erreur sur le modèle ${item.id}:`, error);
  });
});
const axesHelper = new THREE.AxesHelper(3);
scene.add(axesHelper); // Correction : Le 's' est bien là !

// Appel du fichier resize.js (le musicien externe)
resize(camera, renderer);

// 7. LA BOUCLE D'ANIMATION (Le coeur du jeu)
const animate = () => {
  mesh.rotation.x += 0.01;
  mesh.rotation.y += 0.01;

  renderer.render(scene, camera);
  window.requestAnimationFrame(animate);
};

// On allume le moteur !
animate();
// --- LOGIQUE INTERFACE MOHAMED ---

// --- LOGIQUE INTERFACE MOHAMED ---

// On récupère les éléments
const btnPlay = document.querySelector('#btn-play');
const quizModal = document.querySelector('#quiz-modal'); // La fenêtre de quiz
const btnClose = document.querySelector('#btn-close'); // La petite croix

if (btnPlay) {
    btnPlay.addEventListener('click', () => {
        console.log("Le jeu commence !");
        
        // 1. Animation de disparition du bouton
        btnPlay.style.transition = "opacity 0.5s ease, transform 0.5s ease";
        btnPlay.style.opacity = "0";
        btnPlay.style.transform = "translateY(20px) scale(0.8)";
        
        // 2. On affiche la modale de quiz juste après
        setTimeout(() => {
            btnPlay.style.display = "none";
            if(quizModal) {
                quizModal.classList.remove('modal-hidden'); // On enlève la classe qui cache
            }
        }, 500);
    });
}

// 3. Logique pour fermer la modale avec la croix
if (btnClose) {
    btnClose.addEventListener('click', () => {
        quizModal.classList.add('modal-hidden'); // On recache la modale
    });
}
// Fonction pour récupérer les infos d'un objet cliqué
export function getObjectInfo(objectId) {
  return disneyData.find(item => item.id === objectId);
}