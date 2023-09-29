import { Controller, Post, Body, HttpException } from '@nestjs/common';
import { AwsCognitoService } from './aws-cognito.service';

@Controller('auth')
export class AuthController {
  constructor(
    private readonly AwsCognitoService: AwsCognitoService,
  ) { }

  @Post('login')
  async login(@Body() body: { username: string; password: string }): Promise<any> {
    const { username, password } = body;
    return await this.AwsCognitoService.authenticateUser(username, password);
  }
}
