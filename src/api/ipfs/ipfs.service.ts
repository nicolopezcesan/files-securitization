import { Injectable } from '@nestjs/common';
import axios from 'axios';

@Injectable()
export class IpfsService {
  async getFile(cid: string): Promise<string> {
    try {
      const ipfsUrl = `http://127.0.0.1:5002/api/v0/cat?arg=${cid}`;
      const response = await axios.post(ipfsUrl, { responseType: 'arraybuffer' });

      const contentBase64 = Buffer.from(response.data).toString('base64');

      return contentBase64;
    } catch (error) {
      throw new Error('No se pudo obtener el archivo de IPFS');
    }
  }
}
