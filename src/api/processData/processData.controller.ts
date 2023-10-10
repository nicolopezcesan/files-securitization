import { Controller, Get, Param, Res  } from '@nestjs/common';
import axios from 'axios';

@Controller('NumerosCertificados')
export class CertificadosController {
  private certificados: string[] = []; // Variable para almacenar la lista de certificados

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

      this.certificados = response.data.lista; // Almacena la lista de certificados

      return this.certificados; // Devuelve la lista de certificados
    } catch (error) {
      throw error;
    }
  }

  
  
}