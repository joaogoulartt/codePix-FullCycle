import { Inject, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { BankAccount } from 'src/bank-accounts/entities/bank-account.entity';
import { DataSource, Repository } from 'typeorm';
import { CreateTransactionDto } from './dto/create-transaction.dto';
import {
  Transaction,
  TransactionOperation,
  TransactionStatus,
} from './entities/transaction.entity';
import { ClientKafka } from '@nestjs/microservices';
import { lastValueFrom } from 'rxjs';
import { ConfirmTransactionDto } from './dto/confirm-transaction.dto';
import { CreateTransactionFromAnotherBankAccountDto } from './dto/create-transaction-from-another-bank-account.dto';
import { PixKey } from 'src/pix-keys/entities/pix-key.entity';

@Injectable()
export class TransactionsService {
  constructor(
    @InjectRepository(Transaction)
    private transactionRepository: Repository<Transaction>,
    @InjectRepository(BankAccount)
    private bankAccountRepository: Repository<BankAccount>,
    private dataSource: DataSource,
    @Inject('KAFKA_SERVICE')
    private kafkaService: ClientKafka,
  ) {}

  async create(
    bankAccountId: string,
    createTransactionDto: CreateTransactionDto,
  ) {
    const transaction = await this.dataSource.transaction(async (manager) => {
      const bankAccount = await manager.findOneOrFail(BankAccount, {
        where: { id: bankAccountId },
        lock: { mode: 'pessimistic_write' },
      });

      const transaction = manager.create(Transaction, {
        ...createTransactionDto,
        amount: createTransactionDto.amount * -1,
        bank_account_id: bankAccountId,
        operation: TransactionOperation.debit,
      });

      await manager.save(transaction);

      bankAccount.balance += transaction.amount;
      await manager.save(bankAccount);
      return transaction;
    });

    const sendData = {
      id: transaction.id,
      accountId: bankAccountId,
      amount: createTransactionDto.amount,
      pixKeyTo: createTransactionDto.pix_key_key,
      pixKeyKindTo: createTransactionDto.pix_key_kind,
      description: createTransactionDto.description,
    };

    await lastValueFrom(this.kafkaService.emit('transactions', sendData));

    return transaction;
  }

  findAll(bankAccountId: string) {
    return this.transactionRepository.find({
      where: { bank_account_id: bankAccountId },
      order: { created_at: 'DESC' },
    });
  }

  findOne(bankAccountId: string, id: string) {
    return this.transactionRepository.find({
      where: { bank_account_id: bankAccountId, id: id },
      order: { created_at: 'DESC' },
    });
  }

  async createFromAnotherBankAccount(
    input: CreateTransactionFromAnotherBankAccountDto,
  ) {
    const transaction = await this.dataSource.transaction(async (manager) => {
      const pixKey = await manager.findOneOrFail(PixKey, {
        where: {
          key: input.pixKeyTo,
          kind: input.pixKeyKindTo,
        },
      });

      const bankAccount = await manager.findOneOrFail(BankAccount, {
        where: { id: pixKey.bank_account_id },
        lock: { mode: 'pessimistic_write' },
      });

      const transaction = await manager.create(Transaction, {
        related_transaction_id: input.id,
        amount: input.amount,
        description: input.description,
        bank_account_id: bankAccount.id,
        bank_account_from_id: input.accountId,
        pix_key_key: input.pixKeyTo,
        pix_key_kind: input.pixKeyKindTo,
        operation: TransactionOperation.credit,
        status: TransactionStatus.completed,
      });

      await manager.save(transaction);

      bankAccount.balance += transaction.amount;
      await manager.save(bankAccount);
    });

    const sendData = {
      ...input,
      status: 'confirmed',
    };

    await lastValueFrom(
      this.kafkaService.emit('transaction_confirmation', sendData),
    );

    return transaction;
  }

  async confirmTransaction(input: ConfirmTransactionDto) {
    const transaction = await this.transactionRepository.findOneOrFail({
      where: {
        id: input.id,
      },
    });

    await this.transactionRepository.update(
      { id: input.id },
      {
        status: TransactionStatus.completed,
      },
    );

    const sendData = {
      id: input.id,
      accountId: transaction.bank_account_id,
      amount: Math.abs(transaction.amount),
      pixkeyto: transaction.pix_key_key,
      pixKeyKindTo: transaction.pix_key_kind,
      description: transaction.description,
      status: TransactionStatus.completed,
    };

    await lastValueFrom(
      this.kafkaService.emit('transaction_confirmation', sendData),
    );

    return transaction;
  }
}
