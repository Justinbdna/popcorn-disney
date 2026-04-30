// Fichier : src/disneyData.js
// Fusion : Copywriting de Mohamed + Données techniques strictes (ID, Scale, Coordonnées)

export const disneyData =[
  {
    id: "low_poly_lightsaber", // 🟢 Star Wars
    nom: "Le Sabre Laser",
    question: "De quelle couleur est le sabre original de Luke Skywalker ?",
    options:["Bleu", "Vert", "Rouge", "Violet"],
    reponseCorrecte: 0,
    anecdoteSucces: "Bravo ! Le sabre était bleu. Il devient vert dans 'Le Retour du Jedi'.",
    anecdoteEchec: "Faux ! C'était Bleu dans le premier film.",
    flotte: true, vitesse: 1.5, amplitude: 0.05,
    x: -32.00, y: -0.01, z: -242.37, rotX: 0.000, rotY: 0.000, rotZ: 0.000, scale: 0.10,
    hasLowPoly: true
  },
  {
    id: "princess_snow_white_dress", // 🟢 Blanche-Neige
    nom: "La Robe de Princesse",
    question: "Combien de nains accompagnent Blanche-Neige ?",
    options:["5", "7", "9", "12"],
    reponseCorrecte: 1,
    anecdoteSucces: "Exact ! Prof, Joyeux, Atchoum, Grincheux, Dormeur, Timide et Simplet.",
    anecdoteEchec: "Faux ! Ils sont 7.",
    flotte: false,
    x: 36.00, y: 0.00, z: -39.00, rotX: 0.000, rotY: 0.000, rotZ: 0.000, scale: 1.00,
    hasLowPoly: true
  },
  {
    id: "Aladdin_lamp", // 🟢 Aladdin
    nom: "La Lampe Magique",
    question: "Quel acteur célèbre double le Génie dans Aladdin (1992) ?",
    options:["Tom Hanks", "Jim Carrey", "Robin Williams", "Eddie Murphy"],
    reponseCorrecte: 2,
    anecdoteSucces: "C'est ça ! Robin Williams a tellement improvisé qu'il a changé le film.",
    anecdoteEchec: "Perdu ! C'était Robin Williams.",
    flotte: true, vitesse: 0.5, amplitude: 0.15,
    x: -104.44, y: 13.55, z: -157.08, rotX: 0.000, rotY: 5.000, rotZ: 0.000, scale: 1.00,
    hasLowPoly: true
  },
  {
    id: "lowpoly_cowboy_hat_V2", // 🟢 Toy Story (Woody)
    nom: "Le Chapeau de Cowboy",
    question: "Quel nom est écrit sous la botte du propriétaire de ce chapeau ?",
    options: ["Sid", "Andy", "Buzz", "Bonnie"],
    reponseCorrecte: 1,
    anecdoteSucces: "Slay ! C'est bien Andy. Un détail iconique qui définit la loyauté de Woody.",
    anecdoteEchec: "Dommage ! C'est Andy (ou Bonnie dans les derniers films) qui marque son territoire.",
    flotte: false,
    x: 51.13, y: 24.48, z: -223.25, rotX: 0.000, rotY: 0.000, rotZ: 0.000, scale: 15.00,
    hasLowPoly: true
  },
  {
    id: "drapeau_cars", // 🟢 Cars
    nom: "Le Drapeau de Course",
    question: "Dans quelle ville imaginaire se déroule la majeure partie du premier film Cars ?",
    options:["Radiator Springs", "Route 66 City", "Piston Cup Ville", "Turbo Town"],
    reponseCorrecte: 0,
    anecdoteSucces: "Vroom ! Radiator Springs, le plus beau petit village du comté de Carburateur !",
    anecdoteEchec: "Raté ! C'était Radiator Springs, sur la célèbre Route 66.",
    flotte: true, vitesse: 0.8, amplitude: 0.08,
    x: -161.00, y: 19.06, z: -90.00, rotX: 0.000, rotY: 0.000, rotZ: 0.000, scale: 3.00,
    hasLowPoly: true
  },
  {
    id: "Kim_Possible_CellPhone", // 🟢 Kim Possible
    nom: "Le Kimmunicateur",
    question: "Quel est le nom du génie de l'informatique qui aide Kim via cet appareil ?",
    options:["Ron Stoppable", "Wade", "Rufus", "Drakken"],
    reponseCorrecte: 1,
    anecdoteSucces: "Bip-bip ! Exact, Wade gère tout depuis sa chambre sans jamais sortir.",
    anecdoteEchec: "Nope ! C'est Wade, le petit génie de 10 ans qui a créé ce gadget.",
    flotte: true, vitesse: 1.0, amplitude: 0.1, 
    x: -18.91, y: 13.06, z: -34.56, rotX: 5.000, rotY: 0.000, rotZ: 0.000, scale: 5.00,
    hasLowPoly: true
  },
  {
    id: "badge", // 🟢 Là-Haut
    nom: "Le Badge d'Explorateur",
    question: "À l'origine, quel objet servait de badge de 'L'assistant de l'explorateur' ?",
    options:["Une capsule de soda", "Une pièce d'or", "Un bouton de chemise", "Une épingle à nourrice"],
    reponseCorrecte: 0,
    anecdoteSucces: "L'aventure est au bout du chemin ! La capsule de soda 'Ellie' est le symbole ultime du film.",
    anecdoteEchec: "C'était une simple capsule de soda de raisin ! Un trésor sentimental.",
    flotte: false,
    x: -47.00, y: 32.25, z: -82.81, rotX: 0.000, rotY: 4.700, rotZ: 0.000, scale: 5.00,
    hasLowPoly: true
  },
  {
    id: "bougie", // 🟢 La Belle et la Bête
    nom: "Lumière la Bougie",
    question: "Quel est le métier de Lumière avant d'être transformé en chandelier ?",
    options:["Cuisinier", "Maître d'hôtel", "Garde du corps", "Bibliothécaire"],
    reponseCorrecte: 1,
    anecdoteSucces: "C'est la fête ! En tant que maître d'hôtel, il sait recevoir ses invités.",
    anecdoteEchec: "Et non, Lumière était le maître d'hôtel du château.",
    flotte: false,
    x: 19.00, y: 23.37, z: -143.79, rotX: 0.000, rotY: 3.000, rotZ: 0.000, scale: 5.00,
    hasLowPoly: true
  },
  {
    id: "casque_kusco", // 🟢 Kuzco
    nom: "Le Casque de l'Empereur",
    question: "En quel animal Kuzco est-il transformé par erreur par Yzma ?",
    options:["Un alpaga", "Un lama", "Une tortue", "Un condor"], 
    reponseCorrecte: 1,
    anecdoteSucces: "Booyah ! Un lama ! 'Lama de compet', comme il dit.",
    anecdoteEchec: "Mauvaise pioche ! Il devient un lama. Pas de chance pour un empereur.",
    flotte: false,
    x: -55.00, y: 13.79, z: -149.00, rotX: 0.000, rotY: 4.700, rotZ: 0.000, scale: 10.00,
    hasLowPoly: true
  },
  {
    id: "collier_poca", // 🟢 Pocahontas
    nom: "Le Collier de Pocahontas",
    question: "De quelle couleur est la pierre centrale du collier de Pocahontas ?",
    options:["Rouge", "Vert émeraude", "Bleu turquoise", "Jaune ambre"],
    reponseCorrecte: 2,
    anecdoteSucces: "Juste ! Ce bleu turquoise appartient à l'héritage de sa mère.",
    anecdoteEchec: "C'était le bleu turquoise ! Un bijou iconique de la culture Powhatan.",
    flotte: false,
    x: -54.34, y: 13.93, z: -163.84, rotX: 0.000, rotY: 4.700, rotZ: 0.000, scale: 10.00,
    hasLowPoly: true
  },
  {
    id: "poele", // 🟢 Raiponce
    nom: "La Poêle à Frire",
    question: "Qui apprend à Flynn Rider que la poêle est une arme redoutable ?",
    options:["Raiponce", "Maximus", "Pascal", "Mère Gothel"],
    reponseCorrecte: 0,
    anecdoteSucces: "Exact ! 'On devrait tous en avoir une !' dixit Flynn après l'avoir testée.",
    anecdoteEchec: "C'est Raiponce ! Elle prouve qu'un ustensile de cuisine bat une épée.",
    flotte: false,
    x: -140.41, y: 14.76, z: -235.78, rotX: 0.000, rotY: 9.500, rotZ: 0.000, scale: 10.00,
    hasLowPoly: true
  },
  {
    id: "pot_miel", // 🟢 Winnie l'Ourson
    nom: "Le Pot de Miel",
    question: "Comment Winnie écrit-il souvent le mot 'Miel' sur ses pots ?",
    options:["MIEL", "HUNNY", "HONEY", "MYEL"],
    reponseCorrecte: 1,
    anecdoteSucces: "Miam ! Winnie l'écrit 'HUNNY' avec sa petite touche personnelle.",
    anecdoteEchec: "Hé non ! Winnie fait souvent la faute et écrit 'HUNNY'.",
    flotte: false,
    x: -157.15, y: 14.35, z: -236.84, rotX: 0.000, rotY: 0.000, rotZ: 0.000, scale: 10.00,
    hasLowPoly: true
  },
  { 
    id: "cj_gta_sa2014", // 🟢 GTA Easter Egg
    nom: "CJ",
    question: "Quelle est la phrase culte de CJ au début du jeu quand il arrive dans l'allée ?",
    options:["Here we go again", "All you had to do was follow the train", "Grove Street 4 Life", "Busta !"],
    reponseCorrecte: 0,
    anecdoteSucces: "Ah shit, here we go again ! Tu es un vrai fan de San Andreas.",
    anecdoteEchec: "C'est malheureux... C'était la phrase la plus memeable du jeu.",
    flotte: false,
    x: 51.00, y: 0.00, z: -223.61, rotX: 0.000, rotY: 0.000, rotZ: 0.000, scale: 2.70,
    hasLowPoly: true
  },
  {
    id: "Carpet_aladdin", // 🟢 Carpet Aladdin
    nom: "Tapis Aladdin",
    question: "Comment s'appelle le singe d'Aladdin ?",
    options:["Abu", "Iago", "Rajal", "Meeko"],
    reponseCorrecte: 0,
    anecdoteSucces: "Slay ! Abu est effectivement le meilleur complice de tapis.",
    anecdoteEchec: "C'est Abu ! Iago c'est le perroquet, ne mélange pas tout !",
    flotte: false,
    x: -105.00, y: 1.00, z: -159.02, rotX: 0.000, rotY: 4.700, rotZ: 0.000, scale: 0.30,
    hasLowPoly: true
  }
];