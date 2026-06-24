import { Injectable } from '@nestjs/common';
import { DatabaseService } from '../database/database.service';

@Injectable()
export class OnboardingRepository {
    constructor(private readonly db: DatabaseService) {}

    async getCategories() {
        const result = await this.db.query(
            `SELECT id, key, name, emoji, description, color FROM preset_categories ORDER BY id`,
        );
        return result.rows;
    }

    async completeOnboarding(userId: number, categoryKeys: string[]): Promise<void> {
        await this.db.transaction(async (client) => {
            for (const key of categoryKeys) {
                const decksResult = await client.query(
                    `SELECT id, name FROM preset_decks WHERE category_key = $1`,
                    [key],
                );

                for (const presetDeck of decksResult.rows) {
                    const deckResult = await client.query(
                        `INSERT INTO decks (name, user_id, is_system, order_index, min_accuracy, created_at, updated_at)
                         VALUES ($1, $2, false, 0, 0.9, NOW(), NOW())
                         RETURNING id`,
                        [presetDeck.name, userId],
                    );
                    const deckId = deckResult.rows[0].id;

                    const flashcardsResult = await client.query(
                        `SELECT word, translation FROM preset_flashcards WHERE deck_id = $1`,
                        [presetDeck.id],
                    );

                    for (const fc of flashcardsResult.rows) {
                        const wordResult = await client.query(
                            `INSERT INTO words (word, translation, created_at, updated_at)
                             VALUES ($1, $2, NOW(), NOW()) RETURNING id`,
                            [fc.word, fc.translation],
                        );
                        const wordId = wordResult.rows[0].id;

                        const userFcResult = await client.query(
                            `INSERT INTO user_flashcards (user_id, word_id, created_at, updated_at)
                             VALUES ($1, $2, NOW(), NOW()) RETURNING id`,
                            [userId, wordId],
                        );
                        const userFcId = userFcResult.rows[0].id;

                        await client.query(
                            `INSERT INTO deck_flashcards (deck_id, user_flashcard_id) VALUES ($1, $2)`,
                            [deckId, userFcId],
                        );
                    }
                }
            }

            await client.query(
                `UPDATE users SET onboarding_completed = true WHERE id = $1`,
                [userId],
            );
        });
    }
}
