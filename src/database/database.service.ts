import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { Pool, PoolClient } from 'pg';
import { envConfig } from '../config/envConfig';

@Injectable()
export class DatabaseService implements OnModuleInit, OnModuleDestroy {
  private pool: Pool;

  async onModuleInit() {
    const config = envConfig();

    // 🧩 Forzamos SSL seguro (Supabase requiere esto)
    this.pool = new Pool({
      connectionString: config.connectionString,
      ssl: {
        rejectUnauthorized: false, // evita error SELF_SIGNED_CERT_IN_CHAIN
      },
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 10000,
      max: 5,
    });

    // 🧠 Escucha errores inesperados del pool
    this.pool.on('error', (err) => {
      console.error('⚠️ Error inesperado en el pool de PostgreSQL: - database.service.ts:25', err);
    });

    try {
      const client = await this.pool.connect();
      console.log('✅ Conexión a PostgreSQL establecida correctamente - database.service.ts:30');
      client.release();
    } catch (error) {
      console.error('❌ Error al conectar con PostgreSQL: - database.service.ts:33', error);
      throw error;
    }

    // 🔁 Keep alive cada 60 s
    setInterval(async () => {
      try {
        await this.pool.query('SELECT 1');
      } catch (e) {
        console.error('❌ Error en keepalive - database.service.ts:42', e);
      }
    }, 60000);
  }

  async onModuleDestroy() {
    if (this.pool) {
      await this.pool.end();
      console.log('🔌 Conexión a PostgreSQL cerrada - database.service.ts:50');
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
