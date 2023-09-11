import { Injectable } from '@nestjs/common';
import * as fs from 'fs';
import * as crypto from 'crypto';
import * as OpenTimestamps from 'opentimestamps';
import { Multer } from 'multer';


@Injectable()
export class VerificationService {
  async verifyTimestamp(files: Multer.File[]) {
    try {
      if (files.length !== 2) {
        throw new Error('Debe proporcionar un archivo .ots y un nuevo archivo');
      }

      const [otsFile, newFile] = files;

      const otsFilePath = `uploads/${otsFile.originalname}`;
      fs.writeFileSync(otsFilePath, otsFile.buffer);

      const newFileHash = crypto.createHash('sha256').update(newFile.buffer).digest('hex');

      const otsBuffer = fs.readFileSync(otsFilePath);
      const detached = OpenTimestamps.DetachedTimestampFile.deserialize(otsBuffer);

      const infoResult = OpenTimestamps.info(detached);

      fs.unlinkSync(otsFilePath);

      const match = infoResult.match(/File sha256 hash: ([a-fA-F0-9]+)/);
      const hashValue = match ? match[1] : null;

      if (!hashValue) {
        throw new Error('No se pudo encontrar el valor del hash en la respuesta');
      }

      const hashesMatch = hashValue === newFileHash;

      return { otsHash: hashValue, FileHash: newFileHash, hashesMatch };
    } catch (error) {
      console.error('Error al procesar los archivos:', error.message);
      return { error: 'Error al procesar los archivos' };
    }
  }
}
