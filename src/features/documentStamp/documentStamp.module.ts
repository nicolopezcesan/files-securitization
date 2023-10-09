import { Module } from '@nestjs/common';
import { DocumentStampController } from 'src/api/documentStamp/documentStamp.controller';
import { DocumentStampService } from 'src/api/documentStamp/documentStamp.service';
import { EndpointService } from 'src/api/endpoint/endpoint.service';
import { DocumentStamp, DocumentStampSchema } from './documentStamp.schema'; 
import { MongooseModule } from '@nestjs/mongoose';
import { Certificate, CertificateSchema } from '../certificates/certificate.schema';


@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Certificate.name, schema: CertificateSchema },
    ]),
  ], 
  controllers: [DocumentStampController],
  providers: [DocumentStampService, EndpointService],
  exports: [DocumentStampService],
})
export class DocumentStampModule {}
