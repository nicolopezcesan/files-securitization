import { Module } from '@nestjs/common';
import { DocumentStampController } from 'src/api/documentStamp/documentStamp.controller';
import { DocumentStampService } from 'src/api/documentStamp/documentStamp.service';
import { EndpointService } from 'src/api/endpoint/endpoint.service';
import { DocumentStamp, DocumentStampSchema } from './documentStamp.schema'; 
import { MongooseModule } from '@nestjs/mongoose';


@Module({
  imports: [
    MongooseModule.forFeature([
      { name: DocumentStamp.name, schema: DocumentStampSchema },
    ]),
  ], 
  controllers: [DocumentStampController],
  providers: [DocumentStampService, EndpointService],
  exports: [DocumentStampService],
})
export class DocumentStampModule {}
