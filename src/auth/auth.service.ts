import { Injectable, BadRequestException, UnauthorizedException } from '@nestjs/common';
import { UsersRepository } from '../users/repository/users.repository';
import { RegisterDto } from './dto/register.dto';
import { envConfig } from '../config/envConfig';
import * as bcrypt from 'bcryptjs';
import * as jwt from 'jsonwebtoken';
import { LoginDto } from './dto/login.dto';

@Injectable()
export class AuthService {
  constructor(private readonly usersRepository: UsersRepository) {}

  async register(UserDto: RegisterDto) {
    const existing = await this.usersRepository.getUserByEmail(UserDto.email);
    if (existing) throw new BadRequestException('User already exists');

    const salt = await bcrypt.genSalt(10);
    const hashed = await bcrypt.hash(UserDto.password, salt);

    const user = await this.usersRepository.createUser({ name: UserDto.name, email: UserDto.email, password: hashed });
    delete user.password;
    return user;
  }

  async login(userDto: LoginDto) {
    const user = await this.usersRepository.getUserByEmail(userDto.email);
    
    if (!user) throw new UnauthorizedException('Invalid credentials');

    const match = await bcrypt.compare(userDto.password, user.password);
    if (!match) throw new UnauthorizedException('Invalid credentials');

    const token = jwt.sign({ sub: user.id, name: user.name }, envConfig().jwt_secret, { expiresIn: '1h' });
    delete user.password;
    return { user, token };
  }
}
