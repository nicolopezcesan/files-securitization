import { Controller, Post, Body, Get, Param, Res } from '@nestjs/common';
import { EndpointService } from './endpoint.service';

@Controller('endpoint')
export class EndpointController {
  constructor(private readonly endpointService: EndpointService) {}

  @Post('send')
  async storeData(@Body() body: any) {
    const transactionHash = await this.endpointService.storeData(body);
    const sha256Hash = this.endpointService.calculateSHA256(body);
    return { sha256Hash, transactionHash };
  }
  
  @Get('infostamp/:hash')
  async getDecodedTransactionData(@Param('hash') hash: string) {
    const decodedTransactionData = await this.endpointService.getDecodedTransactionData(
      hash
    );
    return { decodedTransactionData };
  }

  @Get('data/:hash')
  async getData0FromDecodedTransaction(@Param('hash') hash: string) {
    const data0 = await this.endpointService.getData0FromDecodedTransaction(hash);
    return data0;
  }
  
 

}
