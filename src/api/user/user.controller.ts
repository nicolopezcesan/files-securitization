import { Controller, Post, Body, BadRequestException, Get, InternalServerErrorException  } from '@nestjs/common';
import { ApiBadRequestResponse, ApiBody, ApiResponse, ApiTags } from '@nestjs/swagger';
import { CreateUserProvider } from 'src/features/user/application/create-user/create-user.provider';
import { CreateUserDto } from 'src/features/user/domain/user.dto';
import { GetAllUsersProvider } from 'src/features/user/application/get-all-users/get-all-users.provider';



@ApiTags('Admin')
@Controller('users')
export class UserController {
  constructor(
    private readonly createUserProvider: CreateUserProvider,
    private readonly getAllUsersProvider: GetAllUsersProvider,
    ) {}

  @Post('create-user')  
  @ApiResponse({ status: 201, description: 'Usuario creado exitosamente' })
  @ApiBadRequestResponse({ description: 'Error al crear el usuario' })
  async createUser(@Body() createUserDto: CreateUserDto) {
    try {
      const user = await this.createUserProvider.createUser(createUserDto);
      return { message: 'Usuario creado exitosamente', user };
    } catch (error) {
      throw new BadRequestException('Error al crear el usuario');
    }
  }

  @Get('all-users') 
  @ApiResponse({ status: 200, description: 'Lista de todos los usuarios' })
  async getAllUsers() {
    try {
      const users = await this.getAllUsersProvider.getAllUsers();
      return { users };
    } catch (error) {
      throw new BadRequestException('Error al obtener la lista de usuarios');
    }
  }


}