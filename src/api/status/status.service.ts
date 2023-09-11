import { Injectable } from '@nestjs/common';
import * as fs from 'fs';
import { Multer } from 'multer';
const OpenTimestamps = require('opentimestamps');

@Injectable()
export class StatusService {
  async getTimestampInfo(otsFile: Multer.File) {
    try {
      if (!otsFile) {
        throw new Error('Archivo .ots no proporcionado');
      }

      // Guarda el archivo .ots en la carpeta temporal para analizar
      const otsFilePath = `documentsTemp/${otsFile.originalname}`;
      fs.writeFileSync(otsFilePath, otsFile.buffer);

      const otsBuffer = fs.readFileSync(otsFilePath);
      const detached = OpenTimestamps.DetachedTimestampFile.deserialize(otsBuffer);

      const infoResult = OpenTimestamps.info(detached);

      // Elimina el archivo .ots
      fs.unlinkSync(otsFilePath);

      const Hash = infoResult.match(/File sha256 hash: ([a-fA-F0-9]+)/);
      const documentHash = Hash ? Hash[1] : null;
      const info = infoResult.split('\n');

      return { documentHash, info };
    } catch (error) {
      console.error('Error al procesar el archivo .ots:', error.message);
      return { error: 'Error al procesar el archivo .ots' };
    }
  }
}
