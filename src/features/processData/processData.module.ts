import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { ProcessDataController } from 'src/api/processData/processData.controller';
import { ProcessDataService } from 'src/api/processData/processData.service';

@Module({
  imports: [HttpModule],
  controllers: [ProcessDataController],
  providers: [ProcessDataService],
  
})
export class ProcessDataModule {}
