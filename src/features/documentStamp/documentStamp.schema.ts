
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

@Schema()
export class DocumentStamp extends Document {
    @Prop()
    transactionHash: string;
    
    @Prop()
    success: boolean;

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

    @Prop()
    certificado: string;
}

export const DocumentStampSchema = SchemaFactory.createForClass(DocumentStamp);
