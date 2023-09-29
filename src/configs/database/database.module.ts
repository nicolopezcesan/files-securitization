import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ConfigService } from '@nestjs/config'; 
import { DocumentStamp, DocumentStampSchema  } from 'src/features/documentStamp/documentStamp.schema';

@Module({
  imports: [
    MongooseModule.forRootAsync({
      useFactory: (configService: ConfigService) => ({
        uri: configService.get<string>('MONGODB_URI'),
      }),
      inject: [ConfigService],
    }),
    MongooseModule.forFeature([{ name: DocumentStamp.name, schema: DocumentStampSchema  }]),
  ],
  exports: [MongooseModule],
})
export class DatabaseModule {
  constructor(private readonly configService: ConfigService) {} 
}
