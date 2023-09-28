import { Controller, Get, Param, Post, Res, UploadedFile, UseInterceptors } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { Multer } from 'multer';
import { Response } from 'express';
import { DocumentStampService } from './documentStamp.service';
import { ApiBody, ApiConsumes, ApiOperation, ApiTags } from '@nestjs/swagger';
import { EndpointService } from '../endpoint/endpoint.service'; 

@Controller('documentStamp')
export class DocumentStampController {
  constructor(
    private readonly documentStampService: DocumentStampService,
    private readonly endpointService: EndpointService,
    ) {}
    
  @ApiTags(' Pdf.')

  @Post('document')
  @ApiOperation({summary: '.PDF', description: 'Securitizar documento en la blockchain' })

  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: {
          type: 'string',
          format: 'binary',
        },
      },
    },
  })
  @UseInterceptors(FileInterceptor('file'))
  async stampDocument(@UploadedFile() file: Multer.File) {
    await this.endpointService.unlockAccount();
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
    } finally {
      await this.endpointService.lockAccount(); 
    }
  }

  
}
