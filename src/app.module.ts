import { Module } from '@nestjs/common';
import { UsersModule } from './users/users.module';
import { AuthModule } from './auth/auth.module';
import { DatabaseModule } from './database/database.module';
import { FlashcardsModule } from './flashcards/flashcards.module';
@Module({
	imports: [DatabaseModule, UsersModule, AuthModule, FlashcardsModule],
	controllers: [],
	providers: [],
})
export class AppModule {}
