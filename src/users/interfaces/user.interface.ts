import { ApiProperty, PartialType } from "@nestjs/swagger";
import { IsEmail, IsNotEmpty, IsOptional, IsString, MinLength } from "class-validator";
export class User {
	id: number;
	@ApiProperty({required: true})
	email: string;
	@ApiProperty({required: true})
	name: string;
	@ApiProperty({required: false})
	avatar_url?: string;
	password?: string;
	created_at: Date;
	updated_at: Date;
}

export class CreateUserDto {
	@ApiProperty({required: true})
	@IsString()
	@MinLength(3)
	name: string;

	
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

export class UpdateUserDto extends PartialType(User) {}
