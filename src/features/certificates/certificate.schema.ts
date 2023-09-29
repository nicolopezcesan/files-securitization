
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

@Schema({ timestamps: true }) 
export class Certificate extends Document {
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

export const CertificateSchema = SchemaFactory.createForClass(Certificate);
