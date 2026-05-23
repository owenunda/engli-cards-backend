import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { UsersModule } from './users/users.module';
import { AuthModule } from './auth/auth.module';
import { DatabaseModule } from './database/database.module';
import { FlashcardsModule } from './flashcards/flashcards.module';
import { DecksModule } from './decks/decks.module';
import { CloudinaryModule } from './cloudinary/cloudinary.module';
import { ProgressModule } from './progress/progress.module';

@Module({
	imports: [
		ThrottlerModule.forRoot([
			{
				name: 'global',
				ttl: 60000,  // ventana de 1 minuto
				limit: 60,   // 60 requests/min por defecto
			},
		]),
		DatabaseModule,
		UsersModule,
		AuthModule,
		FlashcardsModule,
		DecksModule,
		CloudinaryModule,
		ProgressModule,
	],
	controllers: [],
	providers: [
		{
			provide: APP_GUARD,
			useClass: ThrottlerGuard,
		},
	],
})
export class AppModule {}
