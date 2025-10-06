import { Injectable } from '@nestjs/common';
import { DatabaseService } from '../../database/database.service';
import { AllInfoFlashcard, CreateFlashcardDto, UserFlashcards } from '../interface/flashcard.interface';

@Injectable()
export class FlashcardsRepository {
  constructor(private readonly databaseService: DatabaseService) { }

  async createFlashcard(createFlashcardDto: CreateFlashcardDto): Promise<UserFlashcards> {
    try {
      return this.databaseService.transaction(async (client) => {
        //  insertamos la paltabra si no existe y obtenemos su id
        const queryInsertWord = `
        INSERT INTO words (word, translation, image_url)
        VALUES ($1, $2, $3)
        ON CONFLICT (word) DO NOTHING
        RETURNING id
        `
        const resultqueryInsertWord = await client.query(queryInsertWord, [createFlashcardDto.word, createFlashcardDto.translation, createFlashcardDto.image_url || null]);
        let wordId: number;

        if(resultqueryInsertWord.rows.length > 0) {
          wordId = resultqueryInsertWord.rows[0].id;
        }else {
          // si la palabra ya existia, obtenemos su id
          const queryGetWordId = 'SELECT id FROM words WHERE word = $1';
          const resultGetWordId = await client.query(queryGetWordId, [createFlashcardDto.word]);
          wordId = resultGetWordId.rows[0].id;
        }

        console.log(wordId)
        // insertamos en user_flashcards la relacion usuario-palabra
        await client.query(
          `INSERT INTO user_flashcards (user_id, word_id) VALUES ($1, $2) ON CONFLICT DO NOTHING`,
          [createFlashcardDto.user_id, wordId]
        );
        // obtenemos y retornamos el registro insertado o existente en user_flashcards
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
