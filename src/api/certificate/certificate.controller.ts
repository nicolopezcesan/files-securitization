import { Controller, Get, Query } from '@nestjs/common';
import { CertificateService } from './certificate.service';
import { Certificate } from 'src/features/certificates/certificate.schema';

@Controller('certificates')
export class CertificateController {
  constructor(private readonly certificateService: CertificateService) {}

  @Get()
  async findAll(
    @Query('limit') limit: number = 10,
    @Query('page') page: number = 1,
  ): Promise<{ data: Certificate[]; total: number }> 
  {
    const result = await this.certificateService.findAll(+limit, +page);
    return {
      data: result.certificates,
      total: result.total,
    };
  }
}
