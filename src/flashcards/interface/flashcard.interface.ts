export interface Word {
  id: number;
  translation: string;
  image_url?: string;
  created_at: Date;
  updated_at: Date;
}

export interface UserFlashcards {
  id: number;
  user_id: number;
  word_id: number;
  created_at: Date;
  updated_at: Date;
}

export interface CreateFlashcardDto {
  word: string;
  translation: string;
  image_url?: string;
  user_id: number;
  deck_id?: number;
}

export interface AllInfoFlashcard {
  id: number;
  user_id: number;
  word_id: number;
  word: string;
  translation: string;
  image_url?: string;
  created_at: Date;
  updated_at: Date;
}
