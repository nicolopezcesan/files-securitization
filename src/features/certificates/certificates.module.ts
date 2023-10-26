
import { ConfigService } from '@nestjs/config';
import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Certificate, CertificateSchema } from './certificate.schema';
import { CertificateController } from '../../api/certificate/certificate.controller';
import { CertificatesService } from '../../api/certificate/certificate.service';
import { CertificateRepository } from './certificate.repository';


@Module({
	controllers: [CertificateController],
	providers: [
		CertificatesService,
		CertificateRepository
	],
	imports: [
		MongooseModule.forRootAsync({
		  inject: [ConfigService],
		  useFactory: async (configService: ConfigService) => ({
			uri: configService.get<string>('MONGODB_URI'),
		  }),
		}),
		MongooseModule.forFeature([
		  {
			name: Certificate.name,
			schema: CertificateSchema,
		  },
		]), 
	],
})

export class CertificatesModule { }
