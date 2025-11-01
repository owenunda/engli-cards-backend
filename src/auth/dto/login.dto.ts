import { ApiProperty } from "@nestjs/swagger";
import { IsEmail, IsNotEmpty, IsString, MinLength } from "class-validator";
	
export class LoginDto {
	@ApiProperty({required: true})
	@IsEmail()
	@IsNotEmpty()
	email: string;

	@ApiProperty({required: true})
	@IsString()
	@MinLength(4)
	@IsNotEmpty()
	password: string;
}
