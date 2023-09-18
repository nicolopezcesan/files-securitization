import { Controller, Post, UploadedFile, UseInterceptors } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { Multer } from 'multer';
import { DocumentStampService } from './documentStamp.service';

@Controller('documentStamp')
export class DocumentStampController {
  constructor(private readonly documentStampService: DocumentStampService) {}

  @Post('document')
  @UseInterceptors(FileInterceptor('file'))
  async stampDocument(@UploadedFile() file: Multer.File) {
    try {
      const result = await this.documentStampService.stampDocument(file);

      // console.log('Hash de la transacción en la blockchain:', result.transactionHash);
      // console.log('Archivo guardado en:', result.filePath);
      // console.log('SHA256 Hash del archivo:', result.fileHash);
      // console.log('Timestamp Hash:', result.timestampHash);
      // console.log('CID en IPFS:', result.cid);

      return result;
    } catch (error) {
      console.error('Error al procesar el archivo:', error);
      throw new Error('Error al procesar el archivo.');
    }
  }
}
