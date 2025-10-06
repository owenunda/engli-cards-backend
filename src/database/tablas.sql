-- ============================
-- USERS TABLE
-- ============================
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(150) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    avatar_url TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================
-- WORDS TABLE (unique words)
-- ============================
CREATE TABLE words (
    id SERIAL PRIMARY KEY,
    word VARCHAR(100) UNIQUE NOT NULL,
    translation VARCHAR(100) NOT NULL,
    image_url TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================
-- USER_FLASHCARDS TABLE (relationship)
-- ============================
CREATE TABLE user_flashcards (
    id SERIAL PRIMARY KEY,
    user_id INT NOT NULL,
    word_id INT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_user
        FOREIGN KEY (user_id)
        REFERENCES users(id)
        ON DELETE CASCADE,
    CONSTRAINT fk_word
        FOREIGN KEY (word_id)
        REFERENCES words(id)
        ON DELETE CASCADE
);

-- ============================
-- TRIGGERS (for automatic updated_at)
-- ============================

-- Function for automatic updated_at in all tables
CREATE OR REPLACE FUNCTION update_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply trigger to each table that has updated_at
CREATE TRIGGER trigger_update_users
BEFORE UPDATE ON users
FOR EACH ROW
EXECUTE FUNCTION update_timestamp();

CREATE TRIGGER trigger_update_words
BEFORE UPDATE ON words
FOR EACH ROW
EXECUTE FUNCTION update_timestamp();

CREATE TRIGGER trigger_update_user_flashcards
BEFORE UPDATE ON user_flashcards
FOR EACH ROW
EXECUTE FUNCTION update_timestamp();
