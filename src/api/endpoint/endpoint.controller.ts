import { Controller, Post, Body, Get, Param, Res, UseGuards } from '@nestjs/common';
import { EndpointService } from './endpoint.service';
import { AuthGuard } from '../auth/auth.guard';
import { ApiBody, ApiOperation, ApiTags } from '@nestjs/swagger';
import { AccountUnlockService } from 'src/configs/blockchain/blockchain.service';

@ApiTags('core-api')
@Controller('')
export class EndpointController {
  constructor(
    private readonly endpointService: EndpointService,
    private readonly accountUnlockService: AccountUnlockService
    ) {}  


  @Post('send')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        entrada: {
          type: 'string',
        },        
      },
    },
  })
  async storeData(@Body() body: any) {
    await this.accountUnlockService.unlockAccount();
    try {      
      const sha256Hash = this.endpointService.calculateSHA256(body);
      const transactionHash = await this.endpointService.storeData(body);
      return { sha256Hash, transactionHash };
    }
    finally { await this.accountUnlockService.lockAccount(); }
  }

  @Get('infostamp/:hash')  
  @ApiOperation({summary: 'Consultar información del bloque' })
  async getDecodedTransactionData(@Param('hash') hash: string) {
    const decodedTransactionData = await this.endpointService.getDecodedTransactionData(hash);
    return { decodedTransactionData };
  }

  @Get('data/:hash')
  @ApiOperation({summary:'Obtener la información almacenada en JSON' })
  async getData0FromDecodedTransaction(@Param('hash') hash: string) {
    const data0 = await this.endpointService.getData0FromDecodedTransaction(hash);
    return data0;
  }  
}
