import { Injectable } from '@nestjs/common';
import { DatabaseService } from '../../database/database.service';
import { AllInfoFlashcard, CreateFlashcardDto, UserFlashcards } from '../interface/flashcard.interface';

@Injectable()
export class FlashcardsRepository {
  constructor(private readonly databaseService: DatabaseService) { }

  async createFlashcard(createFlashcardDto: CreateFlashcardDto): Promise<UserFlashcards> {
    try {
      return this.databaseService.transaction(async (client) => {
        // Insertamos siempre una nueva fila en words (para que cada usuario tenga su propia versión)
        const insertWordQuery = `
          INSERT INTO words (word, translation, image_url)
          VALUES ($1, $2, $3)
          RETURNING id, word, translation, image_url, created_at, updated_at
        `;
        const insertWordRes = await client.query(insertWordQuery, [createFlashcardDto.word, createFlashcardDto.translation, createFlashcardDto.image_url || null]);
        const wordId = insertWordRes.rows[0].id;

        // insertamos en user_flashcards la relacion usuario-palabra
        await client.query(
          `INSERT INTO user_flashcards (user_id, word_id) VALUES ($1, $2) ON CONFLICT DO NOTHING`,
          [createFlashcardDto.user_id, wordId]
        );

        // retornamos la relación creada
        const queryGetUserFlashcard = `
          SELECT uf.id, uf.user_id, uf.word_id, uf.created_at, uf.updated_at
          FROM user_flashcards uf
          WHERE uf.user_id = $1 AND uf.word_id = $2
        `;
        const resultGetUserFlashcard = await client.query(queryGetUserFlashcard, [createFlashcardDto.user_id, wordId]);
        return resultGetUserFlashcard.rows[0];
      })
    } catch (error) {
      throw new Error('Error creating flashcard');
    }
  }

  async updateFlashcard(userFlashcardId: number, userId: number, updateDto: { word?: string; translation?: string; image_url?: string }) {
    try {
      return this.databaseService.transaction(async (client) => {
        // 1) crear una nueva fila en words con los datos provistos
        const insertWordQuery = `
          INSERT INTO words (word, translation, image_url)
          VALUES ($1, $2, $3)
          RETURNING id, word, translation, image_url, created_at, updated_at
        `;
        const insertWordRes = await client.query(insertWordQuery, [updateDto.word || null, updateDto.translation || null, updateDto.image_url || null]);
        const newWordId = insertWordRes.rows[0].id;

        // 2) reasignar la relación user_flashcards al nuevo word_id (solo si pertenece al usuario)
        const updateRelationQuery = `
          UPDATE user_flashcards SET word_id = $1, updated_at = now()
          WHERE id = $2 AND user_id = $3
          RETURNING id, user_id, word_id, created_at, updated_at
        `;
        const updateRelationRes = await client.query(updateRelationQuery, [newWordId, userFlashcardId, userId]);

        if (updateRelationRes.rows.length === 0) {
          throw new Error('Relation not found or not owned by user');
        }

        return { user_flashcard: updateRelationRes.rows[0], word: insertWordRes.rows[0] };
      })
    } catch (error) {
      throw new Error('Error updating flashcard');
    }
  }

  async getAllFlashcards(): Promise<UserFlashcards[]> {
    try {
      const query = 'SELECT uf.id, uf.user_id, uf.word_id, uf.created_at, uf.updated_at, w.word, w.translation, w.image_url FROM user_flashcards as uf inner join words as w on uf.word_id = w.id';
      const result = await this.databaseService.query(query);
      return result.rows;
    } catch (error) {
      throw new Error('Error fetching flashcards');
    }
  }

  async getFlashcardsByUserId(userId: number): Promise<AllInfoFlashcard[]> {
    try {
      const query = `
        SELECT uf.id, uf.user_id, uf.word_id, uf.created_at, uf.updated_at, w.word, w.translation, w.image_url
        FROM user_flashcards as uf
        INNER JOIN words as w ON uf.word_id = w.id
        WHERE uf.user_id = $1
      `;
      const result = await this.databaseService.query(query, [userId]);
      return result.rows;
    } catch (error) {
      throw new Error('Error fetching user flashcards');
    }

  }

}
