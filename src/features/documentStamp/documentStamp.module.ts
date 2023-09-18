// documentStamp/documentStamp.module.ts

import { Module } from '@nestjs/common';
import { MulterModule } from '@nestjs/platform-express';
import { DocumentStampController } from 'src/api/document/documentStamp.controller';
import { DocumentStampService } from 'src/api/document/documentStamp.service';
import { ConfigModule } from '@nestjs/config'; 
import { EndpointService } from 'src/api/endpoint/endpoint.service';


@Module({
  imports: [], 
  controllers: [DocumentStampController],
  providers: [DocumentStampService, EndpointService],
})
export class DocumentStampModule {}
