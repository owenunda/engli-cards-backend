import { Injectable, BadRequestException, UnauthorizedException } from '@nestjs/common';
import { UsersRepository } from './repositories/users.repository';
import { CreateUserDto } from './interfaces/user.interface';
import * as bcrypt from 'bcryptjs';

@Injectable()
export class UsersService {

  constructor(private readonly usersRepository: UsersRepository) {}

  getAllUsers() {
    return this.usersRepository.getAllUsers();
  }

  createUser(user: CreateUserDto) {
    return this.usersRepository.createUser(user);
  }

  getUserById(id: number) {
    return this.usersRepository.getUserById(id);
  }

  // auth operations moved to AuthModule
}
