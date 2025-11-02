import { ApiProperty } from "@nestjs/swagger";
import { IsNumber, IsOptional, IsString } from "class-validator";
import e from "express";

export class Word {
  @ApiProperty()
  @IsString()
  id: number;
  @ApiProperty()
  @IsString()
  translation: string;
  @ApiProperty()
  @IsString()
  word: string;
  @ApiProperty()
  @IsString()
  image_url?: string;
  @ApiProperty()
  created_at: Date;
  @ApiProperty()
  updated_at: Date;
}

export class UserFlashcards {
  @ApiProperty()
  id: number;
  @ApiProperty()
  user_id: number;
  @ApiProperty()
  word_id: number;
  @ApiProperty()
  created_at: Date;
  @ApiProperty()
  updated_at: Date;
}

export class CreateFlashcardDto {
  @ApiProperty()
  @IsString()
  word: string;
  @ApiProperty()
  @IsString()
  translation: string;
  @ApiProperty()
  @IsString()
  @IsOptional()
  image_url?: string;
  @ApiProperty()
  @IsNumber()
  user_id: number;
  @ApiProperty()
  @IsNumber()
  deck_id?: number;
}

export class UpdateFlashcardDto {
  @ApiProperty()
  @IsString()
  @IsOptional()
  word?: string;

  @ApiProperty()
  @IsString()
  @IsOptional()
  translation?: string;

  @ApiProperty()
  @IsString()
  @IsOptional()
  image_url?: string;

  @ApiProperty({ required: true })
  @IsNumber()
  user_id: number;
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
