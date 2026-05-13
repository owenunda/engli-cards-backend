import { Injectable } from '@nestjs/common';
import { DatabaseService } from '../../database/database.service';
import { CreateDecksDto, Decks, DecksWithFlashcards } from '../interfaces/decks.interface';
import { AllInfoFlashcard } from '../../flashcards/interface/flashcard.interface';

@Injectable()
export class DecksRepository {
  constructor(private readonly databaseService: DatabaseService) { }

  async createDeck(createDecksDto: CreateDecksDto): Promise<Decks> {
    try {
      const { name, user_id, is_system, order_index, min_accuracy } = createDecksDto;
      const query = `
        INSERT INTO decks (name, user_id, is_system, order_index, min_accuracy) 
        VALUES ($1, $2, $3, $4, $5) 
        RETURNING id, name, user_id, is_system, order_index, min_accuracy, created_at, updated_at
      `;
      const result = await this.databaseService.query(query, [
        name, 
        user_id, 
        is_system ?? false, 
        order_index ?? 0, 
        min_accuracy ?? 0.9
      ]);
      return result.rows[0];
    } catch (error) {
      console.error('Error creating deck:', error);
      throw new Error('Error creating deck');
    }
  }

  async getAllDecks(): Promise<DecksWithFlashcards[]> {
    try {
      const query = `
                SELECT
                    d.id AS deck_id,
                    d.name AS deck_name,
                    d.is_system,
                    d.order_index,
                    d.min_accuracy,
                    COALESCE(
                        json_agg(
                            json_build_object(
                                'deck_flashcards_id', df.id,
                                'deck_id', d.id,
                                'user_flashcard_id', df.user_flashcard_id,
                                'word_id', w.id,
                                'word', w.word,
                                'translation', w.translation,
                                'image_url', w.image_url,
                                'created_at', w.created_at,
                                'updated_at', w.updated_at
                            )
                        ) FILTER (WHERE df.id IS NOT NULL),
                        '[]'::json
                    ) AS flashcards
                FROM decks d
                LEFT JOIN deck_flashcards df ON df.deck_id = d.id
                LEFT JOIN user_flashcards uf ON df.user_flashcard_id = uf.id
                LEFT JOIN words w ON uf.word_id = w.id
                GROUP BY d.id, d.name, d.is_system, d.order_index, d.min_accuracy
                ORDER BY d.is_system DESC, d.order_index ASC, d.name ASC;
      `;
      const result = await this.databaseService.query(query);
      return result.rows;
    } catch (error) {
      console.error('Error al obtener todos los mazos: - decks.repository.ts: getAllDecks', error);
      throw error;
    }
  }

  async getAllDecksByUserId(userId: number): Promise<DecksWithFlashcards[]> {
    try {
      const query = `
                SELECT
                    d.id AS deck_id,
                    d.name AS deck_name,
                    d.is_system,
                    d.order_index,
                    d.min_accuracy,
                    COALESCE(
                        CASE 
                            WHEN d.is_system = false THEN false
                            WHEN d.order_index <= 1 THEN false
                            ELSE NOT EXISTS (
                                SELECT 1 FROM user_quiz_sessions uqs
                                JOIN decks dprev ON uqs.deck_id = dprev.id
                                WHERE uqs.user_id = $1 
                                  AND dprev.is_system = true 
                                  AND dprev.order_index = d.order_index - 1
                            )
                        END,
                        false
                    ) as is_locked,
                    COALESCE(
                        (SELECT MAX(uqs.correct_answers::float / uqs.total_questions::float) 
                         FROM user_quiz_sessions uqs 
                         WHERE uqs.deck_id = d.id AND uqs.user_id = $1),
                        0
                    ) as best_accuracy,
                    COALESCE(
                        json_agg(
                            json_build_object(
                                'deck_flashcards_id', df.id,
                                'deck_id', d.id,
                                'user_flashcard_id', df.user_flashcard_id,
                                'word_id', w.id,
                                'word', w.word,
                                'translation', w.translation,
                                'image_url', w.image_url,
                                'created_at', w.created_at,
                                'updated_at', w.updated_at
                            )
                        ) FILTER (WHERE df.id IS NOT NULL),
                        '[]'::json
                    ) AS flashcards
                FROM decks d
                LEFT JOIN deck_flashcards df ON df.deck_id = d.id
                LEFT JOIN user_flashcards uf ON df.user_flashcard_id = uf.id
                LEFT JOIN words w ON uf.word_id = w.id
                WHERE d.user_id = $1 OR d.is_system = true
                GROUP BY d.id, d.name, d.is_system, d.order_index, d.min_accuracy
                ORDER BY d.is_system DESC, d.order_index ASC, d.name ASC;
      `;
      const result = await this.databaseService.query(query, [userId]);
      return result.rows;
    } catch (error) {
      throw new Error('Error fetching user decks');
    }
  }

  async deleteDeckById(deckId: number, userId: number): Promise<string> {
    try {
      return this.databaseService.transaction(async (client) => {
        // Verify deck belongs to user
        const checkQuery = 'SELECT id FROM decks WHERE id = $1 AND user_id = $2';
        const checkRes = await client.query(checkQuery, [deckId, userId]);
        if (checkRes.rowCount === 0) {
          throw new Error('Deck not found or user not authorized');
        }

        // Get the words to delete
        const wordsQuery = `
          SELECT uf.word_id, uf.id AS user_flashcard_id 
          FROM user_flashcards uf
          INNER JOIN deck_flashcards df ON df.user_flashcard_id = uf.id
          WHERE df.deck_id = $1
        `;
        const wordsRes = await client.query(wordsQuery, [deckId]);
        
        const wordIds = wordsRes.rows.map(r => r.word_id);
        const userFlashcardIds = wordsRes.rows.map(r => r.user_flashcard_id);

        // Delete from deck_flashcards
        await client.query('DELETE FROM deck_flashcards WHERE deck_id = $1', [deckId]);

        if (wordIds.length > 0) {
          // Delete from user_flashcards
          await client.query('DELETE FROM user_flashcards WHERE id = ANY($1)', [userFlashcardIds]);
          // Delete from words
          await client.query('DELETE FROM words WHERE id = ANY($1)', [wordIds]);
        }

        // Finally delete the deck
        await client.query('DELETE FROM decks WHERE id = $1', [deckId]);

        return 'Deck and associated flashcards deleted successfully';
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      throw new Error('Error deleting deck: ' + errorMessage);
    }
  }

  async updateDeck(deckId: number, userId: number, name: string, orderIndex?: number, minAccuracy?: number): Promise<Decks> {
    try {
      const query = `
        UPDATE decks 
        SET name = $1, 
            order_index = COALESCE($4, order_index), 
            min_accuracy = COALESCE($5, min_accuracy),
            updated_at = NOW() 
        WHERE id = $2 AND (user_id = $3 OR (SELECT role FROM users WHERE id = $3) = 'admin')
        RETURNING id, name, user_id, is_system, order_index, min_accuracy, created_at, updated_at
      `;
      const result = await this.databaseService.query(query, [name, deckId, userId, orderIndex, minAccuracy]);
      if (result.rowCount === 0) {
        throw new Error('Deck not found or user not authorized');
      }
      return result.rows[0];
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      throw new Error('Error updating deck: ' + errorMessage);
    }
  }

  async getFlashcardsByDeckId(deckId: number): Promise<AllInfoFlashcard[]> {
    try {
      const query = `
        SELECT 
          uf.id, 
          uf.user_id, 
          uf.word_id, 
          w.word, 
          w.translation, 
          w.image_url, 
          uf.created_at, 
          uf.updated_at
        FROM deck_flashcards df
        INNER JOIN user_flashcards uf ON df.user_flashcard_id = uf.id
        INNER JOIN words w ON uf.word_id = w.id
        WHERE df.deck_id = $1
      `;
      const result = await this.databaseService.query(query, [deckId]);
      return result.rows;
    } catch (error) {
      throw new Error('Error fetching flashcards for deck');
    }
  }

  async initializeSystemDecks(): Promise<{ message: string; decksCount: number }> {
    try {
      const systemDecks = [
        { name: 'Greetings', order_index: 1, min_accuracy: 0.9 },
        { name: 'Fruits', order_index: 2, min_accuracy: 0.9 },
        { name: 'Family', order_index: 3, min_accuracy: 0.9 },
        { name: 'Trabajo', order_index: 4, min_accuracy: 0.9 },
        { name: 'Escuela', order_index: 5, min_accuracy: 0.9 },
        { name: 'Viajes', order_index: 6, min_accuracy: 0.9 },
      ];

      // Buscar o crear un usuario de sistema
      let systemUserId: number;
      const checkSystemUserQuery = 'SELECT id FROM users WHERE email = $1';
      const checkSystemUserResult = await this.databaseService.query(checkSystemUserQuery, ['system@engli.cards']);
    
      if (checkSystemUserResult.rowCount > 0) {
        systemUserId = checkSystemUserResult.rows[0].id;
      } else {
        // Crear usuario de sistema si no existe
        const createSystemUserQuery = `
          INSERT INTO users (name, email, password, role)
          VALUES ($1, $2, $3, $4)
          RETURNING id
        `;
        const createSystemUserResult = await this.databaseService.query(createSystemUserQuery, [
          'System User',
          'system@engli.cards',
          'system_user_password_not_used',
          'admin'
        ]);
        systemUserId = createSystemUserResult.rows[0].id;
      }
    
      let createdCount = 0;

      for (const deck of systemDecks) {
        const checkQuery = 'SELECT id FROM decks WHERE name = $1 AND is_system = true';
        const checkResult = await this.databaseService.query(checkQuery, [deck.name]);

        if (checkResult.rowCount === 0) {
          // Create the deck if it doesn't exist
          const insertQuery = `
            INSERT INTO decks (name, user_id, is_system, order_index, min_accuracy, created_at, updated_at)
            VALUES ($1, $2, true, $3, $4, NOW(), NOW())
            RETURNING id
          `;
          await this.databaseService.query(insertQuery, [deck.name, systemUserId, deck.order_index, deck.min_accuracy]);
          createdCount++;
        } else {
          // Update existing deck to ensure correct order_index and min_accuracy
          const updateQuery = `
            UPDATE decks 
            SET order_index = $2, min_accuracy = $3, is_system = true, updated_at = NOW()
            WHERE name = $1
          `;
          await this.databaseService.query(updateQuery, [deck.name, deck.order_index, deck.min_accuracy]);
        }
      }

      return { 
        message: `System decks initialized successfully. Created: ${createdCount}, Updated: ${systemDecks.length - createdCount}`, 
        decksCount: systemDecks.length 
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.error('Error initializing system decks:', errorMessage);
      throw new Error('Error initializing system decks: ' + errorMessage);
    }
  }
}
