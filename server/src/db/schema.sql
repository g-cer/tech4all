-- ---------------------------------------------------------------------------
-- Tech4All - schema del database
--
-- Eseguire con:  mysql -u <utente> -p < src/db/schema.sql
-- Richiede MySQL 8.0 o superiore (vincoli CHECK, ENUM, trigger).
-- ---------------------------------------------------------------------------

DROP DATABASE IF EXISTS tech4all;
CREATE DATABASE tech4all CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE tech4all;

-- --------------------------------------------------------------------------
-- Gestione autenticazione
-- --------------------------------------------------------------------------

CREATE TABLE utente (
    id            INT AUTO_INCREMENT PRIMARY KEY,
    email         VARCHAR(255) NOT NULL UNIQUE
                  CHECK (email LIKE '%_@_%._%'),
    -- Hash bcrypt: 60 caratteri. Il campo è dimensionato con margine per
    -- consentire in futuro un algoritmo con output più lungo.
    password_hash VARCHAR(255) NOT NULL,
    nome          VARCHAR(50)  NOT NULL,
    cognome       VARCHAR(50)  NOT NULL,
    ruolo         ENUM('utente', 'admin') NOT NULL DEFAULT 'utente',
    -- Denormalizzazione di comodo: numero di quiz distinti superati.
    -- È ricalcolato dal server a ogni svolgimento a partire da `svolgimento`.
    quiz_superati INT NOT NULL DEFAULT 0 CHECK (quiz_superati >= 0)
);

-- --------------------------------------------------------------------------
-- Gestione tutorial
-- --------------------------------------------------------------------------

CREATE TABLE tutorial (
    id          INT AUTO_INCREMENT PRIMARY KEY,
    titolo      VARCHAR(100) NOT NULL,
    grafica     VARCHAR(255) NOT NULL,
    testo       TEXT NOT NULL,
    categoria   VARCHAR(50) NOT NULL,
    -- Media dei feedback, mantenuta dai trigger su `feedback`:
    -- il codice applicativo la tratta come sola lettura.
    valutazione DECIMAL(3, 2) DEFAULT NULL
                CHECK (valutazione BETWEEN 1 AND 5),
    INDEX idx_tutorial_categoria (categoria)
);

-- --------------------------------------------------------------------------
-- Gestione feedback
-- --------------------------------------------------------------------------

CREATE TABLE feedback (
    utente_id      INT NOT NULL,
    tutorial_id    INT NOT NULL,
    valutazione    INT NOT NULL CHECK (valutazione BETWEEN 1 AND 5),
    commento       VARCHAR(500) NOT NULL,
    data_creazione DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (utente_id, tutorial_id),
    FOREIGN KEY (utente_id)   REFERENCES utente(id)   ON DELETE CASCADE,
    FOREIGN KEY (tutorial_id) REFERENCES tutorial(id) ON DELETE CASCADE,
    INDEX idx_feedback_tutorial (tutorial_id)
);

-- Ricalcolo della valutazione media del tutorial a ogni variazione dei
-- feedback. Tenerlo nel database garantisce che il valore resti coerente
-- anche di fronte a inserimenti concorrenti.
DELIMITER $$

CREATE PROCEDURE ricalcola_valutazione(IN p_tutorial_id INT)
BEGIN
    UPDATE tutorial
       SET valutazione = (
            SELECT AVG(valutazione) FROM feedback WHERE tutorial_id = p_tutorial_id
       )
     WHERE id = p_tutorial_id;
END$$

CREATE TRIGGER feedback_dopo_insert
AFTER INSERT ON feedback
FOR EACH ROW
BEGIN
    CALL ricalcola_valutazione(NEW.tutorial_id);
END$$

CREATE TRIGGER feedback_dopo_update
AFTER UPDATE ON feedback
FOR EACH ROW
BEGIN
    CALL ricalcola_valutazione(NEW.tutorial_id);
END$$

CREATE TRIGGER feedback_dopo_delete
AFTER DELETE ON feedback
FOR EACH ROW
BEGIN
    CALL ricalcola_valutazione(OLD.tutorial_id);
END$$

DELIMITER ;

-- --------------------------------------------------------------------------
-- Gestione quiz
--
-- Un tutorial ha al più un quiz; domande e risposte non hanno ciclo di vita
-- autonomo e cadono in cascata con il quiz di appartenenza.
-- --------------------------------------------------------------------------

CREATE TABLE quiz (
    id          INT AUTO_INCREMENT PRIMARY KEY,
    tutorial_id INT NOT NULL UNIQUE,
    FOREIGN KEY (tutorial_id) REFERENCES tutorial(id) ON DELETE CASCADE
);

CREATE TABLE domanda (
    id      INT AUTO_INCREMENT PRIMARY KEY,
    quiz_id INT NOT NULL,
    domanda VARCHAR(255) NOT NULL,
    FOREIGN KEY (quiz_id) REFERENCES quiz(id) ON DELETE CASCADE,
    INDEX idx_domanda_quiz (quiz_id)
);

CREATE TABLE risposta (
    id         INT AUTO_INCREMENT PRIMARY KEY,
    domanda_id INT NOT NULL,
    risposta   VARCHAR(255) NOT NULL,
    corretta   BOOLEAN NOT NULL DEFAULT FALSE,
    FOREIGN KEY (domanda_id) REFERENCES domanda(id) ON DELETE CASCADE,
    INDEX idx_risposta_domanda (domanda_id)
);

CREATE TABLE svolgimento (
    utente_id          INT NOT NULL,
    quiz_id            INT NOT NULL,
    esito              BOOLEAN NOT NULL,
    data_conseguimento DATETIME NOT NULL,
    risposte_esatte    INT NOT NULL CHECK (risposte_esatte >= 0),
    PRIMARY KEY (utente_id, quiz_id),
    FOREIGN KEY (utente_id) REFERENCES utente(id) ON DELETE CASCADE,
    FOREIGN KEY (quiz_id)   REFERENCES quiz(id)   ON DELETE CASCADE
);

-- --------------------------------------------------------------------------
-- Gestione obiettivi
-- --------------------------------------------------------------------------

CREATE TABLE obiettivo (
    nome             VARCHAR(255) PRIMARY KEY,
    descrizione      VARCHAR(500) NOT NULL,
    grafica_badge    VARCHAR(255) NOT NULL,
    quiz_da_superare INT NOT NULL CHECK (quiz_da_superare > 0)
);

CREATE TABLE conseguimento (
    utente_id          INT NOT NULL,
    obiettivo_nome     VARCHAR(255) NOT NULL,
    data_conseguimento DATETIME NOT NULL,
    PRIMARY KEY (utente_id, obiettivo_nome),
    FOREIGN KEY (utente_id)      REFERENCES utente(id)     ON DELETE CASCADE,
    FOREIGN KEY (obiettivo_nome) REFERENCES obiettivo(nome) ON DELETE CASCADE
);
