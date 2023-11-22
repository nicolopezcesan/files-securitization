import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Web3 from 'web3';

@Injectable()
export class BlockchainProvider {
  private web3: Web3;
  private contract: any;
  private secretKey: string;
  

  constructor(private readonly configService: ConfigService) {
    this.initializeBlockchain();
  }

  private initializeBlockchain(): void {
    const blockchainUrl = this.configService.get<string>('BLOCKCHAIN_URL');
    this.secretKey = this.configService.get<string>('SECRET_KEY');
    if (!blockchainUrl) {
      throw new Error('BLOCKCHAIN_URL no está definido en .env');
    }

    const provider = new Web3.providers.HttpProvider(blockchainUrl);
    this.web3 = new Web3(provider);

    const contractAddress = this.configService.get<string>('CONTRACT_ADDRESS');

    let contractABI = this.configService.get<any>('CONTRACT_ABI');
    try {
      contractABI = JSON.parse(contractABI);
    } catch (error) {
      console.error('Error parse CONTRACT_ABI:', error);
      throw new Error('Error parse CONTRACT_ABI.');
    }

    if (!contractAddress) {
      throw new Error('Definir CONTRACT_ADDRESS ');
    }
    if (!contractABI) {
      throw new Error('Definir CONTRACT_ABI ');
    }

    // Creacion instancia del contrato
    this.contract = new this.web3.eth.Contract(contractABI, contractAddress);
  }

  getWeb3Instance(): Web3 {
    return this.web3;
  }

  getContractInstance(): any {
    return this.contract;
  }

  getSecretKey(): string {
    return this.secretKey;
  }


}
