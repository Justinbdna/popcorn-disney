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
const lodsScene = []; // 👈 On déclare le tableau ici pour que tout le code le voie

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
renderer.outputColorSpace = THREE.SRGBColorSpace; // 👈 FIX LUMIÈRE NOIRE
if (isMobile) {
  renderer.setPixelRatio(1);
  THREE.Cache.clear(); // 🚫 SURTOUT PAS DE CACHE SUR IOS
}

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
const padMobile = { x: 0, y: 0, actif: false };
let objetActif = null;
let renduAutorise = false; // 👈 Le garde-barrière du GPU

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
  const zoneJoystick = document.getElementById("zone-joystick");
  
  if (zoneJoystick) { // 🛡️ SÉCURITÉ : On s'assure que la div existe avant d'attacher des events
    zoneJoystick.style.touchAction = "none";
    zoneJoystick.addEventListener("touchstart", (e) => e.stopPropagation(), { passive: false });
    
    const joystick = nipplejs.create({
      zone: zoneJoystick, mode: "dynamic", color: "white", restOpacity: 0.75
    });

    joystick.on("move", (evt, data) => {
      const v = data ? data.vector : (evt.data ? evt.data.vector : null);
      if (!v) return;
      padMobile.x = v.x;
      padMobile.y = v.y;
      padMobile.actif = true;
    });

    joystick.on("start", () => bloquerControles3D(true));
    joystick.on("end", () => {
      padMobile.x = 0; padMobile.y = 0; padMobile.actif = false;
      bloquerControles3D(false);
    });
  } else {
    console.error("❌ Impossible de lancer le joystick : div #zone-joystick introuvable.");
  }
 }
};

// --- LE BRIDGE DE SÉCURITÉ ---
window.bloquerControles3D = (etat) => {
  if (controls) controls.enabled = !etat;
};

// 5. TRANSFORM CONTROLS
const transformControls = !isMobile ? new TransformControls(camera, renderer.domElement) : null;
if (transformControls) scene.add(transformControls.getHelper());

transformControls?.addEventListener("dragging-changed", (event) => {
  if (controls) controls.enabled = !event.value;
  const cible = transformControls.object;
  if (cible && cible.userData.flotte) {
    cible.userData.flotteActive = !event.value;
    if (!event.value) {
      cible.userData.baseY = cible.position.y;
    }
  }
});

transformControls?.setMode("translate");

/// 🎮 Contrôles clavier TransformControls
window.addEventListener("keydown", (e) => {
  if (touches.hasOwnProperty(e.key)) touches[e.key] = true;
  if (e.key === "g") transformControls?.setMode("translate");
  if (e.key === "r") transformControls?.setMode("rotate");
  if (e.key === "Escape" && objetActif) {
    transformControls.detach();
    objetActif = null;
    dossierSelection.destroy();
    dossierSelection = gui?.addFolder("Aucun objet sélectionné");
  }
});

// --- INITIALISATION DU MENU (GUI) ---
const gui = !isMobile ? new GUI() : null;
const debugConfig = { afficherHitboxes: false };
const dossierDebug = gui?.addFolder("🛠️ Mode Debug");
dossierDebug?.add(debugConfig, "afficherHitboxes")
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

// 🆘 SÉCURITÉ SAFARI : Fallback
setTimeout(() => {
  const btn = document.getElementById("btn-decouvrir");
  if (btn && btn.classList.contains("cache")) {
    console.warn("⏳ Safari rame trop, on débloque le bouton de force !");
    btn.classList.remove("cache");
  }
}, 10000); 

manager.onProgress = (url, loaded, total) => {
  const percent = Math.round((loaded / total) * 100);
  const el = document.getElementById("loading-percent");
  if (el) el.textContent = `${percent}%`;
};

manager.onLoad = () => {
  // On ne gère plus l'UI ici pour éviter les bugs asynchrones. 
  // Ce log confirme juste que les fichiers sont téléchargés en mémoire.
  console.log("✅ Fichiers 3D téléchargés en mémoire locale.");
};

manager.onError = (url) => {
  console.error("❌ Erreur critique de chargement sur : " + url);
  if (!isMobile) alert("Le fichier " + url + " refuse de charger.");
};

const loader = new GLTFLoader(manager);

// DracoLoader
const dracoLoader = new DRACOLoader();
dracoLoader.setDecoderPath("https://www.gstatic.com/draco/versioned/decoders/1.5.6/");
dracoLoader.setWorkerLimit(1); 
loader.setDRACOLoader(dracoLoader);

// 🟢 CHARGEMENT SÉQUENTIEL TOTAL (MAISON + OBJETS)
const chargerTout = async () => {
  manager.itemStart("chargement_sequentiel");

  try {
    // 1. On charge la maison en premier
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
    const solHitbox = new THREE.Mesh(new THREE.BoxGeometry(300, 1, 300), new THREE.MeshBasicMaterial({ color: 0x0000ff, transparent: true, opacity: 0, depthWrite: false }));
    solHitbox.name = "Maison"; solHitbox.position.y = -0.5;
    scene.add(solHitbox); objetsCliquables.push(solHitbox);

    // 👈 Compilation protégée (renduAutorise est encore false)
    renderer.compile(maison, camera); 
  } catch (e) { console.error("❌ Erreur Maison", e); }

  // 🫁 PAUSE VITALE : 500ms complète pour vider la RAM après la lourde Maison
  await new Promise(resolve => setTimeout(resolve, 500));

  // 2. On charge les objets Disney un par un
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
      const hitX = Math.max(taille.x * 1.5, 2.5), hitY = Math.max(taille.y * 1.5, 2.5), hitZ = Math.max(taille.z * 1.5, 2.5);
      lod.addLevel(gltf.scene, 0);

      const hitbox = new THREE.Mesh(new THREE.BoxGeometry(hitX, hitY, hitZ), new THREE.MeshBasicMaterial({ transparent: true, opacity: 0, depthWrite: false }));
      const center = new THREE.Vector3();
      boite.getCenter(center);
      hitbox.position.copy(center);
      hitbox.name = lod.name; hitbox.userData = lod.userData;
      lod.add(hitbox); objetsCliquables.push(hitbox);

      // 👈 Compilation protégée objet par objet
      renderer.compile(gltf.scene, camera); 
    } catch (error) { console.error("❌ Erreur VRAM sur :", item.id, error); }
  
    lod.addLevel(new THREE.Object3D(), 200);
    scene.add(lod);
    lodsScene.push(lod);
    
    // 🫁 RESPIRATION : Placé DANS la boucle pour libérer la VRAM
    await new Promise(resolve => setTimeout(resolve, 100));
  }

  dracoLoader.dispose();
  manager.itemEnd("chargement_sequentiel");

  // ==================================================
  // 👈 DÉPLOIEMENT DE L'INTERFACE À LA FIN ABSOLUE
  // ==================================================
  console.log("✅ Moteur 3D et Shaders compilés à 100%");

  if (MODE_DEV) {
    const ecranChargement = document.getElementById("ecran-chargement");
    if (ecranChargement) ecranChargement.remove(); 
    
    const tuto = document.getElementById("ecran-tutoriel");
    if (tuto) tuto.remove(); // Destruction totale du DOM

    if (window.lancerJeu3D) window.lancerJeu3D();
  } else {
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
  }

  renduAutorise = true; // 👈 Fin absolue, la boucle animate() prend le relais
};

chargerTout();

// 5. LA LUMIÈRE
const hemiLight = new THREE.HemisphereLight(0xffffff, 0x444444, 3);
scene.add(hemiLight);
const dirLight = new THREE.DirectionalLight(0xffffff, 5);
dirLight.position.set(5, 10, 7);
dirLight.castShadow = false;
scene.add(dirLight);

// GUI - Éclairage
const lumiereDossier = gui?.addFolder("Éclairage");
lumiereDossier?.add(dirLight, "intensity")
  .min(0)
  .max(10)
  .step(0.1)
  .name("Soleil");

// GUI - Sélection dynamique
let dossierSelection = gui?.addFolder("Aucun objet sélectionné");

const outils = {
  exporter: () => {
    const data = objetsCliquables
      .map((o) => {
        const lod = o.parent || o; 
        const y = lod.userData.flotte ? lod.userData.baseY : lod.position.y;
        return `${lod.name} | x: ${lod.position.x.toFixed(2)}, y: ${y.toFixed(2)}, z: ${lod.position.z.toFixed(2)} | rotX: ${lod.rotation.x.toFixed(3)}, rotY: ${lod.rotation.y.toFixed(3)}, rotZ: ${lod.rotation.z.toFixed(3)} | scale: ${lod.scale.x.toFixed(2)}`;
      })
      .join("\n");
    navigator.clipboard.writeText(data);
    alert("Coordonnées ET Tailles copiées ! 📋");
  },
};
gui?.add(outils, "exporter").name("💾 Exporter Coordonnées");

// --- PERFORMANCES ---
const stats = !isMobile ? new Stats() : null;
if (stats) document.body.appendChild(stats.dom);
const perfData = { polygones: 0, drawCalls: 0, geometries: 0 };
const perfFolder = gui?.addFolder("Moniteur d'Activité");
if (perfFolder) {
  perfFolder.add(perfData, "polygones").name("Triangles").listen();
  perfFolder.add(perfData, "drawCalls").name("Draw Calls").listen();
  perfFolder.add(perfData, "geometries").name("Géométries (RAM)").listen();
}

// 🔒 MODE PROD : Cache le GUI et les stats
if (!MODE_DEV) {
  gui?.hide();
  if (stats) stats.dom.style.display = "none";
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

    if (cible.name === "Maison") return;

    objetActif = cible;
    controls.target.copy(cible.position);

    if (!MODE_DEV && window.ouvrirQuiz) {
      window.ouvrirQuiz(
        cible.userData.id || cible.name,
        cible.userData.nom || cible.name,
      );
    }

    if (MODE_DEV && transformControls) {
      transformControls.attach(cible);
    }
    
    if (dossierSelection) {
      dossierSelection.destroy();
      dossierSelection = gui?.addFolder("Objet : " + cible.name);

      let polyObj = 0;
      cible.traverse((c) => {
        if (c.isMesh)
          polyObj += c.geometry.index ? c.geometry.index.count / 3 : c.geometry.attributes.position.count / 3;
      });
      dossierSelection?.add({ p: Math.round(polyObj) }, "p").name("⚖️ Poids (Triangles)").disable();

      const actionsOutils = {
        deplacer: () => transformControls?.setMode("translate"),
        tourner: () => transformControls?.setMode("rotate"),
        agrandir: () => transformControls?.setMode("scale"),
      };

      const lodParent = cible; 
      dossierSelection?.add(lodParent.position, "x").name("Pos X").listen();
      if (cible.userData.flotte) {
        dossierSelection?.add(cible.userData, "baseY").name("Pos Y (Base)").listen();
      } else {
        dossierSelection?.add(lodParent.position, "y").name("Pos Y").listen();
      }
      dossierSelection?.add(lodParent.position, "z").name("Pos Z").listen();
      dossierSelection?.add(lodParent.rotation, "x").name("Rot X").listen(); 
      dossierSelection?.add(lodParent.rotation, "y").name("Rot Y").listen(); 
      dossierSelection?.add(lodParent.rotation, "z").name("Rot Z").listen(); 

      const configScale = {
        Sabre: { min: 0.001, max: 1, step: 0.001 }, Lampe: { min: 0.001, max: 5, step: 0.01 },
        Robe: { min: 0.1, max: 10, step: 0.1 }, Chapeau: { min: 0.1, max: 10, step: 0.1 },
        Drapeau: { min: 0.1, max: 10, step: 0.1 }, CellPhone: { min: 0.001, max: 5, step: 0.01 },
      };
      const cfg = configScale[cible.name] || { min: 0.001, max: 20, step: 0.01 };

      dossierSelection?.add(lodParent.scale, "x").min(cfg.min).max(cfg.max).step(cfg.step).name("Largeur").listen();
      dossierSelection?.add(lodParent.scale, "y").min(cfg.min).max(cfg.max).step(cfg.step).name("Profondeur").listen();
      dossierSelection?.add(lodParent.scale, "z").min(cfg.min).max(cfg.max).step(cfg.step).name("Hauteur").listen();

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

// 🟢 Fonction appelée par l'UI quand le joueur trouve la bonne réponse
window.objetTrouve = (idObjet) => {
  const objetASupprimer = scene.getObjectByName(idObjet);
  if (objetASupprimer) {
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
    scene.remove(objetASupprimer);
    const index = objetsCliquables.findIndex((obj) => obj.name === idObjet);
    if (index > -1) objetsCliquables.splice(index, 1);
  }
};

// ==========================================
// 7. LA BOUCLE D'ANIMATION
// ==========================================
const clock = new THREE.Clock();
const dirRaycast = new THREE.Vector3();
const dirCamera = new THREE.Vector3();
const dirLaterale = new THREE.Vector3();
const offsetCam = new THREE.Vector3();
const axeY = new THREE.Vector3(0, 1, 0);
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
  window.requestAnimationFrame(animate); 
  const delta = clock.getDelta();
  deltaAccumule += delta;

  if (deltaAccumule < intervalleFPS) return; 
  deltaAccumule = deltaAccumule % intervalleFPS; 
  controls.update();

  // --- 🎮 LECTURE MANETTE INTELLIGENTE ---
  let gamepadActif = null;
  let padX = 0, padY = 0, padRotX = 0, padRotY = 0;
  let padA = false, padB = false, padYBtn = false;
  let padLT = 0, padRT = 0;
  padAPrevious = padA; padBPrevious = padB; padYPrevious = padYBtn;
  
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

  if (padA && !padAPrevious) {
    const uiAuCentre = document.elementFromPoint(window.innerWidth / 2, window.innerHeight / 2);
    if (uiAuCentre && (uiAuCentre.tagName === 'BUTTON' || uiAuCentre.closest('button'))) {
      uiAuCentre.click();
    } else {
     canvas.dispatchEvent(new MouseEvent("click", { clientX: window.innerWidth / 2, clientY: window.innerHeight / 2, bubbles: true }));
    }
  }

  if (padB && !padBPrevious) {
    if (objetActif) {
      transformControls?.detach();
      objetActif = null;
      if (dossierSelection) {
        dossierSelection.destroy();
        dossierSelection = gui?.addFolder("Aucun objet sélectionné");
      }
    }
  }

  if (padYBtn && !padYPrevious) {
    console.log("Bouton Y pressé - Ouverture du menu à coder !");
  }

  padAPrevious = padA; padBPrevious = padB; padYPrevious = padYBtn;
  
  if (objetActif && MODE_DEV) {
    const vitesse = 1;
    if (touches.q || touches.ArrowLeft) objetActif.translateX(-vitesse);
    if (touches.d || touches.ArrowRight) objetActif.translateX(vitesse);
    if (touches.z || touches.ArrowUp) objetActif.translateZ(-vitesse);
    if (touches.s || touches.ArrowDown) objetActif.translateZ(vitesse);

    const estEnMouvement = touches.z || touches.s || touches.q || touches.d || touches.ArrowUp || touches.ArrowDown || touches.ArrowLeft || touches.ArrowRight;
    if (estEnMouvement) {
      offsetCam.subVectors(objetActif.position, controls.target);
      camera.position.add(offsetCam);
      controls.target.copy(objetActif.position);
    }
  }

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
    dirCamera.y = 0;
    dirCamera.normalize();
    dirLaterale.crossVectors(camera.up, dirCamera).normalize();

    if (padY < -0.15 && peutBouger(dirCamera)) { camera.position.addScaledVector(dirCamera, -padY * vitesseZQSD); controls.target.addScaledVector(dirCamera, -padY * vitesseZQSD); }
    if (padY > 0.15 && peutBouger(dirCamera, true)) { camera.position.addScaledVector(dirCamera, -padY * vitesseZQSD); controls.target.addScaledVector(dirCamera, -padY * vitesseZQSD); }
    if (padX < -0.15 && peutBouger(dirLaterale)) { camera.position.addScaledVector(dirLaterale, -padX * vitesseZQSD); controls.target.addScaledVector(dirLaterale, -padX * vitesseZQSD); }
    if (padX > 0.15 && peutBouger(dirLaterale, true)) { camera.position.addScaledVector(dirLaterale, -padX * vitesseZQSD); controls.target.addScaledVector(dirLaterale, -padX * vitesseZQSD); }
    
    if (padRotX !== 0) {
      offsetCam.subVectors(controls.target, camera.position);
      offsetCam.applyAxisAngle(axeY, -padRotX * 0.05);
      controls.target.copy(camera.position).add(offsetCam);
    }
    
    if (padRotY !== 0) controls.target.y -= padRotY * 0.4; 
    if (typeof padLT !== 'undefined' && padLT > 0.1) { camera.position.y += padLT * 0.4; controls.target.y += padLT * 0.4; }
    if (typeof padRT !== 'undefined' && padRT > 0.1) { camera.position.y -= padRT * 0.4; controls.target.y -= padRT * 0.4; }

    const fM = vitesseZQSD; 
    const mY = padMobile.y;
    const mX = padMobile.x;

    if (Math.abs(mY) > 0.05 && peutBouger(dirCamera, mY < 0)) {
      camera.position.addScaledVector(dirCamera, mY * fM);
      controls.target.addScaledVector(dirCamera, mY * fM);
    }
    if (Math.abs(mX) > 0.05 && peutBouger(dirLaterale, mX > 0)) {
      camera.position.addScaledVector(dirLaterale, -mX * fM);
      controls.target.addScaledVector(dirLaterale, -mX * fM);
    }
    
    if ((touches.z || touches.ArrowUp) && peutBouger(dirCamera)) {
      camera.position.addScaledVector(dirCamera, vitesseZQSD);
      controls.target.addScaledVector(dirCamera, vitesseZQSD);
    }
    if ((touches.s || touches.ArrowDown) && peutBouger(dirCamera, true)) {
      camera.position.addScaledVector(dirCamera, -vitesseZQSD);
      controls.target.addScaledVector(dirCamera, -vitesseZQSD);
    }
    if ((touches.q || touches.ArrowLeft) && peutBouger(dirLaterale)) {
      camera.position.addScaledVector(dirLaterale, vitesseZQSD);
      controls.target.addScaledVector(dirLaterale, vitesseZQSD);
    }
    if ((touches.d || touches.ArrowRight) && peutBouger(dirLaterale, true)) {
      camera.position.addScaledVector(dirLaterale, -vitesseZQSD);
      controls.target.addScaledVector(dirLaterale, -vitesseZQSD);
    }
  }
 
  const elapsedTime = clock.getElapsedTime();

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

  lodsScene.forEach(lod => lod.update(camera));

  if (renduAutorise) renderer.render(scene, camera); 
  if (stats) stats.update();
};

animate();