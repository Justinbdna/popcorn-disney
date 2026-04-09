/**
 * ui.js - Orchestration du SAS, du Tutoriel et du Feedback en jeu
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

  // Clic sur "Découvrir" -> On passe au Tutoriel
    btnDecouvrir.addEventListener('click', () => {
        console.log('Discover button clicked');
        btnDecouvrir.style.display = "none";
        
        // 1. L'astuce anti-flash : on fait apparaître le tuto instantanément en dessous
        ecranTutoriel.style.transition = "none";
        ecranTutoriel.classList.remove('cache');
        
        // 2. Un micro-délai, puis on lance le fondu de l'écran noir qui est au-dessus
        setTimeout(() => {
            ecranChargement.classList.add('cache');
        }, 300);
        
        // 3. On nettoie tout après l'animation (1 seconde)
        setTimeout(() => {
            ecranChargement.remove();
            // On remet la transition douce au cas où pour la sortie du tuto
            ecranTutoriel.style.transition = "opacity 1s ease-in-out"; 
        }, 1050);
    });

    // --- 2. GESTION DU TUTORIEL FLUIDE ---
    let etapeActuelle = 0;
    const etapes = document.querySelectorAll('.etape-tuto');
    const btnSuivant = document.getElementById('btn-suivant');
    const btnRentrer = document.getElementById('btn-rentrer');

    btnSuivant.addEventListener('click', () => {
        // Cacher l'étape actuelle
        etapes[etapeActuelle].classList.remove('active');
        
        // Passer à la suivante
        etapeActuelle++;
        etapes[etapeActuelle].classList.add('active');

        // Si c'est la dernière étape, on change les boutons
        if (etapeActuelle === etapes.length - 1) {
            btnSuivant.classList.add('cache');
            // Petit délai pour l'apparition du bouton final
            setTimeout(() => {
                btnRentrer.classList.remove('cache');
            }, 300);
        }
    });

    // Clic sur "Rentrer dans l'univers" -> Lancement du JEU
    btnRentrer.addEventListener('click', () => {
        ecranTutoriel.classList.add('cache');
        
        // Signal de départ pour l'équipe 3D
        if (typeof window.lancerJeu3D === 'function') {
            window.lancerJeu3D();
        }

        setTimeout(() => {
            ecranTutoriel.remove(); // On nettoie le DOM
        }, 1000);
    });

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
        if (estVisible) {
            infobulleX += (sourisX - infobulleX) * vitesseLerp;
            infobulleY += (sourisY - infobulleY) * vitesseLerp;
            infobulle.style.left = `${infobulleX}px`;
            infobulle.style.top = `${infobulleY}px`;
        }
        requestAnimationFrame(animerUI);
    }
    animerUI();

    // --- 4. API POUR TES COLLÈGUES 3D (Infobulle) ---
    window.afficherInfobulle = function(titre, film, urlImage = null) {
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
        infobulle.classList.remove('visible');
        document.body.classList.remove('survol-objet');
        estVisible = false;
    };
});