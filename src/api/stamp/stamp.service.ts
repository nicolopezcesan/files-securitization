import { Injectable } from '@nestjs/common';
import * as OpenTimestamps from 'opentimestamps';
import * as crypto from 'crypto';
import { create } from 'ipfs-http-client';
import * as fs from 'fs';
import * as path from 'path';

@Injectable()
export class StampService {
  async timestampDocument(fileBuffer: Buffer, nameFile: string): Promise<any> {
    try {
      const detached = OpenTimestamps.DetachedTimestampFile.fromBytes(
        new OpenTimestamps.Ops.OpSHA256(),
        fileBuffer,
      );

      // Obtenemos el SHA256
      const hash = crypto.createHash('sha256').update(fileBuffer).digest('hex');

      // Guardar en IPFS
      const ipfs = create({ host: '127.0.0.1', port: 5002, protocol: 'http' }); // IPFS configuracion (HTTP API)
      const ipfsFile = await ipfs.add(fileBuffer);

      await OpenTimestamps.stamp(detached);
      const fileOts = detached.serializeToBytes();
      
      const documentHash = hash;
      const ipfsHash = ipfsFile.cid.toString();

      // Guardamos en carpeta OTSdocs
      const timestampFolderPath = path.join(__dirname, '../../../documents');    
      const timestampFilePath = path.join(timestampFolderPath, `${hash}.ots`);
      const originalFilePath = path.join(timestampFolderPath, `${hash}${nameFile}`);
      fs.writeFileSync(timestampFilePath, fileOts);
      fs.writeFileSync(originalFilePath, fileBuffer);

      return {
        message: 'Documento firmado correctamente',
        documentHash,
        ipfsHash,
        timestampPath: timestampFilePath,
        originalPath: originalFilePath,
        timestampProof: fileOts.toString('base64'),

      };
    } catch (error) {
      return {
        message: 'Error al Firmar documento',
        error: error.message,
      };
    }
  }


  

  
}
