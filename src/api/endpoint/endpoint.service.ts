import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Web3 from 'web3';
import * as crypto from 'crypto';


@Injectable()
export class EndpointService {
  private web3: Web3;
  private contract: any;

  constructor(private readonly configService: ConfigService) {

    const blockchainUrl = this.configService.get<string>('BLOCKCHAIN_URL');
    if (!blockchainUrl) {
      throw new Error('BLOCKCHAIN_URL no está definido en .env');
    };
    
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
    console.log('Contract ABI:', contractABI);
    
    if (!contractAddress) {
      throw new Error('Definir CONTRACT_ADDRESS ');
    }
    if (!contractABI) {
      throw new Error('Definir CONTRACT_ABI ');
    }

    //Creacion del contrato
    this.contract = new this.web3.eth.Contract(contractABI, contractAddress);
  }

  //Calculamos el sha256 del JSON
  calculateSHA256(data: any): string {
    const jsonData = JSON.stringify(data);
    const hash = crypto.createHash('sha256').update(jsonData).digest('hex');
    return hash;
  }

  //Guardamos los datos en la Blockchain
  async storeData(data: any): Promise<string> {
    const jsonData = JSON.stringify(data);
    console.log('JSON Data:', jsonData);

    const accounts = await this.web3.eth.getAccounts();
    const result = await this.contract.methods.set(jsonData).send({ from: accounts[0] });

    return result.transactionHash;
}


// Decodificar el bloque 
async getDecodedTransactionData(hash: string): Promise<any> {
  try {
    const transaction = await this.web3.eth.getTransaction(hash);
    const inputData = transaction.input;
    const methodAbi = this.contract.options.jsonInterface.find(
      (method: any) =>
        method.type === 'function' && method.signature === inputData.slice(0, 10)
    );

    if (methodAbi) {
      const params = this.web3.eth.abi.decodeParameters(
        methodAbi.inputs,
        inputData.slice(10)
      );
      return {
        methodName: methodAbi.name,
        params,
      };
    } else {
      return {
        error: 'Error ABI',
      };
    }
  } catch (error) {
    console.error('Error:', error);
    throw new Error('Error fetch.');
  }
}

// Filtrar el bloque decodificado en el parametro 0 y mostrarlo como JSON
async getData0FromDecodedTransaction(hash: string): Promise<any> {
  try {
    const decodedTransaction = await this.getDecodedTransactionData(hash);
    const valueAtIndex0 = decodedTransaction.params["0"];
    return JSON.parse(valueAtIndex0);

  } catch (error) {
    console.error('Error:', error);
    throw new Error('Error fetch');
  }
}

// Obtener el CID relacionado con la transacción
  async getDataByTransactionHash(transactionHash: string): Promise<any> {
    try {
      const transaction = await this.web3.eth.getTransaction(transactionHash);
      if (!transaction || !transaction.input) {
        throw new Error('Transacción no encontrada o sin entrada.');
      }

      const inputData = transaction.input;
      const methodAbi = this.contract.options.jsonInterface.find(
        (method: any) =>
          method.type === 'function' && method.signature === inputData.slice(0, 10)
      );

      if (methodAbi && methodAbi.name === 'set') {
        const params = this.web3.eth.abi.decodeParameters(
          methodAbi.inputs,
          inputData.slice(10)
        );
        const cid = params["0"]; // El CID se encuentra en el primer parámetro
        return { cid };
      } else {
        throw new Error('Transacción no válida para obtener el CID.');
      }
    } catch (error) {
      console.error('Error al obtener el CID por hash de transacción:', error);
      throw new Error('Error al obtener el CID por hash de transacción.');
    }
  }


  //
  
}
