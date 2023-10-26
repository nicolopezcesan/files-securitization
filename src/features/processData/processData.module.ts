import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { CertificadosController } from 'src/api/processData/processData.controller';
import { DocumentStampModule } from '../documentStamp/documentStamp.module';

@Module({
  imports: [HttpModule, DocumentStampModule],
  controllers: [CertificadosController],
  
})
export class ProcessDataModule {}
