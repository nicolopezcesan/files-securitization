import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { PaginateModel, Model, PaginateResult } from 'mongoose';
import { Certificate, CertificateDocument, CertificateState } from './certificate.schema';

export type TCertificateByState = { 
  count: number, 
  status: CertificateState 
}

@Injectable()
export class CertificateRepository {
  constructor(
    @InjectModel(Certificate.name)
    private certificateModel: PaginateModel<CertificateDocument>,
  ) { }

  async findAll(limit: number = 10, page: number = 1, query = {}): Promise<PaginateResult<CertificateDocument>> {
    const options = {
      sort: { process_date: -1 },
      limit,
      page,
      customLabels: {
        docs: 'certificates',
      },
    };

    return await this.certificateModel.paginate(query, options);
  }

  async create(data: CertificateDocument): Promise<CertificateDocument> {
    const createdEntity = new this.certificateModel(data);
    return createdEntity.save();
  }

  async groupByState(): Promise<TCertificateByState[]> {
    const result = await this.certificateModel.aggregate([
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 },
        },
      },
      {
        $project: {
          _id: 0,
          status: '$_id',
          count: 1,
        },
      },
    ]);

    return result;
  }
}


