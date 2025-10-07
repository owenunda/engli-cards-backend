import { Injectable } from '@nestjs/common';
import { DatabaseService } from '../../database/database.service';
import { CreateDecksDto, Decks, DecksWithFlashcards } from '../interfaces/decks.interface';

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
      const query = 'DELETE FROM decks WHERE id = $1 AND user_id = $2';
      const result = await this.databaseService.query(query, [deckId, userId]);
      if (result.rowCount === 0) {
        throw new Error('Deck not found or user not authorized');
      }
      return 'Deck deleted successfully';
    } catch (error) {
      throw new Error('Error deleting deck');
    }
  }
}