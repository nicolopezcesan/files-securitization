import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { ProcessDataController } from 'src/api/processData/processData.controller';
import { DocumentStampModule } from '../documentStamp/documentStamp.module';
import { ProcessDataService } from 'src/api/processData/processData.service';

@Module({
  imports: [HttpModule, DocumentStampModule],
  controllers: [ProcessDataController],
  providers: [ProcessDataService],
  
})
export class ProcessDataModule {}
