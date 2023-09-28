import { HttpStatus, Injectable } from '@nestjs/common';
import { CognitoUserPool, AuthenticationDetails, CognitoUser } from 'amazon-cognito-identity-js';
import { CustomException } from 'src/shared/exceptions/custom-exception';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class AwsCognitoService {
  private readonly userPool: CognitoUserPool;

  constructor(
    private readonly configService: ConfigService,
  ) {
    this.userPool = new CognitoUserPool({
      UserPoolId: this.configService.get('COGNITO_USER_POOL_ID'),
      ClientId: this.configService.get('COGNITO_CLIENT_ID'),
    });
  }

  async authenticateUser(username: string, password: string): Promise<any> {
    const authenticationDetails = new AuthenticationDetails({
      Username: username,
      Password: password,
    });

    const cognitoUser = new CognitoUser({
      Username: username,
      Pool: this.userPool,
    });

    return new Promise((resolve, reject) => {
      cognitoUser.authenticateUser(authenticationDetails, {
        onFailure: (err) => reject(err),
        onSuccess: (result) => resolve({
          accessToken: result.getAccessToken().getJwtToken(),
        }),
      });
    }).catch((error) => {
      if (error.code === 'NotAuthorizedException') {
        throw new CustomException({
          code: "ERR_INVALID_CREDENTIALS",
          message: 'Invalid credentials',
          status: HttpStatus.UNAUTHORIZED,
        });
      }

      throw new CustomException({
        code: "ERR_COGNITO_CONNECT",
        message: error.message,
        status: HttpStatus.INTERNAL_SERVER_ERROR,
      });
    });
  }
}
