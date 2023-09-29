import { IsBoolean, IsDate, IsString } from 'class-validator';

export class CreateCertificateDTO {
  @IsString()
  transactionHash: string;

  @IsBoolean()
  success: boolean;

  @IsString()
  fileHash: string;

  @IsDate()
  timestampDate: Date;

  @IsString()
  timestampHash: string;

  @IsString()
  nameFile: string;

  @IsString()
  cid: string;

  @IsString()
  certificado: string;
}
