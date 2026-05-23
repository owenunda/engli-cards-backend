import { Controller, Get, Post, Body, Patch, Param, Delete, Query, UseGuards, Req } from '@nestjs/common';
import { DecksService } from './decks.service';
import { CreateDecksDto, Decks, DecksWithFlashcards } from './interfaces/decks.interface';
import { ApiOperation, ApiResponse } from '@nestjs/swagger';
import { AllInfoFlashcard } from '../flashcards/interface/flashcard.interface';
import { JwtAuthGuard } from '../auth/jwt.guard';


@Controller('decks')
export class DecksController {
  constructor(private readonly decksService: DecksService) { }

  // Rutas específicas PRIMERO para evitar conflictos
  @Post('init-system')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Inicializar decks del sistema (Greetings, Fruits, Family, etc.)' })
  @ApiResponse({ status: 201, description: 'Decks del sistema inicializados exitosamente.' })
  @ApiResponse({ status: 500, description: 'Error interno del servidor.' })
  async initializeSystemDecks() {
     return this.decksService.initializeSystemDecks();
  }

  @Get('all')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Obtener todos los mazos del sistema (Admin)' })
  @ApiResponse({ status: 200, description: 'Todos los mazos obtenidos.', type: [DecksWithFlashcards] })
  async getAllDecks(): Promise<DecksWithFlashcards[]> {
    return this.decksService.getAllDecks();
  }

  @Post()
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Crear un nuevo mazo' })
  @ApiResponse({ status: 201, description: 'Mazo creado exitosamente.', type: Decks })
  @ApiResponse({ status: 400, description: 'Solicitud incorrecta.' })
  @ApiResponse({ status: 500, description: 'Error interno del servidor.' })
  async createDeck(@Body() createDecksDto: CreateDecksDto, @Req() req: any): Promise<Decks> {
    // Override userId from JWT to prevent forging
    const dto = { ...createDecksDto, userId: Number(req.user?.sub) };
    return this.decksService.createDeck(dto);
  }

  // Rutas genéricas al final
  @Get(':userId')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Obtener todos los mazos del usuario autenticado' })
  @ApiResponse({ status: 200, description: 'Mazos obtenidos exitosamente.', type: [DecksWithFlashcards] })
  @ApiResponse({ status: 404, description: 'No se encontraron mazos.' })
  async getAllDecksByUserId(
    @Param('userId') userId: string,
    @Query('includeSystem') includeSystem?: string,
    @Req() req?: any,
  ): Promise<DecksWithFlashcards[]> {
    const include = includeSystem === undefined ? true : includeSystem === 'true';
    // Always use the authenticated user's ID
    const authenticatedUserId = Number(req.user?.sub);
    return this.decksService.getAllDecksByUserId(authenticatedUserId, include);
  }

  @Get(':deckId/flashcards')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Obtener todas las flashcards de un mazo' })
  @ApiResponse({ status: 200, description: 'Flashcards obtenidas exitosamente.', type: [AllInfoFlashcard] })
  @ApiResponse({ status: 404, description: 'No se encontraron flashcards.' })
  async getFlashcardsByDeckId(@Param('deckId') deckId: string): Promise<AllInfoFlashcard[]> {
    return this.decksService.getFlashcardsByDeckId(Number(deckId));
  }

  @Get(':deckId/quiz')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Generar un quiz de 5 preguntas basado en un mazo' })
  @ApiResponse({ status: 200, description: 'Quiz generado exitosamente.' })
  @ApiResponse({ status: 400, description: 'El mazo no tiene suficientes tarjetas.' })
  async generateQuizFromDeck(@Param('deckId') deckId: string) {
    return this.decksService.generateQuizFromDeck(Number(deckId));
  }

  // DELETE /decks?deckId=3&userId=1
  @Delete()
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Eliminar un mazo por ID' })
  @ApiResponse({ status: 200, description: 'Mazo eliminado exitosamente.' })
  @ApiResponse({ status: 404, description: 'Mazo no encontrado.' })
  @ApiResponse({ status: 500, description: 'Error interno del servidor.' })
  async deleteDeckById(
    @Query('deckId') deckId: string,
    @Query('userId') userId: string,
    @Req() req: any,
  ): Promise<string> {
    const authenticatedUserId = Number(req.user?.sub);
    return this.decksService.deleteDeckById(Number(deckId), authenticatedUserId);
  }

  @Patch(':deckId')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Actualizar un mazo por ID' })
  @ApiResponse({ status: 200, description: 'Mazo actualizado exitosamente.', type: Decks })
  @ApiResponse({ status: 404, description: 'Mazo no encontrado.' })
  async updateDeck(
    @Param('deckId') deckId: string,
    @Body('name') name: string,
    @Body('userId') userId: string,
    @Body('order_index') orderIndex?: number,
    @Body('min_accuracy') minAccuracy?: number,
    @Req() req?: any,
  ): Promise<Decks> {
    const authenticatedUserId = Number(req.user?.sub);
    return this.decksService.updateDeck(Number(deckId), authenticatedUserId, name, orderIndex, minAccuracy);
  }
}
