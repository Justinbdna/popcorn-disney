# 🍿 Popcorn Disney - Le Jeu 3D Interactif

![Version](https://img.shields.io/badge/version-1.0-blue.svg)
![Three.js](https://img.shields.io/badge/Three.js-3D_Engine-black?logo=three.js)
![Vite](https://img.shields.io/badge/Vite-Bundler-646CFF?logo=vite)

**Popcorn Disney** est une expérience web 3D interactive et ludique en vue à la première personne. Plongez dans une chambre virtuelle remplie d'objets cultes, explorez les moindres recoins et testez vos connaissances sur la Pop Culture !

👉 **[Jouer à Popcorn Disney maintenant !](https://popcorn-disney.vercel.app)** 👈

---

## 🎮 Le Concept

Le joueur se retrouve dans un appartement modélisé en 3D. Le but est d'explorer la zone, de dénicher 12 objets cachés (du sabre laser de Star Wars à la poêle de Raiponce) et de cliquer dessus pour déclencher un quiz.

* **Exploration Multi-Plateformes :** Déplacement fluide au clavier (ZQSD), à la manette (GamePad API) ou sur mobile (Joystick tactile avec Nipple.js).
* **Système de Quiz :** Devinez à quel film appartient l'objet pour gagner des points.
* **Gestion des vies & Chrono :** Une expérience gamifiée avec un HUD en temps réel (3 vies, chronomètre, conditions de Game Over et d'écran de Victoire).
* **Optimisation Extrême :** Conçu pour fonctionner de manière fluide sur tous les supports sans surcharger la mémoire, grâce à la gestion du LOD (Level of Detail), à la compression géométrique (Draco) et aux Hitboxes invisibles.
* **Outil de Level Design Intégré :** Un mode développeur 3D sur-mesure intégré au code pour manipuler les objets en jeu, tester le HUD et exporter les coordonnées directement dans la base de données.

---

## 🚀 L'Équipe du Projet (The Dream Team)

Ce projet a été réalisé en équipe avec une architecture claire, un workflow Git strict (`staging`), et une répartition chirurgicale des rôles :

* **Justin** ([GitHub](https://github.com/Justinbdna)) - Lead Tech & Project Manager (Pilier du projet : Architecture globale, intégration logicielle complète, GamePad API, placements et optimisations 3D, supervision du repository).
* **David** ([GitHub](https://github.com/DaupinDavid)) - Core Engine (Création du système de déplacement FPS, Logique mathématique des collisions).
* **Juliana** ([GitHub](https://github.com/Juliana68)) - Lead 3D & Sound Design (Modélisation Low Poly, intégration sonore).
* **Lévine** ([GitHub](https://github.com/Lostvayne142)) - Lead UI/UX (Design de l'interface, HUD, Modales de fin, Responsive Mobile & Accessibilité).
* **Mohamed** ([GitHub](https://github.com/mohamedsamassi-19)) - Lead Content (Base de données du quiz, rédaction du lore).

---

## 🛠️ Stack Technique

* **Moteur 3D :** [Three.js](https://threejs.org/) + DRACOLoader
* **Contrôles Mobiles :** [Nipple.js](https://yoannmoinet.github.io/nipplejs/)
* **Outils de Développement :** lil-gui, TransformControls
* **Bundler :** [Vite](https://vitejs.dev/)
* **Analytics & Performance :** [@vercel/analytics](https://vercel.com/docs/analytics) & [@vercel/speed-insights](https://vercel.com/docs/speed-insights)
* **Déploiement :** Vercel
* **Modélisation 3D :** Blender + Sketchfab

---
