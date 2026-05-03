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
    flotte: true, y: 0, x: -10, z: 0, vitesse: 1.5, amplitude: 0.05,
    scale: 0.1,
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
    flotte: false, y: 0, x: 14, z: 0,
    scale: 1,
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
    flotte: true, y: 2, x: -52.4419806717569, z: 0, vitesse: 0.5, amplitude: 0.15,
    scale: 1,
    hasLowPoly: true
  },
  {
    id: "lowpoly_cowboy_hat", // 🟢 Toy Story (Woody)
    nom: "Le Chapeau de Cowboy",
    question: "Quel nom est écrit sous la botte du propriétaire de ce chapeau ?",
    options: ["Sid", "Andy", "Buzz", "Bonnie"],
    reponseCorrecte: 1,
    anecdoteSucces: "Slay ! C'est bien Andy. Un détail iconique qui définit la loyauté de Woody.",
    anecdoteEchec: "Dommage ! C'est Andy (ou Bonnie dans les derniers films) qui marque son territoire.",
    flotte: false, y: 0, x: -5, z: 0,
    scale: 50,
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
    flotte: true, y: 0, x: 0, z: -5, vitesse: 0.8, amplitude: 0.08,
    scale: 3,
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
    flotte: true, y: 0, x: 0, z: 0, vitesse: 1.0, amplitude: 0.1, 
    scale: 10,
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
    flotte: false, y: 0, x: -2, z: 2,
    scale: 10,
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
    flotte: false, y: 0, x: 2, z: 2,
    scale: 10,
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
    flotte: false, y: 0, x: -4, z: 2,
    scale: 10,
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
    flotte: false, y: 0, x: 4, z: 2,
    scale: 10,
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
    flotte: false, y: 0, x: 0, z: 4,
    scale: 10,
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
    flotte: false, y: 0, x: 0, z: -2,
    scale: 10,
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
    flotte: false, y: 0, x: 51, z: -223.61,
    scale: 2.7,
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
    flotte: false, y: 1, x: 10, z: 10,
    scale: 0.3,
    hasLowPoly: true
  },
  {
    id: "ballon_cirque", // 🔴 Dumbo
    nom: "Le Ballon de Cirque",
    question: "Quelle particularité physique permet à Dumbo de voler ?",
    options:["Ses grandes oreilles", "Sa trompe musclée", "Ses pattes puissantes", "Un vent magique"],
    reponseCorrecte: 0,
    anecdoteSucces: "Exactement ! Ses grandes oreilles lui servent d'ailes. Timothée la souris lui fait croire qu'une plume magique est nécessaire.",
    anecdoteEchec: "Raté ! Ce sont ses immenses oreilles qui lui permettent de voler.",
    flotte: false, y: 0, x: 0, z: 0,
    scale: 1,
    hasLowPoly: true
  },
  {
    id: "carotte", // 🔵 La Reine des Neiges
    nom: "La Carotte de Olaf",
    question: "Quel est le rêve le plus cher d'Olaf le bonhomme de neige ?",
    options:["Nager dans l'océan", "Goûter au chocolat chaud", "Vivre l'été chaud", "Rencontrer des rennes"],
    reponseCorrecte: 2,
    anecdoteSucces: "Parfait ! Olaf chante 'L'été' et rêve de sentir la chaleur du soleil... sans réaliser ce que ça lui ferait.",
    anecdoteEchec: "Non ! Olaf rêve de connaître l'été et la chaleur, sans se douter qu'il fondrait.",
    flotte: false, y: 0, x: 0, z: 0,
    scale: 1,
    hasLowPoly: true
  },
  {
    id: "chemise", // 🟣 Lilo & Stitch
    nom: "La Chemise à Fleurs d'Elvis",
    question: "Quel est le numéro d'expérience de Stitch selon la fiche de Jumba ?",
    options:["Expérience 124", "Expérience 626", "Expérience 000", "Expérience 42"],
    reponseCorrecte: 1,
    anecdoteSucces: "Wobbé ! Expérience 626 ! C'est aussi le nom de son vaisseau dans la franchise.",
    anecdoteEchec: "Loup ! Stitch est l'Expérience 626, créé par Jumba pour être une arme de destruction.",
    flotte: false, y: 0, x: 0, z: 0,
    scale: 1,
    hasLowPoly: true
  },
  {
    id: "coq-vaiana", // 🟠 Vaiana
    nom: "Hei Hei le Coq",
    question: "Pourquoi le chef du village laisse-t-il Hei Hei partir sur le bateau ?",
    options:["Il est sacré", "Pour ne pas le manger", "Il peut naviguer", "Il porte chance"],
    reponseCorrecte: 1,
    anecdoteSucces: "Ouais ! Tui dit que le tuer serait une honte, alors il l'embarque... même s'il est d'une stupidité légendaire.",
    anecdoteEchec: "Non ! La vraie raison c'est que le manger serait une honte, donc il part en mer.",
    flotte: false, y: 0, x: 0, z: 0,
    scale: 1,
    hasLowPoly: true
  },
  {
    id: "gant_mickey", // 🟡 Mickey Mouse
    nom: "Le Gant Blanc de Mickey",
    question: "En quelle année Mickey Mouse fait-il sa première apparition officielle ?",
    options:["1923", "1928", "1932", "1919"],
    reponseCorrecte: 1,
    anecdoteSucces: "Hot dog ! 1928, avec 'Steamboat Willie', le premier dessin animé avec son synchronisé.",
    anecdoteEchec: "Raté ! C'est en 1928 avec 'Steamboat Willie' que Mickey est né officiellement.",
    flotte: false, y: 0, x: 0, z: 0,
    scale: 1,
    hasLowPoly: true
  },
  {
    id: "gargouille", // 🟤 Le Bossu de Notre-Dame
    nom: "La Gargouille de Notre-Dame",
    question: "Comment s'appelle la gargouille la plus timide et romantique du film ?",
    options:["Victor", "Hugo", "Laverne", "Djali"],
    reponseCorrecte: 0,
    anecdoteSucces: "Bravo ! Victor est le plus sensible des trois, toujours en admiration devant Esméralda.",
    anecdoteEchec: "Faux ! C'est Victor, le plus romantique. Hugo c'est le glouton, Laverne c'est la sage.",
    flotte: false, y: 0, x: 0, z: 0,
    scale: 1,
    hasLowPoly: true
  },
  {
    id: "hyene", // 🟢 Le Roi Lion
    nom: "La Hyène",
    question: "Quel est le nom de la hyène leader du trio dans Le Roi Lion ?",
    options:["Banzai", "Ed", "Shenzi", "Nala"],
    reponseCorrecte: 2,
    anecdoteSucces: "Perfecto ! Shenzi est la cheffe. Banzai est le râleur, Ed est le fou riant.",
    anecdoteEchec: "Non ! La leader c'est Shenzi. Elle commande Banzai et Ed sous les ordres de Scar.",
    flotte: false, y: 0, x: 0, z: 0,
    scale: 1,
    hasLowPoly: true
  },
  {
    id: "liane", // 🟢 Tarzan
    nom: "La Liane de Tarzan",
    question: "Quel compositeur a signé la bande originale de Tarzan avec 'Trashin' the Camp' ?",
    options:["Elton John", "Phil Collins", "Hans Zimmer", "Alan Menken"],
    reponseCorrecte: 1,
    anecdoteSucces: "Yaaah ! Phil Collins a tout composé et chanté lui-même. Un choix audacieux pour l'époque.",
    anecdoteEchec: "Raté ! C'est Phil Collins qui a composé et interprété toutes les chansons.",
    flotte: true, y: 0, x: 0, z: 0, vitesse: 0.8, amplitude: 0.1,
    scale: 1,
    hasLowPoly: true
  },
  {
    id: "noeud_rose", // 🟣 Le monde de Ralph
    nom: "Le Nœud Rose de Vanellope",
    question: "Dans quel jeu vidéo Vanellope von Schweetz est-elle la présidente ?",
    options:["Sugar Rush", "Fix-It Felix", "Hero's Duty", "Candy Crush"],
    reponseCorrecte: 0,
    anecdoteSucces: "Glitch power ! Sugar Rush, le jeu de course de karts aux bonbons. Elle en est la vraie présidente !",
    anecdoteEchec: "Non ! C'est Sugar Rush. Ralph lui est dans Fix-It Felix.",
    flotte: false, y: 0, x: 0, z: 0,
    scale: 1,
    hasLowPoly: true
  },
  {
    id: "nuage", // 🔵 Planes
    nom: "Le Nuage de Course",
    question: "Quel est le nom de l'avion héros du film Planes ?",
    options:["Ripslinger", "Dusty Crophopper", "El Chupacabra", "Skipper"],
    reponseCorrecte: 1,
    anecdoteSucces: "Dans le mille ! Dusty Crophopper, un épandeur agricole qui rêve de gagner la course mondiale.",
    anecdoteEchec: "Non ! C'est Dusty Crophopper, le petit avion agricole qui ne devait pas voler si haut.",
    flotte: true, y: 0, x: 0, z: 0, vitesse: 1.2, amplitude: 0.12,
    scale: 1,
    hasLowPoly: true
  },
  {
    id: "pates", // 🟡 La Belle et le Clochard
    nom: "Le Plat de Spaghettis",
    question: "Dans quel restaurant se déroule la scène iconique des spaghettis ?",
    options:["Bella Notte", "Tony's Restaurant", "Ristorante Roma", "Mama Leoni"],
    reponseCorrecte: 1,
    anecdoteSucces: "Bella notte ! Tony's Restaurant, où Tony chante 'Bella Notte' aux chandelles pour les deux tourtereaux.",
    anecdoteEchec: "Faux ! C'est Tony's Restaurant. 'Bella Notte' c'est la chanson, pas le nom du resto.",
    flotte: false, y: 0, x: 0, z: 0,
    scale: 1,
    hasLowPoly: true
  },
  {
    id: "rose", // 🔴 La Belle et la Bête
    nom: "La Rose Enchantée",
    question: "Combien de temps le Prince a-t-il pour briser le sortilège avant que la rose se fane ?",
    options:["Avant ses 20 ans", "Avant ses 21 ans", "Avant la première neige", "Avant la pleine lune"],
    reponseCorrecte: 1,
    anecdoteSucces: "Exact ! Il doit apprendre à aimer et être aimé avant son 21e anniversaire.",
    anecdoteEchec: "Faux ! La malédiction doit être brisée avant le 21e anniversaire du Prince.",
    flotte: true, y: 0, x: 0, z: 0, vitesse: 0.5, amplitude: 0.08,
    scale: 1,
    hasLowPoly: true
  },  
];