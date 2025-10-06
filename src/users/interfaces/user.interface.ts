export interface User {
	id: number;
	email: string;
	name: string;
	avatar_url?: string;
	password?: string;
	created_at: Date;
	updated_at: Date;
}

export interface CreateUserDto {
	name: string;
	email: string;
	password: string;
}

export interface UpdateUserDto {
	email?: string;
	name?: string;
	avatar_url?: string;
	password?: string;
}
