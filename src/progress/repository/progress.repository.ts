import { Injectable } from '@nestjs/common';
import { DatabaseService } from '../../database/database.service';

@Injectable()
export class ProgressRepository{
    constructor(private readonly databaseService: DatabaseService) {}

    async selectUserForUpdate(client: any, userId: number){
        const q = `
            SELECT id, points_total, streak_current, streak_best, last_activity_date,
                   quizzes_completed, correct_answers_total, wrong_answers_total
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
    }) {
        const q = `
        UPDATE users
            SET points_total = points_total + $2,
                quizzes_completed = quizzes_completed + 1,
                correct_answers_total = correct_answers_total + $3,
                wrong_answers_total = wrong_answers_total + $4,
                streak_current = $5,
                streak_best = $6,
                last_activity_date = $7
            WHERE id = $1
            RETURNING points_total, streak_current, streak_best, quizzes_completed,
                      correct_answers_total, wrong_answers_total
        `;
        const vals = [
            p.userId, p.pointsEarned, p.correctAnswers, p.wrongAnswers,
            p.streakCurrent, p.streakBest, p.localDate,
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
    }) {
        const q = `
            INSERT INTO user_quiz_sessions (user_id, deck_id, total_questions, correct_answers, points_awarded, completed_at)
            VALUES ($1, $2, $3, $4, $5, $6)
            RETURNING id, completed_at
        `;
        const res = await client.query(q, [s.userId, s.deckId ?? null, s.totalQuestions, s.correctAnswers, s.pointsAwarded, s.completedAt]);
        return res.rows[0];
    }

    async getTotals(userId: number) {
        const q = `
            SELECT points_total, streak_current, streak_best, quizzes_completed,
                   correct_answers_total, wrong_answers_total
            FROM users
            WHERE id = $1
        `;
        const res = await this.databaseService.query(q, [userId]);
        return res.rows[0];
    }

    async getSessions(userId: number, days: number) {
        const q = `
            SELECT id, deck_id, total_questions, correct_answers, points_awarded, completed_at
            FROM user_quiz_sessions
            WHERE user_id = $1
              AND completed_at >= NOW() - ($2 || ' days')::INTERVAL
            ORDER BY completed_at DESC
        `;
        const res = await this.databaseService.query(q, [userId, days]);
        return res.rows;
    }
}