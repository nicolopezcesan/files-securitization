import { Module } from '@nestjs/common';
import { EndpointController } from '../../api/endpoint/endpoint.controller';
import { EndpointService } from '../../api/endpoint/endpoint.service'; 
import { AccountUnlockService } from 'src/configs/blockchain/blockchain.service';
import { BlockchainProvider } from 'src/configs/blockchain/blockchain.provider';

@Module({
  controllers: [EndpointController],
  providers: [EndpointService, AccountUnlockService,BlockchainProvider],
})
export class EndpointModule {}
