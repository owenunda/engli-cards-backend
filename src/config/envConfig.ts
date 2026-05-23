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
		jwt_secret: (() => {
			if (!env.JWT_SECRET) {
				if (env.NODE_ENV === 'production') {
					throw new Error('JWT_SECRET environment variable is required in production');
				}
				console.warn('⚠️  JWT_SECRET no está definido. Usando valor inseguro solo para desarrollo. Define JWT_SECRET en .env');
				return 'changeme-dev-only';
			}
			return env.JWT_SECRET;
		})(),
		frontend_urls: (env.FRONTEND_URLS || '')
			.split(',')
			.map((s) => s.trim())
			.filter(Boolean),
			node_env: env.NODE_ENV || 'development',
			cloudinary: {
				cloud_name: env.CLOUDINARY_NAME || '',
				cloudinary_key: env.CLOUDINARY_KEY || '',
				cloudinary_secret: env.CLOUDINARY_SECRET || '',
			}
	};
};
