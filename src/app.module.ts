import { Module } from '@nestjs/common';
import { UsersModule } from './users/users.module';
import { AuthModule } from './auth/auth.module';
import { DatabaseModule } from './database/database.module';
import { FlashcardsModule } from './flashcards/flashcards.module';
import { DecksModule } from './decks/decks.module';
import { CloudinaryModule } from './cloudinary/cloudinary.module';
import { ProgressModule } from './progress/progress.module';
@Module({
	imports: [DatabaseModule, UsersModule, AuthModule, FlashcardsModule, DecksModule, CloudinaryModule, ProgressModule],
	controllers: [],
	providers: [],
})
export class AppModule {}
