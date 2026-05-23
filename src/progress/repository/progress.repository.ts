import { Injectable } from '@nestjs/common';
import { DatabaseService } from '../../database/database.service';

@Injectable()
export class ProgressRepository{
    constructor(private readonly databaseService: DatabaseService) {}

    async selectUserForUpdate(client: any, userId: number){
        const q = `
            SELECT id, points_total, streak_current, streak_best, last_activity_date,
                   quizzes_completed, correct_answers_total, wrong_answers_total, study_time_total_seconds
            FROM users
            WHERE id = $1
            FOR UPDATE
        `;
        const res = await client.query(q, [userId]);
        return res.rows[0];
    }

    async updateUserStats(client: any, p:{
        userId: number;
        pointsEarned: number;
        correctAnswers: number;
        wrongAnswers: number;
        localDate: string; // 'YYYY-MM-DD'
        streakCurrent: number;
        streakBest: number;
        timeSpentSeconds: number;
    }) {
        const q = `
        UPDATE users
            SET points_total = points_total + $2,
                quizzes_completed = quizzes_completed + 1,
                correct_answers_total = correct_answers_total + $3,
                wrong_answers_total = wrong_answers_total + $4,
                streak_current = $5,
                streak_best = $6,
                last_activity_date = $7,
                study_time_total_seconds = study_time_total_seconds + $8
            WHERE id = $1
            RETURNING points_total, streak_current, streak_best, quizzes_completed,
                      correct_answers_total, wrong_answers_total, study_time_total_seconds
        `;
        const vals = [
            p.userId, p.pointsEarned, p.correctAnswers, p.wrongAnswers,
            p.streakCurrent, p.streakBest, p.localDate, p.timeSpentSeconds
        ];
        const res = await client.query(q, vals);
        return res.rows[0];

    }

    async insertQuizSession(client: any, s:{
         userId: number;
        deckId?: number;
        totalQuestions: number;
        correctAnswers: number;
        pointsAwarded: number;
        completedAt: Date;
        timeSpentSeconds: number;
    }) {
        const q = `
            INSERT INTO user_quiz_sessions (user_id, deck_id, total_questions, correct_answers, points_awarded, completed_at, time_spent_seconds)
            VALUES ($1, $2, $3, $4, $5, $6, $7)
            RETURNING id, completed_at
        `;
        const res = await client.query(q, [s.userId, s.deckId ?? null, s.totalQuestions, s.correctAnswers, s.pointsAwarded, s.completedAt, s.timeSpentSeconds]);
        return res.rows[0];
    }

    async getTotals(userId: number) {
        const q = `
            SELECT points_total, streak_current, streak_best, quizzes_completed,
                   correct_answers_total, wrong_answers_total, study_time_total_seconds
            FROM users
            WHERE id = $1
        `;
        const res = await this.databaseService.query(q, [userId]);
        return res.rows[0];
    }

    async getSessions(userId: number, days: number, limit = 50) {
        const safeLimit = Math.min(limit, 100);
        const q = `
            SELECT id, deck_id, total_questions, correct_answers, points_awarded, completed_at, time_spent_seconds
            FROM user_quiz_sessions
            WHERE user_id = $1
              AND completed_at >= NOW() - ($2 || ' days')::INTERVAL
            ORDER BY completed_at DESC
            LIMIT $3
        `;
        const res = await this.databaseService.query(q, [userId, days, safeLimit]);
        return res.rows;
    }

    async getAchievements(userId: number) {
        const q = `
            SELECT 
                a.id as achievement_id,
                a.title,
                a.description,
                a.target_value,
                a.icon_type,
                a.achievement_code,
                COALESCE(ua.current_value, 0) as current_value,
                COALESCE(ua.is_completed, false) as is_completed,
                ua.unlocked_at
            FROM achievements a
            LEFT JOIN user_achievements ua ON a.id = ua.achievement_id AND ua.user_id = $1
            ORDER BY a.id ASC
        `;
        const res = await this.databaseService.query(q, [userId]);
        return res.rows;
    }

    async initAchievements(client: any, userId: number) {
        const q = `
            INSERT INTO user_achievements (user_id, achievement_id, current_value)
            SELECT $1, id, 0
            FROM achievements
            ON CONFLICT (user_id, achievement_id) DO NOTHING
        `;
        await client.query(q, [userId]);
    }

    async updateAchievement(client: any, userId: number, achievementCode: string, newValue: number, isCompleted: boolean) {
        const q = `
            UPDATE user_achievements ua
            SET current_value = $1,
                is_completed = $2,
                unlocked_at = CASE WHEN $2 = true AND ua.is_completed = false THEN NOW() ELSE ua.unlocked_at END,
                updated_at = NOW()
            FROM achievements a
            WHERE a.id = ua.achievement_id 
              AND a.achievement_code = $3 
              AND ua.user_id = $4
        `;
        await client.query(q, [newValue, isCompleted, achievementCode, userId]);
    }

    async getUserAchievementByCode(client: any, userId: number, achievementCode: string) {
        const q = `
            SELECT ua.current_value, ua.is_completed, a.target_value
            FROM user_achievements ua
            JOIN achievements a ON ua.achievement_id = a.id
            WHERE ua.user_id = $1 AND a.achievement_code = $2
        `;
        const res = await client.query(q, [userId, achievementCode]);
        return res.rows[0];
    }

    async getAllUserAchievementsTx(client: any, userId: number) {
        const q = `
            SELECT a.achievement_code, a.title, a.icon_type, a.description, a.target_value,
                   COALESCE(ua.is_completed, false) as is_completed,
                   COALESCE(ua.current_value, 0) as current_value
            FROM achievements a
            LEFT JOIN user_achievements ua ON a.id = ua.achievement_id AND ua.user_id = $1
        `;
        const res = await client.query(q, [userId]);
        return res.rows;
    }
}