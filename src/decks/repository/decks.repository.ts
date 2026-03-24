import { Injectable } from '@nestjs/common';
import { DatabaseService } from '../../database/database.service';
import { CreateDecksDto, Decks, DecksWithFlashcards } from '../interfaces/decks.interface';
import { AllInfoFlashcard } from '../../flashcards/interface/flashcard.interface';

@Injectable()
export class DecksRepository {
  constructor(private readonly databaseService: DatabaseService) { }

  async createDeck(createDecksDto: CreateDecksDto): Promise<Decks> {
    try {
      const query = 'INSERT INTO decks (name, user_id) VALUES ($1, $2) RETURNING id, name, user_id, created_at, updated_at';
      const result = await this.databaseService.query(query, [createDecksDto.name, createDecksDto.user_id]);
      return result.rows[0];
    } catch (error) {
      throw new Error('Error creating deck');
    }
  }

  async getAllDecksByUserId(userId: number): Promise<DecksWithFlashcards[]> {
    try {
      const query = `
      SELECT
                    d.id AS deck_id,
                    d.name AS deck_name,
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
                WHERE d.user_id = $1
                GROUP BY d.id, d.name
                ORDER BY d.name;
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
      throw new Error('Error deleting deck: ' + error.message);
    }
  }

  async updateDeckName(deckId: number, userId: number, name: string): Promise<Decks> {
    try {
      const query = 'UPDATE decks SET name = $1, updated_at = NOW() WHERE id = $2 AND user_id = $3 RETURNING id, name, user_id, created_at, updated_at';
      const result = await this.databaseService.query(query, [name, deckId, userId]);
      if (result.rowCount === 0) {
        throw new Error('Deck not found or user not authorized');
      }
      return result.rows[0];
    } catch (error) {
      throw new Error('Error updating deck: ' + error.message);
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
}