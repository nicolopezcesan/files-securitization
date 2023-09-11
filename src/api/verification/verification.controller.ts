import { Controller, Post, UploadedFiles, UseInterceptors } from '@nestjs/common';
import { FilesInterceptor } from '@nestjs/platform-express';
import { VerificationService } from './verification.service';
import { Multer } from 'multer';


@Controller('document')
export class VerificationController {
  constructor(private readonly verificationService: VerificationService) {}

  @Post('verify')
  @UseInterceptors(FilesInterceptor('file', 2))
  async getTimestampInfo(@UploadedFiles() files: Multer.File[]) {
    return this.verificationService.verifyTimestamp(files);
  }
}
