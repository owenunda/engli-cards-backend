import { ApiProperty, PartialType } from "@nestjs/swagger";
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
	name: string;
	@ApiProperty({required: true})
	email: string;
	@ApiProperty({required: true})
	password: string;
}

export class UpdateUserDto extends PartialType(User) {}
