import { Injectable } from '@nestjs/common';
import { Certificate, CertificateDocument } from 'src/features/certificates/certificate.schema';
import { CertificateRepository } from 'src/features/certificates/certificate.repository';
import { PaginateResult } from 'mongoose';

@Injectable()
export class CertificatesService {
  constructor(
    private CertificateRepository: CertificateRepository
    ) {}

    async findAll(params: any = {}): Promise<PaginateResult<CertificateDocument>> {
      const { limit, page, ...filters } = params;
  
      const query = {};
  
      if (Object.entries(filters).length > 0) {
        const { search, state } = filters;
  
        if (search) {
          const re = { $regex: search };
          query['$or'] = [
            { certificado: re },
            { nameFile: re },
            { transactionHash: re },
            { cid: re }
          ];
        }
  
        if (state) {
          query['$and'] = [{
            state: new RegExp(state, 'i'),
          }];
        }
      }
  
      return await this.CertificateRepository.findAll(limit, page, query);
    }
  
    async create(data: Certificate): Promise<Certificate> {
      return await this.CertificateRepository.create(data);
    }

    async findCertificatesByStatus(
      status: string,
      limit: number,
      page: number,
    ): Promise<PaginateResult<CertificateDocument>> {
      const query = { status };
      return await this.CertificateRepository.findAll(limit, page, query);
    }
  }
  
