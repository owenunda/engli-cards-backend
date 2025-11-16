import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { envConfig } from './config/envConfig';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { ValidationPipe } from '@nestjs/common';

async function bootstrap() {
    try {
        const app = await NestFactory.create(AppModule);
        const env = envConfig();

        console.log('🚀 Iniciando servidor EngliCards... - main.ts:12');
        console.log(`📡 Puerto configurado: ${env.server_port} - main.ts:13`);

        // activar validación global de DTOs
        app.useGlobalPipes(new ValidationPipe({
            whitelist: true,
            transform: true,
            forbidNonWhitelisted: true,
            transformOptions: {
                enableImplicitConversion: true,
            },
        }));
        console.log('✅ Tubería de validación global activada - main.ts:19');

        // configurar Swagger
        const config = new DocumentBuilder()
            .setTitle('EngliCards API')
            .setDescription('API para la aplicación EngliCards')
            .setVersion('1.0')
            .addTag('englicards')
            .build();
        
        const document = SwaggerModule.createDocument(app, config);
        SwaggerModule.setup('api/docs', app, document);
        console.log('📚 Documentación Swagger configurada en /api/docs - main.ts:31');

        // Configurar CORS
        const isDev = env.node_env === 'development';
        let allowedOrigins: string[] = [];

        if (isDev) {
            // En desarrollo, permitir cualquier origen (útil para React Native, emuladores y Expo)
            app.enableCors({
                origin: true,
                credentials: true,
                methods: ['GET', 'HEAD', 'PUT', 'PATCH', 'POST', 'DELETE', 'OPTIONS'],
                allowedHeaders: ['Content-Type', 'Authorization'],
            });
        } else {
            // Lista blanca para producción
            allowedOrigins = [
                ...((env.frontend_urls && Array.isArray(env.frontend_urls)) ? env.frontend_urls : []),
            ];

            app.enableCors({
                origin: (origin, callback) => {
                    console.log(`🔍 CORS: Verificando origen: ${origin} - main.ts:53`);
                    
                    if (!origin) {
                        // Postman, apps móviles, etc.
                        return callback(null, true);
                    }

                    if (allowedOrigins.includes(origin)) {
                        return callback(null, true);
                    }

                    return callback(new Error(`CORS: origen no permitido: ${origin}`), false);
                },
                credentials: true,
            });
        }

        await app.listen(env.server_port, '0.0.0.0');
        
        console.log('✅ Servidor iniciado correctamente - main.ts:72');
        console.log(`🔗 Servidor corriendo en: http://localhost:${env.server_port} - main.ts:73`);
        console.log('📝 Presiona Ctrl+C para detener el servidor - main.ts:74');
        
    } catch (error) {
        console.error('❌ Error durante el arranque del servidor: - main.ts:77', error);
        throw error;
    }
}

bootstrap().catch((error) => {
    console.error('❌ Error crítico al iniciar el servidor: - main.ts:83', error);
    process.exit(1);
});