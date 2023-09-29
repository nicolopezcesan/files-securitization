import { Controller, Post, Body } from '@nestjs/common';
import { AwsCognitoService } from './aws-cognito.service';
import { ApiOperation, ApiBody, ApiTags } from '@nestjs/swagger';
import { IsBoolean, IsString } from 'class-validator';

export class LoginDTO {
  @IsString()
  username: string;

  @IsString()
  password: string;
}

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
    return await this.AwsCognitoService.authenticateUser(username, password);
  }
}
