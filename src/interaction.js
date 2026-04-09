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
        
       // 1 & 2. Tuto 100% opaque en dessous, seul l'écran noir fond (anti-trou)
        ecranTutoriel.style.transition = "none";
        ecranTutoriel.style.opacity = "1";
        ecranTutoriel.classList.remove('cache');
        ecranChargement.style.transition = "opacity 1.5s ease-in-out";
        setTimeout(() => ecranChargement.style.opacity = "0", 50);
        
        // 3. On nettoie tout après le fondu (1.5s + marge)
        setTimeout(() => {
            ecranChargement.remove();
            }, 1600);
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
        // 1. On coupe la vidéo et on met un fond noir absolu pour éviter le glitch
        ecranTutoriel.style.backgroundColor = "#050510"; 
        const video = document.getElementById("bg-video");
        if(video) video.style.opacity = "0"; 

       // 2. Fondu vers la 3D (sans la classe 'cache' qui casse l'animation)
        ecranTutoriel.style.transition = "opacity 1.5s ease-in-out";
        ecranTutoriel.style.opacity = "0";
        if (typeof window.lancerJeu3D === 'function') window.lancerJeu3D();
        setTimeout(() => ecranTutoriel.remove(), 1500);
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