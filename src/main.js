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

// injection d'analytics et SpeedInsights (Désactivé pour Opera/AdBlock)
// inject();
// injectSpeedInsights();

// ==========================================
// 🛠️ MODE DÉVELOPPEUR
// ==========================================
const MODE_DEV = true; // Mets sur 'false' pour le rendu final !
window.easterEggDebloque = false; // La clé du mode GTA secret

// 1. LA SCÈNE
const scene = new THREE.Scene();
const objetsCliquables = [];
// On détecte le mobile TOUT DE SUITE
const isMobile = window.innerWidth < 768;

// 2. LA CAMÉRA
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
const renderer = new THREE.WebGLRenderer({ canvas, antialias: !isMobile });
renderer.setSize(window.innerWidth, window.innerHeight);
const pixelRatio = isMobile ? 1 : Math.min(window.devicePixelRatio, 2);
renderer.setPixelRatio(pixelRatio);
// Ombre dynamiques (rendu AAA)
renderer.shadowMap.enabled = false;
renderer.shadowMap.type = THREE.PCFShadowMap;

// 4. ORBIT CONTROLS
const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.target.y = 23;
controls.update();

// --- LIMITES DE LA CAMÉRA ---
controls.maxPolarAngle = Math.PI / 2 - 0.05;
controls.minDistance = 2;
controls.maxDistance = 250;

// --- VARIABLES DE DÉPLACEMENT (DOUBLE-CLIC) ---
let moveControls = false;
const targetTarget = new THREE.Vector3();
const targetPosition = new THREE.Vector3();
// ✅ AJOUT : Variables manquantes du moteur GTA
let mobilePadX = 0;
let mobilePadY = 0;
let objetActif = null;
const touches = {
  z: false,
  q: false,
  s: false,
  d: false,
  ArrowUp: false,
  ArrowLeft: false,
  ArrowDown: false,
  ArrowRight: false,
};
window.addEventListener("keyup", (e) => {
  if (touches.hasOwnProperty(e.key)) touches[e.key] = false;
});

// --- LE PONT AVEC L'INTERFACE ---
window.lancerJeu3D = () => {
  console.log("🎬 Jeu lancé !");
  if (isMobile || 'ontouchstart' in window) {
    const joystick = nipplejs.create({ zone: document.getElementById("zone-joystick") || document.body, mode: "dynamic", color: "white" });
    joystick.on("move", (evt, data) => {
      mobilePadX = data.vector.x; mobilePadY = -data.vector.y;
      controls.enabled = false;
    });
    joystick.on("end", () => {
      mobilePadX = mobilePadY = 0;
      controls.enabled = true;
    });
  }
};
// --- LE BRIDGE DE SÉCURITÉ ---
window.bloquerControles3D = (etat) => {
  if (controls) controls.enabled = !etat;
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

transformControls.setMode("translate");

/// 🎮 Contrôles clavier TransformControls
window.addEventListener("keydown", (e) => {
  if (touches.hasOwnProperty(e.key)) touches[e.key] = true;
  if (e.key === "g") transformControls.setMode("translate");
  if (e.key === "r") transformControls.setMode("rotate");
  if (e.key === "Escape" && objetActif) {
    transformControls.detach();
    objetActif = null;
    dossierSelection.destroy();
    dossierSelection = gui.addFolder("Aucun objet sélectionné");
  }
});

// --- INITIALISATION DU MENU (GUI) ---
const gui = new GUI();
const debugConfig = { afficherHitboxes: false };
const dossierDebug = gui.addFolder("🛠️ Mode Debug");
dossierDebug
  .add(debugConfig, "afficherHitboxes")
  .name("Voir Collisions")
  .onChange((val) => {
    objetsCliquables.forEach((h) => {
      if (h.material) {
        h.material.opacity = val ? 0.4 : 0;
        h.material.wireframe = val;
      }
    });
  });

// 6. CHARGEMENT DES OBJETS
const manager = new THREE.LoadingManager();
const mursCollision = [];
const raycasterColl = new THREE.Raycaster();

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
  console.log("✅ 3D téléchargée ! Pré-compilation GPU en cours...");
  // On force le GPU à tout calculer avant de lever le rideau
  scene.traverse((obj) => { if (obj.isMesh) renderer.compile(obj, camera); });

  if (MODE_DEV) {
    // On attend 1 petite seconde que le compile finisse avant de cacher l'écran
    setTimeout(() => {
      document.getElementById("ecran-chargement").style.display = "none";
      document.getElementById("ecran-tutoriel").style.display = "none";
      if (window.lancerJeu3D) window.lancerJeu3D();
    }, 1000);
    return;
  }
  const btnDecouvrir = document.getElementById("btn-decouvrir");
  const texteChargement = document.querySelector(".texte-chargement");
  if (btnDecouvrir && texteChargement) {
    texteChargement.style.transition = "opacity 0.5s ease";
    texteChargement.style.opacity = "0";
    setTimeout(() => (texteChargement.style.display = "none"), 500);
    setTimeout(() => {
      btnDecouvrir.classList.remove("cache");
    }, 400);
  }
};
//Teste pour identifier erreur
manager.onError = (url) => {
  console.error("❌ Erreur critique de chargement sur : " + url);
  alert(
    "Le fichier " + url + " refuse de charger. Vérifie le poids ou le chemin !",
  );
};

const loader = new GLTFLoader(manager);

//DracoLoader
const dracoLoader = new DRACOLoader();
dracoLoader.setDecoderPath(
  "https://www.gstatic.com/draco/versioned/decoders/1.5.6/",
);
loader.setDRACOLoader(dracoLoader);

// 🟢 CHARGEMENT AUTOMATISÉ AVEC LOD
disneyData.forEach((item) => {
  const lod = new THREE.LOD();
  lod.name = item.id;
  lod.userData = { ...item };
  if (item.flotte)
    Object.assign(lod.userData, {
      flotteActive: true,
      baseY: item.y || 0,
      vitesse: item.vitesse || 0.8,
      amplitude: item.amplitude || 0.08,
    });
  lod.position.set(item.x || 0, item.y || 0, item.z || 0);
  lod.rotation.set(item.rotX || 0, item.rotY || 0, item.rotZ || 0);
  if (item.scale) lod.scale.setScalar(item.scale);

  loader.load(`/assets/${item.id}.glb`, (gltf) => {
    const boite = new THREE.Box3().setFromObject(gltf.scene);
    const taille = new THREE.Vector3();
    boite.getSize(taille);
    const hitX = Math.max(taille.x * 1.5, 2.5);
    const hitY = Math.max(taille.y * 1.5, 2.5);
    const hitZ = Math.max(taille.z * 1.5, 2.5);
    lod.addLevel(gltf.scene, 0);

    const hitbox = new THREE.Mesh(
      new THREE.BoxGeometry(hitX, hitY, hitZ),
      new THREE.MeshBasicMaterial({
        transparent: true,
        opacity: 0,
        depthWrite: false,
      }),
    );
    const center = new THREE.Vector3();
    boite.getCenter(center);
    hitbox.position.copy(center);
    hitbox.name = lod.name;
    hitbox.userData = lod.userData;
    lod.add(hitbox);
    objetsCliquables.push(hitbox);
  }); // LOD de secours (vide) pour éviter les bugs d'apparition
  lod.addLevel(new THREE.Object3D(), 200);
  scene.add(lod);
});

// Asset: Maison
loader.load("/assets/MaisonV2.glb", (gltf) => {
  const maison = gltf.scene;
  maison.scale.set(15, 15, 15);
  maison.name = "Maison";

  maison.traverse((obj) => {
    if (obj.isMesh && obj.name.includes("MurFictif")) {
      obj.visible = false; // Magie : les planches grises disparaissent
      mursCollision.push(obj); // Elles deviennent des obstacles physiques
    }
  });
  scene.add(maison);

  // On crée un sol mathématique ultra-léger pour le clic, au lieu de la vraie maison
  const solHitbox = new THREE.Mesh(
    new THREE.BoxGeometry(300, 1, 300),
    new THREE.MeshBasicMaterial({
      color: 0x0000ff,
      transparent: true,
      opacity: 0,
      wireframe: false,
    }),
  );
  solHitbox.name = "Maison";
  solHitbox.position.y = -0.5;
  scene.add(solHitbox);
  objetsCliquables.push(solHitbox);
});

// 5. LA LUMIÈRE
const hemiLight = new THREE.HemisphereLight(0xffffff, 0x444444, 3);
scene.add(hemiLight);
const dirLight = new THREE.DirectionalLight(0xffffff, 5);
dirLight.position.set(5, 10, 7);
dirLight.castShadow = false;
scene.add(dirLight);

// GUI - Éclairage
const lumiereDossier = gui.addFolder("Éclairage");
lumiereDossier
  .add(dirLight, "intensity")
  .min(0)
  .max(10)
  .step(0.1)
  .name("Soleil");

// GUI - Sélection dynamique
let dossierSelection = gui.addFolder("Aucun objet sélectionné");

const outils = {
  exporter: () => {
    const data = objetsCliquables
      .map((o) => {
        const lod = o.parent || o; // ✅ On remonte au LOD parent, pas la hitbox
        const y = lod.userData.flotte ? lod.userData.baseY : lod.position.y;
        return `${lod.name} | x: ${lod.position.x.toFixed(2)}, y: ${y.toFixed(2)}, z: ${lod.position.z.toFixed(2)} | rotX: ${lod.rotation.x.toFixed(3)}, rotY: ${lod.rotation.y.toFixed(3)}, rotZ: ${lod.rotation.z.toFixed(3)} | scale: ${lod.scale.x.toFixed(2)}`;
      })
      .join("\n");
    navigator.clipboard.writeText(data);
    alert("Coordonnées ET Tailles copiées ! 📋");
  },
};
gui.add(outils, "exporter").name("💾 Exporter Coordonnées");

// --- PERFORMANCES ---
const stats = new Stats();
document.body.appendChild(stats.dom);
const perfData = { polygones: 0, drawCalls: 0, geometries: 0 };
const perfFolder = gui.addFolder("Moniteur d'Activité");
perfFolder.add(perfData, "polygones").name("Triangles").listen();
perfFolder.add(perfData, "drawCalls").name("Draw Calls").listen();
perfFolder.add(perfData, "geometries").name("Géométries (RAM)").listen();

// 🔒 MODE PROD : Cache le GUI et les stats
if (!MODE_DEV) {
  gui.hide();
  stats.dom.style.display = "none";
}

// Resize
resize(camera, renderer);

// --- LE LASER (RAYCASTER) ---
const raycaster = new THREE.Raycaster();
const souris = new THREE.Vector2();

window.addEventListener("pointermove", (event) => {
  souris.x = (event.clientX / window.innerWidth) * 2 - 1;
  souris.y = -(event.clientY / window.innerHeight) * 2 + 1;
  raycaster.setFromCamera(souris, camera);
  // Curseur pointer sur les objets
  const hits = raycaster.intersectObjects(objetsCliquables, true);
  const cibleHover = hits[0]?.object;
  const estMaison =
    cibleHover?.name === "Maison" || cibleHover?.parent?.name === "Maison";
  if (hits.length > 0 && !estMaison) {
    document.body.style.cursor = "pointer";
    if (!MODE_DEV && window.afficherInfobulle)
      window.afficherInfobulle(cibleHover.name, "");
  } else {
    document.body.style.cursor = "default";
    if (!MODE_DEV && window.cacherInfobulle) window.cacherInfobulle();
  }
});

window.addEventListener("click", (event) => {
  if (event.target !== canvas) return;

  souris.x = (event.clientX / window.innerWidth) * 2 - 1;
  souris.y = -(event.clientY / window.innerHeight) * 2 + 1;
  raycaster.setFromCamera(souris, camera);

  const intersections = raycaster.intersectObjects(objetsCliquables, true);

  if (intersections.length > 0) {
    let cible = intersections[0].object;
    while (cible.parent && cible.parent.type !== "Scene") {
      cible = cible.parent;
    }

    // Sécurité Maison
    if (cible.name === "Maison") return;

    // 👉 On désigne cet objet comme celui qu'on conduit
    objetActif = cible;
    controls.target.copy(cible.position);

    // 🟢 Déclenchement du Quiz en mode joueur
    if (!MODE_DEV && window.ouvrirQuiz) {
      window.ouvrirQuiz(
        cible.userData.id || cible.name,
        cible.userData.nom || cible.name,
      );
    }

    // Flèches 3D uniquement pour les développeurs
    if (MODE_DEV) {
      transformControls.attach(cible);
    }
    // GUI dynamique
    dossierSelection.destroy();
    dossierSelection = gui.addFolder("Objet : " + cible.name);

    // Audit des polygones
    let polyObj = 0;
    cible.traverse((c) => {
      if (c.isMesh)
        polyObj += c.geometry.index
          ? c.geometry.index.count / 3
          : c.geometry.attributes.position.count / 3;
    });
    dossierSelection
      .add({ p: Math.round(polyObj) }, "p")
      .name("⚖️ Poids (Triangles)")
      .disable();

    const actionsOutils = {
      deplacer: () => transformControls.setMode("translate"),
      tourner: () => transformControls.setMode("rotate"),
      agrandir: () => transformControls.setMode("scale"),
    };

    // ✅ On affiche la position du LOD parent, pas de la hitbox
    const lodParent = cible; // 🛡️ Fix : On verrouille l'objet, pas la Scène !
    dossierSelection.add(lodParent.position, "x").name("Pos X").listen();
    if (cible.userData.flotte) {
      dossierSelection
        .add(cible.userData, "baseY")
        .name("Pos Y (Base)")
        .listen();
    } else {
      dossierSelection.add(lodParent.position, "y").name("Pos Y").listen();
    }
    dossierSelection.add(lodParent.position, "z").name("Pos Z").listen();
    dossierSelection.add(lodParent.rotation, "x").name("Rot X").listen(); // ✅ lodParent
    dossierSelection.add(lodParent.rotation, "y").name("Rot Y").listen(); // ✅ lodParent
    dossierSelection.add(lodParent.rotation, "z").name("Rot Z").listen(); // ✅ lodParent

    const configScale = {
      Sabre: { min: 0.001, max: 1, step: 0.001 },
      Lampe: { min: 0.001, max: 5, step: 0.01 },
      Robe: { min: 0.1, max: 10, step: 0.1 },
      Chapeau: { min: 0.1, max: 10, step: 0.1 },
      Drapeau: { min: 0.1, max: 10, step: 0.1 },
      CellPhone: { min: 0.001, max: 5, step: 0.01 },
    };
    const cfg = configScale[cible.name] || { min: 0.001, max: 20, step: 0.01 };

    dossierSelection
      .add(lodParent.scale, "x")
      .min(cfg.min)
      .max(cfg.max)
      .step(cfg.step)
      .name("Largeur")
      .listen();
    dossierSelection
      .add(lodParent.scale, "y")
      .min(cfg.min)
      .max(cfg.max)
      .step(cfg.step)
      .name("Profondeur")
      .listen();
    dossierSelection
      .add(lodParent.scale, "z")
      .min(cfg.min)
      .max(cfg.max)
      .step(cfg.step)
      .name("Hauteur")
      .listen();

    dossierSelection.add(actionsOutils, "deplacer").name("Activer Déplacement");
    dossierSelection.add(actionsOutils, "tourner").name("Activer Rotation");
    dossierSelection.add(actionsOutils, "agrandir").name("Activer Taille");

    dossierSelection.open();
  } else {
    // Clic dans le vide
    transformControls.detach();
    // 👉 On arrête de conduire
    objetActif = null;
    dossierSelection.destroy();
    dossierSelection = gui.addFolder("Aucun objet sélectionné");
  }
});

// 🟢 Fonction appelée par l'UI quand le joueur trouve la bonne réponse
window.objetTrouve = (idObjet) => {
  const objetASupprimer = scene.getObjectByName(idObjet);
  if (objetASupprimer) {
    // 1. On purge la mémoire (RAM)
    objetASupprimer.traverse((child) => {
      if (child.isMesh) {
        if (child.geometry) child.geometry.dispose();
        if (child.material) {
          if (Array.isArray(child.material)) {
            child.material.forEach((mat) => mat.dispose());
          } else {
            child.material.dispose();
          }
        }
      }
    });
    // 2. On le retire visuellement
    scene.remove(objetASupprimer);
    // 3. On coupe l'interactivité
    const index = objetsCliquables.findIndex((obj) => obj.name === idObjet);
    if (index > -1) objetsCliquables.splice(index, 1);
  }
};
// ==========================================
// 7. LA BOUCLE D'ANIMATION
// ==========================================
const clock = new THREE.Clock();

const dirCamera = new THREE.Vector3();
const dirLaterale = new THREE.Vector3();
const vitesseZQSD = 0.6;
let deltaAccumule = 0;
const intervalleFPS = 1 / 90; // La limite stricte à 90 FPS

// 🎯 VISEUR ET MÉMOIRE MANETTE
let padAPrevious = false, padBPrevious = false, padYPrevious = false;
const crosshair = document.createElement("div");
crosshair.style.cssText = "display:none; position:fixed;top:50%;left:50%;width:6px;height:6px;background:white;border-radius:50%;transform:translate(-50%,-50%);pointer-events:none;z-index:9999;box-shadow: 0 0 4px black;";
document.body.appendChild(crosshair);

window.addEventListener("gamepadconnected", (e) => {
  console.log("🎮 MANETTE DÉTECTÉE ! Port:", e.gamepad.index, "Nom:", e.gamepad.id);
});
const animate = () => {
  window.requestAnimationFrame(animate); // On déplace l'appel ici
  const delta = clock.getDelta();
  deltaAccumule += delta;

  if (deltaAccumule < intervalleFPS) return; // Frein activé : on passe cette frame
  deltaAccumule = deltaAccumule % intervalleFPS; // On reset le compteur
  controls.update();

  // --- 🎮 LECTURE MANETTE INTELLIGENTE ---
  let padX = 0, padY = 0, padRotX = 0, padRotY = 0;
  let padA = false, padB = false, padYBtn = false;
  let gamepadActif = null;
  let padLT = 0, padRT = 0;
  
  const gamepads = navigator.getGamepads();
  for (let i = 0; i < gamepads.length; i++) {
    if (gamepads[i] && gamepads[i].connected) { gamepadActif = gamepads[i]; break; }
  }

  if (gamepadActif) {
    crosshair.style.display = "block";
    if (Math.abs(gamepadActif.axes[0]) > 0.15) padX = gamepadActif.axes[0]; // Stick gauche X
    if (Math.abs(gamepadActif.axes[1]) > 0.15) padY = gamepadActif.axes[1]; // Stick gauche Y
    if (Math.abs(gamepadActif.axes[2]) > 0.15) padRotX = gamepadActif.axes[2]; // Stick droit X
    if (Math.abs(gamepadActif.axes[3]) > 0.15) padRotY = gamepadActif.axes[3]; // Stick droit Y (Haut/Bas)
    padA = gamepadActif.buttons[0].pressed; // Bouton A (Sélectionner)
    padB = gamepadActif.buttons[1].pressed; // Bouton B (Quitter)
    padYBtn = gamepadActif.buttons[3].pressed; // Bouton Y (Menu)
    padLT = gamepadActif.buttons[6].value;
    padRT = gamepadActif.buttons[7].value;
  } else {
    crosshair.style.display = "none";
  }

  // --- 🎮 ACTIONS DES BOUTONS ---
  // BOUTON A : Clic intelligent (Interface ou 3D)
  if (padA && !padAPrevious) {
    const uiAuCentre = document.elementFromPoint(window.innerWidth / 2, window.innerHeight / 2);
    // Si on vise un bouton du menu HTML, on clique physiquement dessus
    if (uiAuCentre && (uiAuCentre.tagName === 'BUTTON' || uiAuCentre.closest('button'))) {
      uiAuCentre.click();
    } else {
      // Sinon, on clique dans le monde 3D
     canvas.dispatchEvent(new MouseEvent("click", { clientX: window.innerWidth / 2, clientY: window.innerHeight / 2, bubbles: true }));
    }
  }

  // BOUTON B : Quitter l'objet (Comme Echap)
  if (padB && !padBPrevious) {
    if (objetActif) {
      transformControls.detach();
      objetActif = null;
      dossierSelection.destroy();
      dossierSelection = gui.addFolder("Aucun objet sélectionné");
    }
    // (Ajout futur : Fermer la fenêtre du Quiz avec B)
  }

  // BOUTON Y : Menu
  if (padYBtn && !padYPrevious) {
    console.log("Bouton Y pressé - Ouverture du menu à coder !");
  }

  padAPrevious = padA; padBPrevious = padB; padYPrevious = padYBtn;
  // --- 🎮 MOTEUR GTA : Déplace l'objet sélectionné ---
  if (objetActif && MODE_DEV) {
    const vitesse = 1;

    if (touches.q || touches.ArrowLeft) objetActif.translateX(-vitesse);
    if (touches.d || touches.ArrowRight) objetActif.translateX(vitesse);
    if (touches.z || touches.ArrowUp) objetActif.translateZ(-vitesse);
    if (touches.s || touches.ArrowDown) objetActif.translateZ(vitesse);

    // La caméra suit l'objet quand il bouge (vraie caméra GTA)
    const estEnMouvement =
      touches.z ||
      touches.s ||
      touches.q ||
      touches.d ||
      touches.ArrowUp ||
      touches.ArrowDown ||
      touches.ArrowLeft ||
      touches.ArrowRight;
    if (estEnMouvement) {
      // 1. On calcule de combien l'objet vient de se déplacer
      const delta = new THREE.Vector3().subVectors(
        objetActif.position,
        controls.target,
      );
      // 2. On déplace la caméra exactement de la même distance
      camera.position.add(delta);
      // 3. On met à jour la cible
      controls.target.copy(objetActif.position);
    }
  }
  // ✅ RADAR COLLISION — doit être avant le ZQSD
  const peutBouger = (direction) => {
    if (mursCollision.length === 0) return true; // Sécurité si la maison n'est pas chargée
    raycasterColl.set(camera.position, direction.clone().normalize());
    const intersect = raycasterColl.intersectObjects(mursCollision);
    return intersect.length === 0 || intersect[0].distance > 1.5;
  };

  // --- MOTEUR GTA : Déplace la caméra avec ZQSD (quand on ne conduit pas un objet) ---
  if (!objetActif) {
    camera.getWorldDirection(dirCamera);
    dirCamera.y = 0;
    dirCamera.normalize();
    dirLaterale.crossVectors(camera.up, dirCamera).normalize();

   // 🎮 MOUVEMENT & ROTATION MANETTE
    if (padY < -0.15 && peutBouger(dirCamera)) { camera.position.addScaledVector(dirCamera, -padY * vitesseZQSD); controls.target.addScaledVector(dirCamera, -padY * vitesseZQSD); }
    if (padY > 0.15 && peutBouger(dirCamera.clone().negate())) { camera.position.addScaledVector(dirCamera, -padY * vitesseZQSD); controls.target.addScaledVector(dirCamera, -padY * vitesseZQSD); }
    if (padX < -0.15 && peutBouger(dirLaterale)) { camera.position.addScaledVector(dirLaterale, -padX * vitesseZQSD); controls.target.addScaledVector(dirLaterale, -padX * vitesseZQSD); }
    if (padX > 0.15 && peutBouger(dirLaterale.clone().negate())) { camera.position.addScaledVector(dirLaterale, -padX * vitesseZQSD); controls.target.addScaledVector(dirLaterale, -padX * vitesseZQSD); }
   if (padRotX !== 0) {
      const offset = new THREE.Vector3().subVectors(controls.target, camera.position);
      offset.applyAxisAngle(new THREE.Vector3(0, 1, 0), -padRotX * 0.05);
      controls.target.copy(camera.position).add(offset);
    }
    
    // 🎮 INCLINAISON DE LA TÊTE (Joystick Droit Y)
    if (padRotY !== 0) controls.target.y -= padRotY * 0.4; 

    // 🎮 ÉLÉVATION / DRONE MODE (Gâchettes LT / RT)
    if (typeof padLT !== 'undefined' && padLT > 0.1) { camera.position.y += padLT * 0.4; controls.target.y += padLT * 0.4; }
    if (typeof padRT !== 'undefined' && padRT > 0.1) { camera.position.y -= padRT * 0.4; controls.target.y -= padRT * 0.4; }
   const forceMobile = vitesseZQSD * 1.5;
    if (Math.abs(mobilePadY) > 0.05 && peutBouger(dirCamera)) {
      camera.position.addScaledVector(dirCamera, -mobilePadY * forceMobile);
      controls.target.addScaledVector(dirCamera, -mobilePadY * forceMobile);
    }
    if (Math.abs(mobilePadX) > 0.05 && peutBouger(dirLaterale)) {
      camera.position.addScaledVector(dirLaterale, -mobilePadX * forceMobile);
      controls.target.addScaledVector(dirLaterale, -mobilePadX * forceMobile);
    }
    // ⌨️ MOUVEMENT CLAVIER (Touche Z réparée)
    if ((touches.z || touches.ArrowUp) && peutBouger(dirCamera)) {
      camera.position.addScaledVector(dirCamera, vitesseZQSD);
      controls.target.addScaledVector(dirCamera, vitesseZQSD);
    }
    if (
      (touches.s || touches.ArrowDown) &&
      peutBouger(dirCamera.clone().negate())
    ) {
      camera.position.addScaledVector(dirCamera, -vitesseZQSD);
      controls.target.addScaledVector(dirCamera, -vitesseZQSD);
    }
    if ((touches.q || touches.ArrowLeft) && peutBouger(dirLaterale)) {
      camera.position.addScaledVector(dirLaterale, vitesseZQSD);
      controls.target.addScaledVector(dirLaterale, vitesseZQSD);
    }
    if (
      (touches.d || touches.ArrowRight) &&
      peutBouger(dirLaterale.clone().negate())
    ) {
      camera.position.addScaledVector(dirLaterale, -vitesseZQSD);
      controls.target.addScaledVector(dirLaterale, -vitesseZQSD);
    }
  }
 
  const elapsedTime = clock.getElapsedTime();

  // --- ANIMATION FLOTTANTE ---
  objetsCliquables.forEach((objet, i) => {
    if (objet.userData.flotte && objet.userData.flotteActive !== false) {
      const vitesse = objet.userData.vitesse || 0.8;
      const amplitude = objet.userData.amplitude || 0.08;
      const offsetTiming = i * 1.2;
      const cibleAnimation = objet.parent || objet;
      cibleAnimation.position.y =
        objet.userData.baseY +
        Math.sin(elapsedTime * vitesse + offsetTiming) * amplitude;
    }
  });

  // --- LOD ---
  scene.traverse((objet) => {
    if (objet instanceof THREE.LOD) objet.update(camera);
  });

  renderer.render(scene, camera);
  stats.update();
  perfData.polygones = renderer.info.render.triangles;
  perfData.drawCalls = renderer.info.render.calls;
  perfData.geometries = renderer.info.memory.geometries;
};

animate();
