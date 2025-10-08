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
   FOREIGN KEY (challengeId) REFERENCES challenges(id)
);

CREATE TABLE if not exists illustrations (
    id INT AUTO_INCREMENT PRIMARY KEY,
    infoId INT NOT NULL,
    url VARCHAR(255) NOT NULL,
    FOREIGN KEY (infoId) REFERENCES infos(id)
);

CREATE table if not EXISTS parties (
    id INT AUTO_INCREMENT PRIMARY KEY,
    adminUserId INT NOT NULL,
    code VARCHAR(50) NOT NULL UNIQUE,
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

INSERT INTO challenges (flag, reward, hint, points) VALUES
('FLAG{escape_123}', '47°', 'Look under the mat.', 10),
('FLAG{puzzle_456}', "15'", 'Think about the four elements.', 10),
('300 ', '00.0"N', 'Check behind the bookshelf.', 10),
('Dame Verte', '0°', 'code de cesar.', 10),
('FLAG{treasure_202}', "17'", 'X marks the spot.', 10),
('FLAG{final_303}', '29.0"E', 'The end is just the beginning.', 10); 

Insert into infos (title, description, challengeId) values
('Puzzle', 'Your adventure begins here. Solve the challenges to find your way out!', 1),
('quizz', 'You find a note that reads: "The key to freedom lies in understanding the elements."', 2),
('Enigme de Chambord', 'Behind the bookshelf, you discover a cryptic message that hints at coordinates.', 3),
('Enigme de Brissac', 'The numbers on the wall seem to correspond to letters in the alphabet.', 4),
('Memory', 'A map on the table shows an X where you might find something valuable.', 5),
('The Final Challenge', 'You reach a locked door with a keypad. The final code is within your reach.', 6);

INSERT INTO illustrations (infoId, url) VALUES
(1, 'https://example.com/images/welcome.png'),
(2, 'https://example.com/images/first_clue.png'),
(3, 'https://example.com/images/hidden_message.png'),
(4, 'https://example.com/images/decoding_puzzle.png'),
(5, 'https://example.com/images/x_marks_spot.png'),
(6, 'https://example.com/images/final_challenge.png');