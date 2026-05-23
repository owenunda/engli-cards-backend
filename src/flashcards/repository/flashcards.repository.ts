import { Injectable, InternalServerErrorException, NotFoundException } from '@nestjs/common';
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

        // insertamos en deck_flashcards la relacion deck-palabra si se proporcionó deck_id
        if (createFlashcardDto.deck_id) {
          await client.query(
            `INSERT INTO deck_flashcards (deck_id, user_flashcard_id) VALUES ($1, $2) ON CONFLICT DO NOTHING`,
            [createFlashcardDto.deck_id, resultGetUserFlashcard.rows[0].id]
          );
        }

        return resultGetUserFlashcard.rows[0];
      })
    } catch (error) {
      if (error instanceof NotFoundException) throw error;
      throw new InternalServerErrorException('Error al crear la flashcard');
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
          throw new NotFoundException('Flashcard no encontrada o no pertenece al usuario');
        }

        return { user_flashcard: updateRelationRes.rows[0], word: insertWordRes.rows[0] };
      })
    } catch (error) {
      if (error instanceof NotFoundException) throw error;
      throw new InternalServerErrorException('Error al actualizar la flashcard');
    }
  }

  async getAllFlashcards(limit = 50, offset = 0): Promise<UserFlashcards[]> {
    try {
      const query = `
        SELECT uf.id, uf.user_id, uf.word_id, uf.created_at, uf.updated_at, w.word, w.translation, w.image_url
        FROM user_flashcards AS uf
        INNER JOIN words AS w ON uf.word_id = w.id
        ORDER BY uf.created_at DESC
        LIMIT $1 OFFSET $2
      `;
      const result = await this.databaseService.query(query, [limit, offset]);
      return result.rows;
    } catch (error) {
      throw new InternalServerErrorException('Error al obtener las flashcards');
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
      throw new InternalServerErrorException('Error al obtener las flashcards del usuario');
    }
  }

  async deleteFlashcard(userFlashcardId: number, userId: number) {
    try {
      return this.databaseService.transaction(async (client) => {
        // 1. Obtener el word_id asociado antes de borrar
        const findQuery = `SELECT word_id FROM user_flashcards WHERE id = $1 AND user_id = $2`;
        const findRes = await client.query(findQuery, [userFlashcardId, userId]);

        if (findRes.rows.length === 0) {
          throw new NotFoundException('Flashcard no encontrada o no pertenece al usuario');
        }

        const wordId = findRes.rows[0].word_id;

        // 2. Borrar de deck_flashcards (cascada manual si no está en BD, pero lo hacemos por seguridad)
        await client.query(`DELETE FROM deck_flashcards WHERE user_flashcard_id = $1`, [userFlashcardId]);

        // 3. Borrar de user_flashcards
        await client.query(`DELETE FROM user_flashcards WHERE id = $1 AND user_id = $2`, [userFlashcardId, userId]);

        // 4. Borrar de words (ya que cada flashcard tiene su propia word en este sistema)
        await client.query(`DELETE FROM words WHERE id = $1`, [wordId]);

        return { message: 'Flashcard deleted successfully' };
      });
    } catch (error) {
      if (error instanceof NotFoundException) throw error;
      throw new InternalServerErrorException('Error al eliminar la flashcard');
    }
  }
}
