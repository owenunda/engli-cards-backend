import { config } from 'dotenv';
config();

const env = process.env;

export const envConfig = () => {
	return {
		// Database
		DB_HOST: env.DB_HOST,
		DB_PORT: env.DB_PORT,
		DB_USER: env.DB_USER,
		DB_PASSWORD: env.DB_PASSWORD,
		DB_NAME: env.DB_NAME,

		// Server
		server_port: parseInt(env.PORT || '3000'),
		jwt_secret: env.JWT_SECRET || 'changeme',
		frontend_urls: (env.FRONTEND_URLS || '')
			.split(',')
			.map((s) => s.trim())
			.filter(Boolean),
	};
};
