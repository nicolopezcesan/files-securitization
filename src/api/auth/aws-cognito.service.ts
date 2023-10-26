import { HttpStatus, Injectable } from '@nestjs/common';
import { CognitoUserPool, AuthenticationDetails, CognitoUser, CognitoUserAttribute } from 'amazon-cognito-identity-js';
import { CustomException } from 'src/shared/exceptions/custom-exception';
import { ConfigService } from '@nestjs/config';
import { CognitoIdentityServiceProvider } from 'aws-sdk';

@Injectable()
export class AwsCognitoService {
  private readonly userPool: CognitoUserPool;

  constructor(
    private readonly configService: ConfigService,
  ) {
    this.userPool = new CognitoUserPool({
      UserPoolId: this.configService.get('AWS_COGNITO_USER_POOL_ID'),
      ClientId: this.configService.get('AWS_COGNITO_CLIENT_ID'),
    });
  }

  async userLogin(username: string, password: string): Promise<any> {
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
          username: result.getAccessToken().decodePayload().username,
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

  async userRegister(params: { username: string, email: string, password: string }) {
    const { username, email, password } = params;

    const attributeList = [
      new CognitoUserAttribute({ Name: 'email', Value: email }),
      // new CognitoUserAttribute({ Name: 'email_verified', Value: 'true' })
    ];

    return new Promise((resolve, reject) => {
      return this.userPool.signUp(username, password, attributeList, null,
        (err, res) => {
          if (err) {
            return reject(err);
          }
          return resolve(res.user);
        },
      );
    }).catch((error) => {
      if (error.code === 'InvalidPasswordException') {
        throw new CustomException({
          code: "ERR_INVALID_CREDENTIALS",
          message: 'The password is not strong enough',
          status: HttpStatus.BAD_REQUEST,
        });
      }

      throw new CustomException({
        code: "ERR_COGNITO_CONNECT",
        message: error.message,
        status: HttpStatus.INTERNAL_SERVER_ERROR,
      });
    })
  }

  async userConfirmRegistration(params: { username: string, confirmation_code: string }) {
    const { username, confirmation_code } = params;

    const cognitoUser = new CognitoUser({
      Username: username,
      Pool: this.userPool,
    });

    return new Promise((resolve, reject) => {
      return cognitoUser.confirmRegistration(confirmation_code, true,
        (err, res) => {
          if (err) {
            return reject(err);
          }
          return resolve({ message: 'The user confirmed successfully ' });
        },
      );
    }).catch((error) => {
      if (error.code === 'CodeMismatchException') {
        throw new CustomException({
          code: "ERR_CONFIRM_REGISTRATION",
          message: 'Invalid confirmation code provided, please try again',
          status: HttpStatus.BAD_REQUEST,
        });
      }

      throw new CustomException({
        code: "ERR_CONFIRM_REGISTRATION_UNKNOWN",
        message: error.message,
        status: HttpStatus.INTERNAL_SERVER_ERROR,
      });
    })
  }
}
