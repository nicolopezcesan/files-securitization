import { Module } from '@nestjs/common';
import { EndpointService } from 'src/api/endpoint/endpoint.service';
import { IpfsController } from 'src/api/ipfs/ipfs.controller';
import {  IpfsService } from 'src/api/ipfs/ipfs.service';

@Module({
  controllers: [IpfsController],
  providers: [IpfsService, EndpointService],
})
export class IPFSModule {}
