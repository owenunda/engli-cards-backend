import { Body, Controller, Delete, Get, Param, Patch, Post, Req, UseGuards } from '@nestjs/common';
import { UsersService } from './users.service';
import { CreateUserDto, UpdateUserDto } from './interfaces/user.interface';
import { UserEntity } from './entities/user.entity';
import { ApiOperation, ApiResponse } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/jwt.guard';

@Controller('users')
@UseGuards(JwtAuthGuard)
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Post()
  @ApiResponse({ status: 201, type: UserEntity })
  @ApiResponse({ status: 500, description: 'Internal Server Error' })
  @ApiOperation({ summary: 'Crea un nuevo usuario' })
  createUser(@Body() user: CreateUserDto) {
    return this.usersService.createUser(user);
  }

  @Get()
  @ApiOperation({ summary: 'Retorna todos los usuarios' })
  @ApiResponse({ status: 200, type: [UserEntity] })
  @ApiResponse({ status: 500, description: 'Internal Server Error' })
  getAllUsers() {
    return this.usersService.getAllUsers();
  }

  @Get('/:id')
  @ApiOperation({ summary: 'Retorna un usuario por ID' })
  @ApiResponse({ status: 200, type: UserEntity })
  @ApiResponse({ status: 500, description: 'Internal Server Error' })
  getUserById(@Param('id') id: string, @Req() req: any) {
    const requesterId = Number(req.user?.sub);
    const targetId = Number(id);
    if (requesterId !== targetId) {
      // Allow users to only fetch their own profile
      return this.usersService.getUserById(requesterId);
    }
    return this.usersService.getUserById(targetId);
  }

  @Patch('/:id')
  @ApiOperation({ summary: 'Actualiza un usuario por ID' })
  @ApiResponse({ status: 200, type: UserEntity })
  @ApiResponse({ status: 500, description: 'Internal Server Error' })
  updateUser(@Param('id') id: string, @Body() userData: UpdateUserDto, @Req() req: any) {
    const userId = Number(req.user?.sub);
    return this.usersService.updateUser(userId, userData);
  }

  @Delete('/:id')
  @ApiOperation({ summary: 'Elimina un usuario por ID' })
  @ApiResponse({ status: 200, description: 'User deleted successfully' })
  @ApiResponse({ status: 500, description: 'Internal Server Error' })
  deleteUser(@Param('id') id: string, @Req() req: any) {
    const userId = Number(req.user?.sub);
    return this.usersService.deleteUser(userId);
  }
}
