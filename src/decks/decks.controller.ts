import { Controller, Get, Post, Body, Patch, Param, Delete, Query } from '@nestjs/common';
import { DecksService } from './decks.service';
import { CreateDecksDto, Decks, DecksWithFlashcards } from './interfaces/decks.interface';
import { ApiOperation, ApiResponse } from '@nestjs/swagger';
import { AllInfoFlashcard } from '../flashcards/interface/flashcard.interface';


@Controller('decks')
export class DecksController {
  constructor(private readonly decksService: DecksService) { }

  @Post()
  @ApiOperation({ summary: 'Crear un nuevo mazo' })
  @ApiResponse({ status: 201, description: 'Mazo creado exitosamente.', type: Decks })
  @ApiResponse({ status: 400, description: 'Solicitud incorrecta.' })
  @ApiResponse({ status: 500, description: 'Error interno del servidor.' })
  async createDeck(@Body() createDecksDto: CreateDecksDto): Promise<Decks> {
    return this.decksService.createDeck(createDecksDto);
  }

  @Get('/:userId')
  @ApiOperation({ summary: 'Obtener todos los mazos de un usuario' })
  @ApiResponse({ status: 200, description: 'Mazos obtenidos exitosamente.', type: [DecksWithFlashcards] })
  @ApiResponse({ status: 404, description: 'No se encontraron mazos.' })
  async getAllDecksByUserId(@Param('userId') userId: string): Promise<DecksWithFlashcards[]> {
    return this.decksService.getAllDecksByUserId(Number(userId));
  }

  @Get('/:deckId/flashcards')
  @ApiOperation({ summary: 'Obtener todas las flashcards de un mazo' })
  @ApiResponse({ status: 200, description: 'Flashcards obtenidas exitosamente.', type: [AllInfoFlashcard] })
  @ApiResponse({ status: 404, description: 'No se encontraron flashcards.' })
  async getFlashcardsByDeckId(@Param('deckId') deckId: string): Promise<AllInfoFlashcard[]> {
    return this.decksService.getFlashcardsByDeckId(Number(deckId));
  }

  // DELETE /decks?deckId=3&userId=1
  @Delete()
  @ApiOperation({ summary: 'Eliminar un mazo por ID' })
  @ApiResponse({ status: 200, description: 'Mazo eliminado exitosamente.' })
  @ApiResponse({ status: 404, description: 'Mazo no encontrado.' })
  @ApiResponse({ status: 500, description: 'Error interno del servidor.' })
  async deleteDeckById(
    @Query('deckId') deckId: string,
    @Query('userId') userId: string
  ): Promise<string> {
    return this.decksService.deleteDeckById(Number(deckId), Number(userId));
  }

  @Patch('/:deckId')
  @ApiOperation({ summary: 'Actualizar nombre de un mazo por ID' })
  @ApiResponse({ status: 200, description: 'Nombre de mazo actualizado exitosamente.', type: Decks })
  @ApiResponse({ status: 404, description: 'Mazo no encontrado.' })
  async updateDeckName(
    @Param('deckId') deckId: string,
    @Body('name') name: string,
    @Body('userId') userId: string
  ): Promise<Decks> {
    return this.decksService.updateDeckName(Number(deckId), Number(userId), name);
  }

  @Get('/:deckId/quiz')
  @ApiOperation({ summary: 'Generar un quiz de 5 preguntas basado en un mazo' })
  @ApiResponse({ status: 200, description: 'Quiz generado exitosamente.' })
  @ApiResponse({ status: 400, description: 'El mazo no tiene suficientes tarjetas.' })
  async generateQuizFromDeck(@Param('deckId') deckId: string) {
    return this.decksService.generateQuizFromDeck(Number(deckId));
  }
}
