import { Body, Controller, Post, Req, UploadedFile, UseInterceptors } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { CloudinaryService } from './cloudinary.service';
import { UsersService } from '../users/users.service'

@Controller('cloudinary')
export class CloudinaryController {

  constructor(private readonly cloudinaryService: CloudinaryService,
    private readonly usersService: UsersService) { }

  @Post('upload-profile')
  @UseInterceptors(FileInterceptor('avatar'))
  async uploadProfile(
    @UploadedFile() file: Express.Multer.File,
    @Body('userId') userId: number,
  ) {
    if (!userId) return { message: 'UserId requerido' };
    
    const img = await this.cloudinaryService.uploadImage(file);

    await this.usersService.updateUserProfileImage(userId, img.secure_url);

    return { message: 'Imagen de perfil subida con éxito', imageUrl: img.secure_url };

  }

}
