import { Inject, Injectable } from '@nestjs/common';
import { CLOUDINARY } from './cloudinary.provider';
import type { CloudinaryV2 } from './cloudinary.provider';

@Injectable()
export class CloudinaryService {
    constructor(
        @Inject(CLOUDINARY) private readonly cloudinary: CloudinaryV2,
    ) {}

    // sube una imagen a Cloudinary
    async uploadImage(file: Express.Multer.File) {
        return await this.cloudinary.uploader.upload(file.path, {
            folder: 'engli-cards',
        });
    }
}
