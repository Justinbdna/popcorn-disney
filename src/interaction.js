/**
 * interaction.js - Gestionnaire d'Interface Utilisateur, Audio, DRS & Sauvegarde
 */

(function initUIManager() {
  "use strict";

  // === AUDIO MANAGER GLOBAL ===
  window.audioState = { volumeMusique: 0.3, volumeSFX: 0.5, muteRetro: false };
  window.ambiance = null;
  window.isRetroMode = false;

  const sfxPool = Object.create(null);
  window.jouerSFX = (chemin, volumeBase = 1.0) => {
    if (window.audioState.volumeSFX > 0 && !window.audioState.muteRetro) {
      if (!sfxPool[chemin]) sfxPool[chemin] = new Audio(chemin);
      const audio = sfxPool[chemin];
      audio.volume = Math.min(1, volumeBase * window.audioState.volumeSFX);
      audio.currentTime = 0;
      audio.play().catch(() => {});
      return audio;
    }
    return null;
  };

  window.demarrerAmbiance = () => {
    if (!window.ambiance) {
      window.ambiance = new Audio("/sounds/ambiance.mp3");
      window.ambiance.loop = true;
    }
    window.ambiance.volume = window.audioState.volumeMusique;
    if (
      window.audioState.volumeMusique > 0 &&
      !window.enPause &&
      !window.isRetroMode
    ) {
      window.ambiance.play().catch(() => {
        const repriseAuto = () => {
          if (
            window.ambiance &&
            window.ambiance.paused &&
            !window.enPause &&
            !window.isRetroMode &&
            window.audioState.volumeMusique > 0
          ) {
            window.ambiance.play().catch(() => {});
          }
        };
        window.addEventListener("pointerdown", repriseAuto, { once: true });
        window.addEventListener("keydown", repriseAuto, { once: true });
      });
    }
  };

  // === VIDÉO FOND TUTORIEL (CHARGEMENT DIFFÉRÉ + REDUCED MOTION) ===
  const activerVideoTuto = () => {
    const vid = document.getElementById("bg-video");
    if (!vid) return;
    const reducedMotion = window.matchMedia?.(
      "(prefers-reduced-motion: reduce)",
    ).matches;
    if (reducedMotion) return;
    if (!vid.getAttribute("src") && vid.dataset.src) {
      vid.src = vid.dataset.src;
    }
    vid.play().catch(() => {});
  };

  const libererVideoTuto = () => {
    const vid = document.getElementById("bg-video");
    if (!vid) return;
    vid.pause();
    vid.removeAttribute("src");
    vid.load();
  };

  // === ÉTAT SAUVEGARDE & REPRISE ===
  let repriseDepuisSauvegarde = null;
  let totalSauvegarde = 26;
  let partieTerminee = false;

  window.ui_preparerRepriseSauvegarde = (totalObjets, savedData) => {
    totalSauvegarde = totalObjets;
    repriseDepuisSauvegarde = savedData || null;
  };

  // === GESTION DU SAS DE CHARGEMENT ===
  const ecranChargement = document.getElementById("ecran-chargement");
  const btnDecouvrir = document.getElementById("btn-decouvrir");
  const ecranTutoriel = document.getElementById("ecran-tutoriel");

  if (btnDecouvrir) {
    btnDecouvrir.addEventListener("click", () => {
      btnDecouvrir.style.display = "none";

      if (repriseDepuisSauvegarde) {
        // Reprise directe de la partie sauvegardée sans repasser par le tutoriel
        window.jouerSFX("/sounds/clic.mp3", 0.7);
        libererVideoTuto();
        ecranTutoriel?.remove();

        if (ecranChargement) {
          ecranChargement.style.pointerEvents = "none";
          ecranChargement.style.transition = "opacity 1.5s ease-in-out";
          setTimeout(() => (ecranChargement.style.opacity = "0"), 50);
          setTimeout(() => ecranChargement.remove(), 1600);
        }

        window.demarrerAmbiance();
        window.initialiserHUD(totalSauvegarde, repriseDepuisSauvegarde);
        window.lancerJeu3D?.();
        return;
      }

      window.sonLancementGlobal = window.jouerSFX(
        "/sounds/son_lancement.mp3",
        0.8,
      );

      if (ecranTutoriel) {
        ecranTutoriel.style.transition = "none";
        ecranTutoriel.style.opacity = "1";
        ecranTutoriel.classList.remove("cache");
        activerVideoTuto();
      }
      if (ecranChargement) {
        ecranChargement.style.pointerEvents = "none";
        ecranChargement.style.transition = "opacity 1.5s ease-in-out";
        setTimeout(() => (ecranChargement.style.opacity = "0"), 50);
        setTimeout(() => ecranChargement.remove(), 1600);
      }
    });
  }

  // === GESTION DU TUTORIEL FLUIDE ===
  let etapeActuelle = 0;
  const etapes = document.querySelectorAll(".etape-tuto");
  const btnSuivant = document.getElementById("btn-suivant");
  const btnRentrer = document.getElementById("btn-rentrer");

  if (btnSuivant) {
    btnSuivant.addEventListener("click", () => {
      window.jouerSFX("/sounds/clic.mp3");
      if (etapes[etapeActuelle]) etapes[etapeActuelle].classList.remove("active");
      etapeActuelle++;
      if (etapes[etapeActuelle]) etapes[etapeActuelle].classList.add("active");

      if (etapeActuelle === 2) {
        btnSuivant.style.display = "none";
      } else if (etapeActuelle === etapes.length - 1) {
        btnSuivant.style.display = "none";
        setTimeout(() => btnRentrer?.classList.remove("cache"), 300);
      } else {
        btnSuivant.style.display = "inline-block";
      }
    });
  }

  if (btnRentrer) {
    btnRentrer.addEventListener("click", () => {
      if (window.sonLancementGlobal) window.sonLancementGlobal.pause();
      window.demarrerAmbiance();

      if (ecranTutoriel) {
        ecranTutoriel.style.pointerEvents = "none";
        ecranTutoriel.style.backgroundColor = "#050510";
        const video = document.getElementById("bg-video");
        if (video) video.style.opacity = "0";
        ecranTutoriel.style.transition = "opacity 1.5s ease-in-out";
        ecranTutoriel.style.opacity = "0";
        setTimeout(() => {
          libererVideoTuto();
          ecranTutoriel.remove();
        }, 1500);
      }
      window.initialiserHUD(totalSauvegarde, null);
      window.lancerJeu3D?.();
    });
  }

  // === GESTION DU HUD & SAUVEGARDE ===
  const hud = document.getElementById("hud");
  const affichageScore = document.getElementById("score-affichage");
  const affichageVies = document.getElementById("vies-affichage");
  const affichageObjets = document.getElementById("objets-affichage");

  let score = 0;
  let vies = 3;
  let totalObjetsMemoire = 26;

  document.querySelectorAll(".btn-diff").forEach((b) =>
    b.addEventListener("click", (e) => {
      const l = e.currentTarget.dataset.lvl;
      localStorage.removeItem("popcorn_save");
      sessionStorage.setItem("diff_popcorn", l);
      window.viesMax = l === "facile" ? 6 : l === "difficile" ? 2 : 3;
      vies = window.viesMax;
      if (affichageVies) affichageVies.textContent = "❤️".repeat(vies);
      btnSuivant?.click();
    }),
  );

  window.ui_majObjetsTrouves = function (trouves, total = totalObjetsMemoire) {
    totalObjetsMemoire = total;
    if (affichageObjets) affichageObjets.textContent = `${trouves} / ${total}`;
  };

  window.initialiserHUD = function (
    totalObjets = totalObjetsMemoire,
    savedData = null,
  ) {
    partieTerminee = false;
    totalObjetsMemoire = totalObjets;

    const diff =
      savedData?.difficulty ||
      sessionStorage.getItem("diff_popcorn") ||
      "normal";
    sessionStorage.setItem("diff_popcorn", diff);
    window.viesMax = diff === "facile" ? 6 : diff === "difficile" ? 2 : 3;

    if (savedData && Array.isArray(savedData.foundIds)) {
      score = Number(savedData.score) || 0;
      vies = Math.max(
        1,
        Math.min(window.viesMax, Number(savedData.vies) || window.viesMax),
      );
      if (affichageScore) affichageScore.textContent = String(score);
      window.ui_majObjetsTrouves(savedData.foundIds.length, totalObjets);
    } else {
      score = 0;
      vies = window.viesMax;
      if (affichageScore) affichageScore.textContent = "0";
      window.ui_majObjetsTrouves(0, totalObjets);
    }

    if (affichageVies) {
      affichageVies.textContent =
        "❤️".repeat(vies) + "🖤".repeat(Math.max(0, window.viesMax - vies));
    }
    if (hud) hud.classList.remove("cache");
  };

  window.sauvegarderProgression = () => {
    if (partieTerminee) return;
    const foundIds = Array.isArray(window.__foundPropIds)
      ? window.__foundPropIds
      : [];
    if (foundIds.length === 0 || vies <= 0) return;
    try {
      localStorage.setItem(
        "popcorn_save",
        JSON.stringify({
          foundIds,
          score,
          vies,
          difficulty: sessionStorage.getItem("diff_popcorn") || "normal",
        }),
      );
    } catch {
      // Stockage plein ou bloqué en navigation privée : on continue sans erreur
    }
  };

  window.ajouterScore = function (points) {
    score += points;
    if (!affichageScore) return;
    affichageScore.textContent = String(score);
    const parent = affichageScore.parentElement;
    if (parent) {
      parent.style.transform = "scale(1.15)";
      setTimeout(() => (parent.style.transform = "scale(1)"), 200);
    }
  };

  window.perdreVie = function () {
    if (vies > 0) vies--;
    if (affichageVies) {
      affichageVies.textContent =
        "❤️".repeat(vies) +
        "🖤".repeat(Math.max(0, (window.viesMax || 3) - vies));
    }
    if (vies === 0) {
      window.afficherFin?.(false);
    }
  };

  // === GESTION DU QUIZ ===
  const DOM = {
    modal: document.getElementById("modal-quiz"),
    question: document.getElementById("quiz-titre"),
    optionsContainer: document.getElementById("quiz-options"),
    feedback: document.getElementById("quiz-feedback"),
  };

  let quizTimerId = null;
  let quizFinaliser = null;

  window.ui_fermerQuiz = function () {
    if (quizFinaliser) {
      quizFinaliser();
      return;
    }
    DOM.modal?.classList.add("cache");
    window.deselectionnerObjet?.();
  };

  window.ui_afficherQuiz = function (data, callback) {
    if (!DOM.modal) return;
    if (quizTimerId !== null) {
      clearTimeout(quizTimerId);
      quizTimerId = null;
    }
    quizFinaliser = null;

    DOM.optionsContainer.innerHTML = "";
    DOM.feedback.textContent = "";
    DOM.feedback.className = "message-feedback";
    DOM.question.textContent = data.question;

    if (Array.isArray(data.options)) {
      data.options.forEach((texteOption, index) => {
        const btn = document.createElement("button");
        btn.className = "btn-option";
        btn.textContent = texteOption;

        btn.addEventListener(
          "click",
          () => {
            const boutons = DOM.optionsContainer.querySelectorAll(".btn-option");
            boutons.forEach((b) => (b.disabled = true));

            const estBonne = index === data.reponseCorrecte;
            if (estBonne) {
              window.jouerSFX("/sounds/succes.mp3", 0.3);
              btn.classList.add("correct");
              DOM.feedback.textContent =
                data.anecdoteSucces || "Bonne réponse !";
              DOM.feedback.classList.add("succes");
            } else {
              window.jouerSFX("/sounds/erreur.mp3", 0.3);
              btn.classList.add("incorrect");
              DOM.feedback.textContent =
                data.anecdoteEchec || "Mauvaise réponse !";
              DOM.feedback.classList.add("erreur");
              boutons[data.reponseCorrecte]?.classList.add("correct");
            }

            quizFinaliser = () => {
              if (quizTimerId !== null) {
                clearTimeout(quizTimerId);
                quizTimerId = null;
              }
              quizFinaliser = null;
              DOM.modal.classList.add("cache");

              if (estBonne) {
                // Incrémenter le score avant objetTrouve -> afficherFin(true) pour afficher le score final exact
                window.ajouterScore(100);
                if (typeof callback === "function") callback(true);
              } else {
                if (typeof callback === "function") callback(false);
                window.perdreVie();
              }
              window.sauvegarderProgression();
            };
            quizTimerId = setTimeout(quizFinaliser, 1800);
          },
          { once: true },
        );

        DOM.optionsContainer.appendChild(btn);
      });
    }

    window.bloquerControles3D?.(true);
    DOM.modal.classList.remove("cache");
  };

  // === GESTION DE LA MODALE DES CONTRÔLES ===
  const btnOuvrirControles = document.getElementById("btn-ouvrir-controles");
  const btnFermerControles = document.getElementById("btn-fermer-controles");
  const modalControles = document.getElementById("modal-controles");
  const onglets = document.querySelectorAll(".onglet");
  const schemas = document.querySelectorAll(".schema");

  window.ui_fermerControles = () => {
    modalControles?.classList.add("cache");
    if (!window.enPause) window.bloquerControles3D?.(false);
    window.demanderRendu?.();
  };

  if (btnOuvrirControles && modalControles) {
    btnOuvrirControles.addEventListener("click", () => {
      modalControles.classList.remove("cache");
      window.bloquerControles3D?.(true);
    });
  }
  if (btnFermerControles) {
    btnFermerControles.addEventListener("click", window.ui_fermerControles);
  }

  onglets.forEach((onglet) => {
    onglet.addEventListener("click", (e) => {
      const targetBtn = e.currentTarget;
      onglets.forEach((o) => o.classList.remove("active"));
      schemas.forEach((s) => s.classList.remove("active"));
      targetBtn.classList.add("active");
      const cible = document.getElementById(targetBtn.getAttribute("data-cible"));
      if (cible) cible.classList.add("active");
    });
  });

  // === GESTION DES MENUS PAUSE & FIN ===
  const btnPause = document.getElementById("btn-pause");
  const btnReprendre = document.getElementById("btn-reprendre");
  const btnRecommencer = document.getElementById("btn-recommencer");
  const btnResetList = document.querySelectorAll(".btn-reset-partie");
  const btnQuitterList = document.querySelectorAll(".btn-quitter");

  const reinitialiserPartieComplete = () => {
    window.jouerSFX("/sounds/clic.mp3");
    localStorage.removeItem("popcorn_save");
    sessionStorage.setItem("skipIntro", "true");
    window.nettoyerMemoire?.();
    location.reload();
  };

  if (btnPause) {
    btnPause.addEventListener("click", () => {
      window.jouerSFX("/sounds/clic.mp3");
      window.togglePause?.();
    });
  }
  if (btnReprendre) {
    btnReprendre.addEventListener("click", () => {
      window.jouerSFX("/sounds/clic.mp3");
      window.togglePause?.();
    });
  }
  if (btnRecommencer) {
    btnRecommencer.addEventListener("click", reinitialiserPartieComplete);
  }
  btnResetList.forEach((btn) =>
    btn.addEventListener("click", reinitialiserPartieComplete),
  );
  btnQuitterList.forEach((btn) =>
    btn.addEventListener("click", () => {
      window.nettoyerMemoire?.();
      location.reload();
    }),
  );

  // === GESTION DES VOLUMES, DRS & JUKEBOX ===
  const sliderMusique = document.getElementById("volume-musique");
  const sliderSFX = document.getElementById("volume-sfx");
  const toggleDRS = document.getElementById("toggle-drs");
  const badgeDRS = document.getElementById("drs-status");

  window.ui_majDRSBadge = (enabled, scale = 1.0) => {
    const actif = Boolean(enabled);
    if (toggleDRS) toggleDRS.checked = actif;
    if (badgeDRS) {
      badgeDRS.textContent = actif
        ? `Auto (${Math.round((scale || 1) * 100)}%)`
        : "Désactivé";
    }
  };

  if (toggleDRS) {
    const drsPref = localStorage.getItem("popcorn_drs") !== "false";
    window.ui_majDRSBadge(drsPref, window.drsScale || 1.0);
    toggleDRS.addEventListener("change", (e) => {
      window.jouerSFX("/sounds/clic.mp3", 0.4);
      window.setDrsEnabled?.(e.target.checked);
    });
  }

  if (sliderMusique) {
    sliderMusique.addEventListener("input", (e) => {
      const vol = parseFloat(e.target.value);
      window.audioState.volumeMusique = vol;
      if (window.ambiance && !window.audioState.muteRetro) {
        window.ambiance.volume = vol;
      }
      if (window.musiquePause) window.musiquePause.volume = vol;
    });
  }

  if (sliderSFX) {
    sliderSFX.addEventListener("input", (e) => {
      window.audioState.volumeSFX = parseFloat(e.target.value);
      window.jouerSFX("/sounds/clic.mp3", 0.5);
    });
  }

  const selectJukebox = document.getElementById("select-jukebox");
  if (selectJukebox) {
    selectJukebox.addEventListener("change", (e) => {
      window.changerMusique?.(e.target.value);
    });
  }

  window.ui_syncPause = () => {
    const modalPause = document.getElementById("modal-pause");
    if (!modalPause) return;

    if (window.enPause) {
      window.ui_majDRSBadge(window.drsEnabled !== false, window.drsScale || 1.0);
      modalPause.classList.remove("cache");
      if (window.ambiance) window.ambiance.pause();
      if (!window.musiquePause) {
        window.musiquePause = new Audio("/sounds/pause.mp3");
        window.musiquePause.loop = true;
      }
      window.musiquePause.volume = window.audioState.volumeMusique;
      if (window.audioState.volumeMusique > 0) {
        window.musiquePause.play().catch(() => {});
      }
    } else {
      modalPause.classList.add("cache");
      if (window.musiquePause) window.musiquePause.pause();
      if (
        window.ambiance &&
        !window.audioState.muteRetro &&
        window.audioState.volumeMusique > 0
      ) {
        window.ambiance.volume = window.audioState.volumeMusique;
        window.ambiance.play().catch(() => {});
      }
    }
  };

  // === GESTION DE L'ÉCRAN DE FIN ===
  window.afficherFin = (victoire) => {
    partieTerminee = true;
    localStorage.removeItem("popcorn_save");
    window.bloquerControles3D?.(true);

    const titreFin = document.getElementById("titre-fin");
    const texteFin = document.getElementById("texte-fin");
    const modalFin = document.getElementById("modal-fin");

    if (window.ambiance) window.ambiance.pause();
    if (window.musiquePause) window.musiquePause.pause();
    window.jouerSFX(
      victoire ? "/sounds/victoire_final.mp3" : "/sounds/game_over.mp3",
      1.0,
    );

    const best = Math.max(score, Number(localStorage.getItem("dis_best") || 0));
    localStorage.setItem("dis_best", String(best));
    if (titreFin) {
      titreFin.innerHTML = victoire
        ? "<span style='color:#2ed573'>👑 VICTOIRE !</span>"
        : "<span style='color:#ff4757'>💀 FIN DE PARTIE</span>";
    }
    if (texteFin) {
      texteFin.innerHTML = `Ton Score : ${score} <br><br>🏆 Meilleur Score : ${best}`;
    }
    if (modalFin) modalFin.classList.remove("cache");
    window.demanderRendu?.();
  };

  window.ui_AnimationPS2 = () => {
    window.isRetroMode = !window.isRetroMode;
    const vid = document.getElementById("video-ps2");

    const restaurerAudioPostVideo = () => {
      window.audioState.muteRetro = false;
      if (vid) {
        vid.classList.add("cache");
        vid.pause();
        vid.removeAttribute("src");
        vid.load();
      }
      if (window.ambiance && !window.enPause) {
        window.ambiance.volume = window.audioState.volumeMusique;
      }
    };

    if (window.isRetroMode && vid) {
      window.audioState.muteRetro = true;
      if (window.ambiance) window.ambiance.volume = 0;
      if (!vid.getAttribute("src") && vid.dataset.src) {
        vid.src = vid.dataset.src;
      }
      vid.classList.remove("cache");
      vid.currentTime = 0;
      vid.onended = restaurerAudioPostVideo;
      vid.onerror = restaurerAudioPostVideo;
      vid.play().catch(restaurerAudioPostVideo);
    } else {
      restaurerAudioPostVideo();
    }
  };

  window.changerMusique = (nomFichier) => {
    if (!window.ambiance) {
      window.ambiance = new Audio(`/sounds/${nomFichier}`);
      window.ambiance.loop = true;
    } else {
      window.ambiance.pause();
      window.ambiance.src = `/sounds/${nomFichier}`;
      window.ambiance.load();
    }
    window.ambiance.volume = window.audioState.muteRetro
      ? 0
      : window.audioState.volumeMusique;
    if (
      !window.enPause &&
      !window.audioState.muteRetro &&
      window.audioState.volumeMusique > 0
    ) {
      window.ambiance.play().catch(() => {});
    }
  };
})();
