import { Injectable } from '@nestjs/common';
import axios from 'axios';
import { ConfigService } from '@nestjs/config';


@Injectable()
export class IpfsService {
  constructor(
    private readonly configService: ConfigService,
    ) {}

  async getFile(cid: string): Promise<string> {
    try {
      const ipfsNodeUrl = this.configService.get('IPFS_NODE_URL');

      const ipfsUrl = `${ipfsNodeUrl}/api/v0/cat?arg=${cid}`;
      const response = await axios.post(ipfsUrl, { responseType: 'arraybuffer' });

      const contentBase64 = Buffer.from(response.data).toString('base64');

      return contentBase64;
    } catch (error) {
      throw new Error('No se pudo obtener el archivo de IPFS');
    }
  }
}
