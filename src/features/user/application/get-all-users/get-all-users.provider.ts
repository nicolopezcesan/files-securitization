import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { User } from '../../infraestructure/user.interface';

@Injectable()
export class GetAllUsersProvider {
  constructor(@InjectModel('User') private readonly userModel: Model<User>) {}

  async getAllUsers(): Promise<User[]> {
    return await this.userModel.find().exec();
  }
}