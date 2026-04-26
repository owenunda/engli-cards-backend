import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { DatabaseService } from 'src/database/database.service';
import { ProgressRepository } from './repository/progress.repository';
import { CompleteQuizDto, CompleteQuizResponse, Totals } from './interfaces/progress.interface';

@Injectable()
export class  ProgressService {
    constructor(
        private readonly databaseService: DatabaseService,
        private readonly progressRepository: ProgressRepository,
    ){}

    async completeQuiz(userId: number, dto: CompleteQuizDto): Promise<CompleteQuizResponse> {
        // Validación adicional después de los decoradores de clase
        if (dto.correctAnswers > dto.totalQuestions) {
            throw new BadRequestException('correctAnswers no puede ser mayor que totalQuestions');
        }

        // Validar y parsear la fecha
        let finishedAt: Date;
        if (dto.finishedAt) {
            finishedAt = new Date(dto.finishedAt);
            if (isNaN(finishedAt.getTime())) {
                throw new BadRequestException('finishedAt debe ser una fecha válida en formato ISO (ejemplo: 2024-11-15T21:30:00.000Z)');
            }
        } else {
            finishedAt = new Date();
        }

        const localDate = this.isoDateOnly(finishedAt); // 'YYYY-MM-DD'

        const { pointsEarned } = this.computePoints(dto.correctAnswers, dto.totalQuestions);

        return await this.databaseService.transaction(async (client) => {
            const user = await this.progressRepository.selectUserForUpdate(client, userId);
            if (!user) throw new NotFoundException('Usuario no encontrado');

            const { streakCurrent, streakBest } = this.computeStreak(
                user.last_activity_date as string | null,
                localDate,
                user.streak_current as number,
                user.streak_best as number,
            );

            const totalsRow = await this.progressRepository.updateUserStats(client, {
                userId,
                pointsEarned,
                correctAnswers: dto.correctAnswers,
                wrongAnswers: dto.totalQuestions - dto.correctAnswers,
                localDate,
                streakCurrent,
                streakBest,
            });

            const session = await this.progressRepository.insertQuizSession(client, {
                userId,
                deckId: dto.deckId,
                totalQuestions: dto.totalQuestions,
                correctAnswers: dto.correctAnswers,
                pointsAwarded: pointsEarned,
                completedAt: finishedAt,
            });

            const totals = this.addLevelComputed(totalsRow);

            // Logros Dinámicos
            await this.progressRepository.initAchievements(client, userId);
            const unlockedAchievements = await this.evaluateAchievements(client, userId, dto, totalsRow, finishedAt, streakCurrent, totals);

            return {
                pointsEarned,
                totals,
                session,
                unlockedAchievements,
            };
        });
    }

    async getStats(userId: number): Promise<Totals> {
        const row = await this.progressRepository.getTotals(userId);
        if (!row) throw new NotFoundException('Usuario no encontrado');
        return this.addLevelComputed(row);
    }

    async getQuizSessions(userId: number, days = 30) {
        if (days <= 0) days = 30;
        return this.progressRepository.getSessions(userId, days);
    }

    async getAchievements(userId: number) {
        return this.progressRepository.getAchievements(userId);
    }

    // Helpers
    private computePoints(correct: number, total: number) {
        const earnedBase = correct * 10;
        const accuracy = total > 0 ? correct / total : 0;
        let bonus = 0;
        if (accuracy === 1) bonus = 20;
        else if (accuracy >= 0.8 && total >= 10) bonus = 10;
        return { pointsEarned: earnedBase + bonus, bonus, accuracy };
    }

    private computeStreak(lastDate: string | null, currentDate: string, currentStreak: number, bestStreak: number) {
        if (!lastDate) return { streakCurrent: 1, streakBest: 1 };
        const diff = this.daysDiff(lastDate, currentDate);
        let streakCurrent = currentStreak;
        if (diff === 0) streakCurrent = currentStreak;
        else if (diff === 1) streakCurrent = currentStreak + 1;
        else streakCurrent = 1;
        const streakBest = Math.max(bestStreak, streakCurrent);
        return { streakCurrent, streakBest };
    }

    private addLevelComputed(row: any): Totals {
        const points = row.points_total as number;
        const level = Math.floor(points / 100) + 1;
        const next_level_points = 100 - (points % 100);
        return {
            points_total: points,
            streak_current: row.streak_current,
            streak_best: row.streak_best,
            quizzes_completed: row.quizzes_completed,
            correct_answers_total: row.correct_answers_total,
            wrong_answers_total: row.wrong_answers_total,
            level,
            next_level_points,
        };
    }

    private isoDateOnly(d: Date) {
        return d.toISOString().slice(0, 10);
    }

    private daysDiff(aDate: string, bDate: string) {
        const a = new Date(aDate + 'T00:00:00Z').getTime();
        const b = new Date(bDate + 'T00:00:00Z').getTime();
        return Math.round((b - a) / 86400000);
    }

    private async evaluateAchievements(client: any, userId: number, dto: CompleteQuizDto, totalsRow: any, finishedAt: Date, streakCurrent: number, totals: Totals) {
        // Obtener estado anterior
        const beforeState = await this.progressRepository.getAllUserAchievementsTx(client, userId);
        const beforeMap = new Map(beforeState.map(a => [a.achievement_code, a.is_completed]));

        // 1. FIRST_QUIZ
        await this.progressRepository.updateAchievement(client, userId, 'FIRST_QUIZ', 1, true);

        // 2. STREAK_7
        const streak7Completed = streakCurrent >= 7;
        await this.progressRepository.updateAchievement(client, userId, 'STREAK_7', Math.min(streakCurrent, 7), streak7Completed);

        // 3. STREAK_30
        const streak30Completed = streakCurrent >= 30;
        await this.progressRepository.updateAchievement(client, userId, 'STREAK_30', Math.min(streakCurrent, 30), streak30Completed);

        // 4. LEVEL_5
        const level5Completed = totals.level >= 5;
        await this.progressRepository.updateAchievement(client, userId, 'LEVEL_5', Math.min(totals.level, 5), level5Completed);

        // 5. CORRECT_100
        const totalCorrect = Number(totalsRow.correct_answers_total);
        const correct100Completed = totalCorrect >= 100;
        await this.progressRepository.updateAchievement(client, userId, 'CORRECT_100', Math.min(totalCorrect, 100), correct100Completed);

        // 6. EARLY_BIRD_1
        const hour = finishedAt.getHours();
        if (hour < 8) {
            await this.progressRepository.updateAchievement(client, userId, 'EARLY_BIRD_1', 1, true);
        }

        // 7. NIGHT_OWL_3
        if (hour >= 23 || hour < 4) {
            const no3 = await this.progressRepository.getUserAchievementByCode(client, userId, 'NIGHT_OWL_3');
            if (no3 && !no3.is_completed) {
                const newVal = Math.min((no3.current_value || 0) + 1, 3);
                await this.progressRepository.updateAchievement(client, userId, 'NIGHT_OWL_3', newVal, newVal >= 3);
            }
        }

        // 8. PERFECT_LESSONS_5
        const pl5 = await this.progressRepository.getUserAchievementByCode(client, userId, 'PERFECT_LESSONS_5');
        if (pl5 && !pl5.is_completed) {
            if (dto.correctAnswers === dto.totalQuestions && dto.totalQuestions > 0) {
                const newVal = Math.min((pl5.current_value || 0) + 1, 5);
                await this.progressRepository.updateAchievement(client, userId, 'PERFECT_LESSONS_5', newVal, newVal >= 5);
            } else {
                await this.progressRepository.updateAchievement(client, userId, 'PERFECT_LESSONS_5', 0, false);
            }
        }

        // Obtener estado posterior y comparar
        const afterState = await this.progressRepository.getAllUserAchievementsTx(client, userId);
        const newlyUnlocked: any[] = [];

        for (const after of afterState) {
            const wasCompleted = beforeMap.get(after.achievement_code);
            if (!wasCompleted && after.is_completed) {
                newlyUnlocked.push({
                    title: after.title,
                    description: after.description,
                    icon_type: after.icon_type,
                });
            }
        }

        return newlyUnlocked;
    }
}
