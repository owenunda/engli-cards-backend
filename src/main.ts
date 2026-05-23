import { NestFactory, HttpAdapterHost } from '@nestjs/core';
import { AppModule } from './app.module';
import { envConfig } from './config/envConfig';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { ValidationPipe, Logger } from '@nestjs/common';

const logger = new Logger('Bootstrap');

async function bootstrap() {
    try {
        const app = await NestFactory.create(AppModule, { bufferLogs: true });
        const env = envConfig();

        logger.log(`Puerto configurado: ${env.server_port}`);

        app.useGlobalPipes(new ValidationPipe({
            whitelist: true,
            transform: true,
            forbidNonWhitelisted: true,
            transformOptions: { enableImplicitConversion: true },
        }));
        logger.log('Tubería de validación global activada');

        const swaggerConfig = new DocumentBuilder()
            .setTitle('EngliCards API')
            .setDescription('API para la aplicación EngliCards')
            .setVersion('1.0')
            .addBearerAuth()
            .addTag('englicards')
            .build();

        const document = SwaggerModule.createDocument(app, swaggerConfig);
        SwaggerModule.setup('api/docs', app, document);
        logger.log('Documentación Swagger disponible en /api/docs');

        const isDev = env.node_env === 'development';

        if (isDev) {
            app.enableCors({
                origin: true,
                credentials: true,
                methods: ['GET', 'HEAD', 'PUT', 'PATCH', 'POST', 'DELETE', 'OPTIONS'],
                allowedHeaders: ['Content-Type', 'Authorization'],
            });
        } else {
            const allowedOrigins = env.frontend_urls ?? [];
            app.enableCors({
                origin: (origin, callback) => {
                    if (!origin) return callback(null, true); // apps móviles / Postman
                    if (allowedOrigins.includes(origin)) return callback(null, true);
                    logger.warn(`CORS: origen rechazado: ${origin}`);
                    return callback(new Error(`CORS: origen no permitido: ${origin}`), false);
                },
                credentials: true,
            });
        }

        await app.listen(env.server_port, '0.0.0.0');
        logger.log(`Servidor corriendo en http://localhost:${env.server_port}`);

    } catch (error) {
        logger.error('Error durante el arranque del servidor', error);
        throw error;
    }
}

bootstrap().catch((error) => {
    logger.error('Error crítico al iniciar el servidor', error);
    process.exit(1);
});
