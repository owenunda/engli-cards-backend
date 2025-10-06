import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { Pool, PoolClient } from 'pg';
import { envConfig } from '../config/envConfig';

@Injectable()
export class DatabaseService implements OnModuleInit, OnModuleDestroy {
	private pool: Pool;

	async onModuleInit() {
		const config = envConfig();
		this.pool = new Pool(config);

		// Probar la conexión
		try {
			const client = await this.pool.connect();
			console.log('✅ Conexión a PostgreSQL establecida correctamente - database.service.ts:16');
			client.release();
		} catch (error) {
			console.error('❌ Error al conectar con PostgreSQL: - database.service.ts:19', error);
			throw error;
		}
	}

	async onModuleDestroy() {
		if (this.pool) {
			await this.pool.end();
			console.log('🔌 Conexión a PostgreSQL cerrada - database.service.ts:27');
		}
	}

	async getClient(): Promise<PoolClient> {
		return await this.pool.connect();
	}

	async query(text: string, params?: any[]): Promise<any> {
		const client = await this.getClient();
		try {
			const result = await client.query(text, params);
			return result;
		} finally {
			client.release();
		}
	}

	async transaction<T>(callback: (client: PoolClient) => Promise<T>): Promise<T> {
		const client = await this.getClient();
		try {
			await client.query('BEGIN');
			const result = await callback(client);
			await client.query('COMMIT');
			return result;
		} catch (error) {
			await client.query('ROLLBACK');
			throw error;
		} finally {
			client.release();
		}
	}
}
