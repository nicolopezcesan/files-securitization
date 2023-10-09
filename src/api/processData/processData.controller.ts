import { Controller, Get, Param } from '@nestjs/common';
import axios from 'axios';

@Controller('NumerosCertificados')
export class CertificadosController {
  @Get('obtenerTramitesCarnetManipulador/:startDate/:endDate')
  async obtenerTramitesCarnetManipulador(
    @Param('startDate') startDate: string,
    @Param('endDate') endDate: string,
  ) {
    try {
      const url = `https://interoperabilidad.cordoba.gob.ar/api/obtenerTramitesCarnetManipulador/${startDate}/${endDate}`;
      
      // Credenciales
      const username = 'SQR_badi_srl';
      const password = 'iuoERT85dau';

      const response = await axios.get(url, {
        auth: {
          username,
          password,
        },
      });

      
      return response.data.lista;
    } catch (error) {
      throw error;
    }
  }
}