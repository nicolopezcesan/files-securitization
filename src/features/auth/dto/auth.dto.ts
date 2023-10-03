import { IsEmail, IsNotEmpty, IsString, MaxLength, MinLength } from 'class-validator';

export class ConfirmRegistrationDTO {
  @IsNotEmpty()
  @IsString()
  username: string;

  @IsNotEmpty()
  @IsString()
  confirmation_code: string;
}
export class LoginDTO {
  @IsNotEmpty()
  @IsString()
  username: string;

  @IsNotEmpty()
  @IsString()
  password: string;
}

export class RegisterDTO {
  @IsNotEmpty()
  @IsEmail()
  @IsString()
  email: string;

  @IsNotEmpty()
  @IsString()
  @MinLength(5)
  username: string;

  @IsNotEmpty()
  @IsString()
  @MinLength(6)
  @MaxLength(99)
  password: string;
}