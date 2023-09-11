import { Module } from '@nestjs/common';
import { StampController } from '../../api/stamp/stamp.controller';
import { StampService } from 'src/api/stamp/stamp.service';

@Module({
  controllers: [StampController],
  providers: [StampService],
})
export class StampModule {}
