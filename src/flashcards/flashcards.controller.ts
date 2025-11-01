import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { FlashcardsService } from './flashcards.service';
import  type { AllInfoFlashcard, CreateFlashcardDto, UserFlashcards } from './interface/flashcard.interface';
import { ApiOperation, ApiResponse } from '@nestjs/swagger';

@Controller('flashcards')
export class FlashcardsController {
  constructor(private readonly flashcardsService: FlashcardsService) {}

  @Post()
  @ApiOperation({ summary: 'Crear una nueva flashcard' })
  @ApiResponse({ status: 201, description: 'Flashcard created successfully.' })
  @ApiResponse({ status: 400, description: 'Bad Request.' })
  @ApiResponse({ status: 500, description: 'Internal Server Error.' })
  async createFlashcard(@Body() createFlashcardDto: CreateFlashcardDto): Promise<UserFlashcards> {
    return this.flashcardsService.createFlashcard(createFlashcardDto);
  }

  @Get()
  @ApiOperation({ summary: 'Obtener todas las flashcards' })
  async getAllFlashcards(): Promise<UserFlashcards[]> {
    return this.flashcardsService.getAllFlashcards();
  }

  @Get('/:id')
  @ApiOperation({ summary: 'Obtener flashcards por ID de usuario' })
  async getFlashcardById(@Param('id') id: string) : Promise<AllInfoFlashcard[]> {
    return this.flashcardsService.getFlashcardsByUserId(Number(id));
  }

  @Patch('/:id')
  @ApiOperation({ summary: 'Actualizar flashcard por ID' })
  async updateFlashcard(
    @Param('id') id: string,
    @Body() updateDto: { word?: string; translation?: string; image_url?: string; user_id?: number }
  ) {
    // user_id must be passed in body for ownership check (or obtain from auth in a future iteration)
    const userId = updateDto.user_id;
    if (!userId) {
      throw new Error('user_id is required');
    }
    return this.flashcardsService.updateFlashcard(Number(id), Number(userId), updateDto);
  }
}
