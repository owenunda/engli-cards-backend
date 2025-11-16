import { ApiProperty } from "@nestjs/swagger";
import { TotalsEntity } from "./stats.entity";

class SessionLiteEntity{
    @ApiProperty()
    id: number;
    @ApiProperty()
    completed_at: Date;
}

export class CompleteQuizResponseEntity{
    @ApiProperty()
    pointsEarned: number;
    @ApiProperty({type: TotalsEntity})
    totals: TotalsEntity;
    @ApiProperty({type: SessionLiteEntity})
    session: SessionLiteEntity;
}