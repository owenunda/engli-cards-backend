import { Injectable } from '@nestjs/common';
import { FlashcardsRepository } from './repository/flashcards.repository';
import { CreateFlashcardDto, Flashcard } from './interface/flashcard.interface';


@Injectable()
export class FlashcardsService {
  constructor(private readonly flashcardsRepository: FlashcardsRepository) {}

  async createFlashcard(createFlashcardDto: CreateFlashcardDto): Promise<Flashcard> {
    return this.flashcardsRepository.createFlashcard(createFlashcardDto);
  }

  async getAllFlashcards(): Promise<Flashcard[]> {
    return this.flashcardsRepository.getAllFlashcards();
  }
}
