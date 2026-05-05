/**
 * interaction.js - Gestionnaire d'Interface Utilisateur
 */

(function initUIManager() {
    'use strict';

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

    window.perdreVie = function() {
        if (vies > 0) vies--;
        if (affichageVies) {
            affichageVies.textContent = "❤️".repeat(vies) + "🖤".repeat(3 - vies);
        }
        if (vies === 0) {
            console.log("GAME OVER !");
            if (window.bloquerControles3D) window.bloquerControles3D(true); // 🛑 FIX : On coupe le moteur 3D
            window.afficherInfobulle("GAME OVER", "La partie est terminée.", null);
        }
    };

    function demarrerChrono() {
        clearInterval(intervalChrono);
        intervalChrono = setInterval(() => {
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
                if (window.bloquerControles3D) window.bloquerControles3D(true); // 🛑 FIX : On coupe le moteur 3D
                console.log("TEMPS ÉCOULÉ !");
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
                        btn.classList.add('correct');
                        DOM.feedback.textContent = data.anecdoteSucces || "Bonne réponse !";
                        DOM.feedback.classList.add('succes');
                    } else {
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

})();