import { Module } from '@nestjs/common';
import { IpfsController } from 'src/api/ipfs/ipfs.controller';
import {  IpfsService } from 'src/api/ipfs/ipfs.service';

@Module({
  controllers: [IpfsController],
  providers: [IpfsService],
})
export class IPFSModule {}
