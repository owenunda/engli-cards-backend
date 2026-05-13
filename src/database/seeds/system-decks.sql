-- Crear o actualizar decks del sistema con progresión secuencial
-- Los juegos se desbloquean uno por uno al completar el anterior

-- Eliminar decks existentes del sistema si quieres empezar limpio
-- DELETE FROM decks WHERE is_system = true;

-- Insertar decks del sistema con order_index para control de desbloqueo
INSERT INTO decks (name, user_id, is_system, order_index, min_accuracy, created_at, updated_at)
VALUES 
  -- order_index 1: Greetings (siempre desbloqueado)
  ('Greetings', NULL, true, 1, 0.9, NOW(), NOW()),
  -- order_index 2: Fruits (se desbloquea al completar Greetings)
  ('Fruits', NULL, true, 2, 0.9, NOW(), NOW()),
  -- order_index 3: Family (se desbloquea al completar Fruits)
  ('Family', NULL, true, 3, 0.9, NOW(), NOW()),
  -- order_index 4: Work/Trabajo (se desbloquea al completar Family)
  ('Trabajo', NULL, true, 4, 0.9, NOW(), NOW()),
  -- order_index 5: School/Escuela (se desbloquea al completar Trabajo)
  ('Escuela', NULL, true, 5, 0.9, NOW(), NOW()),
  -- order_index 6: Travel/Viajes (se desbloquea al completar Escuela)
  ('Viajes', NULL, true, 6, 0.9, NOW(), NOW())
ON CONFLICT (name) 
DO UPDATE SET 
  is_system = true,
  min_accuracy = 0.9,
  updated_at = NOW()
WHERE decks.is_system = true;
