
import { Injectable } from '@nestjs/common';
import { User } from '../../infraestructure/user.interface'
import { CreateUserDto } from '../../domain/user.dto' ;
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { randomBytes } from 'crypto';

@Injectable()
export class CreateUserProvider {
  UserRepository: any;
  constructor(@InjectModel('User') private readonly userModel: Model<User>) {}

  private generateApiKey(): string {
    const apiKeyLength = 32; 
    const bytes = randomBytes(apiKeyLength / 2);
    return bytes.toString('hex');
  }

  private formatDate(vencimiento: string): Date {
    const [day, month, year] = vencimiento.split('-').map(Number);
    return new Date(year, month - 1, day);
  }

  async createUser(createUserDto: CreateUserDto): Promise<User> {
    const apiKey = this.generateApiKey();
    const formattedVencimiento = this.formatDate(createUserDto.vencimiento);

    const user = new this.userModel({
      ...createUserDto,
      apiKey,
      vencimiento: formattedVencimiento,
      registrosProcesados: 0,
    });

    return await user.save();
  }


}
