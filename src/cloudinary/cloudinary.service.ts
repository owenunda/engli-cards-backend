import { Inject, Injectable, BadRequestException } from '@nestjs/common';
import { CLOUDINARY } from './cloudinary.provider';
import type { CloudinaryV2 } from './cloudinary.provider';
import type { UploadApiResponse } from 'cloudinary';

@Injectable()
export class CloudinaryService {
    constructor(
        @Inject(CLOUDINARY) private readonly cloudinary: CloudinaryV2,
    ) {}

    // sube una imagen a Cloudinary
    async uploadImage(file: Express.Multer.File): Promise<UploadApiResponse> {
        if (!file) {
            throw new BadRequestException('Archivo no recibido');
        }

        // Si Multer usa disco: usar file.path
        if ((file as any).path) {
            return await this.cloudinary.uploader.upload((file as any).path, {
                folder: 'engli-cards-profiles',
                resource_type: 'image',
            });
        }

        // Si Multer usa memoria: usar upload_stream con file.buffer
        return await new Promise<UploadApiResponse>((resolve, reject) => {
            const stream = this.cloudinary.uploader.upload_stream(
                {
                    folder: 'engli-cards-profiles',
                    resource_type: 'image',
                },
                (error, result) => {
                    if (error) return reject(error);
                    return resolve(result as UploadApiResponse);
                },
            );
            stream.end(file.buffer);
        });
    }
}
