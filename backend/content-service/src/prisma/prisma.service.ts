// Cliente de Prisma ligado al ciclo de vida de Nest.

import { Injectable, Logger, type OnModuleDestroy, type OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '../../prisma/generated/client';
import { parseConnection } from './connection';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(PrismaService.name);

  constructor(config: ConfigService) {
    const { connectionString, schema } = parseConnection(
      config.get<string>('DATABASE_URL_CONTENT'),
    );

    // PrismaPg no lee el ?schema= de la URL: hay que pasarlo aparte.
    super({ adapter: new PrismaPg({ connectionString }, { schema }) });
  }

  async onModuleInit(): Promise<void> {
    await this.$connect();
    this.logger.log('Conectado a PostgreSQL (esquema content).');
  }

  async onModuleDestroy(): Promise<void> {
    await this.$disconnect();
  }

  async isReachable(): Promise<boolean> {
    try {
      await this.$queryRaw`SELECT 1`;
      return true;
    } catch (error) {
      this.logger.error('La base de datos no responde.', error);
      return false;
    }
  }
}
