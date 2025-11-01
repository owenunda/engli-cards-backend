import { Body, Controller, Post } from '@nestjs/common';
import { AuthService } from './auth.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { ApiOperation, ApiResponse } from '@nestjs/swagger';
import { UserEntity } from 'src/users/entities/user.entity';
import { LoginEntity } from './entities/login.entity';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  @ApiOperation({ summary: 'Registrar un nuevo usuario' })
  @ApiResponse({ status: 201, description: 'User registered successfully.', type: UserEntity })
  @ApiResponse({ status: 400, description: 'Bad Request.' })
  @ApiResponse({ status: 500, description: 'Internal Server Error.' })
  register(@Body() body: RegisterDto) {
    return  this.authService.register(body);
  }

  @Post('login')
  @ApiOperation({ summary: 'Iniciar sesión de un usuario' })
  @ApiResponse({ status: 200, description: 'User logged in successfully.', type: LoginEntity})
  @ApiResponse({ status: 401, description: 'Unauthorized.' })
  @ApiResponse({ status: 500, description: 'Internal Server Error.' })
  login(@Body() body: LoginDto) {
    return this.authService.login(body);
  }
}
