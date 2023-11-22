import { Module } from '@nestjs/common';
import { DocumentStampController } from 'src/api/documentStamp/documentStamp.controller';
import { DocumentStampService } from 'src/api/documentStamp/documentStamp.service';
import { EndpointService } from 'src/api/endpoint/endpoint.service';
import { MongooseModule } from '@nestjs/mongoose';
import { Certificate, CertificateSchema } from '../certificates/certificate.schema';
import { AccountUnlockService } from 'src/configs/blockchain/blockchain.service';
import { BlockchainProvider } from 'src/configs/blockchain/blockchain.provider';


@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Certificate.name, schema: CertificateSchema },
    ]),
  ], 
  controllers: [DocumentStampController],
  providers: [DocumentStampService, EndpointService,AccountUnlockService,BlockchainProvider],
  exports: [DocumentStampService],
})
export class DocumentStampModule {}
