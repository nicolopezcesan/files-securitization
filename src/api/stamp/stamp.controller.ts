import { Controller, Post, UploadedFile, UseInterceptors } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { Multer } from 'multer';
import { StampService } from './stamp.service';

@Controller('timestamp')
export class StampController {
  constructor(private readonly stampService: StampService) {}

  @Post('document')
  @UseInterceptors(FileInterceptor('file'))
  async timestampDocument(@UploadedFile() file: Multer.File) {
    const originalFileName = file.originalname;
    return this.stampService.timestampDocument(file.buffer, originalFileName);
  }


  
}
  
