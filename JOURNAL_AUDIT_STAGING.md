# Journal d'Audit, d'Optimisation & Passage de Relais — Branche `staging`

> **Branche concernée :** `staging` (synchronisée avec `origin/staging`)  
> **Point de départ :** `7404423` (`main`, non modifiée)  
> **État final du code :** `30995f3` (`staging` / `origin/staging`)  
> **Objectif du document :** Fournir un journal détaillé et exploitable par l'équipe ou une nouvelle conversation IA après un `git pull origin staging`, avec l'historique complet des travaux menés le 13 novembre 2026 (~4h20 de session, ~11h00 à ~15h25 `+0100`), les métriques mesurées, l'architecture en place, les tests effectués et les points restants avant merge sur `main`.

---

## 0. Reprise rapide (pour une nouvelle session / un coéquipier)

```bash
git fetch origin
git checkout staging
git pull origin staging
npm install
npm run build
npm run preview -- --host 127.0.0.1 --port 4173
```

- **Règle Git appliquée :** tous les travaux et tests intermédiaires sont poussés exclusivement sur `staging` (`origin/staging`). La branche `main` (`origin/main`) reste intouchée sur `7404423` en attente de validation finale de l'utilisateur.
- **Commits de code déjà sur `origin/staging` :**
  1. `1408e35` (`2026-11-13 13:49:19 +0100`) — `feat: optimise assets 3D multi-LOD, audio/vidéo, culling, DRS et UI mobile` (`82` fichiers modifiés, `+2352 / -1165`).
  2. `c587332` (`2026-11-13 14:30:46 +0100`) — `fix: limite à 60 FPS, précharge GPU/audio au tutoriel et affine badge/images` (`12` fichiers modifiés, `+187 / -25`).
  3. `30995f3` (`2026-11-13 15:19:15 +0100`) — `fix: lisse les arêtes, tangentes et bordures UV du badge de police` (`public/assets/badge.glb` : `619 316 -> 724 712` octets).

---

## 1. Synthèse chiffrée Avant (`main` `7404423`) vs Après (`staging` `30995f3`)

| Domaine | État initial (`main` `7404423`) | État actuel (`staging` `30995f3`) | Gain / Remarque |
| :--- | :--- | :--- | :--- |
| **Dossier `public/` global** | `~112,36 Mo` | **`58 Mo`** (`dist/` : `60 Mo`) | **-48 %** sur le poids total déployé |
| **Assets 3D (`public/assets/`)** | `26` `.glb` (`8,81 Mo`, avec `gant_mickey.glb` vide de `132 o`) | **`27` `.glb`** (`5,8 Mo`, incluant `LOD0..LOD3` + `gant_mickey.glb` + `hyene.glb`) | **4 niveaux de LOD intégrés** par prop, plafond strict `<= 4 000` tris sur `LOD0` |
| **`gant_mickey.glb`** | `132 octets` (cassé) / `20,87 Mo` (`50 000` tris, PNG 4K dans `fbebe155`) | **`96,8 Ko`** (multi-LOD Draco + WebP) | Restauré et rendu léger |
| **`hyene.glb`** | Absente de `main` (`29,07 Mo` sur une ancienne branche `origin/staging`) | **`327,3 Ko`** (multi-LOD Draco + WebP) | Intégrée et allégée |
| **VRAM textures embarquées** | `~3 015 Mo` estimés avec mipmaps (à cause de `34` maps `4096×4096` oubliées) | **`~137,4 Mo`** initiaux, puis textures WebP `<= 1024px` (`<= 512px` MR/AO) + réduction RAM mobile/low-end | Suppression du goulot VRAM (`4K` éliminées) |
| **Draw calls maison (`MaisonV3.glb`)** | `175` meshes / matériaux non groupés | **`80` meshes visibles** (`25` batchs fusionnés par cellule `80×80`) | Collisions glissantes sur `26` AABB `MurFictif*` |
| **Décodeurs Draco** | CDN externe `gstatic.com` | **Auto-hébergés dans `public/draco/`** (`752 Ko`) | Plus de dépendance réseau tiers critique au boot |
| **Vidéo & Audio (`public/pictures/` & `public/sounds/`)** | `live_background_disney.mp4` (`7,8–8,15 Mo`), pistes MP3 non uniformes, `5` médias orphelins | `live_background_disney.mp4` (`3,5 Mo`), `19` MP3 à `96 kbps` (`47 Mo`), `5` orphelins supprimés | Poids média divisé par ~2 |
| **Build JS/CSS (`npm run build`)** | Bundle monolithique + `@vercel/analytics` & `@vercel/speed-insights` | Dépendances analytics retirées, Vite `esnext` + `manualChunks` (`vendor-three` `626,40 Ko`, `vendor-ui` `20,77 Ko`, `index` `48,73 Ko`, CSS `13,10 Ko`) | Build propre en ~1,1 s |
| **Cadence & préchargement** | Micro-à-coups au spawn/regard et framerate non plafonné (`120 Hz` possible) | Plafond strict **`60 FPS`** + `compileAsync` + init GPU incrémentale (`initTexture` + PMREM) + précharge audio au clic tutoriel | Démarrage et rotation caméra stabilisés |

---

## 2. Journal chronologique détaillé des travaux (13/11/2026)

### Phase 1 — Méga Audit Forensique initial (`~11h00 – 11h08 +0100`)
- Inspection complète du dépôt sur `main` (`7404423`) et comparaison des branches distantes (`origin/staging` `54ffe27`, branches contributives `fbebe155`, etc.).
- **Constats critiques relevés dans l'audit initial :**
  1. `34` textures `4096×4096` (`normal` et `ORM`) oubliées sur `17` objets, générant ~3 Go de VRAM potentielle avec mipmaps.
  2. `gant_mickey.glb` corrompu/vide (`132 octets`) sur `main` ; `hyene.glb` (`29,07 Mo`) commentée/écartée.
  3. Matériaux coûteux : `KHR_materials_transmission` sur `drapeau_cars.glb` (2e passe complète de rendu), `alphaMode: BLEND` sur `Carpet_aladdin.glb` et `atlas_living` de `MaisonV3.glb`, extensions `clearcoat`/`sheen`/`specular`/`ior: 1000` forçant `MeshPhysicalMaterial`.
  4. Architecture `MaisonV3.glb` fragmentée (`175` draw calls) et 26 hitboxes transparentes visibles/coûteuses.
  5. Bugs gameplay/moteur : `resize.js` écrasant le `pixelRatio`, déplacement ZQSD/gamepad dépendant du framerate sans `dt`, absence de blocage de clic à travers les murs, collision par 4 `Raycaster` par frame, fuites/absences de nettoyage audio/mémoire, fichiers morts (`counter.js`, `style.css`), trackers Vercel Analytics / Speed Insights inutiles.

### Phase 2 — Étape 1 : Nettoyage 3D, Draco local, Audio/Vidéo & Suppression des fichiers morts (`~11h10 – 11h22 +0100`)
- **Décodeurs Draco locaux (`public/draco/`) :** copie de `draco_decoder.js`, `draco_decoder.wasm` et `draco_wasm_wrapper.js` alignés avec `three@^0.183.1` (`752 Ko`).
- **Restauration & compression des assets 3D :**
  - Restauration de `gant_mickey.glb` depuis `fbebe155` (`20,87 Mo`, `50 000` tris) -> conversion WebP + décimation + Draco.
  - Ajout et décimation de `hyene.glb` (intégrée dans le pool des 26 objets).
  - Downscale des 34 maps `4K` sur 17 props, passage en WebP de `cj_gta_sa2014.glb`, `Carpet_aladdin.glb`, `princess_snow_white_dress.glb`, `drapeau_cars.glb` (suppression de `KHR_materials_transmission`), `lowpoly_cowboy_hat_V2.glb` et `MaisonV3.glb` (`atlas_living` en `MASK` `alphaCutoff: 0.5`).
- **Recompression Audio/Vidéo via `ffmpeg` :**
  - `public/pictures/live_background_disney.mp4` réencodé (`720p CRF 28 -an +faststart` : `7,8–8,15 Mo -> 3,5 Mo`).
  - `19` fichiers `.mp3` de `public/sounds/` réencodés à `96 kbps` (`~94 Mo -> 47 Mo`).
  - `cielV2.jpg` convertie en `public/pictures/cielV2.webp` (`114 Ko`).
  - Suppression de `5` médias orphelins : `01. Bootup.mp3`, `Mike Wazowski.jpg`, `lezard_bleu.jpg`, `nemo_friend.jpg`, `stitch.jpg`.
- **Nettoyage dépendances & Vite :** retrait de `@vercel/analytics` et `@vercel/speed-insights`, suppression de `counter.js`/`style.css`, configuration `vite.config.js` (`target: "esnext"`, `manualChunks`).

### Phase 3 — Chantier 2 : Multi-LOD 4 niveaux (Option B), Culling Option A, DRS, Sauvegarde, Collisions & UI Mobile (`~11h25 – 12h25 +0100`)
- **Système 4 LOD + Option B :**
  - Génération de `4` niveaux (`LOD0`, `LOD1`, `LOD2`, `LOD3`) embarqués dans chaque `.glb` avec déduplication de textures.
  - Plafond géométrique imposé : aucun `LOD0` de prop ne dépasse `4 000` triangles.
  - Sur `isMobile || isLowEnd` (**Option B**) : `LOD0` n'est jamais conservé dans le graphe de rendu ; `disposeUnusedSubtree()` libère immédiatement ses géométries/matériaux dès le chargement et la scène démarre sur `LOD1 -> LOD2 -> LOD3`, avec réduction dynamique des textures en RAM (`downscaleRootTextures()`).
  - Simplification des shaders par distance : `LOD2` converti en `MeshLambertMaterial` (`convertToLOD2Materials`), `LOD3` converti en `MeshBasicMaterial` unlit (`convertToLOD3BouillieMaterials` / `createBouillieTexture`).
- **Culling par angle de vision (Option A sans micro-freeze) :** `updateVisionCulling()` avec `THREE.Frustum` et sphère englobante précalculée.
- **Batching `MaisonV3` & Collisions glissantes :** `optimizeMaisonGeometryAndCollisions()` fusionne les meshes statiques par matériau et cellules `80×80` (`175 -> 80` meshes visibles, `25` batchs) et précalcule `26` boîtes `MurFictif*` pour `collidesWithWalls()` (glissement fluide le long des murs).
- **Gameplay, DRS & Sauvegarde (`src/main.js`, `src/interaction.js`) :**
  - Suppression du blocage de clics à travers les murs via `isRayBlockedByMaison()` et `getUnblockedPropHit()`.
  - Ajout du **DRS (Dynamic Resolution Scaling)** paliers `[1.0, 0.85, 0.72, 0.6]` activable/désactivable dans le menu Pause (`#toggle-drs`).
  - Sauvegarde locale dans `localStorage["popcorn_save"]` (objets trouvés, score, vies, position/rotation, chronomètre supprimé selon consigne scolaire) avec bouton `▶️ Reprendre (X / 26)`.
  - Lazy-load de `#bg-video` et `#video-ps2` pour ne rien télécharger inutilement pendant la partie.
  - Correctifs CSS Grid du tutoriel mobile (vérifié sur `390×844`) et nettoyage global via `window.nettoyerMemoire`.

### Phase 4 — Refonte des LOD sous Blender 5.0.1 & Assouplissement des distances (`~12h30 – 13h49 +0100`) -> Commit `1408e35`
- **Problème détecté par l'utilisateur (captures envoyées) :** `MeshoptSimplifier.simplifySloppy` abîmait fortement les UVs sur `LOD1..LOD3` (notamment `collier_poca.glb`) et les seuils de distance déclenchaient la "bouillie" `LOD3` beaucoup trop près.
- **Correctifs appliqués :**
  - Régénération de `24` props décimés via **Blender 5.0.1** (`remove_doubles` + modificateur `DECIMATE` délimité par `UV` et `MATERIAL` pour préserver les coutures UV).
  - Restauration de la netteté des textures Desktop/Mac : `1024px` WebP (`baseColor`/`emissive`/`normal`) et `512px` (`mr`/`ao`).
  - Amélioration de `createBouillieTexture` (`24×24` -> `64×64` `LinearFilter`) et réglage des distances avec marge sur le rayon d'objet (`rOff = cullSphere.radius * 1.5`, hystérésis `0.1`, échelle `~15` unités Three.js ≈ `1 m`) :
    - **Desktop :** `LOD0` proche, `LOD1` (`95 + rOff` soit `>= 6,3 m` hors rayon), `LOD2` (`180 + rOff` ≈ `12 m+`), `LOD3` (`275 + rOff` ≈ `18,3 m+`), culling (`lodDist = 380` ≈ `25,3 m`).
    - **Low-end :** `LOD1/2/3` à `100 / 200 / 300` (`lodDist = 350`).
    - **Mobile :** `LOD1/2/3` à `90 / 180 / 250` (`lodDist = 290`).
  - Commit et push de `1408e35` sur `origin/staging`.

### Phase 5 — Plafond 60 FPS, Préchargement GPU/Audio au tutoriel, Images HD WebP & Alignement Badge (`~13h50 – 14h31 +0100`) -> Commit `c587332`
- **Plafond `60 FPS` (`src/main.js`) :** `fpsMax = 60` avec tolérance VSync de `2 ms` (`intervalleFPS - 0.002`) pour éviter l'emballement à `120 Hz` et économiser CPU/GPU.
- **Préchargement complet dès le clic tutoriel (`#btn-decouvrir`) :**
  - Attente de `skyboxPromise` avant `await renderer.compileAsync(scene, camera)` (activé sur tous les appareils, mobile inclus) pour compiler les shaders d'avance.
  - Warm-up GPU incrémental des textures via `collectSceneTextures()` + `renderer.initTexture()` (`pumpTextureWarmup`, accéléré sur demande via `window.prechargerToutTuto`), complété par `window.finaliserPrechargementGPU()` et `warmInitialRenderPass()` (PMREM + passe à blanc).
  - Préchargement audio critique dès l'entrée (`window.prechargerAudioCritique()`).
- **Netteté des images de chargement & HUD (`public/pictures/*.webp`, `src/stylisation.css`) :**
  - Ré-export de 7 WebP nettes (`chateau_disney.webp` `84K`, `lezard.webp` `62K`, `mike.webp` `89K`, `nemo.webp` `44K`, `olaf.webp` `63K`, `stitch.webp` `76K`, `vanellope.webp` `103K`) et suppression du `filter: blur(8px)` sur `@keyframes memoireMagique`.
- **Recalage mural du badge de police (`src/disneyData.js`) :** `badge` replacé contre le mur au-dessus de l'aquarium (`x: -46.78, y: 28.00, z: -132.00, rotY: 4.712`) pour supprimer les triangles qui dépassaient en bas du cadre.
- Commit et push de `c587332` sur `origin/staging`.

### Phase 6 — Correctif géométrique, UV et tangentes MikkTSpace sur `badge.glb` (`~14h31 – 15h19 +0100`) -> Commit `30995f3`
- **Problème signalé sur capture écran :** facettes sombres / arêtes dures cassées à la lumière sur le badge de police (`public/assets/badge.glb`).
- **Diagnostic et réparation Blender 5.0.1 :**
  - Suppression de `2 670` arêtes scindées (>55°) provoquant des normales discontinues, ajout de `WEIGHTED_NORMAL` et export avec `export_tangents=True` (tangentes MikkTSpace précalculées).
  - Correction de `691` triangles dans la gouttière UV sombre (dont `73` sous le texte `POLICE`) par dilatation UV sur 14 passes en préservant le médaillon bleu roi.
  - Suppression de `doubleSided: true` et reconstruction propre des 4 LOD (`LOD0=3 940`, `LOD1=2 850`, `LOD2=1 750`, `LOD3=950`, total `9 490` tris décodés sur les 4 niveaux pour `707,7 Ko`).
- Vérification live en gros plan sous Chromium (`0` erreur console) et push de `30995f3` sur `origin/staging`.

---

## 3. Inventaire actuel des 27 `.glb` (`verify_glbs.mjs`)

Vérifié après le dernier commit code `30995f3` (chaque prop contient ses 4 niveaux `LOD0..LOD3` ; `decodedTris` correspond donc à la somme des 4 LOD embarqués dans le fichier, avec `LOD0 <= 4 000`) :

| Fichier `.glb` | Poids disque | Sommets décodés | Triangles décodés (total fichier) | Images | Matériaux | Statut |
| :--- | ---: | ---: | ---: | ---: | ---: | :--- |
| `Aladdin_lamp.glb` | 17.8 KB | 2 232 | 1 841 | 0 | 1 | OK |
| `Carpet_aladdin.glb` | 47.6 KB | 1 892 | 1 419 | 2 | 2 | OK |
| `Kim_Possible_CellPhone.glb` | 193.9 KB | 5 184 | 3 320 | 3 | 1 | OK |
| `MaisonV3.glb` | 2019.3 KB | 22 331 | 18 904 | 26 | 28 | OK |
| `badge.glb` | 707.7 KB | 15 497 | 9 490 | 3 | 1 | OK |
| `ballon_cirque.glb` | 169.2 KB | 7 452 | 7 722 | 3 | 1 | OK |
| `bougie.glb` | 144.4 KB | 4 072 | 2 954 | 3 | 1 | OK |
| `carotte.glb` | 59.2 KB | 2 147 | 1 476 | 3 | 1 | OK |
| `casque_kusco.glb` | 85.4 KB | 4 649 | 4 924 | 3 | 1 | OK |
| `chemise.glb` | 201.7 KB | 5 320 | 3 020 | 3 | 1 | OK |
| `cj_gta_sa2014.glb` | 173.3 KB | 3 690 | 4 524 | 5 | 4 | OK |
| `collier_poca.glb` | 194.2 KB | 12 577 | 8 088 | 3 | 1 | OK |
| `coq-vaiana.glb` | 223.6 KB | 8 534 | 4 694 | 3 | 1 | OK |
| `drapeau_cars.glb` | 7.8 KB | 216 | 136 | 1 | 2 | OK |
| `gant_mickey.glb` | 96.8 KB | 7 251 | 7 880 | 3 | 1 | OK |
| `gargouille.glb` | 143.9 KB | 8 558 | 5 910 | 3 | 1 | OK |
| `hyene.glb` | 327.3 KB | 12 721 | 8 174 | 3 | 1 | OK |
| `liane.glb` | 128.1 KB | 4 869 | 2 079 | 3 | 1 | OK |
| `low_poly_lightsaber.glb` | 29.0 KB | 3 989 | 4 476 | 0 | 1 | OK |
| `lowpoly_cowboy_hat_V2.glb` | 27.4 KB | 756 | 979 | 4 | 1 | OK |
| `noeud_rose.glb` | 60.4 KB | 1 843 | 996 | 3 | 1 | OK |
| `nuage.glb` | 42.2 KB | 972 | 984 | 3 | 1 | OK |
| `pates.glb` | 209.7 KB | 10 587 | 7 722 | 3 | 1 | OK |
| `poele.glb` | 183.1 KB | 8 899 | 7 268 | 3 | 1 | OK |
| `pot_miel.glb` | 102.2 KB | 4 977 | 4 992 | 3 | 1 | OK |
| `princess_snow_white_dress.glb` | 198.9 KB | 4 322 | 5 916 | 3 | 1 | OK |
| `rose.glb` | 110.3 KB | 4 626 | 4 924 | 3 | 1 | OK |

---

## 4. Vérifications effectuées & Statut

- **Intégrité glTF / Draco :** `27 / 27` `.glb` décodés et validés sans erreur après `30995f3`.
- **Build production (`npm run build`) :** validé sans erreur (`dist/` = `60 Mo`, `vite build` en `996 ms`).
- **Tests navigateur automatisés sur `vite preview` (`127.0.0.1:4173`) :**
  - `0` erreur console/page et `0` requête HTTP en erreur lors des passes Desktop (`1280×800`) et Mobile (`390×844`).
  - Tutoriel mobile (`0 -> 1 -> 2 -> Normal -> Rentrer`) : `0 px` de débordement horizontal, `#modal-pause`, `#hud` et `#zone-joystick` fonctionnels.
  - Gameplay Desktop : rendu intérieur `MaisonV3`, quiz gagné (`+100`, `1 / 26`), erreur (`❤️❤️🖤`), rechargement de page avec restauration `localStorage["popcorn_save"]`, bascule `#toggle-drs`, inspection rapprochée de `collier_poca.glb` et `badge.glb` v2.

---

## 5. Limites connues & Prochaines étapes recommandées

Ces points n'ont pas encore été traités ou validés hors environnement de test local :

1. **Test sur un vrai iPhone / Safari WebKit (et un PC modeste réel) :** la validation mobile a été faite en émulation Chromium (`390×844`), pas sur un terminal iOS physique (gestion mémoire WebKit, contexte WebGL, autoplay audio au toucher).
2. **Test utilisateur final sur l'environnement `staging` Vercel :** re-valider de bout en bout les 26 objets (en particulier le badge de police, le collier, les vignettes du HUD et la fluidité à `60 FPS`) depuis le déploiement `staging`.
3. **En-têtes HTTP de cache (`vercel.json`) :** aucun fichier `vercel.json` n'a été ajouté pour configurer un `Cache-Control` long sur `/assets/*`, `/draco/*`, `/pictures/*` et `/sounds/*`.
4. **`README.md` non mis à jour :** [README.md](file:///Users/jujutravail/popcorn-disney/README.md) mentionne encore `12 objets`, un chronomètre et `@vercel/analytics` (laissé tel quel pour éviter des conflits documentaires non demandés).
5. **Pistes optionnelles d'affinage :**
   - Évaluer l'activation de `THREE.ACESFilmicToneMapping` si un ajustement du rendu lumineux/colorimétrique est souhaité (non activé aujourd'hui).
   - Fusionner `staging` vers `main` **uniquement après validation explicite de l'utilisateur**.
