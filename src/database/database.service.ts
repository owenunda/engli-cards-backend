import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { Pool, PoolClient } from 'pg';
import { envConfig } from '../config/envConfig';

@Injectable()
export class DatabaseService implements OnModuleInit, OnModuleDestroy {
    private pool: Pool;

    constructor() {
        const env = envConfig();

        // Configuración del pool usando solo las variables disponibles en envConfig
        const poolConfig = {
            host: env.DB_HOST,
            port: Number(env.DB_PORT),
            user: env.DB_USER,
            password: env.DB_PASSWORD,
            database: env.DB_NAME,
            connectionTimeoutMillis: 5000,
        };

        this.pool = new Pool(poolConfig);
    }

    async onModuleInit() {
        try {
            console.log('🔌 Conectando a la base de datos... - database.service.ts:27');
            // Intento de conexión para validar credenciales
            const client = await this.pool.connect();
            client.release();
            console.log('✅ Conexión a DB exitosa - database.service.ts:31');
        } catch (error) {
            console.error('❌ Error al conectar con PostgreSQL: - database.service.ts:33', error);
            throw error;
        }

        // 🔁 Keep alive cada 60 s
        setInterval(async () => {
            try {
                const client = await this.pool.connect();
                await client.query('SELECT 1');
                client.release();
            } catch (e) {
                console.error('❌ Error en keepalive de PostgreSQL: - database.service.ts:44', e);
            }
        }, 60000);
    }

    async onModuleDestroy() {
        if (this.pool) {
            await this.pool.end();
            console.log('🔌 Conexión a PostgreSQL cerrada - database.service.ts:52');
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
