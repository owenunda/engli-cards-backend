import { config } from 'dotenv';
config();

export interface envConfigInterface {
	host: string;
	db_port: number;
	database: string;
	user: string;
	password: string;
	server_port: number;
}

const env = process.env;

export const envConfig = (): envConfigInterface => {
	return {
		host: env.DB_HOST || 'localhost',
		db_port: parseInt(env.DB_PORT || '5432'),
		database: env.DB_NAME || 'engli_cards',
		user: env.DB_USER || 'postgres',
		password: env.DB_PASSWORD || 'password',
		server_port: parseInt(env.PORT || '3000')
	};
};
