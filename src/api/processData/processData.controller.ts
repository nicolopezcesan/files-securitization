import { Controller, Get, Param } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { ProcessDataService } from './processData.service';


@ApiTags('Carnet de manipulación de alimentos')
@Controller('')
export class ProcessDataController {
  constructor(private readonly processDataService: ProcessDataService) {}

  @Get('obtenerTramitesCarnetManipulador/:startDate/:endDate')
  async obtenerTramitesCarnetManipulador(
    @Param('startDate') startDate: string,
    @Param('endDate') endDate: string,
  ) {
    return this.processDataService.obtenerTramitesCarnetManipulador(startDate, endDate);
  }catch (error) {
    console.error('Error del Controlador:', error.message);
    return { error: 'Error interno del servidor' }; 
  }
}