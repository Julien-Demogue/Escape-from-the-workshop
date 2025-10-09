CREATE DATABASE if not exists escape_game;

USE escape_game;

CREATE USER if not EXISTS 'exporter' @'%' IDENTIFIED BY 'exporterpassword'
WITH
    MAX_USER_CONNECTIONS 3;

GRANT PROCESS,
REPLICATION CLIENT,
SLAVE MONITOR,
SELECT ON *.* TO 'exporter' @'%';

FLUSH PRIVILEGES;

CREATE TABLE IF NOT EXISTS users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(50) NOT NULL UNIQUE,
    hashedEmail VARCHAR(256) NOT NULL UNIQUE,
    color VARCHAR(12) NOT NULL
);

CREATE TABLE IF NOT EXISTS challenges (
    id INT AUTO_INCREMENT PRIMARY KEY,
    flag VARCHAR(100),
    reward VARCHAR(100) NOT NULL,
    hint VARCHAR(255),
    points INT NOT NULL
);

CREATE TABLE IF NOT EXISTS infos (
    id INT AUTO_INCREMENT PRIMARY KEY,
    title VARCHAR(100) NOT NULL,
    description TEXT NOT NULL,
    challengeId INT NOT NULL,
    FOREIGN KEY (challengeId) REFERENCES challenges (id)
);

CREATE TABLE if not exists illustrations (
    id INT AUTO_INCREMENT PRIMARY KEY,
    infoId INT NOT NULL,
    url VARCHAR(255) NOT NULL,
    FOREIGN KEY (infoId) REFERENCES infos (id)
);

CREATE table if not EXISTS parties (
    id INT AUTO_INCREMENT PRIMARY KEY,
    adminUserId INT NOT NULL,
    code VARCHAR(50) NOT NULL UNIQUE,
    endTime TIMESTAMP,
    FOREIGN KEY (adminUserId) REFERENCES users (id)
);

CREATE TABLE if not EXISTS groupes (
    id INT AUTO_INCREMENT PRIMARY KEY,
    partyId INT NOT NULL,
    name VARCHAR(100) NOT NULL,
    code VARCHAR(50) NOT NULL UNIQUE,
    score INT DEFAULT 0,
    FOREIGN KEY (partyId) REFERENCES parties (id)
);

CREATE TABLE if not EXISTS groupe_user (
    id INT AUTO_INCREMENT PRIMARY KEY,
    groupId INT NOT NULL,
    userId INT NOT NULL,
    FOREIGN KEY (groupId) REFERENCES groupes (id),
    FOREIGN KEY (userId) REFERENCES users (id)
);

CREATE TABLE if not EXISTS messages (
    id INT AUTO_INCREMENT PRIMARY KEY,
    groupId INT NOT NULL,
    senderId INT NOT NULL,
    content TEXT NOT NULL,
    sendDate TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (groupId) REFERENCES groupes (id),
    FOREIGN KEY (senderId) REFERENCES users (id)
);

CREATE TABLE if NOT EXISTS challenge_progress (
    id INT AUTO_INCREMENT PRIMARY KEY,
    groupId INT NOT NULL,
    challengeId INT NOT NULL,
    isCompleted BOOLEAN DEFAULT FALSE,
    FOREIGN KEY (groupId) REFERENCES groupes (id),
    FOREIGN KEY (challengeId) REFERENCES challenges (id)
);

INSERT INTO
    challenges (
        id,
        flag,
        reward,
        hint,
        points
    )
VALUES (
        1,
        '',
        '47°',
        'Maître Alaric, narquois, glisse : « Les fleurs de lys dominent souvent les grandes demeures royales… mais cherche la salamandre, elle brûle du feu de Chambord. »',
        100
    ),
    (
        2,
        '',
        '15''',
        'Le jardinier murmure : « Les plus grands carrés de verdure se trouvent toujours à la base… commence par là, et tout reprendra forme. »',
        100
    ),
    (
        3,
        '',
        '00.0"N',
        'Dame Isabeau souffle : « Les lions rugissent souvent chez les puissants d''Anjou, et les tours se dressent pour ceux de Touraine… »',
        100
    ),
    (
        4,
        'DAME VERTE',
        '0°',
        'Le moine murmure : « Tout est une question de retour… fais reculer les lettres jusqu''à la lumière. »',
        100
    ),
    (
        5,
        '300',
        '17''',
        'Le garde rit : « Ce n''est pas la bête qui brûle, mais celle qui renaît. Regarde les plafonds, les cheminées, les vitraux… compte bien. »',
        100
    ),
    (
        6,
        '',
        'Aucun indice trouvé =(',
        'Une plume enchantée s''agite : « Les rivières sont des routes, et les châteaux aiment la Loire. Suis son cours, mais ne t''éloigne jamais trop d''elle. »',
        100
    ),
    (
        7,
        '',
        '29.0"E',
        'Le cartographe dit : « Le centre n''est jamais au bord, mais là où les lignes s''équilibrent. Cherche l''équilibre des trois points… »',
        100
    );

INSERT INTO
    infos (
        id,
        title,
        description,
        challengeId
    )
VALUES (
        1,
        'Château de Chaumont — Les Armoiries du Passé',
        'Alors que vous explorez la grande salle d''armes du château de Chaumont, un vieil héraldiste nommé Maître Alaric de Sable vous interpelle : « Intrus ou enquêteurs ? Peu m''importe, je garde la mémoire des blasons de la Loire. Si vous voulez que je vous révèle un indice sur la position du farfadet, prouvez que vous connaissez les armoiries des châteaux ! »\n\nAssociez chaque blason à son château. Une seule erreur, et Maître Alaric vous chasse sans ménagement.',
        1
    ),
    (
        2,
        'Château de Villandry — L''Image Brisée du Jardinier',
        'Dans les jardins suspendus de Villandry, une statue animée du jardinier royal, Augustin, pleure : « Le farfadet a brisé le tableau de mon œuvre ! Aide-moi à rassembler les morceaux de l''image de Villandry avant que le vent ne disperse tout à nouveau… »\n\nRemets les fragments dans le bon ordre avant que le sablier ne s''écoule, sinon tout s''effacera.',
        2
    ),
    (
        3,
        'Château du Rivau — Les Familles des Blasons',
        'Dans la galerie des Héros du Rivau, les portraits semblent observer les joueurs. Une dame fantomatique, Dame Isabeau du Rivau, apparaît : « J''ai gardé les souvenirs des lignées nobles, mais le farfadet a mélangé les armoiries ! »\n\nRemets chaque famille avec son blason avant que la mémoire du sang royal ne disparaisse. Jeu de memory : associez les blasons aux familles de châteaux avant la fin du temps imparti.',
        3
    ),
    (
        4,
        'Château de Brissac — Le Nom Caché',
        'Dans les souterrains de Brissac, un vieux moine copiste garde un manuscrit scellé : « Le farfadet a laissé un nom caché dans mes écrits… déchiffre-le, et tu trouveras un indice sur sa cachette. »\n\nSur le parchemin : NKWU FODDY.',
        4
    ),
    (
        5,
        'Château de Chambord — Le Feu Royal',
        'Dans la cour du château, un garde spectral en armure vous barre la route : « Seuls ceux qui connaissent le symbole du roi peuvent passer. Dis-moi, voyageur, combien de fois le feu royal renaît sur ces murs ? »\n\n(Indice visuel disponible sur les plafonds, cheminées et vitraux.)',
        5
    ),
    (
        6,
        'Le Courrier de la Loire — Le Messager Perdu',
        'Vous trouvez une vieille carte de messager tachée d''encre. Une note griffonnée dit : « Je dois livrer le livre avant la nuit… mais quel chemin me mènera le plus vite à travers tous les châteaux ? »\n\nTrouvez le chemin le plus court pour passer par chaque château.',
        6
    ),
    (
        7,
        'Château de Chenonceau — La Triangulation des Secrets',
        'Au pied du pont-galerie, un cartographe fantôme, Maître Orion de Beauregard, vous défie : « J''ai tracé trois points sur la carte de la Loire. Trouve le cœur de ce triangle, et tu trouveras un indice sur la cachette de Farfadoux. »\n\nTrois coordonnées sont données [TODO : ajouter les coordonnées].',
        7
    );