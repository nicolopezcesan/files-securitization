import { Module } from "@nestjs/common";
import { ContractController } from "src/api/contract/contract.controller";
import { ContractService } from "src/api/contract/contract.service";
import { BlockchainProvider } from "src/configs/blockchain/blockchain.provider";

@Module({
  imports: [], 
  controllers: [ContractController],
  providers: [ContractService, BlockchainProvider],
  exports: [],
})
export class ContractModule {}
