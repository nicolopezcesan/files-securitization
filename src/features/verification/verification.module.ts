import { Module } from '@nestjs/common';
import { VerificationController } from '../../api/verification/verification.controller';
import { VerificationService } from 'src/api/verification/verification.service';

@Module({
  controllers: [VerificationController],
  providers: [VerificationService],
})
export class VerificationModule {}
