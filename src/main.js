import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import resize from "./resize.js";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import GUI from "lil-gui";
import { TransformControls } from "three/examples/jsm/controls/TransformControls.js";
import Stats from "three/examples/jsm/libs/stats.module.js";
import { injectSpeedInsights } from "@vercel/speed-insights";
import { inject } from "@vercel/analytics";
import { disneyData } from "./disneyData.js";
import { DRACOLoader } from "three/examples/jsm/loaders/DRACOLoader.js";
import nipplejs from "nipplejs";

// =========================================================================
// 🛠️ 1. CONFIGURATION GLOBALE ET DÉVELOPPEMENT
// =========================================================================
const MODE_DEV = true; // Mets sur 'false' pour le rendu final !
window.easterEggDebloque = false;

// Détection mobile immédiate
const isMobile = window.innerWidth < 768;

// =========================================================================
// 🌍 2. INITIALISATION DE LA SCÈNE 3D (Scène, Caméra, Renderer)
// =========================================================================
const scene = new THREE.Scene();
const objetsCliquables = [];
const lodsScene = []; // Tableau global pour les LODs

const camera = new THREE.PerspectiveCamera(isMobile ? 90 : 75, window.innerWidth / window.innerHeight, 0.1, 1000);
camera.position.set(0, 23, 5);

const canvas = document.querySelector("#webgl");
const renderer = new THREE.WebGLRenderer({ canvas, antialias: !isMobile });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(isMobile ? 1 : Math.min(window.devicePixelRatio, 2));
renderer.shadowMap.enabled = false; // Désactivé pour sauver la VRAM
renderer.outputColorSpace = THREE.SRGBColorSpace;

if (isMobile) {
  THREE.Cache.clear(); // 🚫 PURGE DU CACHE SUR IOS POUR ÉVITER LE CRASH RAM
}

// =========================================================================
// 🎥 3. CONTRÔLES DE LA CAMÉRA (OrbitControls)
// =========================================================================
const controls = new OrbitControls(camera, renderer.domElement);
controls.listenToKeyEvents(window); // Le canevas écoute enfin la fenêtre entière
controls.enableDamping = true;
controls.target.y = 23;
controls.maxPolarAngle = Math.PI / 2 - 0.05;
controls.minDistance = 2;
controls.maxDistance = 250;
controls.update();

// =========================================================================
// 🕹️ 4. VARIABLES D'ÉTAT (Mouvement, Manette, Touches)
// =========================================================================
const padMobile = { x: 0, y: 0, actif: false };
let objetActif = null;
let renduAutorise = false; // Bloque le rendu GPU pendant le chargement

const touches = { z: false, q: false, s: false, d: false, ArrowUp: false, ArrowLeft: false, ArrowDown: false, ArrowRight: false };

window.addEventListener("keyup", (e) => {
  if (touches.hasOwnProperty(e.key)) touches[e.key] = false;
});

window.addEventListener("keydown", (e) => {
  if (touches.hasOwnProperty(e.key)) touches[e.key] = true;
  if (e.key === "g") transformControls?.setMode("translate");
  if (e.key === "r") transformControls?.setMode("rotate");
  if (e.key === "Escape") {
    if (transformControls) transformControls.detach();
    objetActif = null;
    if (window.bloquerControles3D) window.bloquerControles3D(false);
    document.getElementById('modal-quiz')?.classList.remove('is-active');
    dossierSelection?.destroy();
  }
});

// =========================================================================
// 📱 5. INITIALISATION DU JOYSTICK MOBILE (Nipple.js)
// =========================================================================
window.lancerJeu3D = () => {
  console.log("🎬 Jeu lancé !");
  if (isMobile || 'ontouchstart' in window) {
    const zoneJoystick = document.getElementById("zone-joystick");
    if (zoneJoystick) {
      zoneJoystick.style.touchAction = "none"; // Bloque le scroll Safari
      zoneJoystick.addEventListener("touchstart", (e) => e.stopPropagation(), { passive: false });
      
      const joystick = nipplejs.create({ zone: zoneJoystick, mode: "dynamic", color: "white", restOpacity: 0.75 });

      joystick.on("move", (evt, data) => {
        const v = data?.vector || evt.data?.vector;
        if (!v) return;
        padMobile.x = v.x;
        padMobile.y = v.y;
        padMobile.actif = true;
      });

      joystick.on("start", () => { if (controls) controls.enabled = false; });
      joystick.on("end", () => {
        padMobile.x = 0; padMobile.y = 0; padMobile.actif = false;
        if (controls) controls.enabled = true;
      });
    }
  }
};

window.bloquerControles3D = (etat) => { if (controls) controls.enabled = !etat; };

// =========================================================================
// 🛠️ 6. OUTILS DÉVELOPPEUR (TransformControls & GUI)
// =========================================================================
const transformControls = !isMobile ? new TransformControls(camera, renderer.domElement) : null;
if (transformControls) scene.add(transformControls.getHelper());

transformControls?.addEventListener("dragging-changed", (event) => {
  if (controls) controls.enabled = !event.value;
  const cible = transformControls.object;
  if (cible && cible.userData.flotte) {
    cible.userData.flotteActive = !event.value;
    if (!event.value) cible.userData.baseY = cible.position.y;
  }
});

const gui = !isMobile ? new GUI() : null;
const debugConfig = { afficherHitboxes: false };
const dossierDebug = gui?.addFolder("🛠️ Mode Debug");
dossierDebug?.add(debugConfig, "afficherHitboxes").name("Voir Collisions").onChange((val) => {
  objetsCliquables.forEach((h) => { if (h.material) { h.material.opacity = val ? 0.4 : 0; h.material.wireframe = val; } });
});

// =========================================================================
// 📦 7. GESTION DU CHARGEMENT DES ASSETS 3D (Maison & Objets Disney)
// =========================================================================
const manager = new THREE.LoadingManager();
const mursCollision = [];

// Sécurité anti-freeze
setTimeout(() => {
  const btn = document.getElementById("btn-decouvrir");
  if (btn && btn.classList.contains("cache")) btn.classList.remove("cache");
}, 10000);

manager.onProgress = (url, loaded, total) => {
  const el = document.getElementById("loading-percent");
  if (el) el.textContent = `${Math.round((loaded / total) * 100)}%`;
};

manager.onLoad = () => console.log("✅ Fichiers 3D téléchargés en mémoire locale.");
manager.onError = (url) => { if (!isMobile) alert(`Le fichier ${url} refuse de charger.`); };

const loader = new GLTFLoader(manager);
const dracoLoader = new DRACOLoader();
dracoLoader.setDecoderPath("https://www.gstatic.com/draco/versioned/decoders/1.5.6/");
dracoLoader.setWorkerLimit(1);
loader.setDRACOLoader(dracoLoader);

const chargerTout = async () => {
  manager.itemStart("chargement_sequentiel");

  // --- CHARGEMENT DE LA MAISON ---
  try {
    const gltfMaison = await loader.loadAsync("/assets/MaisonV2.glb");
    const maison = gltfMaison.scene;
    maison.scale.set(15, 15, 15);
    maison.name = "Maison";
    maison.traverse((obj) => {
      if (obj.isMesh && obj.name.includes("MurFictif")) {
        obj.visible = false;
        mursCollision.push(obj);
      }
    });
    scene.add(maison);
    
    // Hitbox globale du sol
    const solHitbox = new THREE.Mesh(new THREE.BoxGeometry(300, 1, 300), new THREE.MeshBasicMaterial({ color: 0x0000ff, transparent: true, opacity: 0, depthWrite: false }));
    solHitbox.name = "Maison"; solHitbox.position.y = -0.5;
    scene.add(solHitbox); objetsCliquables.push(solHitbox);
  } catch (e) { console.error("❌ Erreur Maison", e); }

  await new Promise(resolve => setTimeout(resolve, 500)); // Pause Garbage Collector

  // --- CHARGEMENT DES OBJETS DISNEY ---
  for (const item of disneyData) {
    const lod = new THREE.LOD();
    lod.name = item.id;
    lod.userData = { ...item };
    if (item.flotte) Object.assign(lod.userData, { flotteActive: true, baseY: item.y || 0, vitesse: item.vitesse || 0.8, amplitude: item.amplitude || 0.08 });
    lod.position.set(item.x || 0, item.y || 0, item.z || 0);
    lod.rotation.set(item.rotX || 0, item.rotY || 0, item.rotZ || 0);
    if (item.scale) lod.scale.setScalar(item.scale);

    try {
      const gltf = await loader.loadAsync(`/assets/${item.id}.glb`);
      const boite = new THREE.Box3().setFromObject(gltf.scene);
      const taille = new THREE.Vector3();
      boite.getSize(taille);
      
      const hitbox = new THREE.Mesh(new THREE.BoxGeometry(Math.max(taille.x * 1.5, 2.5), Math.max(taille.y * 1.5, 2.5), Math.max(taille.z * 1.5, 2.5)), new THREE.MeshBasicMaterial({ transparent: true, opacity: 0, depthWrite: false }));
      const center = new THREE.Vector3();
      boite.getCenter(center);
      hitbox.position.copy(center);
      hitbox.name = lod.name; hitbox.userData = lod.userData;
      
      lod.addLevel(gltf.scene, 0);
      lod.add(hitbox); objetsCliquables.push(hitbox);
    lod.addLevel(new THREE.Object3D(), 200); // LOD de secours
      scene.add(lod);
      lodsScene.push(lod);
    } catch (error) { console.error("❌ Erreur sur :", item.id, error); }
    await new Promise(resolve => setTimeout(resolve, 150)); // 🫁 Respiration VRAM Safari
  }

  dracoLoader.dispose();
  manager.itemEnd("chargement_sequentiel");
// 💾 CHARGEMENT SAUVEGARDE
  const saves = JSON.parse(localStorage.getItem("popcorn_save")) || [];
  // --- GESTION DE L'INTERFACE À LA FIN ABSOLUE DU CHARGEMENT ---
  console.log("✅ Tous les modèles sont chargés. Compilation GPU...");
  renderer.compile(scene, camera); // Compilation silencieuse
  
  if (MODE_DEV) {
    if (isMobile) { const s = document.createElement('script'); s.src="//cdn.jsdelivr.net/npm/eruda"; document.head.appendChild(s); s.onload=()=>eruda.init(); }
    const ecranChargement = document.getElementById("ecran-chargement");
    const tuto = document.getElementById("ecran-tutoriel");
    if (ecranChargement) ecranChargement.remove();
    if (tuto) tuto.remove();
    if (window.lancerJeu3D) window.lancerJeu3D();
  } else {
    const btnDecouvrir = document.getElementById("btn-decouvrir");
    const texteChargement = document.querySelector(".texte-chargement");
    if (btnDecouvrir && texteChargement) {
      texteChargement.style.transition = "opacity 0.5s ease";
      texteChargement.style.opacity = "0";
      setTimeout(() => (texteChargement.style.display = "none"), 500);
      setTimeout(() => btnDecouvrir.classList.remove("cache"), 400);
    }
  }
  renduAutorise = true; // Autorise la boucle animate à dessiner
};
chargerTout();

// =========================================================================
// 💡 8. LUMIÈRES ET PERFORMANCES
// =========================================================================
const hemiLight = new THREE.HemisphereLight(0xffffff, 0x444444, 3);
scene.add(hemiLight);
const dirLight = new THREE.DirectionalLight(0xffffff, 5);
dirLight.position.set(5, 10, 7);
dirLight.castShadow = false;
scene.add(dirLight);

const lumiereDossier = gui?.addFolder("Éclairage");
lumiereDossier?.add(dirLight, "intensity").min(0).max(10).step(0.1).name("Soleil");

let dossierSelection = gui?.addFolder("Aucun objet sélectionné");

const outils = {
  exporter: () => {
    const data = objetsCliquables.map((o) => {
      const lod = o.parent || o; 
      const y = lod.userData.flotte ? lod.userData.baseY : lod.position.y;
      return `${lod.name} | x: ${lod.position.x.toFixed(2)}, y: ${y.toFixed(2)}, z: ${lod.position.z.toFixed(2)} | rotX: ${lod.rotation.x.toFixed(3)}, rotY: ${lod.rotation.y.toFixed(3)}, rotZ: ${lod.rotation.z.toFixed(3)} | scale: ${lod.scale.x.toFixed(2)}`;
    }).join("\n");
    navigator.clipboard.writeText(data);
    alert("Coordonnées ET Tailles copiées ! 📋");
  },
};
gui?.add(outils, "exporter").name("💾 Exporter Coordonnées");

const stats = !isMobile ? new Stats() : null;
if (stats) document.body.appendChild(stats.dom);
const perfData = { polygones: 0, drawCalls: 0, geometries: 0 };
const perfFolder = gui?.addFolder("Moniteur d'Activité");
if (perfFolder) {
  perfFolder.add(perfData, "polygones").name("Triangles").listen();
  perfFolder.add(perfData, "drawCalls").name("Draw Calls").listen();
  perfFolder.add(perfData, "geometries").name("Géométries (RAM)").listen();
}

if (!MODE_DEV) {
  gui?.hide();
  if (stats) stats.dom.style.display = "none";
}

resize(camera, renderer);

// =========================================================================
// 🎯 9. INTERACTIVITÉ (Raycaster et Clics)
// =========================================================================
const raycaster = new THREE.Raycaster();
const souris = new THREE.Vector2();

window.addEventListener("pointermove", (event) => {
  souris.x = (event.clientX / window.innerWidth) * 2 - 1;
  souris.y = -(event.clientY / window.innerHeight) * 2 + 1;
  raycaster.setFromCamera(souris, camera);
  
  const hits = raycaster.intersectObjects(objetsCliquables, true);
  const cibleHover = hits[0]?.object;
  const estMaison = cibleHover?.name === "Maison" || cibleHover?.parent?.name === "Maison";
  
  if (hits.length > 0 && !estMaison) {
    document.body.style.cursor = "pointer";
    if (!MODE_DEV && window.afficherInfobulle) window.afficherInfobulle(cibleHover.name, "");
  } else {
    document.body.style.cursor = "default";
    if (!MODE_DEV && window.cacherInfobulle) window.cacherInfobulle();
  }
});

window.addEventListener("click", (event) => {
  // 🛑 FIX : On bloque le clic 3D si le Tuto, le Chargement, ou le QUIZ sont affichés
  if (document.getElementById("ecran-tutoriel") || document.getElementById("ecran-chargement")) return;
  const modalQuiz = document.getElementById("modal-quiz");
  if (modalQuiz && !modalQuiz.classList.contains("cache")) return;
  if (event.target !== canvas) return;

  souris.x = (event.clientX / window.innerWidth) * 2 - 1;
  souris.y = -(event.clientY / window.innerHeight) * 2 + 1;
  raycaster.setFromCamera(souris, camera);

  const intersections = raycaster.intersectObjects(objetsCliquables, true);

  if (intersections.length > 0) {
    let cible = intersections[0].object;
    while (cible.parent && cible.parent.type !== "Scene") cible = cible.parent;

    if (cible.name === "Maison") return;

    objetActif = cible;
    controls.target.copy(cible.position);

    // 🛑 FIX : On force le masquage de l'infobulle fantôme
    if (window.cacherInfobulle) window.cacherInfobulle();

    if (!MODE_DEV && window.ouvrirQuiz) window.ouvrirQuiz(cible.userData.id || cible.name, cible.userData.nom || cible.name);
    if (MODE_DEV && transformControls) transformControls.attach(cible);
    
    if (dossierSelection) {
      dossierSelection.destroy();
      dossierSelection = gui?.addFolder("Objet : " + cible.name);
      const actionsOutils = {
        deplacer: () => transformControls?.setMode("translate"),
        tourner: () => transformControls?.setMode("rotate"),
        agrandir: () => transformControls?.setMode("scale"),
      };
      dossierSelection?.add(actionsOutils, "deplacer").name("Activer Déplacement");
      dossierSelection?.add(actionsOutils, "tourner").name("Activer Rotation");
      dossierSelection?.add(actionsOutils, "agrandir").name("Activer Taille");
      dossierSelection?.open();
    }
  } else {
    transformControls?.detach();
    objetActif = null;
    if (dossierSelection) {
      dossierSelection.destroy();
      dossierSelection = gui?.addFolder("Aucun objet sélectionné");
    }
  }
});
// 🟢 LOGIQUE DU QUIZ (Le Cerveau connecté à disneyData)
window.ouvrirQuiz = (idObjet, nomObjet) => {
  const data = disneyData.find(item => item.id === idObjet); // On cherche l'objet cliqué dans ta data
  if (!data || !data.question) return window.objetTrouve(idObjet); // Sécurité si pas de question

  if (window.bloquerControles3D) window.bloquerControles3D(true);
  console.log(`🧠 QUIZ : ${data.question}`);
  console.log(`Choix : ${data.options.join(" | ")}`);

 if (window.ui_afficherQuiz) {
    window.ui_afficherQuiz(data, (succes) => {
      if (succes) window.objetTrouve(idObjet);
      if (window.bloquerControles3D) window.bloquerControles3D(false);
      objetActif = null;
    });
  }
};

window.objetTrouve = (idObjet) => {
  const obj = scene.getObjectByName(idObjet);
  if (obj) {
    obj.traverse((child) => {
      if (child.isMesh) {
        if (child.geometry) child.geometry.dispose();
        if (child.material) Array.isArray(child.material) ? child.material.forEach(m => m.dispose()) : child.material.dispose();
      }
    });
    scene.remove(obj);
    const index = objetsCliquables.findIndex((o) => o.name === idObjet);
    if (index > -1) objetsCliquables.splice(index, 1);
    // 💾 SAUVEGARDE & VICTOIRE
    const saves = JSON.parse(localStorage.getItem("popcorn_save")) ||[];
    if (!saves.includes(idObjet)) localStorage.setItem("popcorn_save", JSON.stringify([...saves, idObjet]));
    const idxLod = lodsScene.findIndex(l => l.name === idObjet);
    if (idxLod > -1) { lodsScene.splice(idxLod, 1); if (lodsScene.length === 0) console.log("👑 VICTOIRE !"); }
  }
};

// =========================================================================
// 🔄 10. LA BOUCLE D'ANIMATION PRINCIPALE (Le cœur du jeu)
// =========================================================================
const clock = new THREE.Clock();
const raycasterColl = new THREE.Raycaster();
const dirRaycast = new THREE.Vector3();
const dirCamera = new THREE.Vector3();
const dirLaterale = new THREE.Vector3();
const offsetCam = new THREE.Vector3();
const axeY = new THREE.Vector3(0, 1, 0);
const vitesseZQSD = 0.5;
let deltaAccumule = 0;
let hauteurJoueur = 26; // 🛑 FIX : L'ancre absolue du joueur
const intervalleFPS = 1 / 90; // Bride à 90 FPS max

// --- VISEUR MANETTE ---
let padAPrevious = false, padBPrevious = false, padYPrevious = false;
let indexBoutonFocus = -1, padDirPrevious = false; // Navigation UI
const crosshair = document.createElement("div");
crosshair.style.cssText = "display:none; position:fixed;top:50%;left:50%;width:6px;height:6px;background:white;border-radius:50%;transform:translate(-50%,-50%);pointer-events:none;z-index:9999;box-shadow: 0 0 4px black;";
document.body.appendChild(crosshair);

// --- DEBUG MANETTE ---
const debugManette = document.createElement("div");
if (MODE_DEV) {
  debugManette.style.cssText = "position:fixed;top:10px;left:10px;background:rgba(0,0,0,0.8);color:lime;padding:10px;font-family:monospace;z-index:99999;pointer-events:none;";
  document.body.appendChild(debugManette);
}

const animate = () => {
  window.requestAnimationFrame(animate); 
  const delta = clock.getDelta();
  deltaAccumule += delta;

  if (deltaAccumule < intervalleFPS) return; // Contrôle du framerate
  deltaAccumule = deltaAccumule % intervalleFPS; 
  controls.update();

  // --------------------------------------------------------
  // A. LECTURE DE LA MANETTE (GamePad API)
  // --------------------------------------------------------
  let gamepadActif = null;
  let padX = 0, padY = 0, padRotX = 0, padRotY = 0;
  let padA = false, padB = false, padYBtn = false;
  let padLT = 0, padRT = 0;
  
  if (!isMobile) {
    const gamepads = navigator.getGamepads();
    for (let i = 0; i < gamepads.length; i++) {
      if (gamepads[i] && gamepads[i].connected) { gamepadActif = gamepads[i]; break; }
    }
  }

  if (gamepadActif) {
    crosshair.style.display = "block";
    if (Math.abs(gamepadActif.axes[0]) > 0.15) padX = gamepadActif.axes[0]; 
    if (Math.abs(gamepadActif.axes[1]) > 0.15) padY = gamepadActif.axes[1]; 
    if (Math.abs(gamepadActif.axes[2]) > 0.15) padRotX = gamepadActif.axes[2]; 
    if (Math.abs(gamepadActif.axes[3]) > 0.15) padRotY = gamepadActif.axes[3]; 
    padA = gamepadActif.buttons[0].pressed; 
    padB = gamepadActif.buttons[1].pressed; 
    padYBtn = gamepadActif.buttons[3].pressed; 
    padLT = gamepadActif.buttons[6].value;
    padRT = gamepadActif.buttons[7].value;
  } else {
    crosshair.style.display = "none";
  }
  
  if (MODE_DEV && gamepadActif) {
    debugManette.innerHTML = `🕹️ L-Joy (X,Y): ${padX.toFixed(2)}, ${padY.toFixed(2)} <br> 👁️ R-Joy (RotX,RotY): ${padRotX.toFixed(2)}, ${padRotY.toFixed(2)} <br> 🔫 Gâchettes: LT:${padLT.toFixed(2)} RT:${padRT.toFixed(2)} <br> 🔘 Boutons: A(${padA}) B(${padB})`;
  } else if (MODE_DEV) { debugManette.innerHTML = "❌ Pas de manette détectée"; }

  // --- NAVIGATION UI (QCM) ---
  const modalQuiz = document.getElementById('modal-quiz');
  // On vérifie que la modale n'a pas la classe 'cache' (ce qui signifie qu'elle est affichée)
  if (modalQuiz && !modalQuiz.classList.contains('cache')) {
    const boutons = document.querySelectorAll('.btn-option:not([disabled])');
    const padUp = padY < -0.5 || (gamepadActif && gamepadActif.buttons[12]?.pressed);
    const padDown = padY > 0.5 || (gamepadActif && gamepadActif.buttons[13]?.pressed);
    
    if (padUp && !padDirPrevious) indexBoutonFocus = (indexBoutonFocus > 0) ? indexBoutonFocus - 1 : boutons.length - 1;
    if (padDown && !padDirPrevious) indexBoutonFocus = (indexBoutonFocus < boutons.length - 1) ? indexBoutonFocus + 1 : 0;
    
    // On applique un style visuel clair (bordure dorée)
    boutons.forEach((b, i) => {
        b.style.border = (i === indexBoutonFocus) ? "3px solid #f9ca24" : "none";
        b.style.transform = (i === indexBoutonFocus) ? "scale(1.05)" : "scale(1)";
    });
    
    // Si on appuie sur A et qu'un bouton est sélectionné
    if (padA && !padAPrevious && indexBoutonFocus >= 0) boutons[indexBoutonFocus].click();
    
    padDirPrevious = padUp || padDown; 
    padX = 0; padY = 0; padRotX = 0; padRotY = 0; // Bloque la caméra 3D
  } else { 
    indexBoutonFocus = -1; 
  }

  // --------------------------------------------------------
  // B. ACTIONS DES BOUTONS (A, B, Y)
  // --------------------------------------------------------
  if (padA && !padAPrevious) {
    const btnDecvrir = document.getElementById("btn-decouvrir");
    const btnSuivant = document.getElementById("btn-suivant");
    const btnRentrer = document.getElementById("btn-rentrer");

    // 1. Navigation fluide dans le tutoriel avec la manette
    if (btnDecvrir && !btnDecvrir.classList.contains("cache") && btnDecvrir.style.display !== "none") btnDecvrir.click();
    else if (btnSuivant && !btnSuivant.classList.contains("cache")) btnSuivant.click();
    else if (btnRentrer && !btnRentrer.classList.contains("cache")) btnRentrer.click();
    
    // 2. Ou bien validation d'un bouton de QCM (Bordure dorée)
    else if (document.getElementById('modal-quiz') && !document.getElementById('modal-quiz').classList.contains('cache')) {
      const boutons = document.querySelectorAll('.btn-option:not([disabled])');
      // Si aucun bouton n'est surligné, on force le premier par défaut
      if (indexBoutonFocus === -1 && boutons.length > 0) indexBoutonFocus = 0; 
      if (boutons[indexBoutonFocus]) boutons[indexBoutonFocus].click();
    }
    // 3. Ou bien tir du Raycaster 3D classique
    else {
      canvas.dispatchEvent(new MouseEvent("click", { clientX: window.innerWidth / 2, clientY: window.innerHeight / 2, bubbles: true }));
    }
  }

  if (padB && !padBPrevious) {
    if (transformControls) transformControls.detach();
    objetActif = null;
    if (window.bloquerControles3D) window.bloquerControles3D(false);
    document.getElementById('modal-quiz')?.classList.remove('is-active');
    if (dossierSelection) { dossierSelection.destroy(); dossierSelection = gui?.addFolder("Aucun objet sélectionné"); }
  }

  padAPrevious = padA; padBPrevious = padB; padYPrevious = padYBtn;

  // --------------------------------------------------------
  // C. MOTEUR GTA (Déplacement de l'objet actif)
  // --------------------------------------------------------
  if (objetActif && MODE_DEV) {
    if (touches.q || touches.ArrowLeft) objetActif.translateX(-1);
    if (touches.d || touches.ArrowRight) objetActif.translateX(1);
    if (touches.z || touches.ArrowUp) objetActif.translateZ(-1);
    if (touches.s || touches.ArrowDown) objetActif.translateZ(1);

    if (touches.z || touches.s || touches.q || touches.d || touches.ArrowUp || touches.ArrowDown || touches.ArrowLeft || touches.ArrowRight) {
      offsetCam.subVectors(objetActif.position, controls.target);
      camera.position.add(offsetCam);
      controls.target.copy(objetActif.position);
    }
  }

  // --------------------------------------------------------
  // D. DÉPLACEMENT DE LA CAMÉRA (ZQSD, Manette, Mobile)
  // --------------------------------------------------------
  const peutBouger = (direction, inverse = false) => {
    if (mursCollision.length === 0) return true; 
    dirRaycast.copy(direction);
    if (inverse) dirRaycast.negate();
    raycasterColl.set(camera.position, dirRaycast.normalize());
    const intersect = raycasterColl.intersectObjects(mursCollision);
    return intersect.length === 0 || intersect[0].distance > 1.5;
  };

  if (!objetActif) {
    camera.getWorldDirection(dirCamera);
    dirCamera.y = 0; dirCamera.normalize();
    dirLaterale.crossVectors(camera.up, dirCamera).normalize();

    // -- Manette --
    if (padY < -0.15 && peutBouger(dirCamera)) { camera.position.addScaledVector(dirCamera, -padY * vitesseZQSD); controls.target.addScaledVector(dirCamera, -padY * vitesseZQSD); }
    if (padY > 0.15 && peutBouger(dirCamera, true)) { camera.position.addScaledVector(dirCamera, -padY * vitesseZQSD); controls.target.addScaledVector(dirCamera, -padY * vitesseZQSD); }
    if (padX < -0.15 && peutBouger(dirLaterale)) { camera.position.addScaledVector(dirLaterale, -padX * vitesseZQSD); controls.target.addScaledVector(dirLaterale, -padX * vitesseZQSD); }
    if (padX > 0.15 && peutBouger(dirLaterale, true)) { camera.position.addScaledVector(dirLaterale, -padX * vitesseZQSD); controls.target.addScaledVector(dirLaterale, -padX * vitesseZQSD); }
    
    if (Math.abs(padRotX) > 0.15) { offsetCam.subVectors(controls.target, camera.position); offsetCam.applyAxisAngle(axeY, -padRotX * 0.05); controls.target.copy(camera.position).add(offsetCam); }
    if (Math.abs(padRotY) > 0.15) { 
      let nouvelleHauteur = controls.target.y - (padRotY * 0.8);
      let dist = camera.position.distanceTo(controls.target);
      controls.target.y = Math.max(camera.position.y - (dist * 0.9), Math.min(camera.position.y + (dist * 0.9), nouvelleHauteur));
    }

    if (MODE_DEV && padLT > 0.1) hauteurJoueur += padLT * 0.4;
    if (MODE_DEV && padRT > 0.1) hauteurJoueur -= padRT * 0.4;

    // -- Tactile Mobile --
    if (Math.abs(padMobile.y) > 0.05 && peutBouger(dirCamera, padMobile.y < 0)) {
      camera.position.addScaledVector(dirCamera, padMobile.y * vitesseZQSD); controls.target.addScaledVector(dirCamera, padMobile.y * vitesseZQSD);
    }
    if (Math.abs(padMobile.x) > 0.05 && peutBouger(dirLaterale, padMobile.x > 0)) {
      camera.position.addScaledVector(dirLaterale, -padMobile.x * vitesseZQSD); controls.target.addScaledVector(dirLaterale, -padMobile.x * vitesseZQSD);
    }
    
    // -- Clavier --
    if ((touches.z || touches.ArrowUp) && peutBouger(dirCamera)) { camera.position.addScaledVector(dirCamera, vitesseZQSD); controls.target.addScaledVector(dirCamera, vitesseZQSD); }
    if ((touches.s || touches.ArrowDown) && peutBouger(dirCamera, true)) { camera.position.addScaledVector(dirCamera, -vitesseZQSD); controls.target.addScaledVector(dirCamera, -vitesseZQSD); }
    if ((touches.q || touches.ArrowLeft) && peutBouger(dirLaterale)) { camera.position.addScaledVector(dirLaterale, vitesseZQSD); controls.target.addScaledVector(dirLaterale, vitesseZQSD); }
    if ((touches.d || touches.ArrowRight) && peutBouger(dirLaterale, true)) { camera.position.addScaledVector(dirLaterale, -vitesseZQSD); controls.target.addScaledVector(dirLaterale, -vitesseZQSD); }
  }
 
  // --------------------------------------------------------
  // E. ANIMATION DES OBJETS ET RENDU FINAL
  // --------------------------------------------------------
  const elapsedTime = clock.getElapsedTime();
  objetsCliquables.forEach((objet, i) => {
    if (objet.userData.flotte && objet.userData.flotteActive !== false) {
      const cibleAnimation = objet.parent || objet;
      cibleAnimation.position.y = objet.userData.baseY + Math.sin(elapsedTime * (objet.userData.vitesse || 0.8) + (i * 1.2)) * (objet.userData.amplitude || 0.08);
    }
  });

  lodsScene.forEach(lod => lod.update(camera));
  // 🛑 FIX RADICAL : On cloue le joueur. OrbitControls ne peut plus te faire voler.
  if (!objetActif) {
    const decalageY = hauteurJoueur - camera.position.y;
    camera.position.y = hauteurJoueur;
    controls.target.y += decalageY;
  }
  if (renduAutorise) renderer.render(scene, camera); 
  if (stats) {
    stats.update();
    perfData.polygones = renderer.info.render.triangles;
    perfData.drawCalls = renderer.info.render.calls;
    perfData.geometries = renderer.info.memory.geometries;
  }
}; 

animate();