import { Injectable, Logger, type OnModuleDestroy, type OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '../../prisma/generated/client';
import { parseConnection } from './connection';

/**
 * Cliente de Prisma con el ciclo de vida atado al del modulo de Nest.
 *
 * Desde Prisma 7 el cliente se conecta a traves de un adaptador de driver
 * (aqui `pg`) en vez de con un motor propio: la cadena de conexion se le pasa
 * en el constructor y ya no vive en schema.prisma.
 *
 * El servicio NO se conecta de forma implicita en la primera consulta: se
 * conecta al arrancar el modulo. Asi un fallo de credenciales o de red revienta
 * en el arranque, que es cuando se puede ver, y no en la primera peticion de
 * un usuario.
 */
@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(PrismaService.name);

  constructor(config: ConfigService) {
    const { connectionString, schema } = parseConnection(
      config.get<string>('DATABASE_URL_CONTENT'),
    );

    super({ adapter: new PrismaPg({ connectionString }, { schema }) });
  }

  async onModuleInit(): Promise<void> {
    await this.$connect();
    this.logger.log('Conectado a PostgreSQL (esquema content).');
  }

  async onModuleDestroy(): Promise<void> {
    await this.$disconnect();
  }

  /** Comprobacion de vida real de la base: no basta con que el proceso exista. */
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
