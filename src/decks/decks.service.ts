import { Injectable } from '@nestjs/common';
import { DecksRepository } from './repository/decks.repository';
import { CreateDecksDto, Decks, DecksWithFlashcards } from './interfaces/decks.interface';
import { AllInfoFlashcard } from '../flashcards/interface/flashcard.interface';


@Injectable()
export class DecksService {
    constructor(private readonly decksRepository: DecksRepository) {}

    async createDeck(createDecksDto: CreateDecksDto): Promise<Decks> {
        return this.decksRepository.createDeck(createDecksDto);
    }

    async getAllDecksByUserId(userId: number): Promise<DecksWithFlashcards[]> {
        return this.decksRepository.getAllDecksByUserId(userId);
    }
    async deleteDeckById(deckId: number, userId: number): Promise<string> {
        return this.decksRepository.deleteDeckById(deckId, userId);
    }

    async updateDeckName(deckId: number, userId: number, name: string): Promise<Decks> {
        return this.decksRepository.updateDeckName(deckId, userId, name);
    }

    async getFlashcardsByDeckId(deckId: number): Promise<AllInfoFlashcard[]> {
        return this.decksRepository.getFlashcardsByDeckId(deckId);
    }
}
