import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { User } from 'src/features/user/infraestructure/user.interface';

@Injectable()
export class ApiKeyAuthProvider {
  constructor(@InjectModel('User') private readonly userModel: Model<User>) {}

  async validateApiKey(apiKey: string): Promise<{ isValid: boolean; message?: string }> {
    try {
      const user = await this.userModel.findOne({ apiKey }, 'apiKey vencimiento').lean().exec();

      if (!user) {
        console.log('La API key no existe: ' + apiKey);
        return { isValid: false, message: 'API key inexistente' };
      }

      if (user.vencimiento < new Date()) {
        console.log('La API key ha vencido: ' + apiKey);
        return { isValid: false, message: 'API key vencida' };
      }

      console.log('La API key es válida: ' + apiKey);
      return { isValid: true };
    } catch (error) {
      console.error('Error al validar la API key:', error);
      return { isValid: false, message: 'Error al validar la API key' };
    }
  }
}
