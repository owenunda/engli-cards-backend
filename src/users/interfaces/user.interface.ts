import { ApiProperty } from "@nestjs/swagger";
export interface User {
	id: number;
	email: string;
	name: string;
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

export interface UpdateUserDto {
	email?: string;
	name?: string;
	avatar_url?: string;
	password?: string;
}
