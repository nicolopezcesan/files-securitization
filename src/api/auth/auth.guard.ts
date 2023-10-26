import { Injectable, CanActivate, ExecutionContext, HttpException, HttpStatus } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { CognitoJwtVerifier } from 'aws-jwt-verify';
import { CustomException } from 'src/shared/exceptions/custom-exception';

@Injectable()
export class AuthGuard implements CanActivate {
  private verifier;

  constructor(
    private readonly configService: ConfigService,
  ) {
    this.verifier = CognitoJwtVerifier.create({
      tokenUse: null,
      clientId: this.configService.get('AWS_COGNITO_CLIENT_ID'),
      userPoolId: this.configService.get('AWS_COGNITO_USER_POOL_ID'),
    });
  }

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const [, token] = request.headers.authorization?.split(' ') ?? [];

    try {
      await this.verifier.verify(token);
      return true;
    } catch (error) {
      throw new CustomException({
        code: "ERR_AUTHENTICATION_FAILED",
        message: 'The token is invalid',
        status: HttpStatus.UNAUTHORIZED,
      });
    }
  }
}


