import { Model } from 'mongoose';
import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { DocumentStamp } from '../documentStamp/documentStamp.schema';

@Injectable()
export class CertificateRepository {
  constructor(
    @InjectModel(DocumentStamp.name)
    private readonly certificateModel: Model<DocumentStamp>,
  ) {}

  async findAllWithPagination(limit: number, skip: number): Promise<[DocumentStamp[], number]> {
    const [certificates, total] = await Promise.all([
      this.certificateModel.find().skip(skip).limit(limit).exec(),
      this.certificateModel.countDocuments().exec(),
    ]);
    return [certificates, total];
  }

  async create(data: DocumentStamp): Promise<DocumentStamp> {
    const certificate = new this.certificateModel(data);
    return await certificate.save();
  }
}
