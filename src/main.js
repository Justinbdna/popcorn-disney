import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import resize from "./resize.js";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import GUI from "lil-gui";
import { TransformControls } from "three/examples/jsm/controls/TransformControls.js";

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

transformControls.addEventListener("dragging-changed", (event) => {
  if (controls) controls.enabled = !event.value;
  const cible = transformControls.object;
  if (cible && cible.userData.flotte) {
    cible.userData.flotteActive = !event.value;
    if (!event.value) {
      cible.userData.baseY = cible.position.y;
    }
  }
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

const manager = new THREE.LoadingManager();

manager.onProgress = (url, loaded, total) => {
  const percent = Math.round((loaded / total) * 100);
  const el = document.getElementById("loading-percent");
  if (el) el.textContent = `${percent}%`;
};

manager.onLoad = () => {
  const loaderScreen = document.getElementById("loader");
  if (loaderScreen) loaderScreen.classList.add("fade-out");
};

const loader = new GLTFLoader(manager);
const objetsCliquables = []; // La liste de tes cibles

// =============================================
// 🔜 FUSION AVEC MOHAMED — À ACTIVER PLUS TARD
// Remplacer les 6 loaders manuels par cette boucle
// quand disneyData sera livré
// =============================================

// disneyData.forEach((item) => {
//   loader.load(`/assets/${item.id}.glb`, (gltf) => {
//     const objet = gltf.scene;
//     objet.name = item.id;
//     objet.userData.nomVisible = item.nom;
//     objet.userData.description = item.description;
//     objet.userData.univers = item.univers;
//     if (item.flotte) {
//       objet.userData.flotte = true;
//       objet.userData.baseY = item.y || 0;
//       objet.userData.vitesse = item.vitesse || 0.8;
//       objet.userData.amplitude = item.amplitude || 0.08;
//       objet.position.set(item.x || 0, item.y || 0, item.z || 0);
//     } else {
//       objet.position.set(item.x || 0, item.y || 0, item.z || 0);
//     }
//     scene.add(objet);
//     objetsCliquables.push(objet);
//   });
// });

// Objet 1 : La Robe
loader.load("/assets/princess_snow_white_dress.glb", (gltf) => {
  const robe = gltf.scene;
  scene.add(robe);
  robe.visible = true; // Correction : on affiche la robe
  robe.name = "Robe";
  robe.position.set(3, 0, 0); // ← AJOUT (évite la superposition avec CellPhone)
  objetsCliquables.push(robe);
});

// Objet 2 : Le Sabre
loader.load("/assets/low_poly_lightsaber.glb", (gltf) => {
  const sabre = gltf.scene;
  scene.add(sabre);
  sabre.visible = true;
  sabre.name = "Sabre";
  objetsCliquables.push(sabre);

  sabre.scale.set(0.03, 0.03, 0.03);
  sabre.position.set(-10, 0, 0);
  sabre.userData.flotte = true;
  sabre.userData.baseY = sabre.position.y;
  sabre.userData.vitesse = 1.5;
  sabre.userData.amplitude = 0.05;
});

// Objet 3 : Lampe d'Aladdin
loader.load("/assets/Aladdin_lamp.glb", (gltf) => {
  const lampe = gltf.scene;
  lampe.name = "Lampe";
  scene.add(lampe);
  objetsCliquables.push(lampe);
  lampe.position.set(5, 0, 0); // On la décale à droite
  lampe.userData.flotte = true;
  lampe.userData.baseY = lampe.position.y;
  lampe.userData.vitesse = 0.5;
  lampe.userData.amplitude = 0.15;
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
  drapeau.userData.flotte = true;
  drapeau.userData.baseY = drapeau.position.y;
  drapeau.userData.vitesse = 0.8;
  drapeau.userData.amplitude = 0.08;
});
// Objet 6 : Kim Possible Telephone
loader.load("/assets/Kim_Possible_CellPhone.glb", (gltf) => {
  const CellPhone = gltf.scene;
  CellPhone.name = "CellPhone";
  scene.add(CellPhone);
  objetsCliquables.push(CellPhone);
  CellPhone.position.set(0, 0, 0);
  CellPhone.userData.flotte = true;
  CellPhone.userData.baseY = CellPhone.position.y;
  CellPhone.userData.vitesse = 1.0;
  CellPhone.userData.amplitude = 0.1;
});

// 5. LA LUMIÈRE
const hemiLight = new THREE.HemisphereLight(0xffffff, 0x444444, 3);
scene.add(hemiLight);
const dirLight = new THREE.DirectionalLight(0xffffff, 5);
dirLight.position.set(5, 10, 7);
scene.add(dirLight);

// 1. Éclairage (Fixe)
const lumiereDossier = gui.addFolder("Éclairage");
lumiereDossier
  .add(dirLight, "intensity")
  .min(0)
  .max(10)
  .step(0.1)
  .name("Soleil");

// 2. Dossier dynamique (Vide au départ)
let dossierSelection = gui.addFolder("Aucun objet sélectionné");

const outils = {
  exporter: () => {
    const data = objetsCliquables
      .map((o) => {
        const y = o.userData.flotte ? o.userData.baseY : o.position.y;
        return `${o.name} Pos: ${o.position.x.toFixed(2)}, ${y.toFixed(2)}, ${o.position.z.toFixed(2)}`;
      })
      .join("\n");
    navigator.clipboard.writeText(data);
    alert("Coordonnées copiées ! 📋 Tu peux faire Cmd+V dans tes notes.");
  },
};

gui.add(outils, "exporter").name("💾 Exporter Coordonnées");

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

window.addEventListener("click", (event) => {
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
    while (cible.parent && cible.parent.type !== "Scene") {
      if (cible.name) break;
      cible = cible.parent;
    }

    // --- LA MAGIE OPÈRE ICI ---

    // A. On accroche les flèches 3D à l'objet cliqué
    transformControls.attach(cible);

    // B. On met à jour le menu dynamiquement
    dossierSelection.destroy(); // On efface l'ancien menu
    dossierSelection = gui.addFolder("Taille : " + cible.name);

    // --- LES BOUTONS D'OUTILS ---
    const actionsOutils = {
      deplacer: () => transformControls.setMode("translate"),
      tourner: () => transformControls.setMode("rotate"),
      agrandir: () => transformControls.setMode("scale"),
    };

    // --- SLIDERS DE POSITION ---
    dossierSelection.add(cible.position, "x").name("Pos X").listen();
    if (cible.userData.flotte) {
      dossierSelection
        .add(cible.userData, "baseY")
        .name("Pos Y (Base)")
        .listen();
    } else {
      dossierSelection.add(cible.position, "y").name("Pos Y").listen();
    }
    dossierSelection.add(cible.position, "z").name("Pos Z").listen();

    // --- SLIDERS DE ROTATION ---
    dossierSelection.add(cible.rotation, "x").name("Rot X").listen();
    dossierSelection.add(cible.rotation, "y").name("Rot Y").listen();
    dossierSelection.add(cible.rotation, "z").name("Rot Z").listen();

    // --- CONFIG PAR OBJET ---
    const configScale = {
      Sabre: { min: 0.001, max: 1, step: 0.001 },
      Lampe: { min: 0.001, max: 5, step: 0.01 },
      Robe: { min: 0.1, max: 10, step: 0.1 },
      Chapeau: { min: 0.1, max: 10, step: 0.1 },
      Drapeau: { min: 0.1, max: 10, step: 0.1 },
      CellPhone: { min: 0.001, max: 5, step: 0.01 },
    };

    const cfg = configScale[cible.name] || { min: 0.001, max: 20, step: 0.01 };

    // --- SLIDERS DE TAILLE ---
    dossierSelection
      .add(cible.scale, "x")
      .min(cfg.min)
      .max(cfg.max)
      .step(cfg.step)
      .name("Largeur")
      .listen();
    dossierSelection
      .add(cible.scale, "y")
      .min(cfg.min)
      .max(cfg.max)
      .step(cfg.step)
      .name("Profondeur")
      .listen();
    dossierSelection
      .add(cible.scale, "z")
      .min(cfg.min)
      .max(cfg.max)
      .step(cfg.step)
      .name("Hauteur")
      .listen();

    // --- AJOUT DES BOUTONS AU MENU ---
    dossierSelection.add(actionsOutils, "deplacer").name("Activer Déplacement");
    dossierSelection.add(actionsOutils, "tourner").name("Activer Rotation");
    dossierSelection.add(actionsOutils, "agrandir").name("Activer Taille");

    dossierSelection.open();
  } else {
    // Si on clique dans le vide
    transformControls.detach(); // On cache les flèches
    dossierSelection.destroy(); // On vide le menu
    dossierSelection = gui.addFolder("Aucun objet sélectionné");
  }
});
// 7. LA BOUCLE D'ANIMATION (Le coeur du jeu)
const clock = new THREE.Clock();

const animate = () => {
  controls.update();

  const elapsedTime = clock.getElapsedTime();

  objetsCliquables.forEach((objet, i) => {
    if (objet.userData.flotte && objet.userData.flotteActive !== false) {
      const vitesse = objet.userData.vitesse || 0.8;
      const amplitude = objet.userData.amplitude || 0.08;
      const offsetTiming = i * 1.2;
      objet.position.y =
        objet.userData.baseY +
        Math.sin(elapsedTime * vitesse + offsetTiming) * amplitude;
    }
  });

  renderer.render(scene, camera);
  window.requestAnimationFrame(animate);
};

animate();
