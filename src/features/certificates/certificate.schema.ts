
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';
import * as MongoosePagination from 'mongoose-paginate-v2';
import MongooseAggregatePaginate from 'mongoose-aggregate-paginate-v2';

enum StatusEnum {
  Completado = 'Completado',
  Fallido = 'Fallido',
  Pendiente = 'Pendiente',
}

export enum CertificateState {
  IN_PROCESS = 'IN_PROCESS',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED',
  PENDING = 'PENDING',
}


@Schema({ timestamps: { createdAt: 'process_date', updatedAt: false } }) 
export class Certificate extends Document {
  @Prop({ type: String, enum: Object.values(CertificateState) }) 
  status: string;

  @Prop()
  certificado: string;

  @Prop()
  success: boolean;

  @Prop()
  transactionHash: string;

  @Prop()
  fileHash: string;

  @Prop()
  timestampDate: Date;

  @Prop()
  timestampHash: string;

  @Prop()
  nameFile: string;

  @Prop()
  cid: string;
}
export type CertificateDocument = Certificate & Document;

export const CertificateSchema = SchemaFactory.createForClass(Certificate);

CertificateSchema.plugin(MongoosePagination);
