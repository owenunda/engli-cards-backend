import { ApiProperty } from '@nestjs/swagger';

export class QuizSessionEntity{
    @ApiProperty()
    id: number;
    @ApiProperty({required: false, nullable: true})
    deck_id?: number | null;
    @ApiProperty()
    total_questions: number;
    @ApiProperty()
    correct_answers: number;
    @ApiProperty()
    points_awarded: number;
    @ApiProperty()
    completed_at: Date;
}