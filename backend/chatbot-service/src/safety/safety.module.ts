// Módulo de seguridad del chat.

import { Global, Module } from '@nestjs/common';
import { AuditService } from './audit.service';
import { SafetyService } from './safety.service';

@Global()
@Module({
  providers: [AuditService, SafetyService],
  exports: [AuditService, SafetyService],
})
export class SafetyModule {}
