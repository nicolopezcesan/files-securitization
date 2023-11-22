import { Injectable } from '@nestjs/common';
import * as crypto from 'crypto';
import * as fs from 'fs-extra';
import { Multer } from 'multer';
import { create } from 'ipfs-http-client';
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
export class DocumentStampProcessProvider {
  private certificadosProcesados: string[] = [];
  private certificadosErroneos: string[] = []; 
  
  constructor(
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

        transactionHash = await this.storeData(dataToStore);
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

    //Guardamos los datos en la Blockchain
    async storeData(data: any): Promise<string> {
      const web3 = this.blockchainProvider.getWeb3Instance();
      const contract = this.blockchainProvider.getContractInstance();
      
      const jsonData = JSON.stringify(data);
     
      const accounts = await web3.eth.getAccounts();
      const result = await contract.methods.set(jsonData).send({ from: accounts[0] });
      console.log('JSON success', jsonData,'Transaction Hash', result.transactionHash, ' Result',  result);
  
      return result.transactionHash;
    }
 

  //Verificar Certificados en DB
  async verificarCertificadosEnDB(certificados: string[]): Promise<string[]> {
    const certificadosEnDB = await this.certificateModel.find({ certificado: { $in: certificados } }).distinct('certificado').exec();
    const certificadosNoCargados = certificados.filter(certificado => !certificadosEnDB.includes(certificado));
    return certificadosNoCargados;
  }


  public async documentStamp(startDate: string, endDate: string): Promise<any> {
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

  public async processCertificado(numeroCertificado: string) {
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

  public async obtenerTramitesCarnetManipulador(startDate: string, endDate: string): Promise<string[]> {
        
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


  public async obtenerCertificadoCarnetManipulador(numeroCertificado: string): Promise<string> {

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

    public async processCertificate(numeroCertificado: string) {
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


    public async processFailedCertificates(): Promise<any> {
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
