import { Injectable, Logger, InternalServerErrorException, NotFoundException } from '@nestjs/common';
import { DatabaseService } from '../../database/database.service';
import { CreateUserDto, UpdateUserDto, User } from '../interfaces/user.interface';
import { UserEntity } from '../entities/user.entity';

@Injectable()
export class UsersRepository {
	private readonly logger = new Logger(UsersRepository.name);
	constructor(private readonly databaseService: DatabaseService) {}

	async getAllUsers(): Promise<UserEntity[]> {
		try {
			const query = `
				SELECT id, email, name, avatar_url, role, created_at, updated_at 
				FROM users`;
			const result = await this.databaseService.query(query);
			return result.rows;	
		} catch (error) {
			this.logger.error('Error al obtener usuarios', error);
			return [];
		}
	}

	async getUserById(id: Number): Promise<UserEntity> {
		try {
			const query = 'SELECT id, email, name, avatar_url, role, onboarding_completed, created_at, updated_at FROM users WHERE id = $1'
			const result = await this.databaseService.query(query, [id])
			return result.rows[0]
		} catch (error) {
			this.logger.error(`Error al obtener usuario id=${id}`, error);
			throw new InternalServerErrorException('Error al obtener el usuario');
		}
	}
	// necesario para el login
	async getUserByEmail(email: string): Promise<any> {
		try {
			const query = `SELECT id, name, email, password, avatar_url, role, onboarding_completed, created_at, updated_at FROM users WHERE email = $1 LIMIT 1`;
			const result = await this.databaseService.query(query, [email]);
			return result.rows[0];
		} catch (error) {
			this.logger.error('Error al obtener usuario por email', error);
			throw new InternalServerErrorException('Error al obtener el usuario');
		}
	}
	

	// no usar USER ENTITY AQUI PARA EVITAR INCLUIR EL PASSWORD
	async createUser(user: CreateUserDto): Promise<User> {
		try {
			const query = `INSERT INTO users(name, email, password, role) VALUES($1, $2, $3, $4) RETURNING id, name, email, avatar_url, role, onboarding_completed, created_at, updated_at`;
			const result = await this.databaseService.query(query, [user.name, user.email, user.password, user.role || 'student']);
			return result.rows[0];
		} catch (error) {
			this.logger.error('Error al crear usuario', error);
			throw new InternalServerErrorException('Error al crear el usuario');
		}
	}

	async updateUser(id: number, userData: UpdateUserDto): Promise<UserEntity> {
		try {
			// Filtrar solo los campos que tienen valor
			const fieldsToUpdate = Object.keys(userData).filter(key => userData[key] !== undefined);
			
			if (fieldsToUpdate.length === 0) {
				throw new Error('No hay campos para actualizar');
			}

			// Construir dinámicamente la query SET
			const setClause = fieldsToUpdate.map((field, index) => `${field} = $${index + 2}`).join(', ');
			const query = `UPDATE users SET ${setClause} WHERE id = $1 RETURNING id, name, email, avatar_url, role, created_at, updated_at`;
			
			// Preparar los valores para la query
			const values = [id, ...fieldsToUpdate.map(field => userData[field])];
			
			const result = await this.databaseService.query(query, values);
			
			if (result.rows.length === 0) {
				throw new NotFoundException(`Usuario con id ${id} no encontrado`);
			}

			return result.rows[0];
		} catch (error) {
			if (error instanceof NotFoundException) throw error;
			this.logger.error(`Error al actualizar usuario id=${id}`, error);
			throw new InternalServerErrorException('Error al actualizar el usuario');
		}
	}

	async deleteUser(id: number): Promise<object> {
		try {
			
			const query = `DELETE FROM users WHERE id = $1`;
			const result = await this.databaseService.query(query, [id]);
			if (result.rowCount === 0) {
				return { message: `User with id ${id} not found.` };
			}

			return { message: `User with id ${id} has been deleted.` };
		} catch (error) {
			this.logger.error(`Error al eliminar usuario id=${id}`, error);
			throw new InternalServerErrorException('Error al eliminar el usuario');
		}
	}

	async updatePassword(id: number, hashed: string): Promise<void> {
		try {
			const query = `UPDATE users SET password = $1 WHERE id = $2`;
			await this.databaseService.query(query, [hashed, id]);
		} catch (error) {
			this.logger.error(`Error al actualizar contraseña usuario id=${id}`, error);
			throw new InternalServerErrorException('Error al actualizar la contraseña');
		}
	}
}
