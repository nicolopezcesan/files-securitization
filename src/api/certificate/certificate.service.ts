import { Injectable } from '@nestjs/common';
import { Certificate } from 'src/features/certificates/certificate.schema';
import { CertificateRepository } from 'src/features/certificates/certificate.repository';

@Injectable()
export class CertificateService {
  constructor(
    private certificateRepository: CertificateRepository
    ) {}

  async findAll(
    limit: number = 10, 
    page: number = 1
    ): Promise<{ certificates: Certificate[]; 
        total: number }> 
    {
    const skip = (page - 1) * limit;
    const [certificates, total] = await this.certificateRepository.findAllWithPagination(limit, skip);
    return { certificates, total };
  }

  async create(data: Certificate): Promise<Certificate> {
    return await this.certificateRepository.create(data);
  }
}
