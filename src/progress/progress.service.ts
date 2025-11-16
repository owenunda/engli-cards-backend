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
            return {
                pointsEarned,
                totals,
                session,
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

}
