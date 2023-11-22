
import { Module } from '@nestjs/common';
import { ReportProvider } from './application/report.provider';
import { ReportController } from 'src/api/reports/reports.controller';
import { BlockchainProvider } from 'src/configs/blockchain/blockchain.provider';

@Module({
    controllers: [ReportController],
    providers: [ReportProvider, BlockchainProvider],
})
export class ReportModule {}
