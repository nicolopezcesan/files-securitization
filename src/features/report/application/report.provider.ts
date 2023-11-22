import { Injectable } from '@nestjs/common';
import { BlockchainProvider } from 'src/configs/blockchain/blockchain.provider';
import * as PDFDocument from 'pdfkit'; 
import * as rp from 'request-promise';
import { AccountUnlockService } from 'src/configs/blockchain/blockchain.service';

@Injectable()
export class ReportProvider {
  
  constructor(
    private readonly blockchainProvider: BlockchainProvider,
       
  ) { }

  async generateAcuse(hash: string, res): Promise<void> {
    try {
      // Información Acuse
    const data0 = await this.getData0FromDecodedTransaction(hash);
    const datahash = data0.timestampDate;
    const fecha = new Date(datahash);
    const hora = fecha.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const dataSecuritizacion = `${fecha.toLocaleDateString()} ${hora} `;


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
  doc.text(`Transacción Hash:`);
  doc.text(` ${hash}`);
  doc.fillColor('black');
  doc.moveDown();
  doc.moveDown();
  doc.moveDown();
  doc.text('Contenido de la transacción:');
  doc.moveDown();
  doc.text(JSON.stringify(data0, null, 2));
  doc.moveDown();
  doc.moveDown();
  doc.moveDown();

  doc.text(`Fecha de Consulta: ${new Date().toLocaleString()} `);


    // Finaliza el documento PDF
      doc.end();
    } catch (error) {
      console.error('Error al generar el acuse:', error);
      res.status(500).send('Error al generar el acuse');
    }
  }


  //Decodificamos el bloque en el parametro 0 para obtener la informacion del JSON.
  async getData0FromDecodedTransaction(hash: string): Promise<any> {
    try {
      const decodedTransaction = await this.getDecodedTransactionData(hash);
      const valueAtIndex0 = decodedTransaction.params['0'];
      return JSON.parse(valueAtIndex0);
    } catch (error) {
      console.error('Error:', error);
      throw new Error('Error fetch');
    }
  }

  async getDecodedTransactionData(hash: string): Promise<any> {
    const web3 = this.blockchainProvider.getWeb3Instance();
    const contract = this.blockchainProvider.getContractInstance();

    try {
      const transaction = await web3.eth.getTransaction(hash);
      const inputData = transaction.input;
      const methodAbi = contract.options.jsonInterface.find(
        (method: any) => method.type === 'function' && method.signature === inputData.slice(0, 10),
      );

      if (methodAbi) {
        const params = web3.eth.abi.decodeParameters(methodAbi.inputs, inputData.slice(10));
        return {
          methodName: methodAbi.name,
          params,
        };
      } else {
        return {
          error: 'Error ABI',
        };
      }
    } catch (error) {
      console.error('Error:', error);
      throw new Error('Error fetch.');
    }
  }
}
