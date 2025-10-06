import { Injectable } from '@nestjs/common';
import { DatabaseService } from '../../database/database.service';
import { CreateUserDto, User } from '../interfaces/user.interface';

@Injectable()
export class UsersRepository {
	constructor(private readonly databaseService: DatabaseService) {}

	async getAllUsers(): Promise<User[]> {
		try {
			const query = `
				SELECT id, email, name, avatar_url created_at, updated_at 
				FROM users`;
			const result = await this.databaseService.query(query);
			return result.rows;	
		} catch (error) {
			console.error('Error al obtener los usuarios: - users.repository.ts:17', error);
			return [];
		}
	}

	async getUserById(id: Number): Promise<User> {
		try {
			const query = 'SELECT id, email, name, avatar_url created_at, updated_at FROM users WHERE id = $1'
			const result = await this.databaseService.query(query, [id])
			return result.rows[0]
		} catch (error) {
			console.error('Error al obtener al usuario - users.repository.ts:28')
			throw error
		}
	}
	
	async createUser(user: CreateUserDto): Promise<User> {
		try {
			const query = `INSERT INTO users(name, email, password) VALUES($1, $2, $3) RETURNING id, name, email, avatar_url created_at, updated_at`;
			const result = await this.databaseService.query(query, [user.name, user.email, user.password]);
			return result.rows[0];
		} catch (error) {
			console.error('Error al crear el usuario: - users.repository.ts:39', error);
			throw error;
		}
	} 

}
