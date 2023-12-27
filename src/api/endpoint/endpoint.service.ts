import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectModel } from '@nestjs/mongoose';
import * as crypto from 'crypto';
import { Model } from 'mongoose';
import { BlockchainProvider } from 'src/configs/blockchain/blockchain.provider';
import { User, UserModel } from 'src/features/user/infraestructure/user.interface';


@Injectable()
export class EndpointService {
  private readonly blockchainProvider: BlockchainProvider;

  constructor(
    private readonly configService: ConfigService,
    @InjectModel(UserModel.modelName) private readonly userModel: Model<User>,
    ) {
    this.blockchainProvider = new BlockchainProvider(configService);
  }

  //Calculamos el sha256 del JSON
  calculateSHA256(data: any): string {
    const jsonData = JSON.stringify(data);
    const hash = crypto.createHash('sha256').update(jsonData).digest('hex');
    return hash;
  }

  //Guardamos los datos en la Blockchain
  async storeData(data: any, apiKey: string): Promise<string> {
    const web3 = this.blockchainProvider.getWeb3Instance();
    const contract = this.blockchainProvider.getContractInstance();
    
    await this.userModel.updateOne({ apiKey }, { $inc: { registrosProcesados: 1 } });

    const jsonData = JSON.stringify(data);
   
    const accounts = await web3.eth.getAccounts();
    const result = await contract.methods.set(jsonData).send({ from: accounts[0] });
    console.log('JSON success', jsonData,'Transaction Hash', result.transactionHash, ' Result',  result);

    return result.transactionHash;
  }

  

  //Decodificamos el bloque en el parametro 0 para obtener la informacion del JSON.
  async getData0FromDecodedTransaction(hash: string): Promise<any> {
    try {
      const decodedTransaction = await this.getDecodedTransactionData(hash);
      const valueAtIndex0 = decodedTransaction.params['0'];
      return JSON.parse(valueAtIndex0);
    } catch (error) {
      console.error('Error:', error);
      throw new Error('Error fetch');
    }
  }

  async getDecodedTransactionData(hash: string): Promise<any> {
    const web3 = this.blockchainProvider.getWeb3Instance();
    const contract = this.blockchainProvider.getContractInstance();

    try {
      const transaction = await web3.eth.getTransaction(hash);
      const inputData = transaction.input;
      const methodAbi = contract.options.jsonInterface.find(
        (method: any) => method.type === 'function' && method.signature === inputData.slice(0, 10),
      );

      if (methodAbi) {
        const params = web3.eth.abi.decodeParameters(methodAbi.inputs, inputData.slice(10));
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


  // Obtener el CID relacionado con la transacción
  // async getDataByTransactionHash(transactionHash: string): Promise<any> {
  //   const web3 = this.blockchainProvider.getWeb3Instance();
  //   const contract = this.blockchainProvider.getContractInstance();
  //   try {
  //     const transaction = await web3.eth.getTransaction(transactionHash);
  //     if (!transaction || !transaction.input) {
  //       throw new Error('Transacción no encontrada o sin entrada.');
  //     }

  //     const inputData = transaction.input;
  //     const methodAbi = contract.options.jsonInterface.find(
  //       (method: any) => method.type === 'function' && method.signature === inputData.slice(0, 10),
  //     );

  //     if (methodAbi && methodAbi.name === 'set') {
  //       const params = web3.eth.abi.decodeParameters(methodAbi.inputs, inputData.slice(10));
  //       const cid = params['0']; 
  //       return { cid };
  //     } else {
  //       throw new Error('Transacción no válida para obtener el CID.');
  //     }
  //   } catch (error) {
  //     console.error('Error al obtener el CID por hash de transacción:', error);
  //     throw new Error('Error al obtener el CID por hash de transacción.');
  //   }
  // }



  
}
