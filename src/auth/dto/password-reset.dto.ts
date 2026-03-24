import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty } from 'class-validator';

export class ForgotPasswordDto {
  @ApiProperty({ example: 'user@example.com' })
  @IsEmail({}, { message: 'Email inválido' })
  @IsNotEmpty({ message: 'El email es requerido' })
  email: string;
}

export class VerifyOtpDto {
  @ApiProperty({ example: 'user@example.com' })
  @IsEmail({}, { message: 'Email inválido' })
  @IsNotEmpty({ message: 'El email es requerido' })
  email: string;

  @ApiProperty({ example: '1234' })
  @IsNotEmpty({ message: 'El código es requerido' })
  otp: string;
}

export class ResetPasswordDto {
  @ApiProperty()
  @IsNotEmpty({ message: 'El token de recuperación es requerido' })
  resetToken: string;

  @ApiProperty()
  @IsNotEmpty({ message: 'La nueva contraseña es requerida' })
  newPassword: string;
}
