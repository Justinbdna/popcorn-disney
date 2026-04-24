import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import resize from "./resize.js";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import GUI from "lil-gui";
import { TransformControls } from "three/examples/jsm/controls/TransformControls.js";
import Stats from "three/examples/jsm/libs/stats.module.js";
import { injectSpeedInsights } from '@vercel/speed-insights'; 
import { inject } from "@vercel/analytics"
import { disneyData } from "./disneyData.js";

// injection d'analytics
inject()

// injection de SpeedInsights
injectSpeedInsights();
// ==========================================
// 🛠️ MODE DÉVELOPPEUR
// ==========================================
const MODE_DEV = false // Mets sur 'false' pour le rendu final !

// 1. LA SCÈNE
const scene = new THREE.Scene();

// 1. On détecte le mobile TOUT DE SUITE
const isMobile = window.innerWidth < 768; 

// 2. LA CAMÉRA (Ajustement du FOV)
const camera = new THREE.PerspectiveCamera(
  isMobile ? 90 : 75,
  window.innerWidth / window.innerHeight,
  0.1,
  1000,
);
camera.position.z = 5;
camera.position.y = 23;

// 3. LE RENDERER
const canvas = document.querySelector("#webgl");

// 2. On crée le renderer UNE SEULE FOIS (sans antialiasing sur mobile)
const renderer = new THREE.WebGLRenderer({ canvas, antialias: !isMobile }); 

// 3. On lui redonne sa taille (très important, tu l'avais perdu !)
renderer.setSize(window.innerWidth, window.innerHeight);

// 4. Si l'écran est petit, on bloque la résolution à 1 pour sauver les FPS
const pixelRatio = isMobile ? 1 : Math.min(window.devicePixelRatio, 2);
renderer.setPixelRatio(pixelRatio);

// 4. ORBIT CONTROLS
const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.target.y = 23; // <-- On lève la tête de la caméra à la même hauteur que ses yeux (1m70)
controls.update();

// --- LIMITES DE LA CAMÉRA ---
controls.maxPolarAngle = Math.PI / 2 - 0.05; // Interdit de regarder sous le plancher
controls.minDistance = 2; // Zoom maximum
controls.maxDistance = 250; // Dézoom maximum (emprisonne dans la pièce)

// --- VARIABLES DE DÉPLACEMENT (DOUBLE-CLIC) ---
let moveControls = false;
const targetTarget = new THREE.Vector3(); // Là où tu regardes
const targetPosition = new THREE.Vector3(); // Là où est ton corps
// --- LE PONT AVEC L'INTERFACE DE LÉVINE ---
window.lancerJeu3D = () => {
    console.log("🎬 Le tutoriel est terminé, le jeu commence !");
    // C'est ici que l'on déclenchera le chronomètre et l'activation des clics plus tard.
    // Pour l'instant, ça dit juste à la 3D que l'interface a fini son job.
};

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

// 🆘 SÉCURITÉ SAFARI : Si le chargement bloque plus de 10s, on force l'ouverture !
setTimeout(() => {
  const btn = document.getElementById("btn-decouvrir");
  if (btn && btn.classList.contains("cache")) {
      console.warn("⏳ Safari rame trop, on débloque le bouton de force !");
      btn.classList.remove("cache");
  }
}, 10000); // 10000 millisecondes = 10 secondes

manager.onProgress = (url, loaded, total) => {
  const percent = Math.round((loaded / total) * 100);
  const el = document.getElementById("loading-percent");
  if (el) el.textContent = `${percent}%`;
};

manager.onLoad = () => {
  console.log("✅ 3D chargée à 100% !");
  // --- 🛠️ MODE DÉVELOPPEUR (Bypass Intro) ---
  if (MODE_DEV) {
      document.getElementById('ecran-chargement').style.display = 'none';
      document.getElementById('ecran-tutoriel').style.display = 'none';
      if (window.lancerJeu3D) window.lancerJeu3D();
      return; // On arrête net la fonction, pas besoin d'afficher les boutons.
  }
  const btnDecouvrir = document.getElementById("btn-decouvrir");
  const texteChargement = document.querySelector(".texte-chargement");
  
  if (btnDecouvrir && texteChargement) {
     // 1. Le texte s'efface en douceur
      texteChargement.style.transition = "opacity 0.5s ease";
      texteChargement.style.opacity = "0";
     // 2. On cache totalement le texte après son fondu (500ms)
      setTimeout(() => texteChargement.style.display = 'none', 500);
      // 3. Le bouton apparaît avec un petit décalage élégant (400ms) 
      // pour croiser la disparition du texte
      setTimeout(() => {
          btnDecouvrir.classList.remove("cache");
      }, 400);
  }
};
//Teste pour identifier erreur 
manager.onError = (url) => {
  console.error("❌ Safari a bloqué le fichier : " + url);
  // On force l'apparition du bouton magique pour ne pas rester coincé
  const btn = document.getElementById("btn-decouvrir");
  if (btn) btn.classList.remove("cache");
};

const loader = new GLTFLoader(manager);
const objetsCliquables = []; // La liste de tes cibles

// 🟢 CHARGEMENT AUTOMATISÉ AVEC LOD DU VIDE (20m)
disneyData.forEach((item) => {
  const lod = new THREE.LOD();
  lod.name = item.id;
  lod.userData = { ...item };
  if (item.flotte) Object.assign(lod.userData, { flotteActive: true, baseY: item.y || 0, vitesse: item.vitesse || 0.8, amplitude: item.amplitude || 0.08 });
  lod.position.set(item.x || 0, item.y || 0, item.z || 0);

  // Niveau 0 : L'objet 3D normal
  loader.load(`/assets/${item.id}.glb`, (gltf) => { lod.addLevel(gltf.scene, 0); });
  // Niveau 1 : Le Vide absolu au-delà de 20 mètres
  lod.addLevel(new THREE.Object3D(), 50);

  scene.add(lod); objetsCliquables.push(lod);
});
// Objet 12 : Maison
loader.load("/assets/MaisonV1.glb", (gltf) => {
  const maison = gltf.scene; scene.add(maison);
  maison.scale.set(15, 15, 15);
  maison.name = "Maison"; maison.position.set(0, 0, 0); objetsCliquables.push(maison);
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
    const data = objetsCliquables.map((o) => {
      const y = o.userData.flotte ? o.userData.baseY : o.position.y;
      return `${o.name} | Pos: ${o.position.x.toFixed(2)}, ${y.toFixed(2)}, ${o.position.z.toFixed(2)} | Scale: ${o.scale.x.toFixed(2)}, ${o.scale.y.toFixed(2)}, ${o.scale.z.toFixed(2)}`;
    }).join("\n");
    navigator.clipboard.writeText(data);
    alert("Coordonnées ET Tailles copiées ! 📋");
  },
};

gui.add(outils, "exporter").name("💾 Exporter Coordonnées");

// --- PERFORMANCES (FPS & POLYGONES) ---
const stats = new Stats();
document.body.appendChild(stats.dom); // Ajoute le compteur FPS en haut à gauche

const perfData = { polygones: 0, drawCalls: 0, geometries: 0 };
const perfFolder = gui.addFolder("Moniteur d'Activité");
perfFolder.add(perfData, "polygones").name("Triangles").listen();
perfFolder.add(perfData, "drawCalls").name("Draw Calls").listen();
perfFolder.add(perfData, "geometries").name("Géométries (RAM)").listen();

// --- 🔒 VERROU BLINDÉ : LIEN AVEC LE MASTER SWITCH ---
// Placé ici, TOUT À LA FIN, le menu ne peut plus se réveiller.
if (!MODE_DEV) {
    gui.hide(); // Méthode officielle absolue pour cacher le menu noir
    stats.dom.style.display = "none"; // Cache le compteur vert FPS
}

// Resize
resize(camera, renderer);

// --- LE LASER (RAYCASTER V3 - Le Clic Intelligent) ---
const raycaster = new THREE.Raycaster();
const souris = new THREE.Vector2();
window.addEventListener("pointermove", (event) => {
  souris.x = (event.clientX / window.innerWidth) * 2 - 1;
  souris.y = -(event.clientY / window.innerHeight) * 2 + 1;
  raycaster.setFromCamera(souris, camera);
});


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
      cible = cible.parent;
    }
  // --- SÉCURITÉ MAISON (CLIC SIMPLE) ---
    if (cible.name === "Maison") {
      return; // On bloque l'apparition des flèches sur la maison
    }
    // --- LA MAGIE OPÈRE ICI ---

    // A. On accroche les flèches 3D à l'objet cliqué
    transformControls.attach(cible);

   // B. On met à jour le menu dynamiquement
    dossierSelection.destroy();
    dossierSelection = gui.addFolder("Objet : " + cible.name);

    // --- AUDIT DES POLYGONES ---
    let polyObj = 0;
    cible.traverse((c) => { if (c.isMesh) polyObj += c.geometry.index ? c.geometry.index.count / 3 : c.geometry.attributes.position.count / 3; });
    dossierSelection.add({ p: Math.round(polyObj) }, 'p').name('⚖️ Poids (Triangles)').disable();

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
// --- LE MOTEUR DE DÉPLACEMENT (DOUBLE-CLIC) ---
window.addEventListener("dblclick", (event) => {
  if (event.target !== canvas) return;
  souris.x = (event.clientX / window.innerWidth) * 2 - 1;
  souris.y = -(event.clientY / window.innerHeight) * 2 + 1;
  raycaster.setFromCamera(souris, camera);
  const intersections = raycaster.intersectObjects(objetsCliquables, true);

  if (intersections.length > 0) {
    let cible = intersections[0].object;
    while (cible.parent && cible.parent.type !== "Scene") cible = cible.parent;

    if (cible.name === "Maison" && intersections[0].point.y < 2) {
      const pointClique = intersections[0].point;
      targetTarget.copy(pointClique); // 1. La tête regarde le point
      const offset = new THREE.Vector3().subVectors(camera.position, controls.target);
      targetPosition.copy(pointClique).add(offset); // 2. Le corps se déplace

      moveControls = true; transformControls.detach(); 
      dossierSelection.destroy(); dossierSelection = gui.addFolder("🚶‍♂️ Déplacement en cours...");
    }
  }
});
// 7. LA BOUCLE D'ANIMATION (Le coeur du jeu)
const clock = new THREE.Clock();


const animate = () => {
  controls.update();
  // --- MOTEUR DE DÉPLACEMENT (DOUBLE-CLIC) ---
  if (moveControls) {
     controls.target.lerp(targetTarget, 0.05); // Tourne la tête
     camera.position.lerp(targetPosition, 0.05); // DÉPLACE LE CORPS
     if (controls.target.distanceTo(targetTarget) < 0.1) {
         moveControls = false; dossierSelection.destroy();
         dossierSelection = gui.addFolder("Aucun objet sélectionné");
     }
  }

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
  // --- MISE À JOUR DU LOD (Vérifie la distance du joueur) ---
  scene.traverse((objet) => {
    if (objet instanceof THREE.LOD) objet.update(camera);
  });
  
  renderer.render(scene, camera);
  stats.update(); 
  perfData.polygones = renderer.info.render.triangles; 
  perfData.drawCalls = renderer.info.render.calls; 
  perfData.geometries = renderer.info.memory.geometries; 
  window.requestAnimationFrame(animate);
};
animate();
