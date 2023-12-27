import { Controller, Get, Param, Post, Req, Res, UploadedFile, UseGuards, UseInterceptors } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { Multer } from 'multer';
import { DocumentStampService } from './documentStamp.service';
import { ApiBody, ApiConsumes, ApiOperation, ApiTags } from '@nestjs/swagger';
import { AccountUnlockService } from 'src/configs/blockchain/blockchain.service';
import { AuthGuard } from '../auth/auth.guard';
import { DocumentStampProcessProvider } from './documentStamp-process.provider';
import { ApiKeyAuthGuard } from '../auth/api-key-auth.guard';

@ApiTags('Carnet de manipulación de alimentos')
@Controller('documentStamp')
export class DocumentStampController {  
  constructor(    
    private readonly documentStampService: DocumentStampService,
    private readonly accountUnlockService: AccountUnlockService, 
    private readonly documentStampProcessProvider: DocumentStampProcessProvider, 
  ) {}
  @UseGuards(ApiKeyAuthGuard)
  @Post('document')
  @ApiOperation({summary: 'Securitizar documento individual blockchain' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: {
          type: 'string',
          format: 'binary',
        },
      },
    },
  })
  
  @UseInterceptors(FileInterceptor('file'))
  async stampDocument( @Req() req: Request, @UploadedFile() file: Multer.File) {
    await this.accountUnlockService.unlockAccount();
    const apiKey = req.headers['apikey'];
    try {
      if (!file) {
        throw new Error('No se proporcionó un archivo.');
      }
      const certificado = await this.documentStampService.numberCertificate(file);
      const result = await this.documentStampService.stampDocument({ file, certificado, apiKey });
      return result;
    } catch (error) {
      console.error('Error al procesar el archivo:', error);
      throw new Error('Error al procesar el archivo.');
    } 
  }

  @Get(':startDate/:endDate')
  async documentStampProcess(
    @Param('startDate') startDate: string,
    @Param('endDate') endDate: string,
  ): Promise<any> {
    return await this.documentStampProcessProvider.documentStamp(startDate, endDate);
  }
  
  @Get('processFailed')
  async processFailedCertificates(): Promise<any> {
    return await this.documentStampService.processFailedCertificates();
  }

  @Get('deleteAllDuplicateCertificates')
  async deleteAllDuplicateCertificates(): Promise<any> {
    return await this.documentStampService.deleteAllDuplicateCertificates();
  }


}


