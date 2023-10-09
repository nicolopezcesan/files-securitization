import { Injectable } from '@nestjs/common';
import { Certificate, CertificateDocument, CertificateState } from 'src/features/certificates/certificate.schema';
import { CertificateRepository, TCertificateByState } from 'src/features/certificates/certificate.repository';
import { PaginateResult } from 'mongoose';

@Injectable()
export class CertificatesService {
  constructor(
    private CertificateRepository: CertificateRepository
  ) { }

  async findAll(params: any = {}): Promise<PaginateResult<CertificateDocument>> {
    const { limit, page, ...filters } = params;

    const query = {};

    if (Object.entries(filters).length > 0) {
      const { search, status } = filters;

      if (search) {
        const re = { $regex: search };
        query['$or'] = [
          { certificado: re },
          { nameFile: re },
          { transactionHash: re },
          { cid: re }
        ];
      }

      if (status) {
        query['$and'] = [{
          status: new RegExp(status, 'i'),
        }];
      }
    }

    return await this.CertificateRepository.findAll(limit, page, query);
  }

  async create(data: Certificate): Promise<Certificate> {
    return await this.CertificateRepository.create(data);
  }

  async countCertificateByState(): Promise<{ certificates: TCertificateByState[] }> {
    const certificates = await this.CertificateRepository.groupByState();

    const amountByStatus = Object.values(CertificateState).map((status) => {
      const certificate = certificates.find((c) => c.status === status);
      if (certificate) return certificate;

      return { status, count: 0 };
    })

    return { certificates: amountByStatus };
  }
}

