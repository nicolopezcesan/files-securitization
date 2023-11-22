import { Injectable } from '@nestjs/common';
import * as crypto from 'crypto';
import * as fs from 'fs-extra';
import { Multer } from 'multer';
import { create } from 'ipfs-http-client';
import { EndpointService } from '../endpoint/endpoint.service';
import { ConfigService } from '@nestjs/config';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Certificate, CertificateDocument, CertificateState } from 'src/features/certificates/certificate.schema';
import { BlockchainProvider } from 'src/configs/blockchain/blockchain.provider';
import * as path from 'path';
import axios from 'axios';
import * as PDFDocument from 'pdfkit'; 
import * as rp from 'request-promise';
import { AccountUnlockService } from 'src/configs/blockchain/blockchain.service';

@Injectable()
export class DocumentStampService {
  private certificadosProcesados: string[] = [];
  private certificadosErroneos: string[] = []; 
  
  constructor(
    private readonly endpointService: EndpointService,
    private readonly configService: ConfigService,
    private readonly accountUnlockService: AccountUnlockService,
    private readonly blockchainProvider: BlockchainProvider,
    @InjectModel(Certificate.name)
    private readonly stampedDocumentModel: Model<Certificate>,
    @InjectModel('Certificate')
     private readonly certificateModel: Model<CertificateDocument>,    
  ) { }

  async stampDocument({ file, certificado }: { file: Multer.File; certificado: string | null }): Promise<any> {
    try {
      if (!file) {
        throw new Error('No se proporcionó un archivo.');
      }
      // Guardar archivo
      const filePath = `./documents/${file.originalname}`;
      const nameFile = file.originalname;
      await fs.writeFile(filePath, file.buffer);

      // SHA256
      const sha256Hash = crypto.createHash('sha256');
      sha256Hash.update(file.buffer);
      const fileHash = sha256Hash.digest('hex');

      // Timestamp
      const timestamp = Date.now().toString();
      const timestampDate = new Date(Date.now());
      const timestampHash = crypto.createHash('sha256').update(timestamp).digest('hex');

      // Enviar a IPFS
      let cid = null;
      const ipfsNodeUrl = this.configService.get('IPFS_NODE_URL');
      const ipfs = create({ url: ipfsNodeUrl });
      try {
        const ipfsResponse = await ipfs.add(fs.readFileSync(filePath));
        cid = ipfsResponse.cid.toString();
      } catch (ipfsError) {
        console.error('Error al subir el archivo a IPFS:', ipfsError);
      }

      //Elimina el archivo
      await fs.unlink(filePath);

      // Guardar en Blockchain
      let transactionHash = null;

      try {
        const dataToStore = {
          fileHash,
          timestampDate,
          timestampHash,
          nameFile,
          cid,
          certificado,
        };

        transactionHash = await this.endpointService.storeData(dataToStore);
      } catch (blockchainError) {
        console.error('Error al subir el archivo a blockchain:', blockchainError);
        transactionHash = null;
      }

      //Status
      let status = CertificateState.PENDING;
      if (transactionHash === null || cid === null) {
        status = CertificateState.FAILED;
      } else {
        status = CertificateState.COMPLETED;
      }

      // Guardar en MongoDB el resultado
      const stampedDocument = new this.stampedDocumentModel({
        certificado,
        status,
        transactionHash,
        fileHash,
        timestampDate,
        timestampHash,
        nameFile,
        cid,
      });
      await stampedDocument.save();

      return { success: true, message: 'El archivo se ha procesado y guardado correctamente en INMUTA.', fileHash, timestampHash, nameFile, cid, certificado, transactionHash, };
    } catch (error) {
      console.error('Error al procesar el archivo:', error);
      throw new Error('Error al procesar el archivo.');
    }
  }

  numberCertificate(file:any){
     const fileName = file.originalname;
      const match = fileName.match(/^(.*?)\s+(\d+)/);
      let certificado: string | null = null; //
      let nameAndSurname: string | null = null;
      if (match) {
        nameAndSurname = match[1];
        certificado = match[2];
      } return certificado;
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


  // Obtener el CID relacionado con la transacción
  async getDataByTransactionHash(transactionHash: string): Promise<any> {
    const web3 = this.blockchainProvider.getWeb3Instance();
    const contract = this.blockchainProvider.getContractInstance();
    try {
      const transaction = await web3.eth.getTransaction(transactionHash);
      if (!transaction || !transaction.input) {
        throw new Error('Transacción no encontrada o sin entrada.');
      }

      const inputData = transaction.input;
      const methodAbi = contract.options.jsonInterface.find(
        (method: any) => method.type === 'function' && method.signature === inputData.slice(0, 10),
      );

      if (methodAbi && methodAbi.name === 'set') {
        const params = web3.eth.abi.decodeParameters(methodAbi.inputs, inputData.slice(10));
        const cid = params['0']; 
        return { cid };
      } else {
        throw new Error('Transacción no válida para obtener el CID.');
      }
    } catch (error) {
      console.error('Error al obtener el CID por hash de transacción:', error);
      throw new Error('Error al obtener el CID por hash de transacción.');
    }
  }

  //Verificar Certificados en DB
  async verificarCertificadosEnDB(certificados: string[]): Promise<string[]> {
    const certificadosEnDB = await this.certificateModel.find({ certificado: { $in: certificados } }).distinct('certificado').exec();
    const certificadosNoCargados = certificados.filter(certificado => !certificadosEnDB.includes(certificado));
    return certificadosNoCargados;
  }


  async documentStamp(startDate: string, endDate: string): Promise<any> {
    await this.accountUnlockService.unlockAccount();
    try {
      const certificados = await this.obtenerTramitesCarnetManipulador(startDate, endDate);    
      const certificadosNoCargados = await this.verificarCertificadosEnDB(certificados);
      
      for (const numeroCertificado of certificadosNoCargados) {
          try {
            await this.processCertificado(numeroCertificado);
            this.certificadosProcesados.push(numeroCertificado);
          } catch (error) {
            this.certificadosErroneos.push(numeroCertificado);
          }
        }

      return {
        mensaje: 'Proceso completo',
        certificadosProcesados: this.certificadosProcesados,
        certificadosErroneos: this.certificadosErroneos,
        certificadosNoCargados,
        fechaInicio: startDate,
        fechaFinal: endDate,
      };
    } catch (error) {
      throw error;
    }
  }

  async processCertificado(numeroCertificado: string) {
    try {
      // Descargar el certificado
      const fileName = await this.obtenerCertificadoCarnetManipulador(numeroCertificado);

      // Procesamos
      const result = await this.stampDocument({
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

  async obtenerTramitesCarnetManipulador(startDate: string, endDate: string): Promise<string[]> {
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


  async obtenerCertificadoCarnetManipulador(numeroCertificado: string): Promise<string> {
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
          throw new Error('El certificado está vacío. ');
        }
  
        const fileName = `${numeroCertificado}.pdf`;
        const filePath = path.join('documentsTemp', fileName);
        fs.writeFileSync(filePath, response.data);
        return fileName;
      } else {
        console.error(`Error al obtener certificado de API externa ${numeroCertificado} `);
        throw new Error(`Error al obtener certificado de API externa ${numeroCertificado}`);
      }
    } catch (error) {
      if (error.response && error.response.status === 500) {
        console.error("Error al obtener archivo de API externa");
      } else {
        // No mostrar detalles adicionales del error
        console.error("Error al obtener archivo de API externa");
      }
      throw error;
    }
  }
  
  
    async saveCancelledCertificate(numeroCertificado: string) {
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

    async processCertificate(numeroCertificado: string) {
      try {
        // Descargar el certificado
        const fileName = await this.obtenerCertificadoCarnetManipulador(numeroCertificado);
    
        // Guardar en Blockchain
        const result = await this.stampDocument({
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


    async generateAcuse(hash: string, res): Promise<void> {
      try {
        // Información Acuse
      const data0 = await this.endpointService.getData0FromDecodedTransaction(hash);
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


    async deleteAllDuplicateCertificates(): Promise<any> {
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


    async processFailedCertificates(): Promise<any> {
      await this.accountUnlockService.unlockAccount();
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

}
