import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { FlashcardsService } from './flashcards.service';
import  type { CreateFlashcardDto, Flashcard } from './interface/flashcard.interface';

@Controller('flashcards')
export class FlashcardsController {
  constructor(private readonly flashcardsService: FlashcardsService) {}

  @Post()
  async createFlashcard(@Body() createFlashcardDto: CreateFlashcardDto): Promise<Flashcard> {
    return this.flashcardsService.createFlashcard(createFlashcardDto);
  }

  @Get()
  async getAllFlashcards(): Promise<Flashcard[]> {
    return this.flashcardsService.getAllFlashcards();
  }
}
