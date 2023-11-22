import { Injectable } from '@nestjs/common';
import axios from 'axios';

@Injectable()
export class ProcessDataService {
  private certificados: string[] = [];

  async obtenerTramitesCarnetManipulador(startDate: string, endDate: string): Promise<string[]> {
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

      this.certificados = response.data.lista;

      return this.certificados;
    } catch (error) {
        console.error('AxiosError:', error.response ? error.response.data : error.message);
        throw error;
      }
  }

  
}
