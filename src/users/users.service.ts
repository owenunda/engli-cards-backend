import { Injectable } from '@nestjs/common';
import { UsersRepository } from './repositories/users.repository';
import { CreateUserDto } from './interfaces/user.interface';

@Injectable()
export class UsersService {

  constructor(private readonly usersRepository: UsersRepository) {}

  getAllUsers() {
    return this.usersRepository.getAllUsers();
  }

  createUser(user: CreateUserDto) {
    return this.usersRepository.createUser(user);
  }
}
