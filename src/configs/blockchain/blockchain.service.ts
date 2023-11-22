import { Injectable } from '@nestjs/common';
import Web3 from 'web3';
import { ConfigService } from '@nestjs/config';


@Injectable()
export class AccountUnlockService {
    private web3: Web3;
    private contract: any;
    private readonly secretKey: string

    constructor(
        private readonly configService: ConfigService
        )  {
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
        
            //Creacion del contrato
            this.contract = new this.web3.eth.Contract(contractABI, contractAddress);
          }

    async unlockAccount(): Promise<string> {
        const accounts = await this.web3.eth.getAccounts();
        const mainAccount = accounts[0];
        try {
          await this.web3.eth.personal.unlockAccount(mainAccount, this.secretKey, 0);
          console.log('Cuenta Desbloqueada desde PROVIDER');
        } catch (error) {
          console.error('Error al desbloquear la cuenta:', error);
          throw new Error('Error al desbloquear la cuenta');
        }
    
        return 'Cuenta desbloqueada';
      }
    
      async lockAccount(): Promise<void> {
        const accounts = await this.web3.eth.getAccounts();
        const mainAccount = accounts[0];
        try {
          await this.web3.eth.personal.lockAccount(mainAccount);
          console.log(' Cuenta Bloqueada ');
        } catch (error) {
          console.error('Error al bloquear la cuenta:', error);
          throw new Error('Error al bloquear la cuenta');
        }
      }
    }