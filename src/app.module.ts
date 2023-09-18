import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ConfigModule } from '@nestjs/config';
import configs from './configs/environments/configs';
import envValidations from './configs/environments/env.validations';
import { EndpointModule } from './features/endpoint/endpoint.module';
import { StampModule } from './features/stamp/stamp.module';
import { VerificationModule } from './features/verification/verification.module';
import { MulterModule } from '@nestjs/platform-express';
import * as path from 'path';
import { statusModule } from './features/status/status.module';
import { DocumentStampModule } from './features/documentStamp/documentStamp.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      envFilePath: '.env',
      load: [configs],
      isGlobal: true,
      validationSchema: envValidations,
    }),
    MulterModule.register({
      dest: path.join(__dirname, '../documents'), 
    }),
    EndpointModule,
    StampModule,
    VerificationModule,
    statusModule,
    DocumentStampModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
