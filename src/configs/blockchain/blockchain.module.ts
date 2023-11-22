
import { Module } from '@nestjs/common';
import { AccountUnlockService } from './blockchain.service';
import { BlockchainProvider } from './blockchain.provider';


@Module({
    imports: [],
    providers: [AccountUnlockService, BlockchainProvider],
    controllers: [],
    exports: [AccountUnlockService, BlockchainProvider],
})
export class BlockchainModule {}
