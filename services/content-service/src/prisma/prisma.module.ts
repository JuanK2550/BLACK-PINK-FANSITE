import { Global, Module } from '@nestjs/common';
import { PrismaService } from './prisma.service';

/**
 * Global para que cualquier modulo del servicio pueda inyectar PrismaService
 * sin volver a importarlo. En un microservicio de un solo dominio, obligar a
 * repetir el import en cada modulo solo anade ruido.
 */
@Global()
@Module({
  providers: [PrismaService],
  exports: [PrismaService],
})
export class PrismaModule {}
