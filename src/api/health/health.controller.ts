import { Controller, Get } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';

@ApiTags('Admin')
@Controller('health')
export class HealthController {
  @Get()
  checkHealth() {
    return 'OK running';
  }
}
