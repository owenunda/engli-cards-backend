import { Injectable } from '@nestjs/common';
import { DatabaseService } from '../../database/database.service';
import { CreateFlashcardDto, Flashcard } from '../interface/flashcard.interface';

@Injectable()
export class FlashcardsRepository {
  constructor(private readonly databaseService: DatabaseService) { }

  async createFlashcard(createFlashcardDto: CreateFlashcardDto): Promise<Flashcard> {
    try {
      const query = 'INSERT INTO flashcards (word, translation, image_url) VALUES ($1, $2, $3) RETURNING id, word, translation, image_url, created_at, updated_at';
      const values = [createFlashcardDto.word, createFlashcardDto.translation, createFlashcardDto.image_url];
      const result = await this.databaseService.query(query, values);
      return result.rows[0];
    } catch (error) {
      throw new Error('Error creating flashcard');
    }
  }

  async getAllFlashcards(): Promise<Flashcard[]> {
    try {
      const query = 'SELECT id, word, translation, image_url, created_at, updated_at FROM flashcards';
      const result = await this.databaseService.query(query);
      return result.rows;
    } catch (error) {
      throw new Error('Error fetching flashcards');
    }
  }


}
