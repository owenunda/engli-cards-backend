import { Controller, Post, Req, UploadedFile, UseInterceptors } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { CloudinaryService } from './cloudinary.service';
import { UsersService } from '../users/users.service'

@Controller('cloudinary')
export class CloudinaryController {

  constructor(private readonly cloudinaryService: CloudinaryService,
              private readonly usersService: UsersService) {}

  @Post('upload-profile-image')
  @UseInterceptors(FileInterceptor('avatar'))
  async uploadProfile(
    @UploadedFile() file: Express.Multer.File,
    @Req() req,
  ){
    const result = await this.cloudinaryService.uploadImage(file);

    const userId = req.user.id;

    await this.usersService.updateUserProfileImage(userId, result.secure_url);

    return {
      message: 'Profile image uploaded successfully',
      url: result.secure_url,
    }

  }

}
