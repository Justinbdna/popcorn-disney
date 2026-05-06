/**
 * interaction.js - Gestionnaire d'Interface Utilisateur
 */

(function initUIManager() {
    'use strict';
    // === AUDIO MANAGER GLOBAL ===
    // On remplace les true/false par des valeurs de volume (0 à 1)
    window.audioState = { volumeMusique: 0.3, volumeSFX: 0.5 }; 
    window.ambiance = null;

    window.jouerSFX = (chemin, volumeBase = 1.0) => { 
        if (window.audioState.volumeSFX > 0) {
            const audio = new Audio(chemin);
            // On multiplie le volume du son par le niveau choisi dans les réglages
            audio.volume = volumeBase * window.audioState.volumeSFX;
            audio.play().catch(e => console.warn("Audio bloqué:", e));
            return audio; 
        }
        return null;
    };

    // === GESTION DU SAS DE CHARGEMENT ===
    const ecranChargement = document.getElementById('ecran-chargement');
    const btnDecouvrir = document.getElementById('btn-decouvrir');
    const ecranTutoriel = document.getElementById('ecran-tutoriel');
    const texteChargement = document.querySelector('.texte-chargement');

    setTimeout(() => {
        if (btnDecouvrir && btnDecouvrir.classList.contains('cache')) {
            console.warn("⏳ Sécurité Safari : Déblocage bouton");
            btnDecouvrir.classList.remove('cache');
            if (texteChargement) {
                texteChargement.style.transition = "opacity 0.5s ease";
                texteChargement.style.opacity = "0";
                setTimeout(() => texteChargement.style.display = 'none', 500);
            }
        }
    }, 10000);

    if (btnDecouvrir) {
        btnDecouvrir.addEventListener('click', () => {
            btnDecouvrir.style.display = "none";
            
            window.sonLancementGlobal = window.jouerSFX('/sounds/son_lancement.mp3', 0.8);

            if (ecranTutoriel) {
                ecranTutoriel.style.transition = "none";
                ecranTutoriel.style.opacity = "1";
                ecranTutoriel.classList.remove('cache');
            }
            if (ecranChargement) {
                ecranChargement.style.transition = "opacity 1.5s ease-in-out";
                setTimeout(() => ecranChargement.style.opacity = "0", 50);
                setTimeout(() => ecranChargement.remove(), 1600);
            }
        });
    }

    // === GESTION DU TUTORIEL FLUIDE ===
    let etapeActuelle = 0;
    const etapes = document.querySelectorAll('.etape-tuto');
    const btnSuivant = document.getElementById('btn-suivant');
    const btnRentrer = document.getElementById('btn-rentrer');

    if (btnSuivant) {
        btnSuivant.addEventListener('click', () => {
            window.jouerSFX('/sounds/clic.mp3');
            if (etapes[etapeActuelle]) etapes[etapeActuelle].classList.remove('active');
            etapeActuelle++;
            if (etapes[etapeActuelle]) etapes[etapeActuelle].classList.add('active');

            if (etapeActuelle === etapes.length - 1) {
                btnSuivant.classList.add('cache');
                setTimeout(() => btnRentrer.classList.remove('cache'), 300);
            }
        });
    }

    if (btnRentrer) {
        btnRentrer.addEventListener('click', () => {
            // 🛑 FIX : Coupure nette du son de lancement
            if (window.sonLancementGlobal) window.sonLancementGlobal.pause();

             // --- MUSIQUE DE FOND APPARTEMENT ---
            if (!window.ambiance) {
                window.ambiance = new Audio('/sounds/ambiance.mp3');
                window.ambiance.loop = true; 
            }
            // On applique le volume choisi par le joueur
            window.ambiance.volume = window.audioState.volumeMusique;
            if (window.ambiance.volume > 0) {
                window.ambiance.play().catch(e => console.warn("Musique bloquée:", e));
            }

            if (ecranTutoriel) {
                ecranTutoriel.style.backgroundColor = "#050510"; 
                const video = document.getElementById("bg-video");
                if(video) video.style.opacity = "0"; 
                ecranTutoriel.style.transition = "opacity 1.5s ease-in-out";
                ecranTutoriel.style.opacity = "0";
                setTimeout(() => ecranTutoriel.remove(), 1500);
            }
            initialiserHUD();
            if (typeof window.lancerJeu3D === 'function') window.lancerJeu3D();
        });
    }

    // === GESTION DU HUD ===
    const hud = document.getElementById('hud');
    const affichageScore = document.getElementById('score-affichage');
    const affichageVies = document.getElementById('vies-affichage');
    const affichageChrono = document.getElementById('chrono-affichage');
    
    let score = 0;
    let vies = 3;
    let tempsRestant = 600; 
    let intervalChrono;

    function initialiserHUD() {
        if (hud) hud.classList.remove('cache');
        demarrerChrono();
    }

    window.ajouterScore = function(points) {
        if (!affichageScore) return;
        score += points;
        affichageScore.textContent = score;
        affichageScore.parentElement.style.transform = "scale(1.2)";
        setTimeout(() => affichageScore.parentElement.style.transform = "scale(1)", 200);
    };

    // Mise à jour de la fonction perdreVie pour déclencher l'écran de Game Over
    window.perdreVie = function() {
        if (vies > 0) vies--;
        if (affichageVies) {
            affichageVies.textContent = "❤️".repeat(vies) + "🖤".repeat(3 - vies);
        }
       if (vies === 0) {
            console.log("GAME OVER !");
            if (window.afficherFin) window.afficherFin(false);
        }
    };

    function demarrerChrono() {
        clearInterval(intervalChrono);
        intervalChrono = setInterval(() => {
            if (window.enPause) return; // 🛑 FIX : Le minuteur vérifie la pause CHAQUE seconde
            if (tempsRestant > 0) {
                tempsRestant--;
                let m = Math.floor(tempsRestant / 60).toString().padStart(2, '0');
                let s = (tempsRestant % 60).toString().padStart(2, '0');
                if (affichageChrono) {
                    affichageChrono.textContent = `${m}:${s}`;
                    if(tempsRestant <= 30) affichageChrono.style.color = "#ff4757";
                }
           } else {
                clearInterval(intervalChrono);
                console.log("TEMPS ÉCOULÉ !");
                if (window.afficherFin) window.afficherFin(false);
            }
        }, 1000);
    }

    // === GESTION DE L'INFOBULLE FLUIDE (LERP) ===
    const infobulle = document.getElementById('infobulle');
    let sourisX = 0, sourisY = 0, infobulleX = 0, infobulleY = 0, estVisible = false;
    const vitesseLerp = 0.15; 

    window.addEventListener('mousemove', (e) => { sourisX = e.clientX; sourisY = e.clientY; });

    function animerUI() {
        if (estVisible && infobulle) {
            infobulleX += (sourisX - infobulleX) * vitesseLerp;
            infobulleY += (sourisY - infobulleY) * vitesseLerp;
            infobulle.style.left = `${infobulleX}px`;
            infobulle.style.top = `${infobulleY}px`;
        }
        requestAnimationFrame(animerUI);
    }
    animerUI();

    window.afficherInfobulle = function(titre, film, urlImage = null) {
        if (!infobulle) return;
        document.getElementById('infobulle-titre').textContent = titre;
        document.getElementById('infobulle-film').textContent = `Film : ${film}`;
        const imgEl = document.getElementById('infobulle-img');
        if (urlImage) { imgEl.src = urlImage; imgEl.style.display = 'block'; } 
        else { imgEl.style.display = 'none'; }
        infobulle.classList.add('visible');
        document.body.classList.add('survol-objet');
        if (!estVisible) { infobulleX = sourisX; infobulleY = sourisY; }
        estVisible = true;
    };

    window.cacherInfobulle = function() {
        if (!infobulle) return;
        infobulle.classList.remove('visible');
        document.body.classList.remove('survol-objet');
        estVisible = false;
    };

    // === GESTION DU QUIZ ===
    const DOM = {
        modal: document.getElementById('modal-quiz'),
        question: document.getElementById('quiz-titre'),
        optionsContainer: document.getElementById('quiz-options'),
        feedback: document.getElementById('quiz-feedback')
    };

    window.ui_afficherQuiz = function(data, callback) {
        if (!DOM.modal) { console.error("❌ ERREUR : Modale introuvable."); return; }

        DOM.optionsContainer.innerHTML = '';
        DOM.feedback.textContent = '';
        DOM.feedback.className = 'message-feedback';
        DOM.question.textContent = data.question;

        if (Array.isArray(data.options)) {
            data.options.forEach((texteOption, index) => {
                const btn = document.createElement('button');
                btn.className = 'btn-option';
                btn.textContent = texteOption;

                btn.addEventListener('click', function onClick() {
                    const boutons = DOM.optionsContainer.querySelectorAll('.btn-option');
                    boutons.forEach(b => b.disabled = true);

                    const estBonne = (index === data.reponseCorrecte);

                    if (estBonne) {
                        window.jouerSFX('/sounds/succes.mp3'); // SON DE BONNE RÉPONSE
                        
                        btn.classList.add('correct');
                        DOM.feedback.textContent = data.anecdoteSucces || "Bonne réponse !";
                        DOM.feedback.classList.add('succes');
                    } else {
                       window.jouerSFX('/sounds/erreur.mp3'); // SON DE MAUVAISE RÉPONSE
                        
                        btn.classList.add('incorrect');
                        DOM.feedback.textContent = data.anecdoteEchec || "Mauvaise réponse !";
                        DOM.feedback.classList.add('erreur');
                        boutons[data.reponseCorrecte].classList.add('correct');
                    }


                    setTimeout(() => {
                        DOM.modal.classList.add('cache');
                        if (typeof callback === 'function') callback(estBonne);
                        if (!estBonne) window.perdreVie(); else window.ajouterScore(100);
                    }, 1800);

                }, { once: true });

                DOM.optionsContainer.appendChild(btn);
            });
        }

        if(window.bloquerControles3D) window.bloquerControles3D(true);
        DOM.modal.classList.remove('cache');
    };
    // === GESTION DE LA MODALE DES CONTRÔLES ===
    const btnOuvrirControles = document.getElementById('btn-ouvrir-controles');
    const btnFermerControles = document.getElementById('btn-fermer-controles');
    const modalControles = document.getElementById('modal-controles');
    const onglets = document.querySelectorAll('.onglet');
    const schemas = document.querySelectorAll('.schema');

    if (btnOuvrirControles && modalControles) btnOuvrirControles.addEventListener('click', () => modalControles.classList.remove('cache'));
    if (btnFermerControles && modalControles) btnFermerControles.addEventListener('click', () => modalControles.classList.add('cache'));

    onglets.forEach(onglet => {
        onglet.addEventListener('click', (e) => {
            onglets.forEach(o => o.classList.remove('active'));
            schemas.forEach(s => s.classList.remove('active'));
            e.target.classList.add('active');
            const cible = document.getElementById(e.target.getAttribute('data-cible'));
            if (cible) cible.classList.add('active');
        });
    });
    // === GESTION DES MENUS PAUSE & FIN ===
    const modalPause = document.getElementById('modal-pause');
    const btnPause = document.getElementById('btn-pause');
    const btnReprendre = document.getElementById('btn-reprendre');
    const btnRecommencer = document.getElementById('btn-recommencer');
    const btnQuitterList = document.querySelectorAll('.btn-quitter');

    if (btnPause) btnPause.addEventListener('click', () => { if (window.togglePause) window.togglePause(); });
    if (btnReprendre) btnReprendre.addEventListener('click', () => { if (window.togglePause) window.togglePause(); });
    if (btnRecommencer) btnRecommencer.addEventListener('click', () => location.reload());
    btnQuitterList.forEach(btn => btn.addEventListener('click', () => location.reload()));

    // === GESTION DES VOLUMES (Sliders Menu Pause) ===
    const sliderMusique = document.getElementById('volume-musique');
    const sliderSFX = document.getElementById('volume-sfx');

    if (sliderMusique) {
        sliderMusique.addEventListener('input', (e) => {
            const vol = parseFloat(e.target.value);
            window.audioState.volumeMusique = vol;
            if (window.ambiance) window.ambiance.volume = vol; // Modifie la musique en temps réel !
        });
    }

    if (sliderSFX) {
        sliderSFX.addEventListener('input', (e) => {
            window.audioState.volumeSFX = parseFloat(e.target.value);
            // On joue un tout petit clic silencieux pour que le joueur se rende compte du niveau sonore
            window.jouerSFX('/sounds/clic.mp3', 0.5); 
        });
    }

   // Synchronisation de l'UI avec l'état de pause global
    window.ui_syncPause = () => {
        const modalPause = document.getElementById('modal-pause');
        if (modalPause) {
            if (window.enPause) {
                modalPause.classList.remove('cache');
            } else {
                modalPause.classList.add('cache');
            }
        }
    };
    

})();