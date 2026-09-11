/* Envelope de respuesta y manejo de errores ------------------------------- */
export { AllExceptionsFilter } from './envelope/exception.filter';
export {
  Enveloped,
  ResponseEnvelopeInterceptor,
  enveloped,
  paginated,
} from './envelope/response.interceptor';

/* Paginacion e idioma ------------------------------------------------------ */
export {
  ContentQueryDto,
  LocaleQueryDto,
  PaginatedContentQueryDto,
  PaginatedLocaleQueryDto,
  PaginationQueryDto,
  toBooleanQuery,
} from './pagination/pagination.dto';
export { buildPageMeta } from './pagination/paginate';

/* Cache -------------------------------------------------------------------- */
export { CacheModule } from './cache/cache.module';
export { CacheService } from './cache/cache.service';
export { CACHE_OPTIONS, REDIS_CLIENT } from './cache/cache.tokens';
export type { CacheModuleOptions } from './cache/cache.tokens';

/* Logging ------------------------------------------------------------------ */
export { buildLoggerConfig } from './logging/logger';
export type { LoggerOptions } from './logging/logger';

/* Arranque comun ----------------------------------------------------------- */
export { configureService } from './bootstrap';
export type { ServiceSetupOptions } from './bootstrap';
