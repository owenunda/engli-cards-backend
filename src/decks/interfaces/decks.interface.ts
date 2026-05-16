import { ApiProperty } from '@nestjs/swagger';
import { AllInfoFlashcard } from '../../flashcards/interface/flashcard.interface';
import { IsBoolean, IsInt, IsNumber, IsOptional, IsString } from 'class-validator';


export class CreateDecksDto {

  @ApiProperty({ required: true })
  @IsString()
  name: string;

  @ApiProperty({ required: true })
  @IsNumber()
  user_id: number;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsBoolean()
  is_system?: boolean;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsInt()
  order_index?: number;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsNumber()
  min_accuracy?: number;
}

export class Decks {
  @ApiProperty()
  id: number;

  @ApiProperty()
  name: string;
  @ApiProperty()
  is_system: boolean;
  @ApiProperty()
  order_index: number;
  @ApiProperty()
  min_accuracy: number;
  @ApiProperty()
  created_at: Date;
  @ApiProperty()
  updated_at: Date;
}


export class DecksWithFlashcards {
  @ApiProperty()
  id: number;
  @ApiProperty()
  name: string;
  @ApiProperty()
  user_id: number;
  @ApiProperty({ type: [AllInfoFlashcard] })
  @ApiProperty()
  flashcards: AllInfoFlashcard[];
  @ApiProperty()
  is_system: boolean;
  @ApiProperty()
  order_index: number;
  @ApiProperty()
  min_accuracy: number;
  @ApiProperty()
  created_at: Date;
  @ApiProperty()
  updated_at: Date;
}