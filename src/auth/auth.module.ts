import { Module } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { UsersRepository } from '../users/repository/users.repository';
import { DatabaseModule } from '../database/database.module';
import { EmailService } from './email.service';

@Module({
	imports: [DatabaseModule],
	providers: [AuthService, UsersRepository, EmailService],
	controllers: [AuthController],
})
export class AuthModule {}
