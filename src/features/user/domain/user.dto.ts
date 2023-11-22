import { IsNotEmpty, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateUserDto {
  @IsNotEmpty()
  @IsString()
  @ApiProperty({
    description: 'Nombre del usuario',
    example: 'Nombre del Usuario',
  })
  nombre: string;

  @IsNotEmpty()
  @IsString()
  @ApiProperty({
    description: 'Fecha de vencimiento en formato DD-MM-AAAA',
    example: '31-12-2023',
  })
  vencimiento: string;
}