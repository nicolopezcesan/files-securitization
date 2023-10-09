import { Controller, Post, Body, Get, Param, Res, UseGuards } from '@nestjs/common';
import { EndpointService } from './endpoint.service';
import { AuthGuard } from '../auth/auth.guard';
import { ApiBody, ApiOperation, ApiTags } from '@nestjs/swagger';
import * as PDFDocument from 'pdfkit'; 
import * as rp from 'request-promise';

@Controller('')
export class EndpointController {
  constructor(private readonly endpointService: EndpointService) {}
  
  @ApiTags('.json')
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

  @ApiTags('.json')
  @Get('infostamp/:hash')  
  @ApiOperation({summary: 'JSON', description: 'Consultar información del bloque' })

  async getDecodedTransactionData(@Param('hash') hash: string) {
    const decodedTransactionData = await this.endpointService.getDecodedTransactionData(hash);
    return { decodedTransactionData };
  }

  @ApiTags('.json')
  @Get('data/:hash')
  @ApiOperation({summary: 'JSON', description: 'Obtener la información almacenada en JSON' })
  async getData0FromDecodedTransaction(@Param('hash') hash: string) {
    const data0 = await this.endpointService.getData0FromDecodedTransaction(hash);
    return data0;
  }

  @UseGuards(AuthGuard)
  @ApiTags('.pdf')
  @Get('admin/acuse/:hash')
  @ApiOperation({summary: '.PDF', description: 'Comprobante de operación .INMUTA' })

  async generateAcuse(@Param('hash') hash: string, @Res() res): Promise<void> {
    try {
      // Información Acuse
      const data0 = await this.endpointService.getData0FromDecodedTransaction(hash);
      const datahash = data0.timestampDate;
      const dataSecuritizacion = new Date(datahash).toLocaleString();


      // Obtener el logo de Inmuta
      const logoUrl = 'https://dev-backoffice.inmuta.com/assets/img/image%202.png';
      const logoResponse = await rp.get({ url: logoUrl, encoding: null });
      

      // Crear un nuevo documento PDF
      const doc = new PDFDocument();
      const pdfFileName = `acuse_${hash}.pdf`; 

      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename=${pdfFileName}`);

      doc.pipe(res);
      // Establecer los tamaños de los márgenes en puntos
      const margenSuperior = 220;
      const margenIzquierdo = 50;
      const margenDerecho = 50;
      const margenInferior = 520;

      // Cuadrado transaction hash
      const anchoUtil = doc.page.width - margenIzquierdo - margenDerecho;
      const altoUtil = doc.page.height - margenSuperior - margenInferior;

      // Cuadrado transaction data
      const anchoUtilData = doc.page.width - margenIzquierdo - margenDerecho;
      const altoUtilData = doc.page.height - 100 - 220;

      // Rectangulo data
      doc.rect(margenIzquierdo, margenSuperior, anchoUtilData, altoUtilData).fill('#EAEAEA'); 

      // Rectangulo transaction hash
      doc.rect(margenIzquierdo, margenSuperior, anchoUtil, altoUtil).fill('#0511F2');         
      doc.moveDown();

    doc.image(logoResponse, { width: 110, height: 30 });
    doc.moveDown();
    doc.moveDown();
    

    doc.font('Helvetica-Bold').fontSize(14).fillColor('#0511F2').text('COMPROBANTE DE OPERACIÓN', { align: 'center' });
    doc.moveDown();

    doc.font('Helvetica-Bold').fontSize(12).fillColor('black');
    doc.text(`Securitizado en Inmuta el día ${dataSecuritizacion}`, { align: 'right' });
    doc.font('Helvetica').fontSize(11);
    doc.text(' GMT-0300 (hora estándar de Argentina)', { align: 'right' });
    
    doc.moveDown();
    doc.moveDown();

    doc.fillColor('white')
    doc.text(`Transacción Hash: ${hash}`);
    doc.fillColor('black');
    doc.moveDown();
    doc.moveDown();

    doc.text('Contenido de la transacción:');
    doc.moveDown();
    doc.text(JSON.stringify(data0, null, 2));
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
