import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { envConfig } from './config/envConfig';


async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  await app.listen(envConfig().server_port);
}
bootstrap();
