import { Controller, Post, Param, Res, UseGuards } from '@nestjs/common';
import { Response } from 'express';
import axios from 'axios';
import { ConfigService } from '@nestjs/config';
import { AuthGuard } from '../auth/auth.guard';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';

@Controller('admin/ipfs')
export class IpfsController {
  constructor(
    private readonly configService: ConfigService,
  ) { }

  @ApiTags('Carnet de manipulación de alimentos')
 @UseGuards(AuthGuard)
  @Post('download/:cid')
  @ApiOperation({ summary: '.PDF', description: 'Obtener el documento en la blockchain' })
    @ApiBearerAuth('bearer')
  async downloadFile(@Param('cid') cid: string, @Res() res: Response) {
    try {
      const ipfsNodeUrl = this.configService.get('IPFS_NODE_URL');
      const ipfsApiUrl = `${ipfsNodeUrl}/api/v0/cat?arg=${cid}`;
      const response = await axios.post(ipfsApiUrl, null, {
        responseType: 'stream',
      });

      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename=${cid}.pdf`);

      response.data.pipe(res);
    } catch (error) {
      res.status(500).send('Error al descargar el archivo desde IPFS.');
    }
  }
}
