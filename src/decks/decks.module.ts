import { Module } from '@nestjs/common';
import { DecksService } from './decks.service';
import { DecksController } from './decks.controller';
import { DecksRepository } from './repository/decks.repository';
import { DatabaseService } from 'src/database/database.service';

@Module({
  controllers: [DecksController],
  providers: [DecksService, DecksRepository, DatabaseService],
})
export class DecksModule {}
