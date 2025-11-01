import { ApiProperty } from "@nestjs/swagger";

export class Word {
  id: number;
  translation: string;
  image_url?: string;
  created_at: Date;
  updated_at: Date;
}

export class UserFlashcards {
  id: number;
  user_id: number;
  word_id: number;
  created_at: Date;
  updated_at: Date;
}

export class CreateFlashcardDto {
  word: string;
  translation: string;
  image_url?: string;
  user_id: number;
  deck_id?: number;
}

export class AllInfoFlashcard {
  @ApiProperty()
  id: number;
  @ApiProperty()
  user_id: number;
  @ApiProperty()
  word_id: number;
  @ApiProperty()
  word: string;
  @ApiProperty()
  translation: string;
  @ApiProperty()
  image_url?: string;
  @ApiProperty()
  created_at: Date;
  @ApiProperty()
  updated_at: Date;
}
