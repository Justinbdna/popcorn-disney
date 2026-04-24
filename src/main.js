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

// injection d'analytics
inject();

// injection de SpeedInsights
injectSpeedInsights();

// ==========================================
// 🛠️ MODE DÉVELOPPEUR
// ==========================================
const MODE_DEV = false; // Mets sur 'false' pour le rendu final !

// 1. LA SCÈNE
const scene = new THREE.Scene();

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

// --- LE PONT AVEC L'INTERFACE ---
window.lancerJeu3D = () => {
  console.log("🎬 Le tutoriel est terminé, le jeu commence !");
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

// 🎮 Contrôles clavier TransformControls
// ⚠️ "s" retiré ici car il est réservé au déplacement d'objet
window.addEventListener("keydown", (e) => {
  if (e.key === "g") transformControls.setMode("translate");
  if (e.key === "r") transformControls.setMode("rotate");
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
  if (MODE_DEV) {
    document.getElementById("ecran-chargement").style.display = "none";
    document.getElementById("ecran-tutoriel").style.display = "none";
    if (window.lancerJeu3D) window.lancerJeu3D();
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
//T este pour identifier erreur 
manager.onError = (url) => {
  console.error("❌ Erreur critique de chargement sur : " + url);
  alert("Le fichier " + url + " refuse de charger. Vérifie le poids ou le chemin !");
};

const loader = new GLTFLoader(manager);
const objetsCliquables = [];

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

  loader.load(`/assets/${item.id}.glb`, (gltf) => {
    lod.addLevel(gltf.scene, 0);
    const boite = new THREE.Box3().setFromObject(gltf.scene);
    const taille = new THREE.Vector3();
    boite.getSize(taille);
    const hitX = Math.max(taille.x * 1.5, 2.5);
    const hitY = Math.max(taille.y * 1.5, 2.5);
    const hitZ = Math.max(taille.z * 1.5, 2.5);

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
  lod.addLevel(new THREE.Object3D(), 50);
  scene.add(lod);
});
// on ne push plus ici

// Objet 12 : Maison
loader.load("/assets/MaisonV1.glb", (gltf) => {
  const maison = gltf.scene;
  scene.add(maison);
  maison.scale.set(15, 15, 15);
  maison.name = "Maison";
  maison.position.set(0, 0, 0);
  objetsCliquables.push(maison);
});

// 5. LA LUMIÈRE
const hemiLight = new THREE.HemisphereLight(0xffffff, 0x444444, 3);
scene.add(hemiLight);
const dirLight = new THREE.DirectionalLight(0xffffff, 5);
dirLight.position.set(5, 10, 7);
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
        const vraiObjet = o.parent || o;
        const y = vraiObjet.userData.flotte
          ? vraiObjet.userData.baseY
          : vraiObjet.position.y;
        return `${vraiObjet.name} | Pos: ${vraiObjet.position.x.toFixed(2)}, ${y.toFixed(2)}, ${vraiObjet.position.z.toFixed(2)} | Scale: ${vraiObjet.scale.x.toFixed(2)}, ${vraiObjet.scale.y.toFixed(2)}, ${vraiObjet.scale.z.toFixed(2)}`;
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

// ==========================================
// 🎮 MOTEUR DE CONDUITE (STYLE GTA)
// ==========================================
let objetActif = null; // L'objet qu'on est en train de conduire
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

window.addEventListener("keydown", (e) => {
  if (touches.hasOwnProperty(e.key)) touches[e.key] = true;
  if (e.key === "Escape" && objetActif) {
    transformControls.detach();
    objetActif = null;
    dossierSelection.destroy();
    dossierSelection = gui.addFolder("Aucun objet sélectionné");
  }
});

window.addEventListener("keyup", (e) => {
  if (touches.hasOwnProperty(e.key)) touches[e.key] = false;
});

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
  document.body.style.cursor =
    hits.length > 0 && !estMaison ? "pointer" : "default";
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
    if (cible.name === "Maison") {
      transformControls.detach();
      objetActif = null;
      if (dossierSelection.title !== "Aucun objet sélectionné") {
        dossierSelection.destroy();
        dossierSelection = gui.addFolder("Aucun objet sélectionné");
      }
      return;
    }

    // 👉 On désigne cet objet comme celui qu'on conduit
    objetActif = cible;

    // Flèches 3D
    transformControls.attach(cible);

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

    dossierSelection.add(cible.rotation, "x").name("Rot X").listen();
    dossierSelection.add(cible.rotation, "y").name("Rot Y").listen();
    dossierSelection.add(cible.rotation, "z").name("Rot Z").listen();

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

// --- DOUBLE-CLIC : Déplacement caméra sur la Maison ---
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
      pointClique.y = 1.7;
      targetTarget.copy(pointClique);
      const offset = new THREE.Vector3().subVectors(
        camera.position,
        controls.target,
      );
      targetPosition.copy(pointClique).add(offset);
      moveControls = true;
      transformControls.detach();
      dossierSelection.destroy();
      dossierSelection = gui.addFolder("🚶‍♂️ Déplacement en cours...");
    }
  }
});

// ==========================================
// 7. LA BOUCLE D'ANIMATION
// ==========================================
const clock = new THREE.Clock();

const dirCamera = new THREE.Vector3();
const dirLaterale = new THREE.Vector3();
const vitesseZQSD = 0.6;

const animate = () => {
  controls.update();

  // --- 🎮 MOTEUR GTA : Déplace l'objet sélectionné ---
  if (objetActif) {
    const vitesse = 0.3;
    const vitesseRotation = 0.08;

    if (touches.q || touches.ArrowLeft)
      objetActif.rotation.y += vitesseRotation;
    if (touches.d || touches.ArrowRight)
      objetActif.rotation.y -= vitesseRotation;
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

  // --- MOTEUR GTA : Déplace la caméra avec ZQSD (quand on ne conduit pas un objet) ---
  if (!objetActif) {
    camera.getWorldDirection(dirCamera);
    dirCamera.y = 0;
    dirCamera.normalize();
    dirLaterale.crossVectors(camera.up, dirCamera).normalize();
    if (touches.z || touches.ArrowUp) {
      camera.position.addScaledVector(dirCamera, vitesseZQSD);
      controls.target.addScaledVector(dirCamera, vitesseZQSD);
    }
    if (touches.s || touches.ArrowDown) {
      camera.position.addScaledVector(dirCamera, -vitesseZQSD);
      controls.target.addScaledVector(dirCamera, -vitesseZQSD);
    }
    if (touches.q || touches.ArrowLeft) {
      camera.position.addScaledVector(dirLaterale, vitesseZQSD);
      controls.target.addScaledVector(dirLaterale, vitesseZQSD);
    }
    if (touches.d || touches.ArrowRight) {
      camera.position.addScaledVector(dirLaterale, -vitesseZQSD);
      controls.target.addScaledVector(dirLaterale, -vitesseZQSD);
    }
  }

  // --- MOTEUR DE DÉPLACEMENT CAMÉRA (DOUBLE-CLIC) ---
  if (moveControls) {
    controls.target.lerp(targetTarget, 0.05);
    camera.position.lerp(targetPosition, 0.05);
    if (controls.target.distanceTo(targetTarget) < 0.1) {
      moveControls = false;
      dossierSelection.destroy();
      dossierSelection = gui.addFolder("Aucun objet sélectionné");
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
  window.requestAnimationFrame(animate);
};

animate();
