import { Module } from '@nestjs/common';
import { EndpointController } from '../../api/endpoint/endpoint.controller';
import { EndpointService } from '../../api/endpoint/endpoint.service'; 

@Module({
  controllers: [EndpointController],
  providers: [EndpointService],
})
export class EndpointModule {}
