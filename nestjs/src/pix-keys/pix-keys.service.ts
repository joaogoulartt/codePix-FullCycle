import { Inject, Injectable, OnModuleInit } from '@nestjs/common';
import { CreatePixKeyDto } from './dto/create-pix-key.dto';
import { Repository } from 'typeorm';
import { PixKey, PixKeyKind } from './entities/pix-key.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { BankAccount } from 'src/bank-accounts/entities/bank-account.entity';
import { ClientGrpc } from '@nestjs/microservices';
import { PixKeyClientGrpc, RegisterPixKeyGrpcResponse } from './pix-keys.grpc';
import { lastValueFrom } from 'rxjs';

@Injectable()
export class PixKeysService implements OnModuleInit {
  private pixGrpcService: PixKeyClientGrpc;

  constructor(
    @InjectRepository(PixKey)
    private pixKeyRepository: Repository<PixKey>,
    @InjectRepository(BankAccount)
    private bankAccountRepository: Repository<BankAccount>,
    @Inject('PIX_PACKAGE')
    private pixGrpcPackage: ClientGrpc,
  ) {}

  onModuleInit() {
    this.pixGrpcService = this.pixGrpcPackage.getService('PixService');
  }

  async create(bankAccountId: string, createPixKeyDto: CreatePixKeyDto) {
    await this.bankAccountRepository.findOneOrFail({
      where: { id: bankAccountId },
    });

    const remotePixKey = await this.findRemotePixKey(createPixKeyDto);

    if (remotePixKey) {
      return this.createIfNotExists(bankAccountId, remotePixKey);
    } else {
      const createdRemotePixKey = await lastValueFrom(
        this.pixGrpcService.registerPixKey({
          ...createPixKeyDto,
          accountId: bankAccountId,
        }),
      );
      return this.pixKeyRepository.save({
        id: createdRemotePixKey.id,
        bank_account_id: bankAccountId,
        ...createPixKeyDto,
      });
    }
  }

  private async createIfNotExists(
    bankAccountId: string,
    remotePixKey: RegisterPixKeyGrpcResponse,
  ) {
    const hasLocalPixKey = await this.pixKeyRepository.exist({
      where: {
        key: remotePixKey.key,
      },
    });
    if (hasLocalPixKey) {
      throw new PixKeyAlreadyExistsError('Pix Key already exists');
    } else {
      return this.pixKeyRepository.save({
        id: remotePixKey.id,
        bank_account_id: bankAccountId,
        remotePixKey: remotePixKey.key,
        kind: remotePixKey.kind as PixKeyKind,
      });
    }
  }

  private async findRemotePixKey(data: {
    key: string;
    kind: string;
  }): Promise<RegisterPixKeyGrpcResponse | null> {
    try {
      return await lastValueFrom(this.pixGrpcService.find(data));
    } catch (e) {
      console.log(e);
      if (e.details === 'no key was found') return null;
      throw new PixKeyGrpcUnknownError('gRPC internal error');
    }
  }

  findAll(bankAccountId: string) {
    return this.pixKeyRepository.find({
      where: { bank_account_id: bankAccountId },
      order: { created_at: 'DESC' },
    });
  }

  findOne(id: string) {
    return `This action returns a #${id} pixKey`;
  }

  update(id: string, updatePixKeyDto: string) {
    return `This action updates a #${id} pixKey with ${updatePixKeyDto}`;
  }

  remove(id: string) {
    return `This action removes a #${id} pixKey`;
  }
}

export class PixKeyGrpcUnknownError extends Error {}

export class PixKeyAlreadyExistsError extends Error {}
