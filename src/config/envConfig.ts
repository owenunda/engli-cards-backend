import { config } from 'dotenv';
config();

export interface envConfigInterface {
	connectionString?: string;
	ssl?: { require: boolean; rejectUnauthorized: boolean };
	server_port: number;
	jwt_secret: string;
	frontend_urls: string[];
}

const env = process.env;

export const envConfig = (): envConfigInterface => {
	return {
		connectionString: env.DATABASE_URL,
		ssl: {
			require: true,
			rejectUnauthorized: false, // esto permite certificados autofirmados
		},
		server_port: parseInt(env.PORT || '3000'),
		jwt_secret: env.JWT_SECRET || 'changeme',
		frontend_urls: (env.FRONTEND_URLS || '')
			.split(',')
			.map((s) => s.trim())
			.filter(Boolean),
	};
};
