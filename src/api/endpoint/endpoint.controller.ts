import { Controller, Post, Body, Get, Param, Res, UseGuards, UnauthorizedException, HttpException, HttpStatus, Req } from '@nestjs/common';
import { EndpointService } from './endpoint.service';
import { AuthGuard } from '../auth/auth.guard';
import { ApiBody, ApiOperation, ApiTags } from '@nestjs/swagger';
import { AccountUnlockService } from 'src/configs/blockchain/blockchain.service';
import { ApiKeyAuthGuard } from '../auth/api-key-auth.guard';

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
  @UseGuards(ApiKeyAuthGuard)
  async storeData(@Body() body: any, @Req() req: Request) {
    try {
      await this.accountUnlockService.unlockAccount();
      const apiKey = req.headers['apikey'];
      const sha256Hash = this.endpointService.calculateSHA256(body);
      const transactionHash = await this.endpointService.storeData(body, apiKey);
      return { sha256Hash, transactionHash };
    } catch (error) {
      if (error instanceof UnauthorizedException) {
        // Manejar la excepción específica y devolver un mensaje personalizado
        if (error.message === 'API key inexistente') {
          throw new HttpException({ message: 'API key inexistente' }, HttpStatus.FORBIDDEN);
        } else if (error.message === 'API key vencida') {
          throw new HttpException({ message: 'API key vencida' }, HttpStatus.FORBIDDEN);
        } else {
          throw new HttpException({ message: 'API key inválida' }, HttpStatus.FORBIDDEN);
        }
      }
      // Otros errores, devolver un mensaje de error genérico
      throw new HttpException({ message: 'Internal Server Error' }, HttpStatus.INTERNAL_SERVER_ERROR);
    } finally {
      await this.accountUnlockService.lockAccount();
    }
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
