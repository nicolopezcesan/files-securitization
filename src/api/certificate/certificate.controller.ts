import { Controller, DefaultValuePipe, Get, ParseIntPipe, Query, UseGuards } from '@nestjs/common';
import { CertificatesService } from './certificate.service';
import { Certificate, CertificateDocument  } from 'src/features/certificates/certificate.schema';
import { AuthGuard } from '../auth/auth.guard';

import { PaginateResult } from 'mongoose';

@Controller('certificates')
export class CertificateController {
  constructor(private readonly certificatesService: CertificatesService) {}

  @UseGuards(AuthGuard)
  @Get()
  async findAll(
    @Query('limit', new DefaultValuePipe(10), ParseIntPipe) limit: number,
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query() filters: any,
  ): Promise<PaginateResult<CertificateDocument>>
  {
    const response = await this.certificatesService.findAll(filters);
    return response;
    
  }

  @Get('completados')
  async findCompletedCertificates(
    @Query('limit', new DefaultValuePipe(10), ParseIntPipe) limit: number,
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
  ): Promise<PaginateResult<CertificateDocument>> {
    const response = await this.certificatesService.findCertificatesByStatus('Completado', limit, page);
    return response;
  }

  @Get('fallidos')
  async findFailedCertificates(
    @Query('limit', new DefaultValuePipe(10), ParseIntPipe) limit: number,
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
  ): Promise<PaginateResult<CertificateDocument>> {
    const response = await this.certificatesService.findCertificatesByStatus('Fallido', limit, page);
    return response;
  }

  @Get('pendientes')
  async findPendingCertificates(
    @Query('limit', new DefaultValuePipe(10), ParseIntPipe) limit: number,
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
  ): Promise<PaginateResult<CertificateDocument>> {
    const response = await this.certificatesService.findCertificatesByStatus('Pendiente', limit, page);
    return response;
  }

}
