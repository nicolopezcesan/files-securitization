import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ConfigService } from '@nestjs/config'; 
import { Certificate, CertificateSchema } from 'src/features/certificates/certificate.schema';

@Module({
  imports: [
    MongooseModule.forRootAsync({
      useFactory: (configService: ConfigService) => ({
        uri: configService.get<string>('MONGODB_URI'),
      }),
      inject: [ConfigService],
    }),
    MongooseModule.forFeature([
      { name: Certificate.name, schema: CertificateSchema  },      
    ]),
  ],
  exports: [MongooseModule],
})
export class DatabaseModule {
  constructor(private readonly configService: ConfigService) {} 
}
