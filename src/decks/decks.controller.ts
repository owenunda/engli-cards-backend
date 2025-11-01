import { Controller, Get, Post, Body, Patch, Param, Delete, Query } from '@nestjs/common';
import { DecksService } from './decks.service';
import { CreateDecksDto, Decks, DecksWithFlashcards } from './interfaces/decks.interface';
import { ApiOperation, ApiResponse } from '@nestjs/swagger';


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
}
