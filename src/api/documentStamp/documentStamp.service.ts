import { Injectable } from '@nestjs/common';
import * as crypto from 'crypto';
import * as fs from 'fs-extra';
import { Multer } from 'multer';
import { create } from 'ipfs-http-client';
import { EndpointService } from '../endpoint/endpoint.service';
import { ConfigService } from '@nestjs/config';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { DocumentStamp } from 'src/features/documentStamp/documentStamp.schema';

@Injectable()
export class DocumentStampService {
  constructor(
    private readonly endpointService: EndpointService,
    private readonly configService: ConfigService,
    @InjectModel(DocumentStamp.name)
    private readonly stampedDocumentModel: Model<DocumentStamp>,
    ) {}

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

      // IPFS
      const ipfsNodeUrl = this.configService.get('IPFS_NODE_URL');
      const ipfs = create({ url: ipfsNodeUrl });
      const ipfsResponse = await ipfs.add(fs.readFileSync(filePath));
      const cid = ipfsResponse.cid.toString();
      
      //Elimina el archivo
      await fs.unlink(filePath);

      // Guardar en Ganache
      const dataToStore = {
        fileHash,
        timestampDate,
        timestampHash,
        nameFile,
        cid,
        certificado, 
      };   
      
      const transactionHash = await this.endpointService.storeData(dataToStore);
      const success = true;

      // Guardar en MongoDB
      const stampedDocument = new this.stampedDocumentModel({
        certificado,
        success,
        transactionHash,
        fileHash,
        timestampDate,
        timestampHash,
        nameFile,
        cid,
      });
      await stampedDocument.save();
      
      return { success:true, message: 'El archivo se ha procesado y guardado correctamente en INMUTA.', fileHash, timestampHash, nameFile, cid, certificado, transactionHash, };
  } catch (error) {
      console.error('Error al procesar el archivo:', error);
      throw new Error('Error al procesar el archivo.');
    }
  }


  

}
