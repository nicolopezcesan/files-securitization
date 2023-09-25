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
        (method: any) => method.type === 'function' && method.signature === inputData.slice(0, 10),
      );

      if (methodAbi) {
        const params = this.web3.eth.abi.decodeParameters(methodAbi.inputs, inputData.slice(10));
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
      const valueAtIndex0 = decodedTransaction.params['0'];
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
        (method: any) => method.type === 'function' && method.signature === inputData.slice(0, 10),
      );

      if (methodAbi && methodAbi.name === 'set') {
        const params = this.web3.eth.abi.decodeParameters(methodAbi.inputs, inputData.slice(10));
        const cid = params['0']; // El CID se encuentra en el primer parámetro
        return { cid };
      } else {
        throw new Error('Transacción no válida para obtener el CID.');
      }
    } catch (error) {
      console.error('Error al obtener el CID por hash de transacción:', error);
      throw new Error('Error al obtener el CID por hash de transacción.');
    }
  }

  //Deploy smart contract
  async deployContract(): Promise<string> {
    const contract = new this.web3.eth.Contract([
      {
        inputs: [],
        name: 'get',
        outputs: [
          {
            internalType: 'string',
            name: '',
            type: 'string',
          },
        ],
        stateMutability: 'view',
        type: 'function',
      },
      {
        inputs: [
          {
            internalType: 'string',
            name: '_data',
            type: 'string',
          },
        ],
        name: 'set',
        outputs: [],
        stateMutability: 'nonpayable',
        type: 'function',
      },
      {
        inputs: [],
        name: 'storedData',
        outputs: [
          {
            internalType: 'string',
            name: '',
            type: 'string',
          },
        ],
        stateMutability: 'view',
        type: 'function',
      },
    ]);
    const accounts = await this.web3.eth.getAccounts();
    const mainAccount = accounts[0];
    try {
      await this.web3.eth.personal.unlockAccount(mainAccount, '5uper53cr3t', 15000);

      const result = await contract
        .deploy({
          data: '608060405234801561001057600080fd5b50610733806100206000396000f3fe608060405234801561001057600080fd5b50600436106100415760003560e01c80632a1afcd9146100465780634ed3885e146100645780636d4ce63c14610080575b600080fd5b61004e61009e565b60405161005b9190610261565b60405180910390f35b61007e600480360381019061007991906103cc565b61012c565b005b61008861013f565b6040516100959190610261565b60405180910390f35b600080546100ab90610444565b80601f01602080910402602001604051908101604052809291908181526020018280546100d790610444565b80156101245780601f106100f957610100808354040283529160200191610124565b820191906000526020600020905b81548152906001019060200180831161010757829003601f168201915b505050505081565b806000908161013b919061062b565b5050565b60606000805461014e90610444565b80601f016020809104026020016040519081016040528092919081815260200182805461017a90610444565b80156101c75780601f1061019c576101008083540402835291602001916101c7565b820191906000526020600020905b8154815290600101906020018083116101aa57829003601f168201915b5050505050905090565b600081519050919050565b600082825260208201905092915050565b60005b8381101561020b5780820151818401526020810190506101f0565b60008484015250505050565b6000601f19601f8301169050919050565b6000610233826101d1565b61023d81856101dc565b935061024d8185602086016101ed565b61025681610217565b840191505092915050565b6000602082019050818103600083015261027b8184610228565b905092915050565b6000604051905090565b600080fd5b600080fd5b600080fd5b600080fd5b7f4e487b7100000000000000000000000000000000000000000000000000000000600052604160045260246000fd5b6102d982610217565b810181811067ffffffffffffffff821117156102f8576102f76102a1565b5b80604052505050565b600061030b610283565b905061031782826102d0565b919050565b600067ffffffffffffffff821115610337576103366102a1565b5b61034082610217565b9050602081019050919050565b82818337600083830152505050565b600061036f61036a8461031c565b610301565b90508281526020810184848401111561038b5761038a61029c565b5b61039684828561034d565b509392505050565b600082601f8301126103b3576103b2610297565b5b81356103c384826020860161035c565b91505092915050565b6000602082840312156103e2576103e161028d565b5b600082013567ffffffffffffffff811115610400576103ff610292565b5b61040c8482850161039e565b91505092915050565b7f4e487b7100000000000000000000000000000000000000000000000000000000600052602260045260246000fd5b6000600282049050600182168061045c57607f821691505b60208210810361046f5761046e610415565b5b50919050565b60008190508160005260206000209050919050565b60006020601f8301049050919050565b600082821b905092915050565b6000600883026104d77fffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff8261049a565b6104e1868361049a565b95508019841693508086168417925050509392505050565b6000819050919050565b6000819050919050565b600061052861052361051e846104f9565b610503565b6104f9565b9050919050565b6000819050919050565b6105428361050d565b61055661054e8261052f565b8484546104a7565b825550505050565b600090565b61056b61055e565b610576818484610539565b505050565b5b8181101561059a5761058f600082610563565b60018101905061057c565b5050565b601f8211156105df576105b081610475565b6105b98461048a565b810160208510156105c8578190505b6105dc6105d48561048a565b83018261057b565b50505b505050565b600082821c905092915050565b6000610602600019846008026105e4565b1980831691505092915050565b600061061b83836105f1565b9150826002028217905092915050565b610634826101d1565b67ffffffffffffffff81111561064d5761064c6102a1565b5b6106578254610444565b61066282828561059e565b600060209050601f8311600181146106955760008415610683578287015190505b61068d858261060f565b8655506106f5565b601f1984166106a386610475565b60005b828110156106cb578489015182556001820191506020850194506020810190506106a6565b868310156106e857848901516106e4601f8916826105f1565b8355505b6001600288020188555050505b50505050505056fea264697066735822122021b53072a48b80c2e40883ee8ff2f11ccd059864baa0b10b9faa9a7bf8b815b364736f6c63430008120033',
        })
        .send({ from: mainAccount, gas: '470000' });
      console.log(result);
    } catch (error) {
      console.log('ERROR AL DEPLOY DEL CONTRATO', error);
    }

    return '0x';
  }

  //Unlock main account
  async unlockAccount(): Promise<string> {
    const accounts = await this.web3.eth.getAccounts();
    const mainAccount = accounts[0];
    try {
      await this.web3.eth.personal.unlockAccount(mainAccount, '5uper53cr3t', 15000);
    } catch (error) {
      console.log('ERROR AL DESBLOQUEAR CUENTA', error);
    }

    return 'Cuenta desbloqueada';
  }
}
