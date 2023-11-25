import { Injectable, CanActivate, ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { Observable } from 'rxjs';
import { Reflector } from '@nestjs/core';
import { ApiKeyAuthProvider } from './api-key-auth.provider';

@Injectable()
export class ApiKeyAuthGuard implements CanActivate {
  constructor(private readonly reflector: Reflector, private readonly apiKeyAuthProvider: ApiKeyAuthProvider) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const apiKey = context.switchToHttp().getRequest().headers['apikey'];

    const result = await this.apiKeyAuthProvider.validateApiKey(apiKey);

    if (!result.isValid) {
      throw new UnauthorizedException(result.message || 'API key inválida');
    }

    return true;
  }
}