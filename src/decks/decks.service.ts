import { Injectable } from '@nestjs/common';
import { DecksRepository } from './repository/decks.repository';
import { CreateDecksDto, Decks, DecksWithFlashcards } from './interfaces/decks.interface';


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
}
