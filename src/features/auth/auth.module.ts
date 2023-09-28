import { Module } from '@nestjs/common';
import { AuthController } from 'src/api/auth/auth.controller';
import { AwsCognitoService } from 'src/api/auth/aws-cognito.service';

@Module({
  controllers: [AuthController],
  providers: [AwsCognitoService],
})
export class AuthModule { };
