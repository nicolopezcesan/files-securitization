import { Controller, Get, Param, Post, Res, UploadedFile, UseInterceptors } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { Multer } from 'multer';
import { DocumentStampService } from './documentStamp.service';
import { ApiBody, ApiConsumes, ApiOperation, ApiTags } from '@nestjs/swagger';
import { EndpointService } from '../endpoint/endpoint.service'; 

import axios from 'axios';
import * as fs from 'fs';
import * as path from 'path';
import { Response } from 'express';

@Controller('documentStamp')
export class DocumentStampController {
  private certificados: string[] = [];
  
  constructor(    
    private readonly documentStampService: DocumentStampService,
    private readonly endpointService: EndpointService,
    ) {}
    
  @ApiTags('.pdf')

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

  @ApiTags('ProcessData')
  @Get(':startDate/:endDate')
  async documentStamp(
    @Param('startDate') startDate: string,
    @Param('endDate') endDate: string,
  ) {
    try {
      // Obtener los certificados
      const certificados = await this.obtenerTramitesCarnetManipulador(startDate, endDate);

      // Procesar los certificados uno por uno
      for (const numeroCertificado of certificados) {
        await this.processCertificado(numeroCertificado);
      }

      return 'Proceso completo';
    } catch (error) {
      throw error;
    }
  }

  private async processCertificado(numeroCertificado: string) {
    try {
      // Descargar el certificado
      const fileName = await this.obtenerCertificadoCarnetManipulador(numeroCertificado);

      // Llama al servicio para procesar el archivo y guardar en Ganache
      const result = await this.documentStampService.stampDocument({
        file: {
          originalname: fileName,
          buffer: fs.readFileSync(path.join('documentsTemp', fileName)),
        },
        certificado: numeroCertificado,
      });

      console.log(`Certificado ${numeroCertificado} procesado:`, result);
    } catch (error) {
      console.error(`Error al procesar el certificado ${numeroCertificado}:`, error);
      throw error;
    }
  }

  private async obtenerTramitesCarnetManipulador(startDate: string, endDate: string): Promise<string[]> {
    try {
      const url = `https://interoperabilidad.cordoba.gob.ar/api/obtenerTramitesCarnetManipulador/${startDate}/${endDate}`;

      // Credenciales
      const username = 'SQR_badi_srl';
      const password = 'iuoERT85dau';

      const response = await axios.get(url, {
        auth: {
          username,
          password,
        },
      });

      return response.data.lista;
    } catch (error) {
      throw error;
    }
  }

  private async obtenerCertificadoCarnetManipulador(numeroCertificado: string): Promise<string> {
    try {
      const username = 'SQR_badi_srl';
      const password = 'iuoERT85dau';

      const url = `https://interoperabilidad.cordoba.gob.ar/api/obtenerCertificadoCarnetManipulador/${numeroCertificado}`;
      const response = await axios.get(url, {
        auth: {
          username,
          password,
        },
        responseType: 'arraybuffer',
        maxContentLength: Infinity, //Test: Para evitar la limitacion del tamaño de archivos.
      });

      if (response.headers['content-type'] === 'application/octet-stream') {
        const fileName = `${numeroCertificado}.pdf`;
        const filePath = path.join('documentsTemp', fileName);
        fs.writeFileSync(filePath, response.data);
        return fileName;
      } else {
        throw new Error(`El certificado ${numeroCertificado} no es un archivo.`);
      }
    } catch (error) {
      throw error;
    }
  }


  
  
}
