import { Provider } from '@nestjs/common';
import { v2 as Cloudinary } from 'cloudinary';
import { envConfig } from 'src/config/envConfig';


export const CLOUDINARY = 'CLOUDINARY';

export const CloudinaryProvider: Provider = {
    provide: CLOUDINARY,
    useFactory: () => {
        const env = envConfig();
        Cloudinary.config({
            cloud_name: env.cloudinary.cloud_name,
            api_key: env.cloudinary.cloudinary_key,
            api_secret: env.cloudinary.cloudinary_secret,
            secure: true,
        });
        return Cloudinary;
    },
};

export type CloudinaryV2 = typeof Cloudinary;
