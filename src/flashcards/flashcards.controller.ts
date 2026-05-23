import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Req, Query, UnauthorizedException } from '@nestjs/common';
import { FlashcardsService } from './flashcards.service';
import { AllInfoFlashcard, CreateFlashcardDto, UpdateFlashcardDto, UserFlashcards } from './interface/flashcard.interface';
import { ApiOperation, ApiResponse } from '@nestjs/swagger';
import { UpdateFlashCardEntity } from './entities/flashCards.entity';
import { JwtAuthGuard } from '../auth/jwt.guard';

@Controller('flashcards')
@UseGuards(JwtAuthGuard)
export class FlashcardsController {
  constructor(private readonly flashcardsService: FlashcardsService) {}

  @Post()
  @ApiOperation({ summary: 'Crear una nueva flashcard' })
  @ApiResponse({ status: 201, description: 'Flashcard created successfully.', type: UserFlashcards })
  @ApiResponse({ status: 400, description: 'Bad Request.' })
  @ApiResponse({ status: 500, description: 'Internal Server Error.' })
  async createFlashcard(
    @Body() createFlashcardDto: CreateFlashcardDto,
    @Req() req: any,
  ): Promise<UserFlashcards> {
    // Override user_id from JWT token to prevent forging
    const dto = { ...createFlashcardDto, user_id: Number(req.user?.sub) };
    return this.flashcardsService.createFlashcard(dto);
  }

  @Get()
  @ApiOperation({ summary: 'Obtener todas las flashcards (paginado)' })
  @ApiResponse({ status: 200, description: 'Lista de flashcards obtenida exitosamente.', type: [UserFlashcards] })
  @ApiResponse({ status: 500, description: 'Internal Server Error.' })
  async getAllFlashcards(
    @Query('limit') limit?: string,
    @Query('offset') offset?: string,
  ): Promise<UserFlashcards[]> {
    const parsedLimit = Math.min(Number(limit) || 50, 100);
    const parsedOffset = Number(offset) || 0;
    return this.flashcardsService.getAllFlashcards(parsedLimit, parsedOffset);
  }

  @Get('/:id')
  @ApiOperation({ summary: 'Obtener flashcards del usuario autenticado' })
  @ApiResponse({ status: 200, description: 'Flashcards obtenidas exitosamente.', type: [AllInfoFlashcard] })
  @ApiResponse({ status: 404, description: 'Flashcards not found.' })
  async getFlashcardById(@Param('id') id: string, @Req() req: any): Promise<AllInfoFlashcard[]> {
    // Always return flashcards belonging to the authenticated user
    const userId = Number(req.user?.sub);
    return this.flashcardsService.getFlashcardsByUserId(userId);
  }

  @Patch('/:id')
  @ApiOperation({ summary: 'Actualizar flashcard por ID' })
  @ApiResponse({ status: 200, description: 'Flashcard updated successfully.', type: UpdateFlashCardEntity })
  @ApiResponse({ status: 404, description: 'Flashcard not found.' })
  async updateFlashcard(
    @Param('id') id: string,
    @Body() updateDto: UpdateFlashcardDto,
    @Req() req: any,
  ) {
    const userId = Number(req.user?.sub);
    return this.flashcardsService.updateFlashcard(Number(id), userId, updateDto);
  }

  @Delete('/:id')
  @ApiOperation({ summary: 'Eliminar flashcard por ID' })
  @ApiResponse({ status: 200, description: 'Flashcard deleted successfully.' })
  @ApiResponse({ status: 404, description: 'Flashcard not found.' })
  async deleteFlashcard(@Param('id') id: string, @Req() req: any) {
    const userId = Number(req.user?.sub);
    return this.flashcardsService.deleteFlashcard(Number(id), userId);
  }
}
