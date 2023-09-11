import { Module } from '@nestjs/common';
import { StatusController } from '../../api/status/status.controller';
import { StatusService } from 'src/api/status/status.service';

@Module({
  controllers: [StatusController],
  providers: [StatusService],
})
export class statusModule {}
