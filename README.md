# BLACKPINK Fansite

> **Sitio de fans no oficial. No afiliado a YG Entertainment ni a BLACKPINK.**
> Proyecto informativo y sin animo de lucro. Todas las marcas, imagenes y grabaciones
> pertenecen a sus respectivos titulares. La musica se reproduce **unicamente** mediante
> el reproductor incrustado oficial de Spotify: este proyecto no aloja
> ni distribuye archivos de audio o video con copyright.

Monorepo trilingue (es / en / ko) con frontend en Next.js 15 y backend de microservicios
en NestJS.

---

## Estado

**Fase 13 completada:** el sitio entero —contenido, discografía con reproductor de Spotify,
cronología, galería, quiz, comparador, chatbot PINKY con voz— más la automatización:
tests unitarios, de componentes, de servicios, e2e y de accesibilidad; CI, despliegues,
Lighthouse, CodeQL, copias diarias y versionado automático. Ver [Tests](#tests) y
[Integración y despliegue continuos](#integración-y-despliegue-continuos).

---

## Requisitos

| Herramienta | Version           |
| ----------- | ----------------- |
| Node.js     | >= 20.12 (LTS 22) |
| pnpm        | >= 10             |
| Docker      | opcional          |

```bash
npm install -g pnpm     # si aun no lo tienes
```

---

## Arranque rapido

```bash
pnpm install         # instala todo el workspace
pnpm setup           # crea el .env a partir de .env.example
pnpm docker:up:deps  # levanta Postgres (pgvector) y Redis   [opcional en Fase 1]
pnpm dev             # arranca el frontend y los 5 microservicios
```

| Servicio          | URL                           |
| ----------------- | ----------------------------- |
| Frontend          | http://localhost:3000         |
| api-gateway       | http://localhost:4000/health  |
| content-service   | http://localhost:4001/health  |
| media-service     | http://localhost:4002/health  |
| chatbot-service   | http://localhost:4003/health  |
| speech-service    | http://localhost:4004/health  |

Todo el stack en contenedores (sin el frontend, que va a Vercel):

```bash
pnpm docker:up      # build + up de Postgres, Redis y los 5 servicios
pnpm docker:logs
pnpm docker:down
```

---

## Scripts de la raiz

| Script            | Que hace                                                     |
| ----------------- | ------------------------------------------------------------ |
| `pnpm dev`        | Frontend + 5 microservicios en paralelo (Turborepo)          |
| `pnpm dev:web`    | Solo el frontend                                             |
| `pnpm dev:services` | Solo los microservicios                                    |
| `pnpm build`      | Build de todos los paquetes respetando el grafo              |
| `pnpm lint`       | ESLint 9 (flat config) en todo el monorepo                   |
| `pnpm typecheck`  | `tsc --noEmit` en todos los paquetes                         |
| `pnpm test`       | Tests unitarios y de servicios (Vitest + Supertest)          |
| `pnpm test:coverage` | Tests del frontend con cobertura; falla por debajo del 60% |
| `pnpm test:e2e`   | Playwright: escritorio y móvil, con axe incluido             |
| `pnpm test:e2e:ui` | Playwright en modo interactivo, para depurar               |
| `pnpm test:a11y`  | Solo la auditoría de accesibilidad con axe-core              |
| `pnpm check:spotify` | Base de datos contra los volcados de Spotify              |
| `pnpm check:gallery` | Archivos de la galería contra su volcado                  |
| `pnpm release:dry` | Qué versión saldría de los commits, sin publicar nada      |
| `pnpm db:migrate` | Aplica las migraciones Prisma (`migrate deploy`)             |
| `pnpm db:seed`    | Carga los datos semilla. Es idempotente                       |
| `pnpm db:reset`   | **Destructivo.** Borra, migra y vuelve a sembrar             |
| `pnpm db:backup`  | Copia de seguridad a `infra/backups/`                        |
| `pnpm check:contrast` | Comprueba el contraste AA de los tokens de color         |
| `pnpm format`     | Prettier + ordenacion de clases de Tailwind                  |
| `pnpm setup`      | Crea el `.env` de la raiz                                    |
| `pnpm clean`      | Borra `dist`, `.next`, `.turbo` y `node_modules`             |

---

## Tests

Cinco capas, y cada una prueba lo que las demás no pueden ver.

| Capa | Herramienta | Dónde | Cómo se ejecuta |
| --- | --- | --- | --- |
| Frontend: lógica y componentes | Vitest + React Testing Library | `apps/web/src/**/*.test.ts(x)` | `pnpm test` · `pnpm test:coverage` |
| Microservicios | Vitest + Supertest | `services/*/src/**/*.test.ts`, `services/*/test/*.e2e.test.ts` | `pnpm test` |
| Contrato de la API | Tipos (`*.test-d.ts`) | `services/*/src/contract.test-d.ts` | `pnpm typecheck` |
| Recorridos completos | Playwright | `e2e/*.spec.ts` | `pnpm test:e2e` |
| Accesibilidad | axe-core sobre Playwright | `e2e/accesibilidad.spec.ts` | `pnpm test:a11y` |

### Vitest, no Jest

Los servicios usan **Vitest + Supertest**, no Jest, y es a propósito: un monorepo con dos
ejecutores tiene dos configuraciones de transformación, dos formas de simular un módulo y
dos informes de cobertura que no se pueden sumar. Supertest es el mismo con los dos. Los
servicios Nest necesitan `unplugin-swc` en su `vitest.config.ts`: esbuild no emite
`emitDecoratorMetadata` y la inyección de dependencias fallaría.

### Tests del frontend

```bash
pnpm test                                   # todo el monorepo
pnpm --filter @blackpink/web test:watch     # solo la web, en modo vigilancia
pnpm test:coverage                          # con cobertura
```

- El entorno por defecto es **Node**. Los tests de componentes piden `jsdom` en su primera
  línea (`// @vitest-environment jsdom`): montar un DOM para probar una función de fechas
  multiplica por diez lo que tarda.
- La cobertura **se exige**: menos del 60% en líneas, ramas, funciones o sentencias hace
  fallar el comando. Se mide sobre los componentes con comportamiento y las bibliotecas
  puras (la lista está en `apps/web/vitest.config.ts`); las páginas de Next son composición
  y se prueban de verdad en los e2e. Hoy: **87% de sentencias y 84% de ramas**.
- `vitest.setup.ts` trae dobles de `matchMedia`, `IntersectionObserver` y `scrollIntoView`,
  que no existen en jsdom y que el sitio usa para respetar `prefers-reduced-motion`, para
  las entradas al hacer scroll y para encuadrar el quiz.

### Tests de los microservicios

Levantan la aplicación Nest **completa** y le hablan por HTTP con Supertest: enrutado,
versionado, validación, envelope y filtro de errores de verdad. Lo que se simula es la capa
de datos (Prisma, Redis, el proveedor de IA): un e2e que necesita una base con contenido
concreto, o una clave de Gemini, deja de ser reproducible y acaba desactivado.

```bash
pnpm --filter @blackpink/api-gateway test        # un servicio
pnpm --filter @blackpink/chatbot-service test
```

### Tests e2e con Playwright

Recorren el sitio de verdad: la web **construida**, el gateway y los servicios. Es la única
capa que puede afirmar que las respuestas del quiz no están en el HTML, que cambiar de
idioma conserva la página o que el reproductor de Spotify no existe hasta que se pide.

```bash
# 1. La pila levantada y sembrada
pnpm docker:up:deps
pnpm db:migrate && pnpm db:seed
pnpm dev:services          # o los servicios desde dist/

# 2. La web construida (Playwright arranca `next start` solo, en el puerto 3210)
pnpm --filter @blackpink/web build

# 3. Los navegadores de Playwright, la primera vez
pnpm exec playwright install chromium

# 4. Los tests
pnpm test:e2e              # escritorio y móvil
pnpm test:e2e:ui           # modo interactivo
pnpm exec playwright test e2e/idioma.spec.ts --project=movil   # uno concreto
```

| Variable | Para qué |
| --- | --- |
| `E2E_BASE_URL` | Probar contra un servidor ya levantado en vez de arrancar uno |
| `E2E_CHAT_REAL=1` | El chat contra Gemini de verdad. **Gasta cuota**: por defecto el stream se simula |

Qué cubren: navegación por todas las secciones con el aviso de sitio no oficial en cada
una (y en el 404), cambio de idioma con cookie y `<html lang>`, el reproductor montado bajo
demanda con `theme=0` y `sandbox`, una conversación con PINKY (markdown, enlaces, el evento
`blocked` que reemplaza lo pintado, Esc devuelve el foco) y el secreto de las respuestas del
quiz. Hoy: **87 tests, escritorio y móvil**, estables en cuatro repeticiones seguidas.

### Accesibilidad con axe-core

`pnpm test:a11y` pasa axe (WCAG 2.1 A y AA) por catorce páginas en español y coreano, el
lightbox de la galería abierto y el panel de PINKY abierto. **Fallan los `serious` y
`critical`**; los `minor` y `moderate` quedan en el informe sin tumbar el PR. El mensaje de
fallo dice qué nodo es, para no tener que volver a ejecutar la suite para encontrarlo.

axe no lo ve todo: el contraste de los tokens lo comprueba `pnpm check:contrast` y el del
color propio de cada integrante —que es un dato de la base, no un token— se resuelve con
`.bp-member-ink` y se midió a mano en los tres temas.

### Lighthouse en local

```bash
pnpm --filter @blackpink/web build
pnpm --filter @blackpink/web exec next start --port 3000
pnpm dlx @lhci/cli@0.15 autorun --config=lighthouserc.desktop.json   # escritorio
pnpm dlx @lhci/cli@0.15 autorun --config=lighthouserc.json           # móvil
```

En Windows, Lighthouse termina la medición pero a veces no puede borrar su carpeta temporal
(`EPERM`) y da la pasada por fallida; en el runner Linux de GitHub no ocurre.

---

## Integración y despliegue continuos

| Workflow | Cuándo | Qué hace |
| --- | --- | --- |
| `ci.yml` | Cada PR y push a `main` | Lint, typecheck, tests, cobertura ≥60%, formato, contraste AA, volcados de Spotify (ida y vuelta contra Postgres), galería y build |
| `e2e.yml` | Cada PR y push a `main` | Levanta la pila con docker compose y corre Playwright + axe |
| `lighthouse.yml` | Cada PR | Seis páginas, tres pasadas, mediana; presupuesto mínimo de 90 |
| `codeql.yml` | PR, push a `main` y cada lunes | Análisis de seguridad (`security-extended`) |
| `deploy-web.yml` | Al terminar CI en verde sobre `main` | Construye y despliega la web en Vercel |
| `deploy-services.yml` | Al terminar CI en verde sobre `main` | Imágenes a GHCR, migraciones, despliegue en Railway o Render |
| `release.yml` | Al terminar CI en verde sobre `main` | semantic-release: versión, CHANGELOG.md y Release de GitHub |
| `db-backup.yml` | Cada día, 03:17 UTC | `pg_dump` de producción, comprobado y cifrado con GPG |
| `content-refresh.yml` | Cada lunes, 04:41 UTC | Revalida la caché ISR y reindexa a PINKY |

Dependabot (`.github/dependabot.yml`) abre cada lunes PRs **agrupadas por familia** —npm,
acciones de GitHub e imágenes base de Docker—. Prisma no sube de versión mayor sola: está
fijado en 7.10.0 hasta que la 8 deje de ser *release candidate*.

### Los despliegues esperan a CI

`deploy-web`, `deploy-services` y `release` no se disparan con el push sino con el **final
de CI en verde**. Con `on: push` correrían en paralelo a los tests y un `main` en rojo
llegaría a producción antes de que nadie viera el rojo.

### El presupuesto de Lighthouse

- **Escritorio**: las cuatro categorías bloquean por debajo de 90. Medido: rendimiento
  95–99, el resto 100.
- **Móvil**: accesibilidad, buenas prácticas y SEO bloquean por debajo de 90. **El
  rendimiento avisa pero no bloquea**: da 57–78 por los 221 KB de reglas `@font-face` de
  Noto Sans KR que bloquean el primer pintado en los tres idiomas (ver CLAUDE.md, Fase 12C).
  Bloquear por eso haría fallar todos los PR por algo que ninguno ha causado. Cuando se
  subsetee la fuente, se cambia `"warn"` por `"error"` en `lighthouserc.json`.

### Configuración en GitHub

**Que un PR no se pueda fusionar si CI falla** se configura en *Settings → Branches →
Branch protection rules* para `main`: exigir los checks «Lint, typecheck, test y build» y
«Playwright (escritorio y móvil) + axe». Si además se exige que todo cambio llegue por PR,
hay que permitir que *GitHub Actions* se salte la regla, o `release.yml` no podrá subir su
commit de versión.

Activar también *Settings → Code security → Private vulnerability reporting* (ver
`SECURITY.md`).

**Secretos** (*Settings → Secrets and variables → Actions*). Sin ellos los workflows de
despliegue fallan con un mensaje que dice cuál falta, y los crons avisan y no hacen nada.

| Secreto | Lo usa |
| --- | --- |
| `VERCEL_TOKEN`, `VERCEL_ORG_ID`, `VERCEL_PROJECT_ID` | `deploy-web` |
| `DATABASE_URL_CONTENT_PROD` | `deploy-services` (migraciones) |
| `RAILWAY_TOKEN` *o* `RENDER_HOOK_CONTENT`, `_MEDIA`, `_CHATBOT`, `_SPEECH`, `_GATEWAY` | `deploy-services` |
| `DATABASE_URL_PROD`, `BACKUP_PASSPHRASE` | `db-backup` |
| `SITE_URL`, `REVALIDATE_SECRET`, `CHATBOT_URL`, `INTERNAL_API_KEY` | `content-refresh` |
| `GOOGLE_AI_API_KEY` | `e2e` solo con el chat real, lanzado a mano |
| `LHCI_GITHUB_APP_TOKEN` | `lighthouse` (opcional: el resultado como check del PR) |

`REVALIDATE_SECRET` e `INTERNAL_API_KEY` tienen que medir **al menos 24 caracteres**: los
dos endpoints que protegen rechazan los valores de ejemplo de `.env.example`, que están
publicados en el repositorio.

### Los dos endpoints internos

- `POST /api/revalidate` (web) con `Authorization: Bearer <REVALIDATE_SECRET>`: tira las
  etiquetas de caché de `lib/api.ts` y el layout entero.
- `POST /api/v1/admin/reindex` (chatbot-service, **fuera del gateway**) con
  `x-internal-key: <INTERNAL_API_KEY>`: rehace el índice de PINKY en segundo plano y
  responde 202, o 409 si ya hay uno en marcha.

Sin el secreto correcto los dos responden **404**, no 401: un 401 confirmaría que existen.

### Calidad en local

| Hook | Qué hace |
| --- | --- |
| `pre-commit` | `lint-staged`: ESLint y Prettier sobre los ficheros preparados |
| `commit-msg` | `commitlint`: Conventional Commits con los ámbitos del proyecto |
| `pre-push` | `pnpm typecheck` del monorepo (Turbo lo cachea) |

El typecheck va en el *push* y no en el *commit* porque tarda: un commit es un punto de
guardado y tiene que ser instantáneo.

### Versiones

**semantic-release**, no Changesets. Los commits ya son convencionales y commitlint los
valida, así que la versión se deduce de ellos: `fix` sube el parche, `feat` la menor y un
`BREAKING CHANGE:` la mayor; `docs`, `test`, `ci` y `chore` no generan versión. Se versiona
**el sitio** —una versión, un `CHANGELOG.md` y una Release de GitHub—, no los once paquetes
privados, que no se publican en npm. `pnpm release:dry` enseña qué versión saldría.

---

## Base de datos

Una sola base de PostgreSQL con un esquema por servicio (`content`, `media`,
`chat`). Cada servicio es dueno de su esquema y de sus propias migraciones.
De momento solo `content-service` tiene esquema; los otros dos llegan en las
Fases 5 y 7.

```bash
pnpm docker:up:deps                          # Postgres (pgvector) + Redis
pnpm --filter @blackpink/content-service db:migrate
pnpm --filter @blackpink/content-service db:seed
```

**Si ya tienes un PostgreSQL en la maquina**, el puerto 5432 estara ocupado:
cambia `POSTGRES_PORT` en el `.env` (por ejemplo a 5433) y actualiza el puerto
de las tres `DATABASE_URL_*`. Los scripts `docker:*` pasan el `.env` de la raiz
a Compose con `--env-file`, asi que el cambio se propaga solo.

### Trazabilidad del contenido

Cada fila de contenido lleva dos campos que no son decorativos:

- **`source`** dice de donde sale el dato. En `trivia` es obligatorio a nivel de
  base de datos: sin fuente, el `INSERT` falla.
- **`verified`** es `false` mientras el dato no se haya contrastado contra esa
  fuente. **El sitio publica solo lo verificado.**

La regla del proyecto es preferir un dato marcado como no verificado a un dato
inventado. Al contrastar uno, se corrige o se borra; nunca se deja publicado
"porque ya estaba".

### Copias y reinicio

```bash
pnpm db:backup                # volcado con marca de tiempo, conserva 10 copias
pnpm db:backup -- --plain     # SQL plano en vez de formato custom
pnpm db:reset                 # DESTRUCTIVO: pide teclear el nombre de la base
pnpm db:reset -- --force      # sin preguntar (CI)
pnpm db:reset -- --no-seed    # deja el esquema vacio
```

`db:reset` se niega a ejecutarse si `NODE_ENV=production` o si la cadena de
conexion no apunta a una base local, salvo `--allow-remote` explicito.

### Identificadores de Spotify

El reproductor no aloja audio: incrusta el reproductor oficial, y para eso
necesita el `spotifyId` de cada pista. Esos identificadores **no se escriben a
mano ni se adivinan**; los resuelve `infra/scripts/spotify-ids.mjs` contra la
Spotify Web API.

**Credenciales.** El script usa el flujo *Client Credentials*, que da acceso al
catalogo publico y a nada mas: no lee ni escribe datos de ninguna cuenta.

1. Entra en <https://developer.spotify.com/dashboard> con una cuenta de Spotify
   (vale una gratuita) y acepta los terminos de desarrollador.
2. **Create app**. El nombre y la descripcion son libres; como *Redirect URI*
   sirve `http://localhost:3000` aunque este flujo no la use, porque el
   formulario la exige.
3. En **Settings** de la app, copia el **Client ID** y pulsa *View client
   secret* para el **Client Secret**.
4. Pegalos en el `.env` de la raiz:

   ```bash
   SPOTIFY_CLIENT_ID=...
   SPOTIFY_CLIENT_SECRET=...
   ```

`.env.example` las trae vacias y `.env` esta en `.gitignore`. El secreto no
aparece en ningun log del script: cuando la autenticacion falla, el mensaje dice
que fallo, no con que credenciales.

**Uso.** Requiere Docker Desktop arriba y la base en marcha (`pnpm docker:up`).

```bash
node infra/scripts/spotify-ids.mjs                 # informe, sin escribir nada
node infra/scripts/spotify-ids.mjs --write         # escribe solo lo inequivoco
node infra/scripts/spotify-ids.mjs --write --only=tracks   # o --only=solo
```

La ejecucion sin `--write` es una simulacion completa: consulta la API y muestra
el informe, pero no toca la base. Conviene mirarlo antes de escribir.

**Que hace y que no.** Puntua cada candidata por artista, titulo y album. Solo
guarda por encima de 0.86. Una version en directo, un remix o una acustica
penalizan fuerte, asi que `DDU-DU DDU-DU` y `DDU-DU DDU-DU (Remix)` acaban con
identificadores distintos en vez de pisarse. Lo que queda por debajo del umbral
**no se descarta en silencio**: se imprime con sus candidatas, su puntuacion y
su URL para que decidas tu.

Para cerrar una de esas dudas:

```bash
node infra/scripts/spotify-ids.mjs --set solo jisoo/jisoo-me 69CrOS7vEHIrhC2ILyEi0s
```

El script verifica contra la API que ese identificador existe, lee de ahi la
duracion real y lo marca como **confirmado a mano**.

**Procedencia.** La columna `spotifyIdSource` distingue `SCRIPT` (lo resolvio la
maquina) de `MANUAL` (lo confirmo una persona). El script **nunca** pisa una
fila `MANUAL`. Sin esa distincion, dentro de unos meses no habria forma de saber
cuales conviene revisar.

## API de los microservicios

Dos servicios sirven contenido hoy. Los dos comparten `@blackpink/service-core`:
mismo envelope, mismo manejo de errores, misma paginacion, misma cache y el
mismo logger.

| | content-service | media-service |
| --- | --- | --- |
| Puerto | 4001 | 4002 |
| Documentacion | `/docs` (OpenAPI en `/docs/json`) | `/docs` |
| Salud | `/health`, `/health/dependencies` | `/health`, `/health/dependencies` |

### content-service

```
GET /api/v1/members                  ?locale=
GET /api/v1/members/:slug            ficha completa: solo works, trivia y cronologia propia
GET /api/v1/albums                   ?type= &sort= &page= &limit=
GET /api/v1/albums/:slug             detalle con tracklist
GET /api/v1/tracks/:id               una cancion suelta (la consume media-service)
GET /api/v1/timeline                 ?category= &from= &to= &memberSlug=
GET /api/v1/trivia                   ?category= &memberSlug= &random= &limit=
GET /api/v1/awards                   ?year= &wonOnly=
GET /api/v1/quiz/questions           ?difficulty= &random= &includeAnswers=
GET /api/v1/search                   ?q= (integrantes, albumes, canciones y cronologia)
```

### media-service

```
GET /api/v1/playlists                listas curadas
GET /api/v1/playlists/:slug          resuelve cada cancion contra content-service
GET /api/v1/tracks/:id/embed         datos del reproductor OFICIAL
```

**media-service no tiene base de datos ni sirve audio.** Lo unico que le
pertenece es la curaduria: que canciones van juntas y en que orden. El resto lo
pide a content-service por HTTP, con tiempo limite y cache. Y lo unico que
devuelve para reproducir son identificadores y la URL del reproductor
incrustable de Spotify. Cuando todavia no se conoce el identificador
oficial de una cancion, responde `available: false` con una nota, en lugar de
inventarse una URL.

### Forma de la respuesta

Todas las rutas bajo `/api` responden igual, con exito o con error:

```jsonc
{
  "data": [ /* ... */ ],
  "meta": {
    "timestamp": "2026-08-28T05:12:00.000Z",
    "service": "content-service",
    "locale": "ko",
    "cached": true,
    "pagination": { "page": 1, "limit": 20, "total": 53, "totalPages": 3,
                    "hasNext": true, "hasPrevious": false }
  },
  "error": null
}
```

`/health` queda **fuera** de `/api` y **fuera** del envelope: mantiene el
contrato simple de la Fase 1 (`{ status, service }`) del que dependen los
HEALTHCHECK de Docker.

Los errores traen un `code` estable (`VALIDATION_FAILED`, `NOT_FOUND`,
`UPSTREAM_UNAVAILABLE`, `INTERNAL_ERROR`) para que el cliente ramifique sin
parsear el mensaje. Un 5xx **nunca** lleva el mensaje interno: el detalle va al
log del servidor.

### Contenido sin contrastar

Todos los endpoints de contenido **excluyen por defecto** los registros con
`verified: false`. Para verlos hay que pedirlo de forma explícita:

```
GET /api/v1/trivia                          solo lo contrastado (por defecto)
GET /api/v1/trivia?includeUnverified=true   incluye lo pendiente de revisar
```

`includeUnverified` es de **uso interno**: existe para revisar contenido antes de
darlo por bueno. **El sitio público nunca lo envía.**

El filtro se aplica también a la búsqueda global (en los cuatro tipos), a las
relaciones de una ficha y al recuento de canciones de un álbum. Un registro sin
contrastar se trata como inexistente: su detalle responde **404**, no un 403,
porque un 403 confirmaría que el recurso existe.

Hoy el palmarés completo está pendiente de contrastar, así que `GET /api/v1/awards`
devuelve una lista **vacía** salvo que se pida `includeUnverified=true`.

### Cache

Redis, con TTL por endpoint (`packages/../common/cache-ttl.ts`) y la clave
siempre con el idioma dentro. Sin eso, la primera peticion en espanol envenena
la cache y el siguiente que pida coreano recibe espanol. `CACHE_TTL_SECONDS`
actua como TTL de referencia: subirlo o bajarlo escala todos los TTL
manteniendo sus proporciones.

**Redis caido no tumba el servicio**: se registra el fallo y se sirve desde la
base de datos.

## API gateway

Único punto por el que el navegador habla con el backend. Puerto **4000**.

```
GET /api/v1/content/*   ->  content-service
GET /api/v1/media/*     ->  media-service
GET /health             ->  el proceso responde
GET /health/aggregate   ->  estado de la caché y de todos los servicios
GET /docs               ->  documentación unificada de los dos servicios
```

| | |
| --- | --- |
| Límite por IP | 100 req/min general, 20 en búsqueda y quiz (no se cachean) |
| CORS | lista blanca desde `ALLOWED_ORIGINS`. Si está vacía, no se permite ningún origen |
| Cabeceras | helmet, compresión gzip, cuerpo máximo 64 KB |
| Caché | Redis, TTL por ruta, clave con el idioma |
| Resiliencia | reintentos con espera exponencial + circuit breaker por servicio |

Cuando un servicio cae, el gateway sirve la **copia de respaldo** de Redis
marcada con `x-gateway-stale: true` y `cache-control: no-store`. Si no hay
copia, responde 503 con `UPSTREAM_UNAVAILABLE`. Un servicio caído no corta las
llamadas al otro: cada uno tiene su propio circuito.

Cabeceras de diagnóstico en cada respuesta: `x-request-id` (respetado si el
cliente ya trae uno, y propagado a los servicios), `x-gateway-cache` (HIT/MISS)
y `x-gateway-upstream`.

## Datos en el frontend

`apps/web` habla **solo** con el gateway, a través de `src/lib/api.ts`: un
cliente tipado con `@blackpink/types`, con tiempo límite, reintentos acotados y
errores tipados.

- **Server Components + ISR** para el contenido de página. Cada sección es su
  propio límite de Suspense: se resuelven en paralelo, y si una falla muestra su
  estado de error sin llevarse el resto de la página.
- **TanStack Query** solo para lo interactivo: hoy, el buscador.
- Los tipos de la API **no** se derivan de Prisma (Prisma tipa `Date` donde el
  JSON lleva `string`, y expone traducciones que la API ya resuelve). El
  contrato vive en `packages/types` y cada servicio comprueba en compilación,
  con `contract.test-d.ts`, que sus DTOs no se desvían de él.

## Chatbot PINKY

`chatbot-service` (puerto 4003) responde preguntas sobre el contenido **publicado**
del sitio. No tiene base de conocimiento propia: indexa lo que sirve
content-service y contesta solo con eso.

### Credenciales

El proveedor es **Google AI Studio (Gemini)**, elegido porque su plan gratuito
cubre a la vez chat y embeddings, que es lo que necesita el RAG.

1. Entra en <https://aistudio.google.com/apikey> con una cuenta de Google.
2. **Create API key**. Vale la que ofrece por defecto.
3. Pegala en el `.env` de la raiz:

   ```bash
   GOOGLE_AI_API_KEY=...
   ```

`.env.example` la trae vacia y `.env` esta en `.gitignore`. **La clave no llega
nunca al navegador**: `apps/web` habla con el gateway, el gateway con
chatbot-service y solo este ultimo con Google. No existe ninguna variable
`NEXT_PUBLIC_` con la clave, y no debe crearse.

### AVISO DE PRIVACIDAD

**En el plan gratuito, Google puede usar lo que se le envia para entrenar sus
modelos.** No es un detalle de letra pequena: cada pregunta que un visitante
escriba en el chat sale del servidor hacia Google y puede acabar en ese conjunto
de datos.

De ahi tres consecuencias que estan en el diseno, no en la documentacion:

- El chatbot **no pide ni necesita datos personales**, y su prompt le prohibe
  tratarlos. Si el visitante los escribe igualmente, viajan; por eso la interfaz
  de la Fase 10 tendra que decirlo antes de la primera pregunta.
- **No se guarda la conversacion.** El historial lo manda el cliente en cada
  peticion y el servidor no lo persiste en ningun sitio.
- El `sessionId` es un valor opaco del navegador. No identifica a nadie y solo
  se usa para contar mensajes.

Si el sitio pasa a plan de pago, Google deja de usar los datos para entrenar.
Mientras siga en gratuito, esto es cierto y hay que decirlo.

### Modelos

| Papel | Modelo | Variable |
| --- | --- | --- |
| Chat | `gemini-3.7-flash` | `GOOGLE_AI_CHAT_MODEL` |
| Embeddings | `gemini-embedding-001` | `GOOGLE_AI_EMBEDDING_MODEL` |

Los dos estan en el plan gratuito. El de chat es configurable a proposito:
cualquier Flash del plan gratuito sirve, y Google los renueva mas rapido de lo
que se actualiza un README. `text-embedding-004` **no** se usa: quedo
descontinuado en enero de 2026.

### Por que 768 dimensiones

`gemini-embedding-001` deja elegir el tamano del vector entre 128 y 3072, y por
defecto devuelve 3072. Aqui se fija **768** (`GOOGLE_AI_EMBEDDING_DIM`), y la
razon es dura:

**pgvector no puede indexar columnas de mas de 2000 dimensiones.** Con las 3072
por defecto, el `CREATE INDEX ... USING hnsw` falla y toda busqueda pasa a ser un
escaneo secuencial de la tabla. 768 es ademas uno de los tres tamanos
recomendados por Google, ocupa la cuarta parte y, con un corpus de unos cientos
de fragmentos, la perdida de precision no se nota.

Dos consecuencias practicas:

- La columna es `vector(768)`. **Cambiar la variable sin migrar la tabla rompe el
  indexado**, a proposito: Postgres rechaza el `INSERT` en vez de guardar
  vectores incoherentes que solo se notarian en respuestas peores.
- Cualquier dimension distinta de 3072 sale **sin normalizar** de la API, y la
  distancia coseno da por hecho norma 1. El proveedor normaliza a mano; sin ese
  paso la recuperacion no falla, empeora en silencio.

### Que pasa cuando se agota la cuota

El plan gratuito tiene limites por minuto y por dia. **No confundirlos con el
limite del sitio**, que es otra cosa:

| | Quien lo pone | Cuando salta | Que ve el visitante |
| --- | --- | --- | --- |
| Cuota de Gemini | Google, global para la clave | Con mucho uso legitimo | «He agotado mi cuota de preguntas del dia, vuelve en un rato» |
| Limite del sitio | Nosotros: 20/min y 200/sesion por IP | Con uso abusivo desde una IP | HTTP 429 del servidor |

Ante un 429 de Google, el proveedor **reintenta con espera exponencial** (cuatro
intentos, ~1s/2s/4s) y respeta el `retryDelay` que envia Google cuando lo envia.
Si tras los reintentos sigue agotada, el flujo emite un evento `error` con codigo
`QUOTA` y un mensaje amable en el idioma de la conversacion. **No es una pantalla
de error**: el sitio entero sigue funcionando, solo el chat descansa.

Si la cuota se agota **durante el indexado**, se abandona sin escribir nada y se
conserva el indice anterior. Media discografia indexada seria peor que la
anterior completa, y encima invisible.

### Endpoints

```bash
POST /api/v1/chat                    # text/event-stream, no JSON
GET  /api/v1/chat/suggestions?locale=es
GET  /api/v1/chat/status             # diagnostico: proveedor e indice
```

`POST /api/v1/chat` responde por **SSE** con tres tipos de evento: `token` (texto
parcial), `done` (accion de navegacion y citas) y `error` (con `code`). Es el
unico endpoint del proyecto que no usa el envelope `{data, meta, error}`: un
envelope describe una respuesta completa, y aqui hay un flujo.

Las acciones que puede devolver son **`navigate`, `open_section` y `none`**. No
existe «reproducir»: el sitio no controla el reproductor de Spotify, asi que
PINKY lleva a la ficha del album y alli el visitante le da al play.

### Seguridad del chatbot

Cuatro capas, y ninguna se sostiene sola.

**1. Filtro de entrada.** Antes de gastar cuota: normalizacion (fuera caracteres
de control y de ancho cero, que sirven para partir una palabra prohibida por la
mitad), deteccion de inyeccion con reglas con nombre, y filtro de contenido
(sexual, odio, acoso y **especulacion sobre la vida privada**, que es la
categoria propia de este sitio). Las negativas estan escritas a mano en los tres
idiomas: cuando se bloquea la entrada, el modelo ni se llama.

**2. El system prompt**, que acota identidad, alcance y lo que no se responde.

**3. El contexto recuperado se trata como dato, nunca como instruccion.** Es el
riesgo mas serio del servicio y se detalla abajo.

**4. Filtro de salida y validacion de la accion.** El texto del modelo se revisa
mientras se emite, y la accion de navegacion se valida contra el mapa del sitio.

**Lo que estas capas NO son.** Una lista de patrones siempre se puede rodear, y
prometer lo contrario seria mentir. Lo que aporta: corta lo evidente sin gastar
cuota, deja registro de auditoria, y responde igual siempre. La defensa de fondo
es que **no hay nada que robar**: el servicio no mete secretos en el contexto del
modelo, y el propio prompt es lo unico "confidencial" que ve.

#### El contexto del RAG es un dato

Los fragmentos recuperados entran al mismo prompt que las reglas. Si alguien
lograse escribir en el contenido del sitio, ese texto viajaria con la misma
autoridad que las instrucciones. Cuatro garantias, de la mas fuerte a la mas
resistente:

1. **Procedencia.** Al indice solo entra lo que sirve la API publica de
   content-service: filas de un seed, contrastadas y con `verified: true`. **No
   existe ninguna via por la que un visitante escriba en el indice**: ni
   comentarios, ni formularios, ni contenido de terceros. Es la garantia mas
   fuerte hoy y la que primero deja de valer si el sitio acepta contenido de
   fuera.
2. **Neutralizacion** (`safety/sanitize.ts`). Cada fragmento pierde, antes de
   entrar al prompt, lo que podria leerse como protocolo: cabeceras de rol
   (`System:`), tokens de plantilla (`<|im_start|>`, `[INST]`), delimitadores y
   **el marcador `ACCION:` de este mismo servicio**. Ese ultimo tapa un agujero
   propio: el marcador es texto plano en el mismo canal que el contenido, asi
   que un fragmento con `ACCION: {...}` inyectaria un boton de navegacion sin
   que el modelo interviniera siquiera.
3. **Delimitador impredecible.** El bloque de datos se abre y cierra con un
   valor aleatorio **por peticion** (`<<<DATOS-a1b2c3d4e5f6>>>`). Un texto
   malicioso ya guardado no puede cerrar el bloque para "salir" a la zona de
   instrucciones: tendria que acertar un valor que no existia cuando se
   escribio. El prompt le dice ademas al modelo, explicitamente, que todo lo de
   dentro es material de lectura.
4. **Validacion de la salida.** Aunque el modelo obedeciese una orden colada, la
   accion se valida contra el mapa del sitio y contra las rutas que de verdad
   aparecieron en el contexto. Una ruta externa o inventada se degrada a `none`.

#### Log de auditoria

Se registra **que** se bloqueo y **por que regla**, nunca **que escribio nadie**:
regla, categoria, fase, idioma, longitud y dos huellas sha256 recortadas (del
mensaje y de la sesion). Nada de texto, IP, `sessionId` en claro ni cabeceras.

El motivo es concreto: **el mensaje es exactamente donde apareceria un dato
personal**. Quien pide el telefono de alguien puede haber escrito el suyo de
paso. Un log de seguridad que acumula eso se convierte en el mayor riesgo de
privacidad del servicio.

La huella permite ver que es *el mismo* intento repetido sin poder reconstruir
el texto.

#### Deteccion de idioma

PINKY responde en el idioma del MENSAJE, no en el de la interfaz: alguien puede
navegar en ingles y preguntar en coreano. Se resuelve con reglas -son tres
idiomas y dos alfabetos distintos-, no con una llamada extra al modelo que
duplicaria el gasto de cuota. Sin senal clara manda el idioma de la interfaz.
Las negativas tambien salen en el idioma detectado.

#### Limite conocido del filtro de salida

Con streaming, **lo ya enviado no se puede retirar**. Al detectar contenido
inapropiado se corta y se emite un evento `blocked`, y el contrato con el cliente
es que **descarte lo pintado** y muestre solo ese texto. La alternativa seria
esperar a la respuesta completa antes de mostrar nada, y perder la escritura
progresiva. Se eligio conscientemente.

### Lo que PINKY no sabe

**Nada que el sitio no publique.** El indice se construye leyendo la API publica
de content-service, que ya excluye todo lo que tiene `verified: false`. No hay un
segundo filtro que pueda divergir del primero: si un dato no se publica, PINKY no
lo ha visto nunca. Es la unica forma de que el trabajo de verificacion de las
fases anteriores no se caiga por el otro lado.

## Voz: dictar y escuchar (Fase 11)

Dos cosas distintas y separadas, y conviene no confundirlas porque tienen
implicaciones de privacidad opuestas:

| | Quien lo hace | Sale el audio del navegador? |
| --- | --- | --- |
| **Dictar** (hablar y que se transcriba) | Groq, en sus servidores | **Si** |
| **Escuchar** (que PINKY lea la respuesta) | El navegador, con `speechSynthesis` | **No** |

### AVISO DE PRIVACIDAD: el audio va a Groq

Cuando alguien graba un mensaje de voz, **ese audio sale del navegador y llega a
los servidores de Groq** para convertirlo en texto. Es la unica forma de
transcribir sin montar un modelo propio, y hay que decirlo donde se lee, no en
una politica enterrada:

- El aviso **«El audio se envia para transcribirlo y no se almacena»** aparece
  **bajo el campo del chat**, siempre visible mientras se puede grabar, en los
  tres idiomas.
- **Este proyecto no guarda el audio en ningun punto.** Ni en disco, ni en base
  de datos, ni en los logs. No hay fichero temporal que borrar porque nunca
  llega a existir: multer trabaja en memoria, el multipart hacia Groq se monta
  en memoria, y el buffer se queda sin referencias al responder.
- **Los logs llevan formato, tamano y duracion. Nunca el audio ni el texto.**
  Es la misma regla que el log de auditoria del chatbot: el contenido es justo
  donde apareceria un dato personal.
- **Que hace Groq con el audio lo decide Groq, no este proyecto.** Sus terminos
  son los que aplican una vez sale de aqui, y conviene leerlos antes de
  publicar el sitio: <https://groq.com/privacy-policy/>. Como con Gemini en la
  Fase 9, un plan gratuito de un tercero no es un sitio donde poner datos
  personales, y por eso PINKY no los pide.
- **Quien no quiera usarlo, no tiene que usarlo.** El microfono es una via de
  entrada mas: el chat entero funciona escribiendo, y negar el permiso no rompe
  nada.

La sintesis de voz es el caso contrario: la pone el sistema operativo, no viaja
nada, y viene **apagada por defecto**. Una pagina que empieza a hablar sola
interrumpe, delata lo que alguien esta leyendo si hay gente cerca, y en un movil
con el volumen alto es una emboscada.

### Credenciales

```bash
GROQ_API_KEY=gsk_...        # de https://console.groq.com  (plan gratuito, sin tarjeta)
WHISPER_PROVIDER=groq       # o `openai`
WHISPER_MODEL=whisper-large-v3
```

La clave **no llega nunca al navegador**: el navegador habla con el gateway, el
gateway con speech-service, y solo ese ultimo con Groq.

**El limite del plan gratuito es POR ORGANIZACION, no por clave.** Generar una
clave nueva no da mas cuota. Ante un 429 se reintenta con espera exponencial
respetando el `retry-after`, y si sigue agotada el visitante ve «vuelve en un
rato» (`ASR_QUOTA`), que no es lo mismo que el limite de 10 audios cada 10
minutos por IP que ponemos nosotros (`SPEECH_RATE_LIMIT`).

### Que modelo, y por que

Se midieron los dos contra la API real, con el mismo audio:

| | Limpio | Ruido 10 dB | Ruido 5 dB | Ruido 0 dB |
| --- | --- | --- | --- | --- |
| `whisper-large-v3` | 855 ms · conf 0.96 | 1039 ms · 0.87 | 658 ms · 0.76 | 660 ms · 0.50 |
| `whisper-large-v3-turbo` | 512 ms · conf 0.91 | 1022 ms · 0.85 | 951 ms · 0.77 | 762 ms · 0.53 |

Turbo es **~1.7x mas rapido con audio limpio** y practicamente igual de robusto
al ruido. Aun asi el proyecto usa **`whisper-large-v3`**, y el criterio es este:

1. Los 340 ms de diferencia **no los nota nadie** en este flujo, porque detras
   viene la respuesta del chat, que tarda segundos.
2. Turbo es un modelo **destilado**, y su punto debil conocido son los idiomas
   distintos del ingles. Este sitio tiene coreano.
3. **Esa parte no se pudo medir**: no habia forma de generar audio coreano real
   en la maquina de desarrollo (Windows no traia voz coreana instalada), asi
   que la comparativa de arriba es en castellano.

Ante una diferencia imperceptible en velocidad y un riesgo real —y no medido—
en calidad, gana la calidad. **Si algun dia se mide en coreano y turbo aguanta,
cambiar es una linea**: `WHISPER_MODEL` en `.env`.

### Endpoint

`POST /api/v1/transcribe` — multipart con un campo `audio`. Devuelve
`{ text, detectedLanguage, confidence, durationSec }`.

**El formato se comprueba por los BYTES del fichero**, no por su extension ni
por el `content-type` que declare el cliente: las dos las escribe quien envia, y
`curl` manda lo que se le diga. Un ejecutable renombrado a `.webm` se rechaza
con `UNSUPPORTED_FORMAT` sin llegar a gastar una llamada a Groq.

`confidence` es una **estimacion, no una probabilidad calibrada**: sale de la
verosimilitud media por segmento que informa el modelo, penalizada por su
probabilidad de silencio. Sirve para decidir si conviene revisar el texto —y
Whisper inventa frases enteras sobre ruido de fondo—, no para afirmar nada.

Codigos de error, todos distinguibles: `EMPTY_AUDIO`, `UNSUPPORTED_FORMAT`,
`AUDIO_TOO_LARGE`, `AUDIO_TOO_LONG`, `ASR_QUOTA` (429), `SPEECH_RATE_LIMIT`
(429), `ASR_NOT_CONFIGURED` y `ASR_UNAVAILABLE` (503).

### El texto transcrito pasa por el filtro de la Fase 9

Un audio puede llevar un intento de inyeccion igual que un mensaje escrito. **Se
topa con las mismas reglas, y no por un filtro nuevo**, sino por como esta
montado el camino:

```
audio -> speech-service -> texto -> el navegador lo pinta en el campo
      -> la persona lo revisa -> POST /chat -> SafetyService.checkInput
```

**speech-service no habla con chatbot-service.** Devuelve texto al navegador y
ahi acaba su trabajo. Lo que llega al chat entra por la MISMA puerta que lo
tecleado. La alternativa —que speech-service llamase al chatbot— habria
obligado a repetir el filtro alli, y un filtro duplicado es un filtro del que
divergir. Lo fija `services/chatbot-service/src/safety/transcript.test.ts`.

Y el texto **no se envia solo**: aparece en el campo para que la persona lo lea
y lo corrija antes de mandarlo. Tampoco es cortesia —mandar directamente lo que
el modelo creyo oir convierte un carraspeo en una pregunta que nadie hizo.

## Estructura

```
.
├── apps/
│   └── web/                  Next.js 15 (App Router) + Tailwind v4 + Framer Motion
├── services/
│   ├── api-gateway/          BFF: enruta, cachea y aplica rate limiting   :4000
│   ├── content-service/      Miembros, albumes, cronologia, curiosidades  :4001
│   ├── media-service/        Playlists y embeds oficiales                 :4002
│   ├── chatbot-service/      PINKY: asistente con RAG                     :4003
│   └── speech-service/       Transcripcion de audio                       :4004
├── packages/
│   ├── config/               ESLint, tsconfig y tokens de Tailwind compartidos
│   ├── types/                Tipos e interfaces compartidos (compilado a dist)
│   └── ui/                   Componentes React compartidos (codigo fuente)
└── infra/
    ├── docker-compose.yml       Stack completo
    ├── docker-compose.deps.yml  Solo Postgres + Redis
    ├── postgres/init.sql        Extensiones y schemas
    ├── scripts/                 Utilidades
    └── migrations/              Nota sobre donde viven las migraciones
```

### Como se enlazan los paquetes

- `@blackpink/types` se **compila a `dist`**: los microservicios lo consumen por
  `node_modules` (symlink de pnpm), que es lo que resuelve Node en tiempo de ejecucion.
- `@blackpink/ui` se consume como **codigo fuente**, via `transpilePackages` de Next.
- `@blackpink/config` no se compila: solo exporta ficheros de configuracion.
- Los alias `@blackpink/*` del `tsconfig.json` raiz son para el editor y para los paquetes
  que compilan con resolucion `bundler`. Los servicios NestJS **no** los heredan: si lo
  hicieran, `tsc` arrastraria ficheros fuera de `rootDir` y romperia la ruta `dist/main.js`.

---

## Variables de entorno

Hay **un unico `.env`** en la raiz del monorepo:

- los microservicios lo leen con `@nestjs/config` (`envFilePath: ['../../.env']`);
- `apps/web` lo carga en `next.config.ts` con `process.loadEnvFile()`, porque Next solo
  mira dentro de `apps/web` por defecto.

`.env.example` documenta todas las variables agrupadas por bloque. Nunca subas el `.env`.

---

## Convenciones

- **Commits:** [Conventional Commits](https://www.conventionalcommits.org).
  Ambitos permitidos: `web`, `gateway`, `content`, `media`, `chatbot`, `speech`, `ui`,
  `types`, `config`, `infra`, `ci`, `deps`, `repo`, `release`.
  Ejemplo: `feat(content): anadir modelo de albumes`. De ellos sale la version (ver
  [Versiones](#versiones)).
- **Hooks de Git:** Husky ejecuta `lint-staged` antes de cada commit, `commitlint` sobre
  el mensaje y `pnpm typecheck` antes de cada push.
- **Formato:** Prettier con ordenacion automatica de clases de Tailwind.

---

## Reglas del proyecto

1. Ningun archivo de audio o video con copyright: solo el embed oficial de Spotify.
2. Imagenes: placeholders o material con licencia libre, siempre con atribucion.
3. El avatar del chatbot (**PINKY**) es un personaje original de estilo K-pop, nunca una
   replica del rostro de una persona real.
4. El chatbot responde solo sobre el contenido publico del sitio y jamas inventa ni expone
   datos personales.
5. El aviso de sitio no oficial es visible en todas las paginas.

---

## Licencia

Codigo: [MIT](./LICENSE). El contenido y las marcas de terceros no estan cubiertos por
esa licencia.
