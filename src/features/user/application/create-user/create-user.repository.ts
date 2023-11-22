import { Injectable } from '@nestjs/common';
import { User } from '../../infraestructure/user.interface'

@Injectable()
export class UserRepository {
  private readonly users: User[] = [];

  create(user: User): User {
    this.users.push(user);
    return user;
  }
}