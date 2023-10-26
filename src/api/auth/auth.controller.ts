import { Controller, Post, Body } from '@nestjs/common';
import { AwsCognitoService } from './aws-cognito.service';
import { ApiOperation, ApiBody, ApiTags } from '@nestjs/swagger';
import { ConfirmRegistrationDTO, LoginDTO, RegisterDTO } from 'src/features/auth/dto/auth.dto';

@Controller('auth')
export class AuthController {
  constructor(
    private readonly AwsCognitoService: AwsCognitoService,
  ) { }

  @ApiOperation({ summary: 'Login' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        username: {
          type: 'string',
        },
        password: {
          type: 'string',
        }
      },
    },
  })
  @Post('login')
  async login(@Body() body: LoginDTO): Promise<any> {
    const { username, password } = body;
    return await this.AwsCognitoService.userLogin(username, password);
  }

  @ApiOperation({ summary: 'Register' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        email: {
          type: 'string',
        },
        username: {
          type: 'string',
        },
        password: {
          type: 'string',
        }
      },
    },
  })
  @Post('register')
  async createUser(@Body() body: RegisterDTO): Promise<any> {
    return await this.AwsCognitoService.userRegister(body);
  }

  @ApiOperation({ summary: 'ConfirmRegistration' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        username: {
          type: 'string',
        },
        confirmation_code: {
          type: 'string',
        },
      },
    },
  })
  @Post('confirm-registration')
  async confirmUser(@Body() body: ConfirmRegistrationDTO): Promise<any> {
    return await this.AwsCognitoService.userConfirmRegistration(body);
  }
}
