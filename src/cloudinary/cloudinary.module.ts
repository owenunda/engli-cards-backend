import { Module } from '@nestjs/common';
import { CloudinaryService } from './cloudinary.service';
import { CloudinaryController } from './cloudinary.controller';
import { CloudinaryProvider } from './cloudinary.provider';
import { UsersModule } from 'src/users/users.module';

@Module({
    imports: [UsersModule],
    controllers: [CloudinaryController],
    providers: [CloudinaryService, CloudinaryProvider],
    exports: [CloudinaryService],
})
export class CloudinaryModule {}
