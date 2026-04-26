import { ApiProperty } from '@nestjs/swagger';

export class TotalsEntity{
    @ApiProperty()
    points_total: number;
    @ApiProperty()  
    level: number;
    @ApiProperty()
    next_level_points: number;
    @ApiProperty()
    streak_current: number;
    @ApiProperty()
    streak_best: number;
    @ApiProperty()
    quizzes_completed: number;
    @ApiProperty()
    correct_answers_total: number;
    @ApiProperty()
    wrong_answers_total: number;
    @ApiProperty()
    study_time_total_seconds: number;
}