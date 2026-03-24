import { Injectable, BadRequestException, UnauthorizedException } from '@nestjs/common';
import { UsersRepository } from '../users/repository/users.repository';
import { RegisterDto } from './dto/register.dto';
import { envConfig } from '../config/envConfig';
import * as bcrypt from 'bcryptjs';
import * as jwt from 'jsonwebtoken';
import { LoginDto } from './dto/login.dto';

import { RedisService } from '../database/redis.service';
import { EmailService } from './email.service';

@Injectable()
export class AuthService {
  constructor(
    private readonly usersRepository: UsersRepository,
    private readonly redisService: RedisService,
    private readonly emailService: EmailService,
  ) {}

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

  async forgotPassword(email: string) {
    const user = await this.usersRepository.getUserByEmail(email);
    if (!user) throw new BadRequestException('Usuario no encontrado');

    const otp = Math.floor(1000 + Math.random() * 9000).toString();
    
    await this.redisService.setOtp(email, otp, 300); // 5 minutos
    await this.redisService.resetAttempts(email);

    await this.emailService.sendOtpEmail(email, otp);

    return { message: 'Código enviado al correo' };
  }

  async verifyOtp(email: string, otp: string) {
    const attempts = await this.redisService.getAttempts(email);
    if (attempts >= 3) {
      throw new BadRequestException('Has excedido el número de intentos. Solicita un nuevo código.');
    }

    const savedOtp = await this.redisService.getOtp(email);
    if (!savedOtp) {
      throw new BadRequestException('El código ha expirado o no es válido');
    }

    if (savedOtp !== otp) {
      await this.redisService.incrementAttempts(email);
      const remaining = 3 - (attempts + 1);
      throw new BadRequestException(`Código incorrecto. Te quedan ${remaining} intentos.`);
    }

    // OTP correcto
    await this.redisService.deleteOtp(email);
    await this.redisService.resetAttempts(email);

    // Generar token temporal para el reset
    const resetToken = jwt.sign(
      { email, type: 'password_reset' },
      envConfig().jwt_secret,
      { expiresIn: '10m' }
    );

    return { resetToken };
  }

  async resetPassword(resetToken: string, newPassword: Buffer | string) {
    try {
      const payload = jwt.verify(resetToken, envConfig().jwt_secret) as any;
      
      if (payload.type !== 'password_reset') {
        throw new BadRequestException('Token inválido');
      }

      const user = await this.usersRepository.getUserByEmail(payload.email);
      if (!user) throw new BadRequestException('Usuario no encontrado');

      const salt = await bcrypt.genSalt(10);
      const hashed = await bcrypt.hash(newPassword as string, salt);

      await this.usersRepository.updatePassword(user.id, hashed);

      return { message: 'Contraseña actualizada correctamente' };
    } catch (error) {
      if (error instanceof jwt.TokenExpiredError) {
        throw new BadRequestException('El token ha expirado. Inicia el proceso de nuevo.');
      }
      throw new BadRequestException('Token de restablecimiento inválido');
    }
  }
}
