import { AllInfoFlashcard } from '../../flashcards/interface/flashcard.interface';


export interface CreateDecksDto {
  id: number;
  name: string;
  user_id: number;
  created_at: Date;
  updated_at: Date;
}

export interface Decks {
  id: number;
  name: string;
  user_id: number;
  created_at: Date;
  updated_at: Date;
}


export interface DecksWithFlashcards {
  id: number;
  name: string;
  user_id: number;
  flashcards: AllInfoFlashcard[];
  created_at: Date;
  updated_at: Date;
}