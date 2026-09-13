// Exportaciones de service-core.

export { AllExceptionsFilter } from './envelope/exception.filter';
export {
  Enveloped,
  ResponseEnvelopeInterceptor,
  enveloped,
  paginated,
} from './envelope/response.interceptor';

export {
  ContentQueryDto,
  LocaleQueryDto,
  PaginatedContentQueryDto,
  PaginatedLocaleQueryDto,
  PaginationQueryDto,
  toBooleanQuery,
} from './pagination/pagination.dto';
export { buildPageMeta } from './pagination/paginate';

export { CacheModule } from './cache/cache.module';
export { CacheService } from './cache/cache.service';
export { CACHE_OPTIONS, REDIS_CLIENT } from './cache/cache.tokens';
export type { CacheModuleOptions } from './cache/cache.tokens';

export { buildLoggerConfig } from './logging/logger';
export type { LoggerOptions } from './logging/logger';

export { configureService, useStructuredLogger } from './bootstrap';
export type { ServiceSetupOptions } from './bootstrap';

export { applyTrustProxy, parseTrustProxy } from './http/trust-proxy';
export { captureServerError, initSentry } from './observability/sentry';
