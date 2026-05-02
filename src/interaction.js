/**
 * ui.js - Orchestration du SAS, du Tutoriel, du Feedback et du HUD en jeu
 */

document.addEventListener('DOMContentLoaded', () => {
    console.log('DOM fully loaded and parsed');

    // --- 1. GESTION DU SAS DE CHARGEMENT ---
    const ecranChargement = document.getElementById('ecran-chargement');
    const btnDecouvrir = document.getElementById('btn-decouvrir');
    const ecranTutoriel = document.getElementById('ecran-tutoriel');
    const texteChargement = document.querySelector('.texte-chargement');

    if (!ecranChargement) console.error('Loading screen not found');
    if (!btnDecouvrir) console.error('Discover button not found');
    if (!ecranTutoriel) console.error('Tutorial screen not found');

    // 🆘 SÉCURITÉ SAFARI : Apparition du bouton "Découvrir" de force après 10s
    setTimeout(() => {
        if (btnDecouvrir && btnDecouvrir.classList.contains('cache')) {
            console.warn("⏳ Safari rame trop, on débloque le bouton de force !");
            btnDecouvrir.classList.remove('cache');
            if (texteChargement) {
                texteChargement.style.transition = "opacity 0.5s ease";
                texteChargement.style.opacity = "0";
                setTimeout(() => texteChargement.style.display = 'none', 500);
            }
        }
    }, 10000);

    // Clic sur "Découvrir" -> On passe au Tutoriel (Avec tes transitions fluides)
    btnDecouvrir.addEventListener('click', () => {
        console.log('Discover button clicked');
        btnDecouvrir.style.display = "none";
        
        // Tuto 100% opaque en dessous
        ecranTutoriel.style.transition = "none";
        ecranTutoriel.style.opacity = "1";
        ecranTutoriel.classList.remove('cache');
        
        // Fondu du sas
        ecranChargement.style.transition = "opacity 1.5s ease-in-out";
        setTimeout(() => ecranChargement.style.opacity = "0", 50);
        
        // On nettoie tout après le fondu
        setTimeout(() => {
            ecranChargement.remove();
        }, 1600);
    });

    // --- 2. GESTION DU TUTORIEL FLUIDE ---
    let etapeActuelle = 0;
    const etapes = document.querySelectorAll('.etape-tuto');
    const btnSuivant = document.getElementById('btn-suivant');
    const btnRentrer = document.getElementById('btn-rentrer');

    if (btnSuivant) {
        btnSuivant.addEventListener('click', () => {
            etapes[etapeActuelle].classList.remove('active');
            etapeActuelle++;
            etapes[etapeActuelle].classList.add('active');

            if (etapeActuelle === etapes.length - 1) {
                btnSuivant.classList.add('cache');
                setTimeout(() => {
                    btnRentrer.classList.remove('cache');
                }, 300);
            }
        });
    }

    // Clic sur "Rentrer dans l'univers" -> Lancement du JEU
    if (btnRentrer) {
        btnRentrer.addEventListener('click', () => {
            // 1. On coupe la vidéo et on met un fond noir absolu pour éviter le glitch
            ecranTutoriel.style.backgroundColor = "#050510"; 
            const video = document.getElementById("bg-video");
            if(video) video.style.opacity = "0"; 

            // 2. Fondu vers la 3D
            ecranTutoriel.style.transition = "opacity 1.5s ease-in-out";
            ecranTutoriel.style.opacity = "0";
            
            // 3. On affiche le HUD de Lévine
            initialiserHUD();

            if (typeof window.lancerJeu3D === 'function') window.lancerJeu3D();
            
            setTimeout(() => ecranTutoriel.remove(), 1500);
        });
    }

    // --- 3. GESTION DE L'INFOBULLE FLUIDE (EFFET LERP) ---
    const infobulle = document.getElementById('infobulle');
    let sourisX = 0, sourisY = 0;
    let infobulleX = 0, infobulleY = 0;
    let estVisible = false;
    const vitesseLerp = 0.15; 

    window.addEventListener('mousemove', (e) => {
        sourisX = e.clientX;
        sourisY = e.clientY;
    });

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
        if (urlImage) {
            imgEl.src = urlImage;
            imgEl.style.display = 'block';
        } else {
            imgEl.style.display = 'none';
        }

        infobulle.classList.add('visible');
        document.body.classList.add('survol-objet');
        
        if (!estVisible) {
            infobulleX = sourisX;
            infobulleY = sourisY;
        }
        estVisible = true;
    };

    window.cacherInfobulle = function() {
        if (!infobulle) return;
        infobulle.classList.remove('visible');
        document.body.classList.remove('survol-objet');
        estVisible = false;
    };

    // ==============================================================
    // 5. GESTION DU HUD (Vies, Score, Chrono) - Code de Lévine
    // ==============================================================
    const hud = document.getElementById('hud');
    const affichageScore = document.getElementById('score-affichage');
    const affichageVies = document.getElementById('vies-affichage');
    const affichageChrono = document.getElementById('chrono-affichage');
    
    let score = 0;
    let vies = 3;
    let tempsRestant = 180; // 3 minutes en secondes
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
        
        let texteVies = "";
        for(let i=0; i<3; i++) {
            texteVies += (i < vies) ? "❤️" : "🖤";
        }
        if (affichageVies) affichageVies.textContent = texteVies;

        if (vies === 0) {
            console.log("GAME OVER !");
            window.afficherInfobulle("GAME OVER", "Plus de vies...", null);
        }
    };

    function demarrerChrono() {
        clearInterval(intervalChrono);
        intervalChrono = setInterval(() => {
            if (tempsRestant > 0) {
                tempsRestant--;
                let minutes = Math.floor(tempsRestant / 60);
                let secondes = tempsRestant % 60;
                if (affichageChrono) affichageChrono.textContent = `${minutes.toString().padStart(2, '0')}:${secondes.toString().padStart(2, '0')}`;
                
                if(tempsRestant <= 30 && affichageChrono) {
                    affichageChrono.style.color = "#ff4757";
                }
            } else {
                clearInterval(intervalChrono);
                console.log("TEMPS ÉCOULÉ !");
            }
        }, 1000);
    }

    // ==============================================================
    // 6. GESTION DES MODALES (Quiz & Paramètres) - Code de Lévine
    // ==============================================================
    const modalQuiz = document.getElementById('modal-quiz');
    const modalParametres = document.getElementById('modal-parametres');
    
    const btnOuvrirParam = document.getElementById('btn-ouvrir-parametres');
    if (btnOuvrirParam) {
        btnOuvrirParam.addEventListener('click', () => {
            modalParametres.classList.remove('cache');
        });
    }
    
    const btnFermerParam = document.getElementById('btn-fermer-parametres');
    if (btnFermerParam) {
        btnFermerParam.addEventListener('click', () => {
            modalParametres.classList.add('cache');
        });
    }

    const toggleMusique = document.getElementById('toggle-musique');
    if (toggleMusique) {
        toggleMusique.addEventListener('change', (e) => {
            console.log("Musique: ", e.target.checked ? "ON" : "OFF");
        });
    }

    // --- Le Quiz ---
    let objetActuelEnCoursDeQuiz = null;

    window.ui_afficherQuiz = function(data, callback) {

        if (!modalQuiz) return;
        document.getElementById('quiz-titre').textContent = data.question;
        const conteneur = document.getElementById('quiz-options');
        conteneur.innerHTML = data.options.map((opt, i) => `<button class="bouton-secondaire btn-rep" data-index="${i}">${opt}</button>`).join("");
        document.getElementById('quiz-feedback').textContent = "";
        document.getElementById('quiz-feedback').className = "message-feedback";

        modalQuiz.classList.remove('cache');
        if(window.bloquerControles3D) window.bloquerControles3D(true);
        modalQuiz.classList.remove('cache');
        document.querySelectorAll('.btn-rep').forEach(btn => btn.addEventListener('click', (e) => {
            const estBonne = parseInt(e.target.dataset.index) === data.reponseCorrecte;
            document.getElementById('quiz-feedback').textContent = estBonne ? data.anecdoteSucces : data.anecdoteEchec;
            document.getElementById('quiz-feedback').className = `message-feedback ${estBonne ? 'succes' : 'erreur'}`;
            setTimeout(() => { modalQuiz.classList.add('cache'); callback(estBonne); if(!estBonne) window.perdreVie(); else window.ajouterScore(100); }, 2500);
        }));
    
    };
    
});