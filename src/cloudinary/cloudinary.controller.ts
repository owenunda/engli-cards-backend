import { Body, Controller, Post, UploadedFile, UseInterceptors, BadRequestException, ParseIntPipe } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { CloudinaryService } from './cloudinary.service';
import { UsersService } from '../users/users.service'
import { ApiBadRequestResponse, ApiBody, ApiConsumes, ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';

@ApiTags('cloudinary')
@Controller('cloudinary')
export class CloudinaryController {

    constructor(private readonly cloudinaryService: CloudinaryService,
        private readonly usersService: UsersService) { }

    @Post('upload-profile')
    @UseInterceptors(FileInterceptor('avatar'))
    @ApiOperation({
        summary: 'Subir imagen de perfil',
        description: 'Sube una imagen a Cloudinary y actualiza el avatar del usuario.',
    })
    @ApiConsumes('multipart/form-data')
    @ApiBody({
        description: 'Formulario con la imagen y el ID de usuario',
        required: true,
        schema: {
            type: 'object',
            properties: {
                avatar: {
                    type: 'string',
                    format: 'binary',
                    description: 'Archivo de imagen',
                },
                userId: {
                    type: 'integer',
                    example: 123,
                    description: 'ID del usuario a actualizar',
                },
            },
            required: ['avatar', 'userId'],
        },
    })
    @ApiOkResponse({
        description: 'Imagen de perfil subida con éxito',
        schema: {
            type: 'object',
            properties: {
                message: { type: 'string', example: 'Imagen de perfil subida con éxito' },
                imageUrl: { type: 'string', example: 'https://res.cloudinary.com/.../image.jpg' },
            },
        },
    })
    @ApiBadRequestResponse({
        description: 'Parámetros inválidos o faltantes',
        schema: {
            type: 'object',
            properties: {
                message: { type: 'string', example: 'UserId requerido' },
            },
        },
    })
    async uploadProfile(
        @UploadedFile() file: Express.Multer.File,
        @Body('userId', ParseIntPipe) userId: number,
    ) {
        if (!userId) throw new BadRequestException('UserId requerido');
        if (!file) throw new BadRequestException('Archivo no recibido');

        const img = await this.cloudinaryService.uploadImage(file);

        await this.usersService.updateUserProfileImage(userId, img.secure_url);

        return { message: 'Imagen de perfil subida con éxito', imageUrl: img.secure_url };
    }

    @Post('upload-flashcard')
    @UseInterceptors(FileInterceptor('image'))
    @ApiOperation({
        summary: 'Subir imagen para una flashcard',
        description: 'Sube una imagen a Cloudinary (carpeta engli-cards-flashcards) y devuelve la URL para ser usada al crear o actualizar una flashcard.',
    })
    @ApiConsumes('multipart/form-data')
    @ApiBody({
        description: 'Formulario con la imagen de la flashcard',
        required: true,
        schema: {
            type: 'object',
            properties: {
                image: {
                    type: 'string',
                    format: 'binary',
                    description: 'Archivo de imagen',
                },
            },
            required: ['image'],
        },
    })
    @ApiOkResponse({
        description: 'Imagen subida con éxito',
        schema: {
            type: 'object',
            properties: {
                message: { type: 'string', example: 'Imagen subida con éxito' },
                imageUrl: { type: 'string', example: 'https://res.cloudinary.com/.../image.jpg' },
            },
        },
    })
    @ApiBadRequestResponse({
        description: 'Archivo faltante',
        schema: {
            type: 'object',
            properties: {
                message: { type: 'string', example: 'Archivo no recibido' },
            },
        },
    })
    async uploadFlashcardImage(
        @UploadedFile() file: Express.Multer.File,
    ) {
        if (!file) throw new BadRequestException('Archivo no recibido');

        const img = await this.cloudinaryService.uploadFlashcardImage(file);

        return { message: 'Imagen subida con éxito', imageUrl: img.secure_url };
    }
}
