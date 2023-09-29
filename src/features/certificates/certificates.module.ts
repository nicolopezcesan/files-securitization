
import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { DocumentStamp, DocumentStampSchema } from '../documentStamp/documentStamp.schema';
import { CertificateService } from 'src/api/certificate/certificate.service';
import { CertificateController } from 'src/api/certificate/certificate.controller';
import { CertificateRepository } from './certificate.repository';

@Module({
  
  controllers: [CertificateController],
  providers: [CertificateService, CertificateRepository],
  imports: [
    MongooseModule.forFeature([
      { name: DocumentStamp.name, schema: DocumentStampSchema }, 
    ]),
  ],
  exports: [CertificateService],
})
export class CertificateModule {}
