import { Injectable } from '@nestjs/common';
import { DatabaseService } from '../../database/database.service';
import { CreateUserDto, User, UpdateUserDto } from '../interfaces/user.interface';

@Injectable()
export class UsersRepository {
	constructor(private readonly databaseService: DatabaseService) {}

	async getAllUsers(): Promise<User[]> {
		try {
			const query = `
				SELECT id, email, name, avatar_url, created_at, updated_at 
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
			const query = 'SELECT id, email, name, avatar_url, created_at, updated_at FROM users WHERE id = $1'
			const result = await this.databaseService.query(query, [id])
			return result.rows[0]
		} catch (error) {
			console.error('Error al obtener al usuario - users.repository.ts:28')
			throw error
		}
	}

	async getUserByEmail(email: string): Promise<any> {
		try {
			const query = `SELECT id, name, email, password, avatar_url, created_at, updated_at FROM users WHERE email = $1 LIMIT 1`;
			const result = await this.databaseService.query(query, [email]);
			return result.rows[0];
		} catch (error) {
			console.error('Error al obtener usuario por email - users.repository.ts:39', error);
			throw error;
		}
	}
	
	async createUser(user: CreateUserDto): Promise<User> {
		try {
			const query = `INSERT INTO users(name, email, password) VALUES($1, $2, $3) RETURNING id, name, email, avatar_url, created_at, updated_at`;
			const result = await this.databaseService.query(query, [user.name, user.email, user.password]);
			return result.rows[0];
		} catch (error) {
			console.error('Error al crear el usuario: - users.repository.ts:50', error);
			throw error;
		}
	}

	async updateUser(id: number, userData: UpdateUserDto): Promise<User> {
		try {
			// Filtrar solo los campos que tienen valor
			const fieldsToUpdate = Object.keys(userData).filter(key => userData[key] !== undefined);
			
			if (fieldsToUpdate.length === 0) {
				throw new Error('No hay campos para actualizar');
			}

			// Construir dinámicamente la query SET
			const setClause = fieldsToUpdate.map((field, index) => `${field} = $${index + 2}`).join(', ');
			const query = `UPDATE users SET ${setClause} WHERE id = $1 RETURNING id, name, email, avatar_url, created_at, updated_at`;
			
			// Preparar los valores para la query
			const values = [id, ...fieldsToUpdate.map(field => userData[field])];
			
			const result = await this.databaseService.query(query, values);
			
			if (result.rows.length === 0) {
				throw new Error(`Usuario con id ${id} no encontrado`);
			}
			
			return result.rows[0];
		} catch (error) {
			console.error('Error al actualizar el usuario: - users.repository.ts:79', error);
			throw error;
		}
	}
}
