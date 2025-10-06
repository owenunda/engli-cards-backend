export interface Flashcard {
  id: number;
  word: string;
  translation: string;
  image_url?: string;
  created_at: Date;
  updated_at: Date;
}

export interface CreateFlashcardDto {
  word: string;
  translation: string;
  image_url?: string;
}