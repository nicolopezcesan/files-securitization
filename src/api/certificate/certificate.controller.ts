import { Controller, DefaultValuePipe, Get, ParseIntPipe, Query, UseGuards } from '@nestjs/common';
import { CertificatesService } from './certificate.service';
import { Certificate, CertificateDocument  } from 'src/features/certificates/certificate.schema';
import { AuthGuard } from '../auth/auth.guard';
import { PaginateResult } from 'mongoose';
import { ApiQuery } from '@nestjs/swagger';
import { TCertificateByState } from 'src/features/certificates/certificate.repository';

@Controller('certificates')
export class CertificateController {
  constructor(private readonly certificatesService: CertificatesService) {}

  // @UseGuards(AuthGuard)
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

  @UseGuards(AuthGuard)
  @Get('count')
  async countByState(): Promise<{ certificates: TCertificateByState[] }> {
    const response = await this.certificatesService.countCertificateByState();
    return response;
  }
}
