import { Module } from '@nestjs/common';
import { EndpointController } from '../../api/endpoint/endpoint.controller';
import { EndpointService } from '../../api/endpoint/endpoint.service'; 
import { AccountUnlockService } from 'src/configs/blockchain/blockchain.service';
import { BlockchainProvider } from 'src/configs/blockchain/blockchain.provider';
import { ApiKeyAuthProvider } from 'src/api/auth/api-key-auth.provider';
import { MongooseModule } from '@nestjs/mongoose';
import { UserModel, UserSchema } from '../user/infraestructure/user.interface';
import { ConfigService } from '@nestjs/config';

@Module({
  controllers: [EndpointController],
  providers: [EndpointService, AccountUnlockService, BlockchainProvider, ApiKeyAuthProvider],
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
export class EndpointModule {}
