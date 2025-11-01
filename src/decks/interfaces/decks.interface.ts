import { ApiProperty } from '@nestjs/swagger';
import { AllInfoFlashcard } from '../../flashcards/interface/flashcard.interface';
import { IsEmail, IsNumber, IsString } from 'class-validator';


export class CreateDecksDto {

  @ApiProperty({ required: true })
  @IsString()
  name: string;

  @ApiProperty({ required: true })
  @IsNumber()
  user_id: number;
}

export class Decks {
  @ApiProperty()
  id: number;

  @ApiProperty()
  name: string;
  @ApiProperty()
  user_id: number;
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
  flashcards: AllInfoFlashcard[];
  @ApiProperty()
  created_at: Date;
  @ApiProperty()
  updated_at: Date;
}