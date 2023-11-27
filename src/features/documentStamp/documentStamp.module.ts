import { Module } from '@nestjs/common';
import { DocumentStampController } from 'src/api/documentStamp/documentStamp.controller';
import { DocumentStampService } from 'src/api/documentStamp/documentStamp.service';
import { MongooseModule } from '@nestjs/mongoose';
import { Certificate, CertificateSchema } from '../certificates/certificate.schema';
import { AccountUnlockService } from 'src/configs/blockchain/blockchain.service';
import { BlockchainProvider } from 'src/configs/blockchain/blockchain.provider';
import { DocumentStampProcessProvider } from 'src/api/documentStamp/documentStamp-process.provider';
import { ApiKeyAuthProvider } from 'src/api/auth/api-key-auth.provider';
import { UserModel, UserSchema } from '../user/infraestructure/user.interface';


@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Certificate.name, schema: CertificateSchema },
      { name: UserModel.modelName, schema: UserSchema },

    ]),
  ], 
  controllers: [DocumentStampController],
  providers: [DocumentStampService,AccountUnlockService,BlockchainProvider,DocumentStampProcessProvider, ApiKeyAuthProvider],
  exports: [],
})
export class DocumentStampModule {}
