import { Controller, Get, Param, Post, Res, UploadedFile, UseInterceptors } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { Multer } from 'multer';
import { Response } from 'express';
import { DocumentStampService } from './documentStamp.service';


@Controller('documentStamp')
export class DocumentStampController {
  constructor(private readonly documentStampService: DocumentStampService) {}

  @Post('document')
  @UseInterceptors(FileInterceptor('file'))
  async stampDocument(@UploadedFile() file: Multer.File) {
    try {
      if (!file) {
        throw new Error('No se proporcionó un archivo.');
      }

      // Extraer el número del nombre del archivo
      const fileName = file.originalname;
      const match = fileName.match(/^(.*?)\s+(\d+)/);
      let certificado: string | null = null; // 
      let nameAndSurname: string | null = null;
      if (match) {
        nameAndSurname = match[1];
        certificado = match[2];
      }

      // Llama al servicio para procesar el archivo y guardar en Ganache
      const result = await this.documentStampService.stampDocument({ file, certificado });

      return result;
    } catch (error) {
      console.error('Error al procesar el archivo:', error);
      throw new Error('Error al procesar el archivo.');
    }
  }


  @Get('document/:fileHash')
  async getDocumentTxt(@Param('fileHash') fileHash: string, @Res() res: Response) {
    try {
      const txtContent = await this.documentStampService.getTxtContent(fileHash);

      // Configura los encabezados de respuesta para indicar que estás enviando un archivo .txt
      res.setHeader('Content-Type', 'text/plain');
      res.attachment(`${fileHash}.txt`);

      // Envía el contenido del archivo .txt como respuesta
      res.send(txtContent);
    } catch (error) {
      console.error('Error al obtener el archivo .txt:', error);
      throw new Error('Error al obtener el archivo .txt.');
    }
  }
}
