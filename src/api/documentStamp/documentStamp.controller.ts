import { Controller, Get, Param, Post, Res, UploadedFile, UseGuards, UseInterceptors } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { Multer } from 'multer';
import { DocumentStampService } from './documentStamp.service';
import { ApiBody, ApiConsumes, ApiOperation, ApiTags } from '@nestjs/swagger';
import { AccountUnlockService } from 'src/configs/blockchain/blockchain.service';
import { AuthGuard } from '../auth/auth.guard';



@ApiTags('Carnet de manipulación de alimentos')
@Controller('')
export class DocumentStampController {  
  constructor(    
    private readonly documentStampService: DocumentStampService,
    private readonly accountUnlockService: AccountUnlockService,    
  ) {}
  
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
  async stampDocument(@UploadedFile() file: Multer.File) {
    await this.accountUnlockService.unlockAccount();
    try {
      if (!file) {
        throw new Error('No se proporcionó un archivo.');
      }
      const certificado = await this.documentStampService.numberCertificate(file);
      const result = await this.documentStampService.stampDocument({ file, certificado });
      return result;
    } catch (error) {
      console.error('Error al procesar el archivo:', error);
      throw new Error('Error al procesar el archivo.');
    } 
  }

  @Get(':startDate/:endDate')
  async documentStamp(
    @Param('startDate') startDate: string,
    @Param('endDate') endDate: string,
  ): Promise<any> {
    return await this.documentStampService.documentStamp(startDate, endDate);
  }
  
  @Get('processFailed')
  async processFailedCertificates(): Promise<any> {
    return await this.documentStampService.processFailedCertificates();
  }

  @Get('deleteAllDuplicateCertificates')
  async deleteAllDuplicateCertificates(): Promise<any> {
    return await this.documentStampService.deleteAllDuplicateCertificates();
  }

  // @UseGuards(AuthGuard)
  @Get('admin/acuse/:hash')
  @ApiOperation({summary: '.PDF', description: 'Comprobante de operación .INMUTA' })
  async generateAcuse(@Param('hash') hash: string, @Res() res): Promise<void> {    
      await this.documentStampService.generateAcuse(hash, res);
  }

}


