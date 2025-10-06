import { Module } from '@nestjs/common';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';
import { UsersRepository } from './repository/users.repository';
import { DatabaseModule } from '../database/database.module';

@Module({
	imports: [DatabaseModule],
	controllers: [UsersController],
	providers: [UsersService, UsersRepository],
})
export class UsersModule {}
