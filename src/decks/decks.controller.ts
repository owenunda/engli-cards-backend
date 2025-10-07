import { Controller, Get, Post, Body, Patch, Param, Delete, Query } from '@nestjs/common';
import { DecksService } from './decks.service';
import type { CreateDecksDto, Decks, DecksWithFlashcards } from './interfaces/decks.interface';


@Controller('decks')
export class DecksController {
  constructor(private readonly decksService: DecksService) { }

  @Post()
  async createDeck(@Body() createDecksDto: CreateDecksDto): Promise<Decks> {
    return this.decksService.createDeck(createDecksDto);
  }

  @Get('/:userId')
  async getAllDecksByUserId(@Param('userId') userId: string): Promise<DecksWithFlashcards[]> {
    return this.decksService.getAllDecksByUserId(Number(userId));
  }

  // DELETE /decks?deckId=3&userId=1
    @Delete()
    async deleteDeckById(
        @Query('deckId') deckId: string,
        @Query('userId') userId: string
    ): Promise<string> {
        return this.decksService.deleteDeckById(Number(deckId), Number(userId));
    }
}
