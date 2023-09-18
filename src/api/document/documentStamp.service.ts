import { Injectable } from '@nestjs/common';
import * as crypto from 'crypto';
import * as fs from 'fs-extra';
import { Multer } from 'multer';
import { create } from 'ipfs-http-client';
import { EndpointService } from '../endpoint/endpoint.service';

@Injectable()
export class DocumentStampService {
  constructor(private readonly endpointService: EndpointService) {}

  async stampDocument(file: Multer.File): Promise<any> {
    try {
      if (!file) {
        throw new Error('No se proporcionó un archivo.');
      }

      // Guardar archivo
      const filePath = `./documents/${file.originalname}`;
      await fs.writeFile(filePath, file.buffer);

      // SHA256
      const sha256Hash = crypto.createHash('sha256');
      sha256Hash.update(file.buffer);
      const fileHash = sha256Hash.digest('hex');

      // Timestamp
      const timestamp = Date.now().toString();
      const timestampHash = crypto.createHash('sha256').update(timestamp).digest('hex');

      // IPFS
      const ipfs = create({ host: '127.0.0.1', port: 5002, protocol: 'http' });
      const ipfsResponse = await ipfs.add(fs.readFileSync(filePath));
      const cid = ipfsResponse.cid.toString();

      // Guardar en Ganache
      const dataToStore = {
        fileHash,
        timestampHash,
        filePath,
        cid,
      };
      
      const transactionHash = await this.endpointService.storeData(dataToStore);

      return { fileHash, timestampHash, filePath, cid, transactionHash };
    } catch (error) {
      console.error('Error al procesar el archivo:', error);
      throw new Error('Error al procesar el archivo.');
    }
  }
}
