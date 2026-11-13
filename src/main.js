import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { DRACOLoader } from "three/examples/jsm/loaders/DRACOLoader.js";
import { mergeGeometries } from "three/examples/jsm/utils/BufferGeometryUtils.js";
import nipplejs from "nipplejs";
import resize from "./resize.js";
import { disneyData } from "./disneyData.js";

// =========================================================================
// 🛠️ 1. CONFIGURATION GLOBALE ET PROFIL MATÉRIEL (LOW-END FIRST)
// =========================================================================
const MODE_DEV = false; // Mets sur 'false' pour le rendu final !
window.easterEggDebloque = false;

const isTouchDevice = "ontouchstart" in window || navigator.maxTouchPoints > 0;
const isMobile =
  window.innerWidth < 768 ||
  (isTouchDevice && Math.min(window.innerWidth, window.innerHeight) < 768);

const hardwareLowHint =
  isMobile ||
  (typeof navigator.hardwareConcurrency === "number" &&
    navigator.hardwareConcurrency <= 4) ||
  (typeof navigator.deviceMemory === "number" && navigator.deviceMemory <= 4);

const TOTAL_OBJETS = disneyData.length;

// Sauvegarde persistante (entre rafraîchissements)
let savedGame = null;
try {
  const parsed = JSON.parse(localStorage.getItem("popcorn_save") || "null");
  if (
    parsed &&
    Array.isArray(parsed.foundIds) &&
    parsed.foundIds.length > 0 &&
    (parsed.vies ?? 1) > 0 &&
    parsed.foundIds.length < TOTAL_OBJETS
  ) {
    savedGame = {
      foundIds: parsed.foundIds.filter((id) => typeof id === "string"),
      score: Number(parsed.score) || 0,
      vies: Math.max(1, Number(parsed.vies) || 3),
      difficulty: parsed.difficulty || "normal",
    };
  }
} catch {
  savedGame = null;
}
window.__foundPropIds = savedGame ? [...savedGame.foundIds] : [];
window.hasSavedProgression = Boolean(savedGame);

// =========================================================================
// 🌍 2. INITIALISATION DE LA SCÈNE 3D (Scène, Caméra, Renderer)
// =========================================================================
const scene = new THREE.Scene();
const propHitboxes = [];
const objetsCliquables = [];
const lodsScene = [];
const visiblePropHitboxes = [];
const maisonBlockingMeshes = [];

const camera = new THREE.PerspectiveCamera(
  75,
  window.innerWidth / window.innerHeight,
  0.5,
  500,
);
camera.position.set(0, 23, 5);

const canvas = document.querySelector("#webgl");
const renderer = new THREE.WebGLRenderer({
  canvas,
  antialias: !isMobile && !hardwareLowHint,
  powerPreference: "high-performance",
});
renderer.setSize(window.innerWidth, window.innerHeight);

// Détection GPU pour adapter résolution, textures (Option B) et distances LOD
const gl = renderer.getContext();
const gpuExt = gl.getExtension("WEBGL_debug_renderer_info");
const gpuName = gpuExt
  ? String(gl.getParameter(gpuExt.UNMASKED_RENDERER_WEBGL) || "").toLowerCase()
  : "";
const isWeakGpu =
  /intel|mali|adreno|powervr|videocore|vivante|swiftshader|llvmpipe|microsoft basic|softpipe/i.test(
    gpuName,
  );
const isLowEnd =
  isMobile ||
  isWeakGpu ||
  (!gpuName && hardwareLowHint) ||
  (typeof navigator.deviceMemory === "number" && navigator.deviceMemory <= 4);

window.lodDist = isMobile ? 250 : isLowEnd ? 300 : 380;

// État DRS (Résolution Dynamique)
const DRS_STEPS = [1.0, 0.85, 0.72, 0.6];
let drsStepIdx = 0;
let drsScale = 1.0;
let drsLodFactor = 1.0;
window.drsEnabled = localStorage.getItem("popcorn_drs") !== "false";
window.drsScale = 1.0;

const getBasePixelRatio = () => {
  if (isMobile || isLowEnd) return 1;
  return Math.min(window.devicePixelRatio || 1, 2);
};

const getTargetPixelRatio = () => {
  if (window.easterEggDebloque) return 0.37;
  const base = getBasePixelRatio();
  if (!window.drsEnabled) return base;
  return Math.max(0.55, Number((base * drsScale).toFixed(2)));
};

window.setDrsEnabled = (enabled) => {
  window.drsEnabled = Boolean(enabled);
  localStorage.setItem("popcorn_drs", String(window.drsEnabled));
  if (!window.drsEnabled) {
    drsStepIdx = 0;
    drsScale = 1.0;
    drsLodFactor = 1.0;
    window.drsScale = 1.0;
  }
  renderer.setPixelRatio(getTargetPixelRatio());
  window.ui_majDRSBadge?.(window.drsEnabled, drsScale);
  window.demanderRendu?.();
};

renderer.setPixelRatio(getTargetPixelRatio());
renderer.shadowMap.enabled = false; // Désactivé pour économiser la VRAM
renderer.outputColorSpace = THREE.SRGBColorSpace;

// --- SKYBOX (La vue par les fenêtres) ---
const textureLoader = new THREE.TextureLoader();
const skyboxPromise = textureLoader
  .loadAsync("/pictures/cielV2.webp")
  .then((texture) => {
    texture.mapping = THREE.EquirectangularReflectionMapping;
    texture.colorSpace = THREE.SRGBColorSpace;
    scene.background = texture;
    // Économise la génération PMREM (~24 Mo VRAM) sur mobile et GPU intégrés modestes
    if (!isMobile && !isLowEnd) scene.environment = texture;
    window.demanderRendu?.();
    return texture;
  })
  .catch((err) => {
    console.warn("⚠️ Skybox indisponible :", err);
    return null;
  });

// =========================================================================
// 🎥 3. CONTRÔLES DE LA CAMÉRA (OrbitControls)
// =========================================================================
const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.dampingFactor = 0.08;
controls.enableZoom = MODE_DEV;
controls.enablePan = MODE_DEV;
controls.target.set(0, 23, 4.9);
controls.maxPolarAngle = Math.PI / 2 - 0.05;
controls.minDistance = 0.1;
controls.maxDistance = 250;
controls.update();

// =========================================================================
// 🕹️ 4. VARIABLES D'ÉTAT (Mouvement, Manette, Touches, Modales)
// =========================================================================
const padMobile = { x: 0, y: 0, actif: false };
let objetActif = null;
let renduAutorise = false;
let forceRender = true;
let joystickInitialise = false;

window.demanderRendu = () => {
  forceRender = true;
};

const estModaleOuverte = (id) => {
  const el = document.getElementById(id);
  return Boolean(el && !el.classList.contains("cache"));
};

const estIntroPresente = () =>
  Boolean(
    document.getElementById("ecran-chargement") ||
      document.getElementById("ecran-tutoriel"),
  );

const estJeuInteractif = () =>
  renduAutorise &&
  !window.enPause &&
  !estIntroPresente() &&
  !estModaleOuverte("modal-quiz") &&
  !estModaleOuverte("modal-controles") &&
  !estModaleOuverte("modal-fin");

window.activerModeRetro = () => {
  window.easterEggDebloque = !window.easterEggDebloque;
  renderer.setPixelRatio(getTargetPixelRatio());
  canvas.classList.toggle("mode-retro", window.easterEggDebloque);
  window.ui_AnimationPS2?.();
  forceRender = true;
};

const touches = {
  z: false,
  q: false,
  s: false,
  d: false,
  arrowup: false,
  arrowleft: false,
  arrowdown: false,
  arrowright: false,
};

const resetTouches = () => {
  for (const key in touches) touches[key] = false;
  padMobile.x = 0;
  padMobile.y = 0;
  padMobile.actif = false;
};

window.addEventListener("blur", resetTouches);
document.addEventListener("visibilitychange", () => {
  if (document.hidden) resetTouches();
  else forceRender = true;
});

// Outils dev initialisés uniquement si MODE_DEV === true
let transformControls = null;
let gui = null;
let stats = null;
let dossierSelection = null;
let debugManette = null;
const debugConfig = { afficherHitboxes: false };
const perfData = { polygones: 0, drawCalls: 0, geometries: 0 };

window.deselectionnerObjet = () => {
  objetActif = null;
  const direction = new THREE.Vector3();
  camera.getWorldDirection(direction);
  controls.target.copy(camera.position).add(direction.multiplyScalar(0.1));
  controls.update();

  transformControls?.detach();
  const gardeBlocage =
    window.enPause ||
    estModaleOuverte("modal-fin") ||
    estModaleOuverte("modal-controles");
  window.bloquerControles3D?.(gardeBlocage);
  document.getElementById("modal-quiz")?.classList.add("cache");

  if (dossierSelection) {
    dossierSelection.destroy();
    dossierSelection = gui?.addFolder("Aucun objet sélectionné") || null;
  }
  forceRender = true;
};

window.resetCamera = () => {
  camera.position.set(0, 23, 5);
  controls.target.set(0, 23, 4.9);
  controls.update();
  forceRender = true;
};

window.addEventListener("keyup", (e) => {
  const k = e.key.toLowerCase();
  if (Object.hasOwn(touches, k)) touches[k] = false;
});

window.addEventListener("keydown", (e) => {
  if (e.ctrlKey || e.metaKey || e.altKey) return;
  const tag = e.target?.tagName;
  if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT") return;

  const k = e.key.toLowerCase();
  if (k.length === 1) {
    window.seqClavier = ((window.seqClavier || "") + k).slice(-6);
    if (window.seqClavier === "mickey") window.activerModeRetro();
  }

  if (Object.hasOwn(touches, k)) touches[k] = true;
  if (MODE_DEV) {
    if (k === "g") transformControls?.setMode("translate");
    if (k === "r") transformControls?.setMode("rotate");
  }
  if (k === "e" && objetActif && !estModaleOuverte("modal-quiz")) {
    window.deselectionnerObjet();
  }
  if (e.key === "Escape") {
    if (estModaleOuverte("modal-controles")) {
      window.ui_fermerControles?.();
    } else if (estModaleOuverte("modal-quiz")) {
      window.ui_fermerQuiz?.();
    } else if (
      renduAutorise &&
      !estIntroPresente() &&
      !estModaleOuverte("modal-fin")
    ) {
      window.togglePause?.();
    }
  }
});

// =========================================================================
// ⏸️ SYSTÈME DE PAUSE
// =========================================================================
window.enPause = false;
window.togglePause = () => {
  if (estIntroPresente() || estModaleOuverte("modal-fin")) return;
  window.enPause = !window.enPause;
  if (window.enPause) resetTouches();
  window.bloquerControles3D?.(window.enPause);
  window.ui_syncPause?.();
  forceRender = true;
};

// =========================================================================
// 📱 5. INITIALISATION DU JOYSTICK MOBILE (Nipple.js)
// =========================================================================
window.lancerJeu3D = () => {
  window.finaliserPrechargementGPU?.();
  if (joystickInitialise) return;
  if (isTouchDevice || isMobile) {
    const zoneJoystick = document.getElementById("zone-joystick");
    if (zoneJoystick) {
      joystickInitialise = true;
      zoneJoystick.style.touchAction = "none";
      zoneJoystick.addEventListener("touchstart", (e) => e.stopPropagation(), {
        passive: false,
      });

      const joystick = nipplejs.create({
        zone: zoneJoystick,
        mode: "dynamic",
        color: "white",
        restOpacity: 0.75,
      });

      joystick.on("move", (evt, data) => {
        const v = data?.vector || evt?.data?.vector;
        if (!v) return;
        padMobile.x = v.x;
        padMobile.y = v.y;
        padMobile.actif = true;
      });

      joystick.on("start", () => {
        if (controls) controls.enabled = false;
      });
      joystick.on("end", () => {
        padMobile.x = 0;
        padMobile.y = 0;
        padMobile.actif = false;
        if (controls && !window.enPause) controls.enabled = true;
      });
    }
  }
  forceRender = true;
};

window.bloquerControles3D = (etat) => {
  if (controls) controls.enabled = !etat;
};

// =========================================================================
// 🛠️ 6. OUTILS DÉVELOPPEUR (Chargement dynamique uniquement si MODE_DEV)
// =========================================================================
async function initDevTools() {
  if (!MODE_DEV) return;
  const [{ default: GUI }, { TransformControls }, { default: Stats }] =
    await Promise.all([
      import("lil-gui"),
      import("three/examples/jsm/controls/TransformControls.js"),
      import("three/examples/jsm/libs/stats.module.js"),
    ]);

  if (!isMobile) {
    transformControls = new TransformControls(camera, renderer.domElement);
    scene.add(transformControls.getHelper());
    transformControls.addEventListener("dragging-changed", (event) => {
      if (controls) controls.enabled = !event.value;
      const cible = transformControls.object;
      if (cible && cible.userData.flotte) {
        cible.userData.flotteActive = !event.value;
        if (!event.value) cible.userData.baseY = cible.position.y;
      }
    });

    gui = new GUI();
    const dossierDebug = gui.addFolder("🛠️ Mode Debug");
    dossierDebug
      .add(debugConfig, "afficherHitboxes")
      .name("Voir Collisions")
      .onChange((val) => {
        propHitboxes.forEach((h) => {
          h.visible = val;
        });
        forceRender = true;
      });

    const lumiereDossier = gui.addFolder("Éclairage");
    lumiereDossier
      .add(dirLight, "intensity")
      .min(0)
      .max(10)
      .step(0.1)
      .name("Soleil");

    dossierSelection = gui.addFolder("Aucun objet sélectionné");

    const outils = {
      exporter: () => {
        const data = propHitboxes
          .map((o) => {
            const lod = o.parent || o;
            const y = lod.userData.flotte ? lod.userData.baseY : lod.position.y;
            return `${lod.name} | x: ${lod.position.x.toFixed(2)}, y: ${y.toFixed(2)}, z: ${lod.position.z.toFixed(2)} | rotX: ${lod.rotation.x.toFixed(3)}, rotY: ${lod.rotation.y.toFixed(3)}, rotZ: ${lod.rotation.z.toFixed(3)} | scale: ${lod.scale.x.toFixed(2)}`;
          })
          .join("\n");
        navigator.clipboard?.writeText(data);
        alert("Coordonnées ET Tailles copiées ! 📋");
      },
    };
    gui.add(outils, "exporter").name("💾 Exporter Coordonnées");

    const cheats = {
      gagner: () => window.afficherFin?.(true),
      perdre: () => window.afficherFin?.(false),
      respawn: () => document.getElementById("btn-recommencer")?.click(),
    };
    const cheatFolder = gui.addFolder("🎭 God Mode (Cheat)");
    cheatFolder.add(cheats, "gagner").name("🏆 Forcer Victoire");
    cheatFolder.add(cheats, "perdre").name("💀 Forcer Game Over");
    cheatFolder.add(cheats, "respawn").name("🔄 Forcer Respawn");

    stats = new Stats();
    document.body.appendChild(stats.dom);
    const perfFolder = gui.addFolder("Moniteur d'Activité");
    perfFolder.add(perfData, "polygones").name("Triangles").listen();
    perfFolder.add(perfData, "drawCalls").name("Draw Calls").listen();
    perfFolder.add(perfData, "geometries").name("Géométries (RAM)").listen();
  }

  debugManette = document.createElement("div");
  debugManette.style.cssText =
    "position:fixed;top:10px;left:10px;background:rgba(0,0,0,0.8);color:lime;padding:10px;font-family:monospace;z-index:99999;pointer-events:none;";
  document.body.appendChild(debugManette);
}

// =========================================================================
// 🎨 HELPERS TEXTURES & MULTI-LOD (OPTION B + BOUILLIE DE TEXTURES LOD3)
// =========================================================================
function downscaleTextureInPlace(tex, maxDim, processedSet) {
  if (!tex || !tex.image || processedSet.has(tex)) return;
  processedSet.add(tex);
  const img = tex.image;
  const w = img.width || img.naturalWidth || 0;
  const h = img.height || img.naturalHeight || 0;
  if (!w || !h || Math.max(w, h) <= maxDim) return;

  const scale = maxDim / Math.max(w, h);
  const nw = Math.max(1, Math.round(w * scale));
  const nh = Math.max(1, Math.round(h * scale));
  const c = document.createElement("canvas");
  c.width = nw;
  c.height = nh;
  const ctx = c.getContext("2d");
  if (!ctx) return;
  ctx.drawImage(img, 0, 0, nw, nh);
  if (typeof img.close === "function") img.close();
  tex.image = c;
  tex.needsUpdate = true;
}

function downscaleRootTextures(root, maxBasePx, maxAuxPx) {
  const seen = new WeakSet();
  root.traverse((obj) => {
    if (!obj.isMesh || !obj.material) return;
    const mats = Array.isArray(obj.material) ? obj.material : [obj.material];
    for (const m of mats) {
      if (m.map) downscaleTextureInPlace(m.map, maxBasePx, seen);
      if (m.emissiveMap) downscaleTextureInPlace(m.emissiveMap, maxBasePx, seen);
      ["normalMap", "roughnessMap", "metalnessMap", "aoMap"].forEach((k) => {
        if (m[k]) downscaleTextureInPlace(m[k], maxAuxPx, seen);
      });
    }
  });
}

function createBouillieTexture(srcTex, cache) {
  if (!srcTex || !srcTex.image) return null;
  if (cache.has(srcTex)) return cache.get(srcTex);
  const img = srcTex.image;
  const w = img.width || img.naturalWidth || 0;
  const h = img.height || img.naturalHeight || 0;
  if (!w || !h) return srcTex;

  // Mini-texture 64x64 lissée (~16 Ko VRAM) pour LOD3 lointain sans bouillie pixelisée
  const size = 64;
  const c = document.createElement("canvas");
  c.width = size;
  c.height = size;
  const ctx = c.getContext("2d");
  if (!ctx) return srcTex;
  ctx.imageSmoothingEnabled = true;
  ctx.drawImage(img, 0, 0, size, size);

  const tinyTex = new THREE.CanvasTexture(c);
  tinyTex.colorSpace = srcTex.colorSpace;
  tinyTex.flipY = srcTex.flipY;
  tinyTex.wrapS = srcTex.wrapS;
  tinyTex.wrapT = srcTex.wrapT;
  tinyTex.minFilter = THREE.LinearFilter;
  tinyTex.magFilter = THREE.LinearFilter;
  tinyTex.generateMipmaps = false;
  tinyTex.needsUpdate = true;
  cache.set(srcTex, tinyTex);
  return tinyTex;
}

function convertToLOD2Materials(root) {
  const matCache = new Map();
  const convertOne = (m) => {
    if (matCache.has(m)) return matCache.get(m);
    const lambert = new THREE.MeshLambertMaterial({
      color: m.color ? m.color.clone() : new THREE.Color(0xffffff),
      map: m.map || null,
      transparent: Boolean(m.transparent),
      opacity: m.opacity ?? 1,
      alphaTest: m.alphaTest || 0,
      side: m.side ?? THREE.FrontSide,
      emissive: m.emissive ? m.emissive.clone() : new THREE.Color(0x000000),
      emissiveMap: m.emissiveMap || null,
      emissiveIntensity: m.emissiveIntensity ?? 1,
    });
    matCache.set(m, lambert);
    return lambert;
  };
  root.traverse((obj) => {
    if (!obj.isMesh || !obj.material) return;
    obj.material = Array.isArray(obj.material)
      ? obj.material.map(convertOne)
      : convertOne(obj.material);
  });
}

function convertToLOD3BouillieMaterials(root, bouillieCache) {
  const matCache = new Map();
  const convertOne = (m) => {
    if (matCache.has(m)) return matCache.get(m);
    const baseCol = m.color ? m.color.clone().multiplyScalar(0.88) : new THREE.Color(0xe0e0e0);
    const basic = new THREE.MeshBasicMaterial({
      color: baseCol,
      map: m.map ? createBouillieTexture(m.map, bouillieCache) : null,
      transparent: Boolean(m.transparent),
      opacity: m.opacity ?? 1,
      alphaTest: m.alphaTest || 0,
      side: m.side ?? THREE.FrontSide,
    });
    matCache.set(m, basic);
    return basic;
  };
  root.traverse((obj) => {
    if (!obj.isMesh || !obj.material) return;
    obj.material = Array.isArray(obj.material)
      ? obj.material.map(convertOne)
      : convertOne(obj.material);
  });
}

function disposeUnusedSubtree(unusedRoot, keptRoots) {
  const keptGeoms = new Set();
  const keptMats = new Set();
  for (const r of keptRoots) {
    if (!r) continue;
    r.traverse((obj) => {
      if (!obj.isMesh) return;
      if (obj.geometry) keptGeoms.add(obj.geometry);
      const mats = Array.isArray(obj.material) ? obj.material : [obj.material];
      mats.forEach((m) => m && keptMats.add(m));
    });
  }
  unusedRoot.traverse((obj) => {
    if (!obj.isMesh) return;
    if (obj.geometry && !keptGeoms.has(obj.geometry)) obj.geometry.dispose();
    const mats = Array.isArray(obj.material) ? obj.material : [obj.material];
    mats.forEach((m) => m && !keptMats.has(m) && m.dispose());
  });
}

// =========================================================================
// 📦 7. CHARGEMENT DES ASSETS 3D, BATCHING MAISON & MURS BLOQUANTS
// =========================================================================
const manager = new THREE.LoadingManager();
const mursCollisionBoxes = [];

setTimeout(() => {
  const btn = document.getElementById("btn-decouvrir");
  if (btn && btn.classList.contains("cache")) btn.classList.remove("cache");
}, 10000);

let dernierPourcentage = 0;
manager.onProgress = (_url, loaded, total) => {
  const el = document.getElementById("loading-percent");
  const actuel = Math.round((loaded / total) * 100);
  if (el && actuel > dernierPourcentage) {
    dernierPourcentage = actuel;
    el.textContent = `${actuel}%`;
  }
};

manager.onLoad = () =>
  console.log("✅ Fichiers 3D téléchargés en mémoire locale.");
manager.onError = (url) => {
  if (!isMobile) alert(`Le fichier ${url} refuse de charger.`);
};

const loader = new GLTFLoader(manager);
const dracoLoader = new DRACOLoader();
dracoLoader.setDecoderPath("/draco/");
dracoLoader.setWorkerLimit(1);
loader.setDRACOLoader(dracoLoader);

function optimizeMaisonGeometryAndCollisions(maison) {
  maison.updateMatrixWorld(true);

  const wallMeshes = [];
  const staticMeshes = [];
  const boxTmp = new THREE.Box3();
  const sizeTmp = new THREE.Vector3();
  const centerTmp = new THREE.Vector3();

  maison.traverse((obj) => {
    if (!obj.isMesh) return;
    if (obj.name.includes("MurFictif")) {
      boxTmp.setFromObject(obj);
      mursCollisionBoxes.push({
        minX: boxTmp.min.x,
        maxX: boxTmp.max.x,
        minY: boxTmp.min.y,
        maxY: boxTmp.max.y,
        minZ: boxTmp.min.z,
        maxZ: boxTmp.max.z,
      });
      wallMeshes.push(obj);
      return;
    }

    const geom = obj.geometry;
    if (
      !geom ||
      !obj.material ||
      Array.isArray(obj.material) ||
      obj.isSkinnedMesh ||
      obj.morphTargetInfluences ||
      obj.matrixWorld.determinant() <= 0 ||
      Object.values(geom.attributes).some((a) => a.isInterleavedBufferAttribute)
    ) {
      return;
    }

    boxTmp.setFromObject(obj);
    boxTmp.getSize(sizeTmp);
    if (sizeTmp.x > 100 || sizeTmp.z > 100) return;

    boxTmp.getCenter(centerTmp);
    staticMeshes.push({
      mesh: obj,
      cellX: Math.floor(centerTmp.x / 80),
      cellZ: Math.floor(centerTmp.z / 80),
    });
  });

  const replacedGeoms = new Set();
  for (const wall of wallMeshes) {
    if (wall.geometry) replacedGeoms.add(wall.geometry);
    wall.parent?.remove(wall);
  }

  const buckets = new Map();
  for (const entry of staticMeshes) {
    const { mesh, cellX, cellZ } = entry;
    const geom = mesh.geometry;
    const isIndexed = geom.index ? 1 : 0;
    const attrSig = Object.keys(geom.attributes).sort().join(",");
    const key = `${mesh.material.uuid}|${isIndexed}|${attrSig}|${cellX},${cellZ}`;
    let list = buckets.get(key);
    if (!list) {
      list = [];
      buckets.set(key, list);
    }
    list.push(mesh);
  }

  const invMaisonWorld = new THREE.Matrix4().copy(maison.matrixWorld).invert();
  const relMatrix = new THREE.Matrix4();

  for (const meshes of buckets.values()) {
    if (meshes.length < 2) continue;
    const clones = meshes.map((m) => {
      const cloned = m.geometry.clone();
      relMatrix.copy(invMaisonWorld).multiply(m.matrixWorld);
      cloned.applyMatrix4(relMatrix);
      return cloned;
    });

    const merged = mergeGeometries(clones, false);
    clones.forEach((c) => c.dispose());
    if (!merged) continue;

    merged.computeBoundingBox();
    merged.computeBoundingSphere();

    const batchedMesh = new THREE.Mesh(merged, meshes[0].material);
    batchedMesh.name = "Maison_ZoneBatch";
    batchedMesh.frustumCulled = true;
    batchedMesh.matrixAutoUpdate = false;
    batchedMesh.updateMatrix();
    maison.add(batchedMesh);

    for (const m of meshes) {
      if (m.geometry) replacedGeoms.add(m.geometry);
      m.parent?.remove(m);
    }
  }

  const activeGeoms = new Set();
  maisonBlockingMeshes.length = 0;
  maison.traverse((obj) => {
    if (!obj.isMesh) return;
    if (obj.geometry) activeGeoms.add(obj.geometry);
    obj.matrixAutoUpdate = false;
    const mats = Array.isArray(obj.material) ? obj.material : [obj.material];
    const opaque = mats.every(
      (m) => m && !m.transparent && (m.opacity ?? 1) >= 0.99,
    );
    if (opaque) maisonBlockingMeshes.push(obj);
  });
  for (const geom of replacedGeoms) {
    if (!activeGeoms.has(geom)) geom.dispose();
  }
  maison.updateMatrixWorld(true);
}

const hitboxMaterial = new THREE.MeshBasicMaterial({
  color: 0xffd700,
  transparent: true,
  opacity: 0.4,
  wireframe: true,
  depthWrite: false,
});

let solHitbox = null;

// --- OPTIMISATION OPTION A : VISION-CONE (FRUSTUM) + 4 NIVEAUX LOD (OPTION B) ---
const frustum = new THREE.Frustum();
const projScreenMatrix = new THREE.Matrix4();

function updateVisionCulling() {
  camera.updateMatrixWorld();
  projScreenMatrix.multiplyMatrices(
    camera.projectionMatrix,
    camera.matrixWorldInverse,
  );
  frustum.setFromProjectionMatrix(projScreenMatrix);

  const camPos = camera.position;
  const effLodDist = window.lodDist * drsLodFactor;
  visiblePropHitboxes.length = 0;

  for (let i = 0; i < lodsScene.length; i++) {
    const lod = lodsScene[i];
    const sphere = lod.userData._cullSphere;
    if (!sphere) continue;

    if (lod.userData.flotte) {
      sphere.center.y =
        lod.userData._cullBaseY + (lod.position.y - lod.userData._basePosY);
    }

    const dx = sphere.center.x - camPos.x;
    const dy = sphere.center.y - camPos.y;
    const dz = sphere.center.z - camPos.z;
    const distSq = dx * dx + dy * dy + dz * dz;
    const maxDist = effLodDist + sphere.radius;

    const visible = distSq < maxDist * maxDist && frustum.intersectsSphere(sphere);
    lod.visible = visible;
    if (visible) {
      lod.update(camera);
      if (lod.userData._hitbox) visiblePropHitboxes.push(lod.userData._hitbox);
    }
  }
}

const TEXTURE_SLOTS = [
  "map",
  "normalMap",
  "aoMap",
  "emissiveMap",
  "roughnessMap",
  "metalnessMap",
  "bumpMap",
  "lightMap",
  "alphaMap",
];
const warmedTextures = new WeakSet();
const warmupTextureQueue = [];
let warmupRafId = 0;
let warmupTexturesPerFrame = isMobile || isLowEnd ? 2 : 4;
let gpuPreloadRequested = false;
let pmremWarmed = false;
let chargementModelesTermine = false;

function collectSceneTextures() {
  const pushTex = (tex) => {
    if (tex && tex.isTexture && !warmedTextures.has(tex)) {
      warmedTextures.add(tex);
      warmupTextureQueue.push(tex);
    }
  };
  pushTex(scene.background);
  pushTex(scene.environment);
  scene.traverse((child) => {
    if (!child.isMesh || !child.material) return;
    const mats = Array.isArray(child.material)
      ? child.material
      : [child.material];
    for (let i = 0; i < mats.length; i++) {
      const mat = mats[i];
      if (!mat) continue;
      for (let k = 0; k < TEXTURE_SLOTS.length; k++) {
        pushTex(mat[TEXTURE_SLOTS[k]]);
      }
    }
  });
}

function warmInitialRenderPass() {
  if (pmremWarmed || !chargementModelesTermine) return;
  pmremWarmed = true;
  updateVisionCulling();
  renderer.render(scene, camera);
}

function pumpTextureWarmup() {
  warmupRafId = 0;
  let count = 0;
  while (warmupTextureQueue.length > 0 && count < warmupTexturesPerFrame) {
    const tex = warmupTextureQueue.shift();
    try {
      renderer.initTexture(tex);
    } catch {}
    count++;
  }
  if (warmupTextureQueue.length > 0) {
    warmupRafId = window.requestAnimationFrame(pumpTextureWarmup);
  } else {
    // Génère le PMREM envMap et amorce le pipeline GPU tant que le tuto/chargement masque la scène
    warmInitialRenderPass();
  }
}

function flushTextureWarmup() {
  if (warmupRafId) {
    window.cancelAnimationFrame(warmupRafId);
    warmupRafId = 0;
  }
  while (warmupTextureQueue.length > 0) {
    const tex = warmupTextureQueue.shift();
    try {
      renderer.initTexture(tex);
    } catch {}
  }
  warmInitialRenderPass();
}

window.prechargerToutTuto = () => {
  gpuPreloadRequested = true;
  warmupTexturesPerFrame = isMobile || isLowEnd ? 4 : 8;
  if (warmupTextureQueue.length > 0 && !warmupRafId) {
    warmupRafId = window.requestAnimationFrame(pumpTextureWarmup);
  } else if (chargementModelesTermine && warmupTextureQueue.length === 0) {
    warmInitialRenderPass();
  }
};

window.finaliserPrechargementGPU = () => {
  gpuPreloadRequested = true;
  flushTextureWarmup();
  drsLastTime = performance.now();
  stepAccumule = intervalleFPS;
  renduAutorise = true;
  forceRender = true;
};

const chargerTout = async () => {
  manager.itemStart("chargement_sequentiel");

  // --- CHARGEMENT DE LA MAISON ---
  try {
    const gltfMaison = await loader.loadAsync("/assets/MaisonV3.glb");
    const maison = gltfMaison.scene;
    maison.scale.set(15, 15, 15);
    maison.name = "Maison";
    // Réduction dynamique en RAM des textures de la maison à 512px max sur mobile / petit PC
    if (isMobile || isLowEnd) {
      downscaleRootTextures(maison, 512, 256);
    }
    optimizeMaisonGeometryAndCollisions(maison);
    scene.add(maison);

    solHitbox = new THREE.Mesh(
      new THREE.BoxGeometry(300, 1, 300),
      hitboxMaterial,
    );
    solHitbox.name = "Maison";
    solHitbox.position.y = -0.5;
    solHitbox.visible = false;
    solHitbox.matrixAutoUpdate = false;
    solHitbox.updateMatrix();
    scene.add(solHitbox);
    objetsCliquables.push(solHitbox);
  } catch (e) {
    console.error("❌ Erreur Maison", e);
  }

  await new Promise((resolve) => setTimeout(resolve, isMobile ? 250 : 100));

  // --- CHARGEMENT DES OBJETS DISNEY (AVEC REPRISE DE SAUVEGARDE & 4 LODs OPTION B) ---
  const savedSet = new Set(window.__foundPropIds);
  const tailleTmp = new THREE.Vector3();
  const centerTmp = new THREE.Vector3();
  const boiteTmp = new THREE.Box3();
  const worldBoxTmp = new THREE.Box3();

  for (const item of disneyData) {
    if (savedSet.has(item.id)) continue; // Déjà trouvé dans la sauvegarde : ne même pas le charger !

    const lod = new THREE.LOD();
    lod.autoUpdate = false;
    lod.name = item.id;
    lod.userData.id = item.id;
    lod.userData.nom = item.nom || item.id;

    if (item.flotte) {
      Object.assign(lod.userData, {
        flotte: true,
        flotteActive: true,
        baseY: item.y || 0,
        vitesse: item.vitesse || 0.8,
        amplitude: item.amplitude || 0.08,
      });
    }

    lod.position.set(item.x || 0, item.y || 0, item.z || 0);
    lod.rotation.set(item.rotX || 0, item.rotY || 0, item.rotZ || 0);
    const scale = item.scale || 1;
    lod.scale.setScalar(scale);

    try {
      const gltf = await loader.loadAsync(`/assets/${item.id}.glb`);
      const node0 = gltf.scene.getObjectByName("LOD0");
      const node1 = gltf.scene.getObjectByName("LOD1");
      const node2 = gltf.scene.getObjectByName("LOD2");
      const node3 = gltf.scene.getObjectByName("LOD3");
      const refMesure = node0 || gltf.scene;

      boiteTmp.setFromObject(refMesure);
      boiteTmp.getSize(tailleTmp);
      boiteTmp.getCenter(centerTmp);

      const minWorldHit = 3.5;
      const hitbox = new THREE.Mesh(
        new THREE.BoxGeometry(
          Math.max(tailleTmp.x * 1.2, minWorldHit / scale),
          Math.max(tailleTmp.y * 1.2, minWorldHit / scale),
          Math.max(tailleTmp.z * 1.2, minWorldHit / scale),
        ),
        hitboxMaterial,
      );
      hitbox.position.copy(centerTmp);
      hitbox.name = lod.name;
      hitbox.userData = lod.userData;
      hitbox.visible = MODE_DEV && debugConfig.afficherHitboxes;

      if (node0 && node1 && node2 && node3) {
        // Réduction textures props en RAM à 512px max sur mobile / petit PC (Mac/PC garde 1024px)
        if (isMobile || isLowEnd) {
          downscaleRootTextures(node1, 512, 256);
        }

        // Dégradation progressive des shaders pour LOD2 (Lambert sans normal/ORM) & LOD3 (64x64 unlit)
        const bouillieCache = new Map();
        convertToLOD2Materials(node2);
        convertToLOD3BouillieMaterials(node3, bouillieCache);

        // Détache les 4 groupes de gltf.scene pour les greffer comme niveaux LOD propres
        gltf.scene.remove(node0, node1, node2, node3);

        lod.add(hitbox); // Pas dans levels : reste actif pour raycaster indépendamment du LOD
        lod.userData._hitbox = hitbox;
        scene.add(lod);

        // Calcul sphère de culling avant éventuellement de purger LOD0 en Option B
        lod.add(node0);
        lod.updateMatrixWorld(true);
        worldBoxTmp.setFromObject(node0);
        lod.remove(node0);

        const cullSphere = new THREE.Sphere();
        worldBoxTmp.getBoundingSphere(cullSphere);
        cullSphere.radius = cullSphere.radius * 1.15 + 2.0;
        // 1 mètre jeu ≈ 15 unités Three.js : seuil LOD1 >= ~6 m (+ grâce proportionnelle à la taille de l'objet)
        const rOff = cullSphere.radius * 1.5;

        if (isMobile || isLowEnd) {
          // Option B : LOD0 n'est JAMAIS monté dans le graphe de rendu sur petit PC / mobile
          disposeUnusedSubtree(node0, [node1, node2, node3]);
          const distBase = isMobile ? 90 : 100;
          lod.addLevel(node1, 0, 0.1);
          lod.addLevel(node2, distBase + rOff, 0.1);
          lod.addLevel(node3, distBase * 2 + rOff, 0.1);
        } else {
          // 4 niveaux complets sur PC standard / Mac / PC gamer (LOD0 net sur toute la pièce >= 6,3 m)
          lod.addLevel(node0, 0, 0.1);
          lod.addLevel(node1, 95 + rOff, 0.1);
          lod.addLevel(node2, 180 + rOff, 0.1);
          lod.addLevel(node3, 275 + rOff, 0.1);
        }

        lod.userData._cullSphere = cullSphere;
        lod.userData._cullBaseY = cullSphere.center.y;
        lod.userData._basePosY = lod.position.y;
      } else {
        // Fallback sûr si un asset n'a pas de nœuds LOD0..LOD3
        lod.addLevel(gltf.scene, 0);
        lod.add(hitbox);
        lod.userData._hitbox = hitbox;
        scene.add(lod);

        lod.updateMatrixWorld(true);
        worldBoxTmp.setFromObject(gltf.scene);
        const cullSphere = new THREE.Sphere();
        worldBoxTmp.getBoundingSphere(cullSphere);
        cullSphere.radius = cullSphere.radius * 1.15 + 2.0;
        lod.userData._cullSphere = cullSphere;
        lod.userData._cullBaseY = cullSphere.center.y;
        lod.userData._basePosY = lod.position.y;
      }

      propHitboxes.push(hitbox);
      objetsCliquables.push(hitbox);
      lodsScene.push(lod);
    } catch (error) {
      console.error("❌ Erreur sur :", item.id, error);
    }
    await new Promise((resolve) => setTimeout(resolve, isMobile ? 25 : 5));
  }

  dracoLoader.dispose();
  manager.itemEnd("chargement_sequentiel");

  await skyboxPromise;
  console.log("✅ Tous les modèles sont chargés.");

  try {
    await renderer.compileAsync(scene, camera);
  } catch {
    renderer.compile(scene, camera);
  }
  collectSceneTextures();
  if (gpuPreloadRequested) {
    warmupTexturesPerFrame = isMobile || isLowEnd ? 4 : 8;
  }

  await initDevTools();
  updateVisionCulling();
  chargementModelesTermine = true;

  if (MODE_DEV || sessionStorage.getItem("skipIntro") === "true") {
    flushTextureWarmup();
    renduAutorise = true;
  } else {
    if (warmupTextureQueue.length > 0 && !warmupRafId) {
      warmupRafId = window.requestAnimationFrame(pumpTextureWarmup);
    } else if (warmupTextureQueue.length === 0) {
      warmInitialRenderPass();
    }
    renduAutorise = !estIntroPresente();
  }
  drsLastTime = performance.now();
  forceRender = true;
  window.ui_majDRSBadge?.(window.drsEnabled, drsScale);

  if (MODE_DEV) {
    if (isMobile) {
      const s = document.createElement("script");
      s.src = "//cdn.jsdelivr.net/npm/eruda";
      document.head.appendChild(s);
      s.onload = () => window.eruda?.init();
    }
    document.getElementById("ecran-chargement")?.remove();
    document.getElementById("ecran-tutoriel")?.remove();
    window.initialiserHUD?.(TOTAL_OBJETS, savedGame);
    window.lancerJeu3D?.();
  } else if (sessionStorage.getItem("skipIntro") === "true") {
    sessionStorage.removeItem("skipIntro");
    document.getElementById("ecran-chargement")?.remove();
    document.getElementById("ecran-tutoriel")?.remove();
    window.initialiserHUD?.(TOTAL_OBJETS, savedGame);
    window.demarrerAmbiance?.();
    window.lancerJeu3D?.();
  } else {
    const btnDecouvrir = document.getElementById("btn-decouvrir");
    const texteChargement = document.querySelector(".texte-chargement");
    if (savedGame && btnDecouvrir) {
      btnDecouvrir.textContent = `▶️ Reprendre (${savedGame.foundIds.length} / ${TOTAL_OBJETS})`;
      window.ui_preparerRepriseSauvegarde?.(TOTAL_OBJETS, savedGame);
    }
    if (btnDecouvrir && texteChargement) {
      texteChargement.style.transition = "opacity 0.5s ease";
      texteChargement.style.opacity = "0";
      setTimeout(() => (texteChargement.style.display = "none"), 500);
      setTimeout(() => btnDecouvrir.classList.remove("cache"), 400);
    }
  }
};
chargerTout();

// =========================================================================
// 💡 8. LUMIÈRES ET REDIMENSIONNEMENT
// =========================================================================
const hemiLight = new THREE.HemisphereLight(
  0xffffff,
  0x444444,
  isMobile || isLowEnd ? 3.5 : 3,
);
scene.add(hemiLight);

const dirLight = new THREE.DirectionalLight(0xffffff, 5);
dirLight.position.set(5, 10, 7);
dirLight.castShadow = false;
scene.add(dirLight);

resize(camera, renderer, getTargetPixelRatio);

// =========================================================================
// 🎯 9. INTERACTIVITÉ (Raycaster throttlé + Anti-clic à travers les murs)
// =========================================================================
const raycaster = new THREE.Raycaster();
const souris = new THREE.Vector2();
let hoverPending = false;
let hoverClientX = 0;
let hoverClientY = 0;
let dernierCurseur = "";

const setCursorSafe = (curseur) => {
  if (dernierCurseur !== curseur) {
    dernierCurseur = curseur;
    document.body.style.cursor = curseur;
  }
};

function isRayBlockedByMaison(hitDistance) {
  if (maisonBlockingMeshes.length === 0) return false;
  const prevFar = raycaster.far;
  raycaster.far = Math.max(0.1, hitDistance - 0.2);
  let blocked = false;
  try {
    blocked =
      raycaster.intersectObjects(maisonBlockingMeshes, false).length > 0;
  } finally {
    raycaster.far = prevFar;
  }
  return blocked;
}

function getUnblockedPropHit(propHits) {
  for (let i = 0; i < propHits.length; i++) {
    if (!isRayBlockedByMaison(propHits[i].distance)) return propHits[i];
  }
  return null;
}

window.addEventListener("pointermove", (event) => {
  if (isMobile || !estJeuInteractif()) {
    setCursorSafe("default");
    return;
  }
  hoverClientX = event.clientX;
  hoverClientY = event.clientY;
  if (hoverPending) return;
  hoverPending = true;

  requestAnimationFrame(() => {
    hoverPending = false;
    if (!estJeuInteractif() || visiblePropHitboxes.length === 0) {
      setCursorSafe("default");
      return;
    }
    souris.x = (hoverClientX / window.innerWidth) * 2 - 1;
    souris.y = -(hoverClientY / window.innerHeight) * 2 + 1;
    raycaster.setFromCamera(souris, camera);
    const hits = raycaster.intersectObjects(visiblePropHitboxes, false);
    const unblocked = hits.length > 0 ? getUnblockedPropHit(hits) : null;
    setCursorSafe(unblocked ? "pointer" : "default");
  });
});

let ptX = 0;
let ptY = 0;
window.addEventListener("pointerdown", (e) => {
  ptX = e.clientX;
  ptY = e.clientY;
});

window.addEventListener("pointerup", (event) => {
  if (Math.abs(event.clientX - ptX) + Math.abs(event.clientY - ptY) > 10) return;
  if (!estJeuInteractif() || event.target !== canvas) return;

  souris.x = (event.clientX / window.innerWidth) * 2 - 1;
  souris.y = -(event.clientY / window.innerHeight) * 2 + 1;
  raycaster.setFromCamera(souris, camera);

  const propHits = raycaster.intersectObjects(visiblePropHitboxes, false);
  const validPropHit =
    propHits.length > 0 ? getUnblockedPropHit(propHits) : null;

  if (validPropHit) {
    let cible = validPropHit.object;
    while (cible.parent && cible.parent.type !== "Scene") cible = cible.parent;

    objetActif = cible;
    controls.target.copy(cible.position);
    controls.update();
    forceRender = true;

    if (!MODE_DEV && window.ouvrirQuiz) {
      setCursorSafe("default");
      window.ouvrirQuiz(
        cible.userData.id || cible.name,
        cible.userData.nom || cible.name,
      );
    }
    if (MODE_DEV && transformControls) transformControls.attach(cible);

    if (dossierSelection && gui) {
      dossierSelection.destroy();
      dossierSelection = gui.addFolder("Objet : " + cible.name);
      const actionsOutils = {
        deplacer: () => transformControls?.setMode("translate"),
        tourner: () => transformControls?.setMode("rotate"),
        agrandir: () => transformControls?.setMode("scale"),
      };
      dossierSelection.add(actionsOutils, "deplacer").name("Activer Déplacement");
      dossierSelection.add(actionsOutils, "tourner").name("Activer Rotation");
      dossierSelection.add(actionsOutils, "agrandir").name("Activer Taille");
      dossierSelection.open();
    }
    return;
  }

  // Si on a cliqué sur un mur ou le sol (pas le ciel vide), on ne désélectionne pas brutalement
  const maisonOrFloor = solHitbox
    ? [...maisonBlockingMeshes, solHitbox]
    : maisonBlockingMeshes;
  if (raycaster.intersectObjects(maisonOrFloor, false).length === 0) {
    window.deselectionnerObjet();
  }
});

// 🟢 LOGIQUE DU QUIZ (Connectée à disneyData)
window.ouvrirQuiz = (idObjet) => {
  const data = disneyData.find((item) => item.id === idObjet);
  if (!data || !data.question) {
    window.objetTrouve(idObjet);
    window.sauvegarderProgression?.();
    window.deselectionnerObjet();
    return;
  }

  window.bloquerControles3D?.(true);

  if (window.ui_afficherQuiz) {
    window.ui_afficherQuiz(data, (succes) => {
      if (succes) window.objetTrouve(idObjet);
      window.deselectionnerObjet();
    });
  }
};

window.objetTrouve = (idObjet) => {
  const obj = scene.getObjectByName(idObjet);
  if (obj) {
    const disposedGeoms = new Set();
    const disposedMats = new Set();
    const disposedTexs = new Set();

    obj.traverse((child) => {
      if (child.isMesh) {
        if (child.geometry && !disposedGeoms.has(child.geometry)) {
          disposedGeoms.add(child.geometry);
          child.geometry.dispose();
        }
        if (child.material && child.material !== hitboxMaterial) {
          const mats = Array.isArray(child.material)
            ? child.material
            : [child.material];
          mats.forEach((m) => {
            if (!m || m === hitboxMaterial || disposedMats.has(m)) return;
            disposedMats.add(m);
            [
              "map",
              "normalMap",
              "aoMap",
              "emissiveMap",
              "roughnessMap",
              "metalnessMap",
            ].forEach((k) => {
              if (m[k] && !disposedTexs.has(m[k])) {
                disposedTexs.add(m[k]);
                m[k].dispose();
              }
            });
            m.dispose();
          });
        }
      }
    });
    scene.remove(obj);

    const removeByName = (arr) => {
      const idx = arr.findIndex((o) => o.name === idObjet);
      if (idx > -1) arr.splice(idx, 1);
    };
    removeByName(propHitboxes);
    removeByName(objetsCliquables);
    removeByName(visiblePropHitboxes);
    removeByName(lodsScene);
  }

  if (!window.__foundPropIds.includes(idObjet)) {
    window.__foundPropIds.push(idObjet);
  }
  window.ui_majObjetsTrouves?.(window.__foundPropIds.length, TOTAL_OBJETS);
  forceRender = true;

  if (lodsScene.length === 0) {
    window.afficherFin?.(true);
  }
};

// =========================================================================
// 🧱 COLLISIONS FLUIDES CERCLE VS AABB (GLISSEMENT CONTRE LES MURS)
// =========================================================================
function collidesWithWalls(x, y, z, radius = 1.5) {
  const r2 = radius * radius;
  for (let i = 0; i < mursCollisionBoxes.length; i++) {
    const w = mursCollisionBoxes[i];
    if (y < w.minY || y > w.maxY) continue;
    const cx = x < w.minX ? w.minX : x > w.maxX ? w.maxX : x;
    const cz = z < w.minZ ? w.minZ : z > w.maxZ ? w.maxZ : z;
    const dx = x - cx;
    const dz = z - cz;
    if (dx * dx + dz * dz < r2) return true;
  }
  return false;
}

// =========================================================================
// 🔄 10. BOUCLE D'ANIMATION PRINCIPALE (DT NORMALISÉ + DRS + VEILLE PAUSE)
// =========================================================================
const clock = new THREE.Clock();
const dirCamera = new THREE.Vector3();
const dirLaterale = new THREE.Vector3();
const offsetCam = new THREE.Vector3();
const axeY = new THREE.Vector3(0, 1, 0);

const vitesseUnitsParSec = 30;
const vitesseRotPadRad = 3.0;
const fpsMax = 60;
const intervalleFPS = 1 / fpsMax;
let stepAccumule = 0;
let hauteurJoueur = 26;

// Moniteur DRS temps réel
let drsFrames = 0;
let drsSampleMs = 0;
let drsLastTime = performance.now();
let drsLastChange = 0;
let drsGoodStreak = 0;

function updateDynamicResolution(now) {
  const frameMs = now - drsLastTime;
  drsLastTime = now;
  if (!window.drsEnabled || window.easterEggDebloque || frameMs > 250 || frameMs <= 0) {
    drsFrames = 0;
    drsSampleMs = 0;
    return;
  }
  drsFrames++;
  drsSampleMs += frameMs;
  if (drsSampleMs < 1000 || drsFrames < 15) return;

  const avgFps = (drsFrames * 1000) / drsSampleMs;
  drsFrames = 0;
  drsSampleMs = 0;

  if (avgFps < 38 && drsStepIdx < DRS_STEPS.length - 1 && now - drsLastChange > 2000) {
    drsStepIdx++;
    drsGoodStreak = 0;
    drsLastChange = now;
    drsScale = DRS_STEPS[drsStepIdx];
    drsLodFactor = Math.max(0.75, drsScale);
    window.drsScale = drsScale;
    renderer.setPixelRatio(getTargetPixelRatio());
    window.ui_majDRSBadge?.(true, drsScale);
  } else if (avgFps > 54 && drsStepIdx > 0 && now - drsLastChange > 4500) {
    drsGoodStreak++;
    if (drsGoodStreak >= 2) {
      drsStepIdx--;
      drsGoodStreak = 0;
      drsLastChange = now;
      drsScale = DRS_STEPS[drsStepIdx];
      drsLodFactor = Math.max(0.75, drsScale);
      window.drsScale = drsScale;
      renderer.setPixelRatio(getTargetPixelRatio());
      window.ui_majDRSBadge?.(true, drsScale);
    }
  } else {
    drsGoodStreak = 0;
  }
}

// Navigation manette
let padAPrevious = false;
let padBPrevious = false;
let padYPrevious = false;
let padXPrevious = false;
let padStartPrev = false;
let indexBoutonFocus = -1;
let padDirPrevious = false;

const crosshair = document.createElement("div");
crosshair.style.cssText =
  "display:none; position:fixed;top:50%;left:50%;width:6px;height:6px;background:white;border-radius:50%;transform:translate(-50%,-50%);pointer-events:none;z-index:9999;box-shadow: 0 0 4px black;";
document.body.appendChild(crosshair);

const animate = () => {
  window.requestAnimationFrame(animate);
  const rawDelta = clock.getDelta();
  if (document.hidden || !renduAutorise) {
    stepAccumule = 0;
    drsLastTime = performance.now();
    return;
  }

  stepAccumule += rawDelta;
  // Tolérance de 2 ms pour absorber la gigue VSync (évite un saut à 30 FPS sur écran 60 Hz)
  if (stepAccumule < intervalleFPS - 0.002) return;
  const dt = Math.min(stepAccumule, 0.05);
  stepAccumule = Math.min(
    Math.max(0, stepAccumule - intervalleFPS),
    intervalleFPS * 0.5,
  );

  // A. LECTURE MANETTE
  let gamepadActif = null;
  let padX = 0;
  let padY = 0;
  let padRotX = 0;
  let padRotY = 0;
  let padA = false;
  let padB = false;
  let padYBtn = false;
  let padXBtn = false;
  let padLT = 0;
  let padRT = 0;

  if (!isMobile && typeof navigator.getGamepads === "function") {
    const gamepads = navigator.getGamepads();
    for (let i = 0; i < gamepads.length; i++) {
      if (gamepads[i] && gamepads[i].connected) {
        gamepadActif = gamepads[i];
        break;
      }
    }
  }

  if (gamepadActif) {
    crosshair.style.display = estJeuInteractif() ? "block" : "none";
    if (Math.abs(gamepadActif.axes[0]) > 0.15) padX = gamepadActif.axes[0];
    if (Math.abs(gamepadActif.axes[1]) > 0.15) padY = gamepadActif.axes[1];
    if (Math.abs(gamepadActif.axes[2]) > 0.15) padRotX = gamepadActif.axes[2];
    if (Math.abs(gamepadActif.axes[3]) > 0.15) padRotY = gamepadActif.axes[3];
    padA = Boolean(gamepadActif.buttons[0]?.pressed);
    padB = Boolean(gamepadActif.buttons[1]?.pressed);
    padXBtn = Boolean(gamepadActif.buttons[2]?.pressed);
    padYBtn = Boolean(gamepadActif.buttons[3]?.pressed);
    padLT = gamepadActif.buttons[6]?.value || 0;
    padRT = gamepadActif.buttons[7]?.value || 0;

    const padStart = Boolean(gamepadActif.buttons[9]?.pressed);
    if (padStart && !padStartPrev) window.togglePause?.();
    padStartPrev = padStart;
  } else {
    crosshair.style.display = "none";
  }

  if (MODE_DEV && debugManette) {
    if (gamepadActif) {
      debugManette.innerHTML = `🕹️ L-Joy: ${padX.toFixed(2)}, ${padY.toFixed(2)} <br> 👁️ R-Joy: ${padRotX.toFixed(2)}, ${padRotY.toFixed(2)} <br> 🔫 LT:${padLT.toFixed(2)} RT:${padRT.toFixed(2)} <br> 🔘 A(${padA}) B(${padB})`;
    } else {
      debugManette.innerHTML = "❌ Pas de manette détectée";
    }
  }

  // Navigation UI QCM manette
  const quizOuvert = estModaleOuverte("modal-quiz");
  if (quizOuvert) {
    const boutons = document.querySelectorAll(".btn-option:not([disabled])");
    const padUp = padY < -0.5 || Boolean(gamepadActif?.buttons[12]?.pressed);
    const padDown = padY > 0.5 || Boolean(gamepadActif?.buttons[13]?.pressed);

    if (boutons.length > 0) {
      if (padUp && !padDirPrevious) {
        indexBoutonFocus =
          indexBoutonFocus > 0 ? indexBoutonFocus - 1 : boutons.length - 1;
      }
      if (padDown && !padDirPrevious) {
        indexBoutonFocus =
          indexBoutonFocus < boutons.length - 1 ? indexBoutonFocus + 1 : 0;
      }
      boutons.forEach((b, i) => {
        b.style.border = i === indexBoutonFocus ? "3px solid #f9ca24" : "";
        b.style.transform = i === indexBoutonFocus ? "scale(1.03)" : "";
      });
      if (padA && !padAPrevious && indexBoutonFocus >= 0) {
        boutons[indexBoutonFocus].click();
      }
    }
    padDirPrevious = padUp || padDown;
    padX = 0;
    padY = 0;
    padRotX = 0;
    padRotY = 0;
  } else {
    indexBoutonFocus = -1;
  }

  // B. BOUTONS MANETTE
  const btnPress =
    padA && !padAPrevious
      ? "A"
      : padB && !padBPrevious
        ? "B"
        : padYBtn && !padYPrevious
          ? "Y"
          : "";
  if (btnPress) {
    window.seqPad = ((window.seqPad || "") + btnPress).slice(-4);
    if (window.seqPad === "YYBA") window.activerModeRetro();
  }

  if (padA && !padAPrevious) {
    const btnDec = document.getElementById("btn-decouvrir");
    const btnSuiv = document.getElementById("btn-suivant");
    const btnRent = document.getElementById("btn-rentrer");
    if (btnDec && !btnDec.classList.contains("cache") && btnDec.style.display !== "none") {
      btnDec.click();
    } else if (btnSuiv && !btnSuiv.classList.contains("cache") && btnSuiv.style.display !== "none") {
      btnSuiv.click();
    } else if (btnRent && !btnRent.classList.contains("cache")) {
      btnRent.click();
    } else if (quizOuvert) {
      const boutons = document.querySelectorAll(".btn-option:not([disabled])");
      if (indexBoutonFocus === -1 && boutons.length > 0) indexBoutonFocus = 0;
      boutons[indexBoutonFocus]?.click();
    } else if (estModaleOuverte("modal-controles")) {
      window.ui_fermerControles?.();
    } else if (estModaleOuverte("modal-pause")) {
      document.getElementById("btn-reprendre")?.click();
    } else if (estModaleOuverte("modal-fin")) {
      document.getElementById("btn-recommencer")?.click();
    } else if (estJeuInteractif()) {
      const xc = window.innerWidth / 2;
      const yc = window.innerHeight / 2;
      canvas.dispatchEvent(new PointerEvent("pointerdown", { clientX: xc, clientY: yc }));
      canvas.dispatchEvent(new PointerEvent("pointerup", { clientX: xc, clientY: yc }));
    }
  }

  if (padB && !padBPrevious) {
    if (estModaleOuverte("modal-controles")) {
      window.ui_fermerControles?.();
    } else if (quizOuvert) {
      window.ui_fermerQuiz?.();
    } else if (window.enPause) {
      window.togglePause?.();
    } else {
      window.deselectionnerObjet();
    }
  }
  if (padXBtn && !padXPrevious && objetActif) {
    window.deselectionnerObjet();
  }

  padXPrevious = padXBtn;
  padAPrevious = padA;
  padBPrevious = padB;
  padYPrevious = padYBtn;

  // Pause ou superposition totale : économise GPU (1 seul rendu à la transition)
  if (
    window.enPause ||
    estIntroPresente() ||
    quizOuvert ||
    estModaleOuverte("modal-fin")
  ) {
    drsLastTime = performance.now();
    if (forceRender) {
      renderer.render(scene, camera);
      forceRender = false;
    }
    stats?.update();
    return;
  }

  // C. MODE DEV : DÉPLACEMENT OBJET
  if (objetActif && MODE_DEV) {
    const devStep = 12 * dt;
    let movedObj = false;
    if (touches.q || touches.arrowleft) { objetActif.translateX(-devStep); movedObj = true; }
    if (touches.d || touches.arrowright) { objetActif.translateX(devStep); movedObj = true; }
    if (touches.z || touches.arrowup) { objetActif.translateZ(-devStep); movedObj = true; }
    if (touches.s || touches.arrowdown) { objetActif.translateZ(devStep); movedObj = true; }

    if (movedObj) {
      offsetCam.subVectors(objetActif.position, controls.target);
      camera.position.add(offsetCam);
      controls.target.copy(objetActif.position);
    }
  }

  // D. DÉPLACEMENT CAMÉRA + GLISSEMENT SUR MURS
  if (!objetActif) {
    camera.getWorldDirection(dirCamera);
    dirCamera.y = 0;
    dirCamera.normalize();
    dirLaterale.crossVectors(camera.up, dirCamera).normalize();

    let fwdInput = 0;
    let sideInput = 0;

    if (touches.z || touches.arrowup) fwdInput += 1;
    if (touches.s || touches.arrowdown) fwdInput -= 1;
    if (touches.q || touches.arrowleft) sideInput += 1;
    if (touches.d || touches.arrowright) sideInput -= 1;

    if (Math.abs(padY) > 0.15) fwdInput -= padY;
    if (Math.abs(padX) > 0.15) sideInput -= padX;

    if (Math.abs(padMobile.y) > 0.05) fwdInput += padMobile.y;
    if (Math.abs(padMobile.x) > 0.05) sideInput -= padMobile.x;

    const mag = Math.hypot(fwdInput, sideInput);
    if (mag > 1) {
      fwdInput /= mag;
      sideInput /= mag;
    }

    if (mag > 0.001) {
      const distPas = vitesseUnitsParSec * dt;
      const dx = (dirCamera.x * fwdInput + dirLaterale.x * sideInput) * distPas;
      const dz = (dirCamera.z * fwdInput + dirLaterale.z * sideInput) * distPas;

      if (dx !== 0 && !collidesWithWalls(camera.position.x + dx, camera.position.y, camera.position.z)) {
        camera.position.x += dx;
        controls.target.x += dx;
      }
      if (dz !== 0 && !collidesWithWalls(camera.position.x, camera.position.y, camera.position.z + dz)) {
        camera.position.z += dz;
        controls.target.z += dz;
      }
    }

    if (Math.abs(padRotX) > 0.15) {
      offsetCam.subVectors(controls.target, camera.position);
      offsetCam.applyAxisAngle(axeY, -padRotX * vitesseRotPadRad * dt);
      controls.target.copy(camera.position).add(offsetCam);
    }
    if (Math.abs(padRotY) > 0.15) {
      const nouvelleHauteur = controls.target.y - padRotY * 12 * dt;
      const dist = camera.position.distanceTo(controls.target);
      controls.target.y = Math.max(
        camera.position.y - dist * 0.9,
        Math.min(camera.position.y + dist * 0.9, nouvelleHauteur),
      );
    }

    if (MODE_DEV && padLT > 0.1) hauteurJoueur += padLT * 24 * dt;
    if (MODE_DEV && padRT > 0.1) hauteurJoueur -= padRT * 24 * dt;
  }

  if (!objetActif) {
    const decalageY = hauteurJoueur - camera.position.y;
    camera.position.y = hauteurJoueur;
    controls.target.y += decalageY;
  }

  controls.update();

  // E. FLOTTAISON & CULLING PAR ANGLE DE VISION + 4 LODs
  const elapsedTime = clock.elapsedTime;
  for (let i = 0; i < lodsScene.length; i++) {
    const lod = lodsScene[i];
    if (lod.visible && lod.userData.flotte && lod.userData.flotteActive !== false) {
      lod.position.y =
        lod.userData.baseY +
        Math.sin(elapsedTime * lod.userData.vitesse + i * 1.2) *
          lod.userData.amplitude;
    }
  }

  updateVisionCulling();
  renderer.render(scene, camera);
  forceRender = false;
  updateDynamicResolution(performance.now());

  if (stats) {
    stats.update();
    perfData.polygones = renderer.info.render.triangles;
    perfData.drawCalls = renderer.info.render.calls;
    perfData.geometries = renderer.info.memory.geometries;
  }
};
animate();

window.nettoyerMemoire = () => {
  renduAutorise = false;
  const gSet = new Set();
  const mSet = new Set();
  const tSet = new Set();
  scene.traverse((child) => {
    if (child.isMesh) {
      if (child.geometry && !gSet.has(child.geometry)) {
        gSet.add(child.geometry);
        child.geometry.dispose();
      }
      if (child.material) {
        const mats = Array.isArray(child.material)
          ? child.material
          : [child.material];
        mats.forEach((m) => {
          if (!m || mSet.has(m)) return;
          mSet.add(m);
          [
            "map",
            "normalMap",
            "aoMap",
            "emissiveMap",
            "roughnessMap",
            "metalnessMap",
          ].forEach((k) => {
            if (m[k] && !tSet.has(m[k])) {
              tSet.add(m[k]);
              m[k].dispose();
            }
          });
          m.dispose();
        });
      }
    }
  });
  renderer.dispose();
  console.log("🧹 Mémoire WebGL purgée avec succès.");
};
