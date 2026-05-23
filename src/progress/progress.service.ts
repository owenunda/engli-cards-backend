import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { DatabaseService } from '../database/database.service';
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
                timeSpentSeconds: dto.timeSpentSeconds || 0,
            });

            const session = await this.progressRepository.insertQuizSession(client, {
                userId,
                deckId: dto.deckId,
                totalQuestions: dto.totalQuestions,
                correctAnswers: dto.correctAnswers,
                pointsAwarded: pointsEarned,
                completedAt: finishedAt,
                timeSpentSeconds: dto.timeSpentSeconds || 0,
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

    async getQuizSessions(userId: number, days = 30, limit = 50) {
        if (days <= 0) days = 30;
        return this.progressRepository.getSessions(userId, days, limit);
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
            study_time_total_seconds: row.study_time_total_seconds || 0,
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
        // Cargar todo el estado en una sola query al inicio
        interface AchievementRow {
            achievement_code: string;
            title: string;
            description: string;
            icon_type: string;
            target_value: number;
            is_completed: boolean;
            current_value: number;
        }
        const allAchievements: AchievementRow[] = await this.progressRepository.getAllUserAchievementsTx(client, userId);
        const stateMap = new Map<string, AchievementRow>(allAchievements.map(a => [a.achievement_code, a]));
        const beforeCompleted = new Map<string, boolean>(allAchievements.map(a => [a.achievement_code, a.is_completed]));

        const hour = finishedAt.getHours();
        const totalCorrect = Number(totalsRow.correct_answers_total);

        // Calcular nuevos valores en memoria — sin queries adicionales
        const updates: Array<{ code: string; value: number; completed: boolean }> = [];

        updates.push({ code: 'FIRST_QUIZ', value: 1, completed: true });

        updates.push({ code: 'STREAK_7', value: Math.min(streakCurrent, 7), completed: streakCurrent >= 7 });
        updates.push({ code: 'STREAK_30', value: Math.min(streakCurrent, 30), completed: streakCurrent >= 30 });
        updates.push({ code: 'LEVEL_5', value: Math.min(totals.level, 5), completed: totals.level >= 5 });
        updates.push({ code: 'CORRECT_100', value: Math.min(totalCorrect, 100), completed: totalCorrect >= 100 });

        if (hour < 8) {
            updates.push({ code: 'EARLY_BIRD_1', value: 1, completed: true });
        }

        // NIGHT_OWL_3 — usar current_value del mapa ya cargado
        if (hour >= 23 || hour < 4) {
            const no3 = stateMap.get('NIGHT_OWL_3');
            if (no3 && !no3.is_completed) {
                const newVal = Math.min((no3.current_value || 0) + 1, 3);
                updates.push({ code: 'NIGHT_OWL_3', value: newVal, completed: newVal >= 3 });
            }
        }

        // PERFECT_LESSONS_5 — usar current_value del mapa ya cargado
        const pl5 = stateMap.get('PERFECT_LESSONS_5');
        if (pl5 && !pl5.is_completed) {
            if (dto.correctAnswers === dto.totalQuestions && dto.totalQuestions > 0) {
                const newVal = Math.min((pl5.current_value || 0) + 1, 5);
                updates.push({ code: 'PERFECT_LESSONS_5', value: newVal, completed: newVal >= 5 });
            } else {
                updates.push({ code: 'PERFECT_LESSONS_5', value: 0, completed: false });
            }
        }

        // Ejecutar todas las actualizaciones
        await Promise.all(
            updates.map(u => this.progressRepository.updateAchievement(client, userId, u.code, u.value, u.completed))
        );

        // Detectar logros recién desbloqueados usando el estado anterior en memoria
        const newlyUnlocked: any[] = [];
        for (const u of updates) {
            if (u.completed && !beforeCompleted.get(u.code)) {
                const meta = stateMap.get(u.code);
                if (meta) {
                    newlyUnlocked.push({ title: meta.title, description: meta.description, icon_type: meta.icon_type });
                }
            }
        }

        return newlyUnlocked;
    }
}
