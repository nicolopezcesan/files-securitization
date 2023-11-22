
import { Module } from '@nestjs/common';
import { CreateUserProvider } from './application/create-user/create-user.provider';
import { UserController } from 'src/api/user/user.controller';
import { GetAllUsersProvider } from './application/get-all-users/get-all-users.provider';
import { MongooseModule } from '@nestjs/mongoose';
import { ConfigService } from '@nestjs/config';
import { UserModel, UserSchema } from './infraestructure/user.interface';



@Module({
    controllers: [UserController],
    providers: [CreateUserProvider, GetAllUsersProvider],
    imports: [MongooseModule.forRootAsync({
        inject: [ConfigService],
        useFactory: async (configService: ConfigService) => ({
          uri: configService.get<string>('MONGODB_URI'),
        }),
      }),
      MongooseModule.forFeature([
        {
          name: UserModel.modelName,
          schema: UserSchema,
        },
      ]),],        
    
})
export class UserModule {}
