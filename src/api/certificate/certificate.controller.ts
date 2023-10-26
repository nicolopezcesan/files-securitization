import { Controller, DefaultValuePipe, Delete, Get, ParseIntPipe, Query, UseGuards } from '@nestjs/common';
import { CertificatesService } from './certificate.service';
import { Certificate, CertificateDocument  } from 'src/features/certificates/certificate.schema';
import { AuthGuard } from '../auth/auth.guard';
import { Model, PaginateResult } from 'mongoose';
import { ApiQuery, ApiTags } from '@nestjs/swagger';
import { TCertificateByState } from 'src/features/certificates/certificate.repository';
import { InjectModel } from '@nestjs/mongoose';

@Controller('certificates')
export class CertificateController {
  constructor(
    private readonly certificatesService: CertificatesService,
    @InjectModel(Certificate.name) private certificateModel: Model<CertificateDocument>
    ) {}
  

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

  @UseGuards(AuthGuard)
  @Get('count')
  async countByState(): Promise<{ certificates: TCertificateByState[] }> {
    const response = await this.certificatesService.countCertificateByState();
    return response;
  }

  @ApiTags('ProcessData')
  @Delete('delete-all')
  async deleteAllCertificates(): Promise<{ message: string }> {
    try {
      await this.certificateModel.deleteMany({});
      return { message: 'Todos los datos de la colección han sido eliminados.' };
    } catch (error) {
      throw new Error('Error al eliminar los datos de la colección.');
    }
  }
}
