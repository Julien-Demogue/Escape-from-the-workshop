CREATE DATABASE if not exists escape_game;
USE escape_game;

CREATE USER if not EXISTS 'exporter'@'%' IDENTIFIED BY 'exporterpassword' WITH MAX_USER_CONNECTIONS 3;
GRANT PROCESS, REPLICATION CLIENT, SLAVE MONITOR, SELECT ON *.* TO 'exporter'@'%';
FLUSH PRIVILEGES;

CREATE TABLE IF NOT EXISTS users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(50) NOT NULL UNIQUE,
    hashedEmail VARCHAR(256) NOT NULL UNIQUE,
    color VARCHAR(12) NOT NULL

);
CREATE TABLE IF NOT EXISTS infos (
    id INT AUTO_INCREMENT PRIMARY KEY,
    title VARCHAR(100) NOT NULL,
   description TEXT NOT NULL

);

CREATE TABLE IF NOT EXISTS challenges (
    id INT AUTO_INCREMENT PRIMARY KEY,
    infoId INT NOT NULL,
    flag VARCHAR(100) NOT NULL,
    reward INT NOT NULL,
    hint VARCHAR(255),
    points INT NOT NULL,
    FOREIGN KEY (infoId) REFERENCES infos(id)

);

CREATE TABLE if not exists illustrations (
    id INT AUTO_INCREMENT PRIMARY KEY,
    infosId INT NOT NULL,
    url VARCHAR(255) NOT NULL,
    FOREIGN KEY (infosId) REFERENCES infos(id)

);

CREATE table if not EXISTS parties (
    id INT AUTO_INCREMENT PRIMARY KEY,
    adminUserId INT NOT NULL,
    endTime TIMESTAMP NULL,
    FOREIGN KEY (adminUserId) REFERENCES users(id)
);

CREATE TABLE if not EXISTS groupes (
    id INT AUTO_INCREMENT PRIMARY KEY,
    partyId INT NOT NULL,
    name VARCHAR(100) NOT NULL,
    code VARCHAR(50) NOT NULL UNIQUE,
    score INT DEFAULT 0,
    FOREIGN KEY (partyId) REFERENCES parties(id)
);

CREATE TABLE if not EXISTS groupe_user (
    id INT AUTO_INCREMENT PRIMARY KEY,
    groupId INT NOT NULL,
    userId INT NOT NULL,
    FOREIGN KEY (groupId) REFERENCES groupes(id),
    FOREIGN KEY (userId) REFERENCES users(id)
);

CREATE TABLE if not EXISTS messages (
    id INT AUTO_INCREMENT PRIMARY KEY,
    groupId INT NOT NULL,
    senderId INT NOT NULL,
    content TEXT NOT NULL,
    sendDate TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (groupId) REFERENCES groupes(id),
    FOREIGN KEY (senderId) REFERENCES users(id)
);

CREATE TABLE if NOT EXISTS challenge_progress (
    id INT AUTO_INCREMENT PRIMARY KEY,
    groupId INT NOT NULL,
    challengeId INT NOT NULL,
    isCompleted BOOLEAN DEFAULT FALSE,
    FOREIGN KEY (groupId) REFERENCES groupes(id),
    FOREIGN KEY (challengeId) REFERENCES challenges(id)
);