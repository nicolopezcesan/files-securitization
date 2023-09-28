import { Controller, Post, Body, Get, Param, Res } from '@nestjs/common';
import { EndpointService } from './endpoint.service';
import { ApiBody, ApiOperation } from '@nestjs/swagger';
import * as PDFDocument from 'pdfkit'; 
import * as rp from 'request-promise';

@Controller('endpoint')
export class EndpointController {
  constructor(private readonly endpointService: EndpointService) {}

  @Post('send')
  @ApiOperation({ summary: 'JSON', description: 'Para almacenar JSON' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        entrada: {
          type: 'string',
        },        
      },
    },
  })
  async storeData(@Body() body: any) {

    await this.endpointService.unlockAccount();
    try {
      const transactionHash = await this.endpointService.storeData(body);
      const sha256Hash = this.endpointService.calculateSHA256(body);
      return { sha256Hash, transactionHash };
    }
    finally {
      await this.endpointService.lockAccount();
    }
  }

  @Get('infostamp/:hash')
  
  @ApiOperation({summary: 'JSON', description: 'Consultar información del bloque' })

  async getDecodedTransactionData(@Param('hash') hash: string) {
    const decodedTransactionData = await this.endpointService.getDecodedTransactionData(hash);
    return { decodedTransactionData };
  }

  @Get('data/:hash')
  @ApiOperation({summary: 'JSON', description: 'Obtener la información almacenada en JSON' })

  async getData0FromDecodedTransaction(@Param('hash') hash: string) {
    const data0 = await this.endpointService.getData0FromDecodedTransaction(hash);
    return data0;
  }

  @Get('acuse/:hash')
  @ApiOperation({summary: '.PDF', description: 'Comprobante de operación .INMUTA' })

  async generateAcuse(@Param('hash') hash: string, @Res() res): Promise<void> {
    try {
      // Información Acuse
      const decodedTransactionData = await this.endpointService.getDecodedTransactionData(hash);
      const data0 = await this.endpointService.getData0FromDecodedTransaction(hash);
      const datahash = data0.timestamp;
      const fecha = new Date(Number(datahash)); 
      const dataSecuritizacion = fecha.toISOString();

      const timestamp = Date.now();
      const fechaConsulta = new Date(timestamp).toLocaleString();

      // Genera el contenido del archivo de acuse en formato de texto
      const acuseContent = `Comprobante de Operación\n----------------------------------------------------------\n
      Securitizado en Inmuta el día ${new Date(timestamp).toISOString()} \n
      Transacción Hash: ${hash}
      \n
      Información del Bloque: ${JSON.stringify(decodedTransactionData)} \n
    
      ----------------------------------------------------------\n
      Fecha de Consulta: ${fechaConsulta}\n\n`;


      // Obtener el logo de Inmuta
      const logoUrl = 'https://raw.githubusercontent.com/pedrotapia2416/img/main/logo%20(2).png';
      const logoResponse = await rp.get({ url: logoUrl, encoding: null });
      // Obtener las dimensiones del logo
      const logoDimensions = (logoResponse);

      // Crear un nuevo documento PDF
      const doc = new PDFDocument();
      const pdfFileName = `acuse_${hash}.pdf`;

      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename=${pdfFileName}`);

      doc.pipe(res);

    doc.image(logoResponse, { width: 50, height: 50 }).fill('#EAEAEA');

    doc.font('Helvetica-Bold').fontSize(14).fillColor('#0511F2').text('COMPROBANTE DE OPERACIÓN', { align: 'center' });
    doc.moveDown();

    doc.font('Helvetica').fontSize(12).fillColor('black');
    doc.text(`Securitizado en Inmuta el día ${dataSecuritizacion}`, { align: 'right' });
    doc.moveDown();
    doc.moveDown();
      
    doc.text(`Transacción Hash: ${hash}`);
    doc.moveDown();
    doc.moveDown();

    doc.text('Información del Bloque:');
    doc.text(JSON.stringify(decodedTransactionData, null, 2));
    doc.moveDown();
    doc.moveDown();
    doc.moveDown();

    doc.text(`Fecha de Consulta: ${new Date().toLocaleString()}`);


      // Finaliza el documento PDF
      doc.end();
    } catch (error) {
      console.error('Error al generar el acuse:', error);
      res.status(500).send('Error al generar el acuse');
    } 
  }

  // @Get('deploy-contract')
  // async deployContract(@Res() res): Promise<void> {
  //   try {
  //     const contractAddress = await this.endpointService.deployContract();

  //     res.send(contractAddress);
  //   } catch (error) {
  //     console.error('Error al desplegar el contrato:', error);
  //     res.status(500).send('Error al desplegar el contrato');
  //   }
  // }

  // @Get('unlock-account')
  // async unlockAccount(@Res() res): Promise<void> {
  //   try {
  //     const result = await this.endpointService.unlockAccount();
  //     res.send(result);
  //   } catch (error) {
  //     console.error('Error al desbloquear la cuenta:', error);
  //     res.status(500).send('Error al desbloquear la cuenta');
  //   }
  // }

  // @Post('lock-account')
  // async lockAccount() {
  //   try {
  //     await this.endpointService.lockAccount();
  //     return { message: 'Cuenta bloqueada exitosamente' };
  //   } catch (error) {
  //     console.error('Error al bloquear la cuenta:', error);
  //     return { error: 'Error al bloquear la cuenta' };
  //   }
  // }
  
}
