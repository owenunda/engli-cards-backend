import { IsEmail, IsNotEmpty, IsString, MinLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
export class RegisterDto {
	@ApiProperty({ required: true })
	@IsString()
	@MinLength(3)
	name: string;	

	@ApiProperty({ required: true })
	@IsEmail()
	@IsNotEmpty()
	email: string;

	@ApiProperty({ required: true })
	@IsString()
	@MinLength(4)
	@IsNotEmpty()
	password: string;
}
