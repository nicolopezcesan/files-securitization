import { Controller, Post, Body, Get, Param, Res } from '@nestjs/common';
import { EndpointService } from './endpoint.service';
import PDFDocument from 'pdfkit';

@Controller('endpoint')
export class EndpointController {
  constructor(private readonly endpointService: EndpointService) {}

  @Post('send')
  async storeData(@Body() body: any) {
    const transactionHash = await this.endpointService.storeData(body);
    const sha256Hash = this.endpointService.calculateSHA256(body);
    return { sha256Hash, transactionHash };
  }

  @Get('infostamp/:hash')
  async getDecodedTransactionData(@Param('hash') hash: string) {
    const decodedTransactionData = await this.endpointService.getDecodedTransactionData(hash);
    return { decodedTransactionData };
  }

  @Get('data/:hash')
  async getData0FromDecodedTransaction(@Param('hash') hash: string) {
    const data0 = await this.endpointService.getData0FromDecodedTransaction(hash);
    return data0;
  }

  @Get('acuse/:hash')
  async generateAcuse(@Param('hash') hash: string, @Res() res): Promise<void> {
    try {
      // Obtén la información que necesitas para generar el acuse
      const decodedTransactionData = await this.endpointService.getDecodedTransactionData(hash);
      const data0 = await this.endpointService.getData0FromDecodedTransaction(hash);

      // Calcula el timestamp actual en milisegundos
      const timestamp = Date.now();

      // Formatea la fecha actual en una cadena legible
      const fechaConsulta = new Date(timestamp).toLocaleString();

      // Genera el contenido del archivo de acuse en formato de texto
      const acuseContent = `Comprobante de autenticación.\n----------------------------------------------------------\n
      Securitizado en Inmuta el día ${new Date(timestamp).toISOString()} \n
      Transacción Hash: ${hash}
      \n
      Información del Bloque: ${JSON.stringify(decodedTransactionData)} \n
      ----------------------------------------------------------\n
      Para auditar el bloque ingresar el transactionHash en el siguiente link:
      \n
      ----------------------------------------------------------\n
      Fecha de Consulta: ${fechaConsulta}\n\n`;

      res.setHeader('Content-Type', 'text/plain');
      res.setHeader('Content-Disposition', `attachment; filename=acuse_${hash}.txt`);

      res.send(acuseContent);
    } catch (error) {
      console.error('Error al generar el acuse:', error);
      res.status(500).send('Error al generar el acuse');
    }
  }

  @Get('deploy-contract')
  async deployContract(@Res() res): Promise<void> {
    try {
      const contractAddress = await this.endpointService.deployContract();

      res.send(contractAddress);
    } catch (error) {
      console.error('Error al desplegar el contrato:', error);
      res.status(500).send('Error al desplegar el contrato');
    }
  }

  @Get('unlock-account')
  async unlockAccount(@Res() res): Promise<void> {
    try {
      const result = await this.endpointService.unlockAccount();

      res.send(result);
    } catch (error) {
      console.error('Error al desbloquear la cuenta:', error);
      res.status(500).send('Error al desbloquear la cuenta');
    }
  }
}
