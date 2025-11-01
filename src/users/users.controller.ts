import { Body, Controller, Delete, Get, Param, Patch, Post } from '@nestjs/common';
import { UsersService } from './users.service';
import { CreateUserDto, UpdateUserDto } from './interfaces/user.interface';
import { UserEntity } from './entities/user.entity';
import { ApiOperation, ApiResponse } from '@nestjs/swagger';

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Post()
  // documenting response type for Swagger
  @ApiResponse({ status: 201, type: UserEntity })
  @ApiResponse({ status: 500, description: 'Internal Server Error' })
  @ApiOperation({ summary: 'Crea un nuevo usuario' })
  createUser(@Body() user: CreateUserDto) {
    return this.usersService.createUser(user);
  }

  @Get()
  // documenting response type for Swagger
  @ApiOperation({ summary: 'Retorna todos los usuarios' })
  @ApiResponse({status: 200, type: [UserEntity] })
  @ApiResponse({ status: 500, description: 'Internal Server Error' })
  getAllUsers() {
    return this.usersService.getAllUsers();
  }

  @Get('/:id')
  @ApiOperation({ summary: 'Retorna un usuario por ID' })
  @ApiResponse({ status: 200, type: UserEntity })
  @ApiResponse({ status: 500, description: 'Internal Server Error' })
  getUserById(@Param('id') id: string) {
    return this.usersService.getUserById(Number(id));
  }



  @Patch('/:id')
  @ApiOperation({ summary: 'Actualiza un usuario por ID' })
  @ApiResponse({ status: 200, type: UserEntity })
  @ApiResponse({ status: 500, description: 'Internal Server Error' })
  updateUser(@Param('id') id: string, @Body() userData: UpdateUserDto) {
    return this.usersService.updateUser(Number(id), userData);
  }

  @Delete('/:id')
  @ApiOperation({ summary: 'Elimina un usuario por ID' })
  @ApiResponse({ status: 200, description: "User deleted successfully" })
  @ApiResponse({ status: 500, description: 'Internal Server Error' })
  deleteUser(@Param('id') id: string) {
    return this.usersService.deleteUser(Number(id));
  }

  // auth endpoints moved to AuthModule
}
