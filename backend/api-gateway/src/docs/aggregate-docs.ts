// Une la documentación de todos los servicios en una.

import { Logger } from '@nestjs/common';
import type { INestApplication } from '@nestjs/common';
import { SwaggerModule } from '@nestjs/swagger';
import type { OpenAPIObject, PathItemObject } from '@nestjs/swagger';

interface UpstreamDoc {
  name: string;
  url: string;
  namespace: string;
}

export async function setupAggregateDocs(
  app: INestApplication,
  base: OpenAPIObject,
  upstreams: UpstreamDoc[],
  timeoutMs: number,
): Promise<void> {
  const logger = new Logger('docs');

  const document: OpenAPIObject = {
    ...base,
    paths: { ...base.paths },
    components: { ...base.components, schemas: { ...(base.components?.schemas ?? {}) } },
    tags: [...(base.tags ?? [])],
  };

  const unavailable: string[] = [];

  const results = await Promise.all(
    upstreams.map(async (upstream) => {
      try {
        const response = await fetch(`${upstream.url}/docs/json`, {
          signal: AbortSignal.timeout(timeoutMs),
        });
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        return { upstream, spec: (await response.json()) as OpenAPIObject };
      } catch (error) {
        unavailable.push(upstream.name);
        logger.warn(
          `No se ha podido leer la documentacion de ${upstream.name}: ${describe(error)}`,
        );
        return null;
      }
    }),
  );

  for (const result of results) {
    if (!result) continue;
    const { upstream, spec } = result;

    for (const [path, item] of Object.entries(spec.paths ?? {})) {
      if (path.startsWith('/health')) continue;

      const publicPath = path.replace(/^\/api\/v1/, `/api/v1/${upstream.namespace}`);
      document.paths[publicPath] = prefixTags(item, upstream.namespace);
    }

    for (const [name, schema] of Object.entries(spec.components?.schemas ?? {})) {
      document.components!.schemas![`${upstream.namespace}.${name}`] = schema;
    }
  }

  if (unavailable.length > 0) {
    document.info = {
      ...document.info,
      description:
        `${document.info.description ?? ''}\n\n` +
        `**Documentacion incompleta.** No se ha podido contactar con: ${unavailable.join(', ')}. ` +
        'Reinicia el gateway cuando esten disponibles para verla completa.',
    };
  }

  SwaggerModule.setup('docs', app, document, {
    jsonDocumentUrl: 'docs/json',
    swaggerOptions: { persistAuthorization: true, tagsSorter: 'alpha', operationsSorter: 'alpha' },
  });

  logger.log(
    `Documentacion unificada en /docs (${Object.keys(document.paths).length} rutas` +
      `${unavailable.length ? `, sin ${unavailable.join(' ni ')}` : ''}).`,
  );
}

function prefixTags(item: PathItemObject, namespace: string): PathItemObject {
  const result: Record<string, unknown> = {};
  for (const [method, operation] of Object.entries(item as Record<string, unknown>)) {
    if (typeof operation === 'object' && operation !== null && 'tags' in operation) {
      const typed = operation as { tags?: string[] };
      result[method] = {
        ...operation,
        tags: (typed.tags ?? []).map((tag) => `${namespace}: ${tag}`),
      };
    } else {
      result[method] = operation;
    }
  }
  return result as PathItemObject;
}

function describe(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}
