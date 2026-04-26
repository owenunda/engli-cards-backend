import { ApiProperty } from "@nestjs/swagger";
import { IsNumber, IsDate } from "class-validator";

// Importar el DTO desde su ubicación correcta
export { CompleteQuizDto } from '../dto/complete-quiz.dto';

export class Totals{
    @ApiProperty()
    @IsNumber()
    points_total: number;

    @ApiProperty()
    @IsNumber()
    streak_current: number;

    @ApiProperty()
    @IsNumber()
    streak_best: number;

    @ApiProperty()
    @IsNumber()
    quizzes_completed: number;

    @ApiProperty()
    @IsNumber()
    correct_answers_total: number;

    @ApiProperty()
    @IsNumber()
    wrong_answers_total: number;

    @ApiProperty()
    @IsNumber()
    level: number;

    @ApiProperty()
    @IsNumber()
    next_level_points: number;
}

export class QuizSession{
    @ApiProperty()
    @IsNumber()
    id: number;

    @ApiProperty()
    @IsNumber()
    deck_id: number | null;

    @ApiProperty()
    total_questions: number;
    @ApiProperty()
    correct_answers: number;

    @ApiProperty()
    @IsNumber()
    points_awarded: number;

    @ApiProperty()
    @IsDate()
    completed_at: Date;
}

export class CompleteQuizResponse{
    @ApiProperty()
    @IsNumber()
    pointsEarned: number;

    @ApiProperty()
    totals: Totals;
    @ApiProperty()
    session: Pick<QuizSession, 'id' | 'completed_at'>;

    @ApiProperty({ required: false })
    unlockedAchievements?: any[];
}