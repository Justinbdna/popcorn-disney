// Fichier : src/disneyData.js
// MISSION POUR MOHAMED : Remplir les questions, les 4 options, indiquer la bonne réponse (0, 1, 2 ou 3) et faire l'anecdote !

export const disneyData = [
  {
    id: "low_poly_lightsaber", // 🟢 Star Wars
    nom: "Le Sabre Laser",
    question: "De quelle couleur est le sabre original de Luke Skywalker ?",
    options: ["Bleu", "Vert", "Rouge", "Violet"],
    reponseCorrecte: 0, 
    anecdoteSucces: "Bravo ! Le sabre était bleu. Il devient vert dans 'Le Retour du Jedi'.",
    anecdoteEchec: "Faux ! C'était Bleu dans le premier film.",
    flotte: true, y: 0, x: -10, z: 0, vitesse: 1.5, amplitude: 0.05, 
    hasLowPoly: true
  },
  {
    id: "princess_snow_white_dress", // 🟢 Blanche-Neige
    nom: "La Robe de Princesse",
    question: "Combien de nains accompagnent Blanche-Neige ?",
    options: ["5", "7", "9", "12"],
    reponseCorrecte: 1, 
    anecdoteSucces: "Exact ! Prof, Joyeux, Atchoum, Grincheux, Dormeur, Timide et Simplet.",
    anecdoteEchec: "Faux ! Ils sont 7.",
    flotte: false, y: 0, x: 14, z: 0, 
    hasLowPoly: true
  },
  {
    id: "Aladdin_lamp", // 🟢 Aladdin
    nom: "La Lampe Magique",
    question: "Quel acteur célèbre double le Génie dans Aladdin (1992) ?",
    options: ["Tom Hanks", "Jim Carrey", "Robin Williams", "Eddie Murphy"],
    reponseCorrecte: 2,
    anecdoteSucces: "C'est ça ! Robin Williams a tellement improvisé qu'il a changé le film.",
    anecdoteEchec: "Perdu ! C'était Robin Williams.",
    flotte: true, y: 2, x: -52.4419806717569, z: 0, vitesse: 0.5, amplitude: 0.15, 
    hasLowPoly: true
  },
  {
    id: "lowpoly_cowboy_hat", // 🟢 Toy Story (Woody)
    nom: "Le Chapeau de Cowboy",
    question: "[Mohamed : Ta question ici]",
    options: ["Choix 1", "Choix 2", "Choix 3", "Choix 4"],
    reponseCorrecte: 0, 
    anecdoteSucces: "[Mohamed : Ton anecdote ici]", 
    anecdoteEchec: "[Mohamed : Ta phrase d'erreur ici]",
    flotte: false, y: 0, x: -5, z: 0, 
    hasLowPoly: true
  },
  {
    id: "drapeau_cars", // 🟢 Cars
    nom: "Le Drapeau de Course",
    question: "",
    options: ["", "", "", ""],
    reponseCorrecte: 0, anecdoteSucces: "", anecdoteEchec: "",
    flotte: true, y: 0, x: 0, z: -5, vitesse: 0.8, amplitude: 0.08, 
    hasLowPoly: true
  },
  {
    id: "Kim_Possible_CellPhone", // 🟢 Kim Possible
    nom: "Le Kimmunicateur",
    question: "",
    options: ["", "", "", ""],
    reponseCorrecte: 0, anecdoteSucces: "", anecdoteEchec: "",
    flotte: true, y: 0, x: 0, z: 0, vitesse: 1.0, amplitude: 0.1, 
    hasLowPoly: true
  },
  {
    id: "badge", // 🟢 Là-Haut
    nom: "Le Badge d'Explorateur",
    question: "",
    options: ["", "", "", ""],
    reponseCorrecte: 0, anecdoteSucces: "", anecdoteEchec: "",
    flotte: false, y: 0, x: -2, z: 2, 
    hasLowPoly: true
  },
  {
    id: "bougie", // 🟢 La Belle et la Bête
    nom: "Lumière la Bougie",
    question: "",
    options: ["", "", "", ""],
    reponseCorrecte: 0, anecdoteSucces: "", anecdoteEchec: "",
    flotte: false, y: 0, x: 2, z: 2, 
    hasLowPoly: true
  },
  {
    id: "casque_kusco", // 🟢 Kuzco
    nom: "Le Casque de l'Empereur",
    question: "",
    options: ["", "", "", ""],
    reponseCorrecte: 0, anecdoteSucces: "", anecdoteEchec: "",
    flotte: false, y: 0, x: -4, z: 2, 
    hasLowPoly: true
  },
  {
    id: "collier_poca", // 🟢 Pocahontas
    nom: "Le Collier de Pocahontas",
    question: "",
    options: ["", "", "", ""],
    reponseCorrecte: 0, anecdoteSucces: "", anecdoteEchec: "",
    flotte: false, y: 0, x: 4, z: 2, 
    hasLowPoly: true
  },
  {
    id: "poele", // 🟢 Raiponce
    nom: "La Poêle à Frire",
    question: "",
    options: ["", "", "", ""],
    reponseCorrecte: 0, anecdoteSucces: "", anecdoteEchec: "",
    flotte: false, y: 0, x: 0, z: 4, 
    hasLowPoly: true
  },
  {
    id: "pot_miel", // 🟢 Winnie l'Ourson
    nom: "Le Pot de Miel",
    question: "",
    options: ["", "", "", ""],
    reponseCorrecte: 0, anecdoteSucces: "", anecdoteEchec: "",
    flotte: false, y: 0, x: 0, z: -2, 
    hasLowPoly: true
  },
  { 
    id: "cj_gta_sa2014", // 🟢 GTA Easter Egg
    nom: "CJ",
    question: "",
    options: ["", "", "", ""],
    reponseCorrecte: 0, anecdoteSucces: "", anecdoteEchec: "",
    flotte: false, y: 0, x: 0, z: -2,
    hasLowPoly: true
  }
];

