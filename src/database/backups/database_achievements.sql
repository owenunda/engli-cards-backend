-- Creación de la tabla catálogo de logros
CREATE TABLE achievements (
    id SERIAL PRIMARY KEY,
    title VARCHAR(100) NOT NULL,
    description TEXT NOT NULL,
    target_value INTEGER NOT NULL, -- La meta (ej. 5 para "5 lecciones con 100%")
    icon_type VARCHAR(50), -- Tipo de ícono ('Trophy', 'Zap', 'Moon')
    achievement_code VARCHAR(50) UNIQUE NOT NULL, -- Código interno identificador ('PERFECT_LESSONS_5', 'STREAK_30', 'NIGHT_OWL_3')
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Creación de la tabla pivote para el progreso del usuario en los logros
CREATE TABLE user_achievements (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    achievement_id INTEGER REFERENCES achievements(id) ON DELETE CASCADE,
    current_value INTEGER DEFAULT 0, -- Progreso actual (ej. lleva 3 de 5)
    is_completed BOOLEAN DEFAULT FALSE,
    unlocked_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE (user_id, achievement_id) -- Un usuario solo puede tener un registro por logro
);

-- Insertar los logros basados en el diseño y extras
INSERT INTO achievements (title, description, target_value, icon_type, achievement_code) VALUES
('Puntería Fina', 'Completa 5 lecciones seguidas con 100% de precisión.', 5, 'Trophy', 'PERFECT_LESSONS_5'),
('Imparable', 'Mantén una racha de aprendizaje durante 30 días seguidos.', 30, 'Zap', 'STREAK_30'),
('Noctámbulo', 'Estudia después de las 11:00 PM por 3 noches.', 3, 'Moon', 'NIGHT_OWL_3'),
('Primeros Pasos', 'Completa tu primer quiz de práctica.', 1, 'Star', 'FIRST_QUIZ'),
('Constancia', 'Mantén una racha de aprendizaje de 7 días.', 7, 'Flame', 'STREAK_7'),
('Centurión', 'Acumula 100 respuestas correctas en total.', 100, 'Award', 'CORRECT_100'),
('Madrugador', 'Estudia temprano, antes de las 8:00 AM.', 1, 'Sun', 'EARLY_BIRD_1'),
('Erudito', 'Alcanza el nivel 5 de experiencia.', 5, 'GraduationCap', 'LEVEL_5');
