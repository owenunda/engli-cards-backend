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
            whitelist: true
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
        let allowedOrigins: string[] = [];
        
        if (env.node_env === 'development') {
            // En desarrollo, incluir localhost
            allowedOrigins = [
                'http://localhost:3000',
                'http://localhost:3001', 
                'http://localhost:5173',
                'http://127.0.0.1:3000',
                'http://127.0.0.1:5173'
            ];
        }
        
        // Agregar URLs del frontend desde variables de entorno
        if (env.frontend_urls && Array.isArray(env.frontend_urls)) {
            allowedOrigins.push(...env.frontend_urls);
        }

        console.log(`🌐 CORS configurado para orígenes: - main.ts:52`, allowedOrigins);
        console.log(`🔧 Entorno actual: ${env.node_env} - main.ts:53`);

        app.enableCors({
            origin: (origin, callback) => {
                console.log(`🔍 CORS: Verificando origen: ${origin} - main.ts:57`);
                
                // Permitir requests sin origin (Postman, apps móviles, etc.)
                if (!origin) {
                    console.log(`✅ CORS: Request sin origin permitido - main.ts:61`);
                    return callback(null, true);
                }

                // Verificar si el origin está en la lista permitida
                if (allowedOrigins.includes(origin)) {
                    console.log(`✅ CORS: Origen permitido: ${origin} - main.ts:67`);
                    return callback(null, true);
                }

                // En desarrollo, ser más permisivo con localhost
                if (env.node_env === 'development' && origin.includes('localhost')) {
                    console.log(`⚠️ CORS: Localhost permitido en desarrollo: ${origin} - main.ts:73`);
                    return callback(null, true);
                }

                // Rechazar orígenes no permitidos
                console.log(`❌ CORS: Origen no permitido: ${origin} - main.ts:78`);
                return callback(new Error(`CORS: origen no permitido: ${origin}`), false);
            },
            credentials: true,
        });

        await app.listen(env.server_port, '0.0.0.0');
        
        console.log('✅ Servidor iniciado correctamente - main.ts:86');
        console.log(`🔗 Servidor corriendo en: http://localhost:${env.server_port} - main.ts:87`);
        console.log('📝 Presiona Ctrl+C para detener el servidor - main.ts:88');
        
    } catch (error) {
        console.error('❌ Error durante el arranque del servidor: - main.ts:91', error);
        throw error;
    }
}

bootstrap().catch((error) => {
    console.error('❌ Error crítico al iniciar el servidor: - main.ts:97', error);
    process.exit(1);
});