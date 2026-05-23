import { Body, Controller, Post } from '@nestjs/common';
import { Throttle, SkipThrottle } from '@nestjs/throttler';
import { AuthService } from './auth.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { ApiOperation, ApiResponse } from '@nestjs/swagger';
import { UserEntity } from '../users/entities/user.entity';
import { LoginEntity } from './entities/login.entity';
import { ForgotPasswordDto, VerifyOtpDto, ResetPasswordDto } from './dto/password-reset.dto';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  @Throttle({ default: { ttl: 60000, limit: 5 } }) // 5 registros por minuto por IP
  @ApiOperation({ summary: 'Registrar un nuevo usuario' })
  @ApiResponse({ status: 201, description: 'User registered successfully.', type: UserEntity })
  @ApiResponse({ status: 400, description: 'Bad Request.' })
  @ApiResponse({ status: 500, description: 'Internal Server Error.' })
  register(@Body() body: RegisterDto) {
    return this.authService.register(body);
  }

  @Post('login')
  @Throttle({ default: { ttl: 60000, limit: 10 } }) // 10 intentos por minuto por IP
  @ApiOperation({ summary: 'Iniciar sesión de un usuario' })
  @ApiResponse({ status: 200, description: 'User logged in successfully.', type: LoginEntity })
  @ApiResponse({ status: 401, description: 'Unauthorized.' })
  @ApiResponse({ status: 500, description: 'Internal Server Error.' })
  login(@Body() body: LoginDto) {
    return this.authService.login(body);
  }

  @Post('forgot-password')
  @Throttle({ default: { ttl: 900000, limit: 3 } }) // 3 solicitudes por 15 minutos por IP
  @ApiOperation({ summary: 'Solicitar recuperación de contraseña (envía OTP)' })
  @ApiResponse({ status: 200, description: 'Código enviado al correo' })
  forgotPassword(@Body() body: ForgotPasswordDto) {
    return this.authService.forgotPassword(body.email);
  }

  @Post('verify-otp')
  @Throttle({ default: { ttl: 300000, limit: 10 } }) // 10 intentos por 5 minutos por IP (Redis ya limita a 3 por código)
  @ApiOperation({ summary: 'Verificar el código OTP' })
  @ApiResponse({ status: 200, description: 'Código verificado, devuelve resetToken' })
  verifyOtp(@Body() body: VerifyOtpDto) {
    return this.authService.verifyOtp(body.email, body.otp);
  }

  @Post('reset-password')
  @Throttle({ default: { ttl: 300000, limit: 5 } }) // 5 intentos por 5 minutos por IP
  @ApiOperation({ summary: 'Restablecer la contraseña usando el resetToken' })
  @ApiResponse({ status: 200, description: 'Contraseña actualizada correctamente' })
  resetPassword(@Body() body: ResetPasswordDto) {
    return this.authService.resetPassword(body.resetToken, body.newPassword);
  }
}
