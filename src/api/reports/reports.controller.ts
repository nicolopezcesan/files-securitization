import { Controller, Get, Param, Res} from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { AuthGuard } from '../auth/auth.guard';
import { ReportProvider } from 'src/features/report/application/report.provider';

@ApiTags('Carnet de manipulación de alimentos')
@Controller('')
export class ReportController {  
  constructor(
    private readonly reportProvider: ReportProvider, 
  ) {}  
  // @UseGuards(AuthGuard)
  @Get('admin/acuse/:hash')
  @ApiOperation({summary: '.PDF', description: 'Comprobante de operación .INMUTA' })
  async generateAcuse(@Param('hash') hash: string, @Res() res): Promise<void> {    
      await this.reportProvider.generateAcuse(hash, res);
  }
}