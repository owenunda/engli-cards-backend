import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { envConfig } from './config/envConfig';


async function bootstrap() {
    try {
        const app = await NestFactory.create(AppModule);
        const env = envConfig();

        console.log('🚀 Iniciando servidor EngliCards... - main.ts:11');
        console.log(`📡 Puerto configurado: ${env.server_port} - main.ts:12`);

        // Configurar CORS
        const origins = env.frontend_urls.length > 0 ? env.frontend_urls : ['http://localhost:3000'];
        console.log(`🌐 CORS configurado para orígenes: - main.ts:16`, origins);


        app.enableCors({
            origin: (origin, callback) => {
                if (!origin) return callback(null, true);
                if (origins.includes(origin)) return callback(null, true);
                return callback(new Error('CORS: origen no permitido'), false);
            },
            credentials: true,
        });

        await app.listen(env.server_port, '0.0.0.0');
        
        console.log('✅ Servidor iniciado correctamente - main.ts:30');
        console.log(`🔗 Servidor corriendo en: http://localhost:${env.server_port} - main.ts:31`);
        console.log('📝 Presiona Ctrl+C para detener el servidor - main.ts:32');
        
    } catch (error) {
        console.error('❌ Error durante el arranque del servidor: - main.ts:35', error);
        throw error;
    }
}

bootstrap().catch((error) => {
    console.error('❌ Error crítico al iniciar el servidor: - main.ts:41', error);
    process.exit(1);
});