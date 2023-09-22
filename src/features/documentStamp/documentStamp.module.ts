import { Module } from '@nestjs/common';
import { DocumentStampController } from 'src/api/documentStamp/documentStamp.controller';
import { DocumentStampService } from 'src/api/documentStamp/documentStamp.service';
import { EndpointService } from 'src/api/endpoint/endpoint.service';


@Module({
  imports: [], 
  controllers: [DocumentStampController],
  providers: [DocumentStampService, EndpointService],
})
export class DocumentStampModule {}
