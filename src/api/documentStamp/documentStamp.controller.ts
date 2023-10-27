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
import { Model } from 'mongoose'; // Importa Model
import { InjectModel } from '@nestjs/mongoose';
import { CertificateDocument, CertificateState } from 'src/features/certificates/certificate.schema';
import { CertificateRepository } from 'src/features/certificates/certificate.repository';

@Controller('documentStamp')
export class DocumentStampController {
  private certificados: string[] = [];
  private certificadosProcesados: string[] = [];
  private certificadosErroneos: string[] = [];
  private readonly certificateRepository: CertificateRepository;
  
  constructor(    
    private readonly documentStampService: DocumentStampService,
    private readonly endpointService: EndpointService,
    @InjectModel('Certificate') private readonly certificateModel: Model<CertificateDocument>, 
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

      // Guardamos en blockchain
      const result = await this.documentStampService.stampDocument({ file, certificado });

      return result;
    } catch (error) {
      console.error('Error al procesar el archivo:', error);
      throw new Error('Error al procesar el archivo.');
    } 
  }

  @ApiTags('ProcessData')
  @Get(':startDate/:endDate')
  async documentStamp(
    @Param('startDate') startDate: string,
    @Param('endDate') endDate: string,
  ) {
    await this.endpointService.unlockAccount();
    try {
      // Obtener los certificados
        const certificados = await this.obtenerTramitesCarnetManipulador(startDate, endDate);

        // Verificar si los certificados están en la base de datos
        const certificadosNoCargados = await this.verificarCertificadosEnDB(certificados);

        // Procesar los certificados uno por uno
        for (const numeroCertificado of certificadosNoCargados) {
          try {
            await this.processCertificado(numeroCertificado);
            this.certificadosProcesados.push(numeroCertificado); // Agregar a la lista de procesados
          } catch (error) {
            this.certificadosErroneos.push(numeroCertificado);
          }
        }

      return {
        mensaje: 'Proceso completo',
        certificadosProcesados: this.certificadosProcesados,
        certificadosErroneos: this.certificadosErroneos,
        certificadosNoCargados, // Agregar los certificados no cargados en la respuesta
        fechaInicio: startDate,
        fechaFinal: endDate,
      };
    } catch (error) {
      throw error;
    }
  }

  private async verificarCertificadosEnDB(certificados: string[]): Promise<string[]> {
    const certificadosEnDB = await this.certificateModel.find({ certificado: { $in: certificados } }).distinct('certificado').exec();
    const certificadosNoCargados = certificados.filter(certificado => !certificadosEnDB.includes(certificado));
    return certificadosNoCargados;
  }

  private async processCertificado(numeroCertificado: string) {
    try {
      // Descargar el certificado
      const fileName = await this.obtenerCertificadoCarnetManipulador(numeroCertificado);

      // Guardar en Blockchain
      const result = await this.documentStampService.stampDocument({
        file: {
          originalname: fileName,
          buffer: fs.readFileSync(path.join('documentsTemp', fileName)),
        },
        certificado: numeroCertificado,
      });

      this.certificadosProcesados.push(numeroCertificado);
      console.log(`Certificado ${numeroCertificado} procesado:`, result);
     

    } catch (error) {
      console.error(`Error al procesar el certificado ${numeroCertificado}:`, error);
      await this.saveCancelledCertificate(numeroCertificado);
      throw error;
    }finally {
      
      
      // Elimina el archivo temporal
        const fileName = `${numeroCertificado}.pdf`;
        const filePath = path.join('documentsTemp', fileName);
        fs.unlinkSync(filePath);
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
      maxContentLength: Infinity, 
    });

    if (response.headers['content-type'] === 'application/octet-stream') {
      if (response.data.length === 0) {
        console.error(`Certificado Obtenido inválido. El certificado ${numeroCertificado} está vacío.`);
        throw new Error('El certificado está vacío.');
      }

      const fileName = `${numeroCertificado}.pdf`;
      const filePath = path.join('documentsTemp', fileName);
      fs.writeFileSync(filePath, response.data);
      return fileName;
    } else {
      throw new Error(`El certificado ${numeroCertificado} no es un archivo.`);
    }
  } catch (error) {
    console.error('Error al obtener certificado de API externa:', error); 
    throw error;
  }
}


  private async saveCancelledCertificate(numeroCertificado: string) {
    const cancelledCertificate = new this.certificateModel({
      status: CertificateState.FAILED,
      certificado: numeroCertificado,
      transactionHash: null,
      fileHash: null,
      timestampDate: null,
      timestampHash: null,
      nameFile:`${numeroCertificado}.pdf`,
      cid: null,
    });

    await cancelledCertificate.save();
  }

  @ApiTags('ProcessData')
  @Get('processFailed')
  async processFailedCertificates() {
    await this.endpointService.unlockAccount();
    try {
      const failedCertificates = await this.certificateModel.find({ status: CertificateState.FAILED }).exec();
      const processedCertificates = [];
      const errors = [];
  
      for (const certificate of failedCertificates) {
        if (!processedCertificates.includes(certificate.certificado)) {
          try {
            const result = await this.processCertificate(certificate.certificado);
            if (result.success) {
              certificate.status = CertificateState.COMPLETED;
            } else {
              certificate.status = CertificateState.FAILED;
            }
            certificate.transactionHash = result.transactionHash;
            certificate.fileHash = result.fileHash;
            certificate.timestampHash = result.timestampHash;
            certificate.nameFile = result.nameFile;
            certificate.cid = result.cid;
            await certificate.deleteOne();
            processedCertificates.push(certificate.certificado);
          } catch (error) {
            errors.push({ certificado: certificate.certificado, error: error.message });
          }
        }
      }
  
      return {
        mensaje: 'Proceso de certificados fallidos completo',
        certificadosProcesados: processedCertificates,
        certificadosConErrores: errors,
        fechaInicio: new Date(),
        fechaFinal: new Date(),
      };
    } catch (error) {
      throw error;
    }
  }

  private async processCertificate(numeroCertificado: string) {
    try {
      // Descargar el certificado
      const fileName = await this.obtenerCertificadoCarnetManipulador(numeroCertificado);
  
      // Guardar en Blockchain
      const result = await this.documentStampService.stampDocument({
        file: {
          originalname: fileName,
          buffer: fs.readFileSync(path.join('documentsTemp', fileName)),
        },
        certificado: numeroCertificado,
      });
  
      // Eliminar el archivo temporal
      const filePath = path.join('documentsTemp', fileName);
      fs.unlinkSync(filePath);
      
  
      return result;
    } catch (error) {
      console.error(`Error al procesar el certificado ${numeroCertificado}:`, error);
      await this.saveCancelledCertificate(numeroCertificado);
      throw error;
    } 
  }

  @ApiTags('ProcessData')
  @Get('deleteAllDuplicateCertificates')
  async deleteAllDuplicateCertificates() {
    try {
      const certificates = await this.certificateModel.find().exec();
      const uniqueCertificados = [];
      const duplicates = [];

      certificates.forEach((certificate) => {
             
        const existingCert = uniqueCertificados.find((c) => c.certificado === certificate.certificado);

        if (existingCert) {
          const existingCertDate = new Date(existingCert.timestampDate);
          const certificateDate = new Date(certificate.timestampDate);

          if (certificateDate < existingCertDate) {
            duplicates.push(existingCert);
            uniqueCertificados.splice(uniqueCertificados.indexOf(existingCert), 1);
            uniqueCertificados.push(certificate);
          } else {
            duplicates.push(certificate);
          }
        } else {
          uniqueCertificados.push(certificate);
        }
      });

      if (duplicates.length > 0) {
        for (const duplicate of duplicates) {
          await this.certificateModel.findByIdAndDelete(duplicate._id).exec();
        }

        return {
          mensaje: 'Todos los certificados duplicados han sido eliminados',
          certificadosEliminados: duplicates,
        };
      } else {
        return {
          mensaje: 'No se encontraron certificados duplicados para eliminar',
          certificadosEliminados: [],
        };
      }
    } catch (error) {
      throw error;
    }
  }

}


