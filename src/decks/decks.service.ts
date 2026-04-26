import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { DecksRepository } from './repository/decks.repository';
import { CreateDecksDto, Decks, DecksWithFlashcards } from './interfaces/decks.interface';
import { AllInfoFlashcard } from '../flashcards/interface/flashcard.interface';
import * as fs from 'fs';
import * as path from 'path';

@Injectable()
export class DecksService {
    constructor(private readonly decksRepository: DecksRepository) {}

    async createDeck(createDecksDto: CreateDecksDto): Promise<Decks> {
        return this.decksRepository.createDeck(createDecksDto);
    }

    async getAllDecksByUserId(userId: number): Promise<DecksWithFlashcards[]> {
        return this.decksRepository.getAllDecksByUserId(userId);
    }

    async getAllDecks(): Promise<DecksWithFlashcards[]> {
        return this.decksRepository.getAllDecks();
    }
    async deleteDeckById(deckId: number, userId: number): Promise<string> {
        return this.decksRepository.deleteDeckById(deckId, userId);
    }

    async updateDeck(deckId: number, userId: number, name: string, orderIndex?: number, minAccuracy?: number): Promise<Decks> {
        return this.decksRepository.updateDeck(deckId, userId, name, orderIndex, minAccuracy);
    }

    async getFlashcardsByDeckId(deckId: number): Promise<AllInfoFlashcard[]> {
        return this.decksRepository.getFlashcardsByDeckId(deckId);
    }

    async generateQuizFromDeck(deckId: number) {
        const flashcards = await this.getFlashcardsByDeckId(deckId);

        if (!flashcards || flashcards.length < 5) {
            throw new BadRequestException('El mazo debe tener al menos 5 tarjetas para generar un quiz.');
        }

        // Cargar distractores externos
        let distractorsPool: { en: string[], es: string[] } = { en: [], es: [] };
        try {
            const filePath = path.join(process.cwd(), 'src', 'utils', 'distractors.json');
            const fileData = fs.readFileSync(filePath, 'utf8');
            distractorsPool = JSON.parse(fileData);
        } catch (error) {
            console.error('Error al cargar distractores fallback:', error);
        }

        // Seleccionar 5 preguntas al azar
        const shuffled = [...flashcards].sort(() => 0.5 - Math.random());
        const selectedCards = shuffled.slice(0, 5);

        const quiz = selectedCards.map((card, index) => {
            const isWordInEnglish = this.detectLanguage(card.word) === 'en';
            const correctAnswer = card.translation; // La respuesta es la traducción

            // Generar distractores
            // 1. Intentar usar otras tarjetas del mismo mazo
            let potentialDistractors = flashcards
                .filter(f => f.id !== card.id)
                .map(f => f.translation);

            // 2. Si no hay suficientes, usar el pool de JSON
            const fallbackPool = isWordInEnglish ? distractorsPool.es : distractorsPool.en;
            potentialDistractors = [...new Set([...potentialDistractors, ...fallbackPool])];
            
            // 3. Mezclar y tomar 3
            const wrongOptions = potentialDistractors
                .filter(d => d.toLowerCase() !== correctAnswer.toLowerCase())
                .sort(() => 0.5 - Math.random())
                .slice(0, 3);

            // 4. Crear opciones finales
            const options = [
                { id: 1, text: correctAnswer, correct: true },
                ...wrongOptions.map((text, i) => ({ id: i + 2, text, correct: false }))
            ];

            return {
                id: card.id || index + 1,
                question: card.word,
                options: options.sort(() => 0.5 - Math.random()) // Barajar opciones
            };
        });

        return quiz;
    }

    private detectLanguage(text: string): 'en' | 'es' {
        // Lógica simple por ahora, se podría mejorar
        // Asumimos que si no hay caracteres especiales como ñ o tildes, es inglés (o simplificamos)
        const spanishChars = /[áéíóúñÁÉÍÓÚÑ]/;
        return spanishChars.test(text) ? 'es' : 'en';
    }
}
