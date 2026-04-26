-- Añadir registro de tiempo de estudio en segundos a las sesiones y a los usuarios totales

ALTER TABLE users ADD COLUMN IF NOT EXISTS study_time_total_seconds INTEGER DEFAULT 0;
ALTER TABLE user_quiz_sessions ADD COLUMN IF NOT EXISTS time_spent_seconds INTEGER DEFAULT 0;
