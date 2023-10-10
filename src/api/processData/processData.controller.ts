import { Controller, Get, Param, Res  } from '@nestjs/common';
import axios from 'axios';
import { Response } from 'express';
import * as fs from 'fs';
import * as path from 'path';

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

  @Get('obtenerCertificadoCarnetManipulador/:numeroCertificado')
  async obtenerCertificadoCarnetManipulador(
    @Param('numeroCertificado') numeroCertificado: string,
    @Res() res: Response,
  ) {
    try {
      const url = `https://interoperabilidad.cordoba.gob.ar/api/obtenerCertificadoCarnetManipulador/${numeroCertificado}`;

      // Credenciales
      const username = 'SQR_badi_srl';
      const password = 'iuoERT85dau';

      const response = await axios.get(url, {
        auth: {
          username,
          password,
        },
        responseType: 'arraybuffer', // Configura el tipo de respuesta como array de bytes
      });

      // Verifica si la respuesta es un archivo (application/octet-stream)
      if (response.headers['content-type'] === 'application/octet-stream') {
        // Ruta donde se guardará el archivo en documentsTemp
        const filePath = path.join('documentsTemp', `${numeroCertificado}.pdf`);

        // Guarda el archivo en la carpeta documentsTemp
        fs.writeFileSync(filePath, response.data);

        // Envía el archivo como respuesta
        res.download(filePath, `${numeroCertificado}.pdf`, (err) => {
          if (err) {
            throw err;
          } else {
            
          }
        });
      } else {
        // Manejar el caso en que la respuesta no sea un archivo
        throw new Error('La respuesta no es un archivo.');
      }
    } catch (error) {
      throw error;
    }
  }
  
}