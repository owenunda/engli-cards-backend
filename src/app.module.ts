import { Module } from '@nestjs/common';
import { UsersModule } from './users/users.module';
import { AuthModule } from './auth/auth.module';
import { DatabaseModule } from './database/database.module';
import { FlashcardsModule } from './flashcards/flashcards.module';
import { DecksModule } from './decks/decks.module';
@Module({
	imports: [DatabaseModule, UsersModule, AuthModule, FlashcardsModule, DecksModule],
	controllers: [],
	providers: [],
})
export class AppModule {}
