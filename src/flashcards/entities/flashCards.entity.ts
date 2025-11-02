import { ApiProperty } from "@nestjs/swagger";
import { UserFlashcards, Word } from "../interface/flashcard.interface";

export class UpdateFlashCardEntity extends UserFlashcards {
  @ApiProperty({ type: () => UserFlashcards })
  user_flashcard: UserFlashcards;

  @ApiProperty({ type: () => Word })
  word: Word;

}