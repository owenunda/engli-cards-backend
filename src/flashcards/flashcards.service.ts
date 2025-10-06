import { Injectable } from '@nestjs/common';
import { FlashcardsRepository } from './repository/flashcards.repository';
import { AllInfoFlashcard, CreateFlashcardDto, UserFlashcards } from './interface/flashcard.interface';


@Injectable()
export class FlashcardsService {
  constructor(private readonly flashcardsRepository: FlashcardsRepository) {}

  async createFlashcard(createFlashcardDto: CreateFlashcardDto): Promise<UserFlashcards> {
    return this.flashcardsRepository.createFlashcard(createFlashcardDto);
  }

  async getAllFlashcards(): Promise<UserFlashcards[]> {
    return this.flashcardsRepository.getAllFlashcards();
  }
  async getFlashcardsByUserId(id: number): Promise<AllInfoFlashcard[]> {
    return this.flashcardsRepository.getFlashcardsByUserId(id);
  }

}
