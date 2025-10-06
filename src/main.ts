import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { envConfig } from './config/envConfig';


async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const env = envConfig();

  // Configurar CORS según FRONTEND_URLS (coma-separadas) o permitir localhost básico
  const origins = env.frontend_urls.length > 0 ? env.frontend_urls : ['http://localhost:3000'];
  app.enableCors({
    origin: (origin, callback) => {
      // Permitir peticiones sin origin (por ejemplo Postman)
      if (!origin) return callback(null, true);
      if (origins.includes(origin)) return callback(null, true);
      return callback(new Error('CORS: origen no permitido'), false);
    },
    credentials: true,
  });
  await app.listen(env.server_port);
}
bootstrap();
