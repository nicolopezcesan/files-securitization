import { Controller, Post, UploadedFile, UseInterceptors } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express/multer';
import { Multer } from 'multer';
import { StatusService } from './status.service';

@Controller('document')
export class StatusController {
  constructor(private readonly statusService: StatusService) {}

  @Post('info')
  @UseInterceptors(FileInterceptor('file'))
  async getTimestampInfo(@UploadedFile() otsFile: Multer.File) {
    return this.statusService.getTimestampInfo(otsFile);
  }
}
