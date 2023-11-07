import { Injectable } from '@nestjs/common';
import { CreateBankAccountDto } from './dto/create-bank-account.dto';
import { Repository } from 'typeorm';
import { BankAccount } from './entities/bank-account.entity';
import { InjectRepository } from '@nestjs/typeorm';

@Injectable()
export class BankAccountsService {
  constructor(
    @InjectRepository(BankAccount)
    private bankAccountRepository: Repository<BankAccount>,
  ) {}

  create(createBankAccountDto: CreateBankAccountDto) {
    return this.bankAccountRepository.save(createBankAccountDto);
  }

  findAll() {
    return this.bankAccountRepository.find();
  }

  findOne(id: string) {
    return this.bankAccountRepository.findOneOrFail({
      where: { id },
    });
  }

  update(id: number, updateBankAccountDto: string) {
    return `This action updates a #${id} bankAccount to ${updateBankAccountDto}`;
  }

  remove(id: number) {
    return `This action removes a #${id} bankAccount`;
  }
}
