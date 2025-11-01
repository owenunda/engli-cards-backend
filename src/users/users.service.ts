import { Injectable, BadRequestException, UnauthorizedException } from '@nestjs/common';
import { UsersRepository } from './repository/users.repository';
import { CreateUserDto, UpdateUserDto } from './interfaces/user.interface';
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

  updateUser(id: number, userData: UpdateUserDto) {
    return this.usersRepository.updateUser(id, userData);
  }

  deleteUser(id: number) {
    return this.usersRepository.deleteUser(id);
  }

  // auth operations moved to AuthModule
}
