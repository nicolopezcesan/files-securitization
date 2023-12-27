import { Controller, Post, Body, Get, Param, Res, UseGuards } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { ContractService } from './contract.service';

@ApiTags('Admin')
@Controller('')
export class ContractController {
  constructor(
    private readonly contractService: ContractService,    
    ) {}  

  @Get('deploy-contract')
  async deployContract(@Res() res): Promise<void> {
    try {
      const contractAddress = await this.contractService.deployContract();
      res.send(contractAddress);
    } catch (error) {
      console.error('Error al desplegar el contrato:', error);
      res.status(500).send('Error al desplegar el contrato');
    }
  }

  
}