# Publicar el sitio

Guía paso a paso para poner el sitio en internet por primera vez, en el orden exacto en el que
hay que hacerlo. Al final hay una lista de comprobación para antes de anunciarlo.

---

## 1. Qué va dónde y por qué

| Pieza | Dónde | Plan | Coste |
| --- | --- | --- | --- |
| Web (`frontend/`) | **Vercel** | Hobby | Gratis |
| 5 servicios (`backend/`) | **Railway** | Hobby | 5 USD/mes, con 5 USD de consumo incluidos |
| PostgreSQL + pgvector | **Neon** | Free | Gratis |
| Redis (caché) | **Upstash** | Free | Gratis |
| Errores | **Sentry** | Developer | Gratis |
| Aviso si el sitio se cae | **UptimeRobot** | Free | Gratis |
| Aparecer en Google | **Google Search Console** | — | Gratis |
| Dominio propio (opcional) | Cualquier registrador | — | ~10 USD/año |

### ¿Vercel o Firebase? Vercel

- **Next.js es de Vercel.** Las páginas estáticas que se refrescan solas (ISR), el optimizador de
  imágenes, el cambio de idioma y la tarjeta del quiz funcionan sin configurar nada.
- **Firebase App Hosting exige el plan Blaze** (de pago por uso, con tarjeta) y por debajo corre
  en Cloud Run. Tampoco aloja los 5 servicios NestJS: habría que montarlos aparte igualmente.
- **Para Google da igual dónde esté alojado.** Lo que decide que aparezca es que el HTML llegue
  ya pintado desde el servidor, con título, descripción, `sitemap.xml` y enlaces entre idiomas.
  Todo eso ya lo hace el sitio (ver el paso 11).
- El plan Hobby de Vercel es **para uso no comercial**. Un sitio de fans sin anuncios encaja; si
  algún día lleva publicidad o donaciones, hay que pasar a Pro.

### ¿Por qué Railway y no Render gratis?

- En **Render gratis** los servicios **no pueden recibir tráfico interno**, se **duermen tras
  15 minutos** sin visitas (casi un minuto en despertar) y las 750 horas al mes se reparten entre
  todos: con 5 servicios no llegan ni a una semana. Además, PINKY recalcula su índice con
  Gemini cada vez que arranca, así que cada despertar gastaría cuota.
- **Railway** mantiene los 5 encendidos, se comunican por una red privada y cobra por lo que
  consumen (RAM a 10 USD por GB al mes, CPU a 20 USD por vCPU al mes). Con poco tráfico el gasto
  ronda lo que incluye el plan: **cuenta con 5–10 USD al mes** y míralo en *Usage* tras dos días.
- `infra/render.yaml` queda preparado como plan B (ver el apartado final).

---

## 2. Orden de despliegue

```
Neon + Upstash  →  Railway (content → media, chatbot, speech → gateway)  →  cargar contenido
      →  Vercel  →  dominio  →  Sentry  →  UptimeRobot  →  Google  →  lista de comprobación
```

La web va **después** de los servicios: al compilar, Vercel pide los datos al gateway para
generar las páginas. Si el gateway no responde, la compilación falla.

---

## 3. Crear las cuentas

Entra en todas con **«Continue with GitHub»** (usuario `JuanK2550`), así no hay contraseñas nuevas:

1. <https://vercel.com/signup> → plan **Hobby**.
2. <https://railway.com> → *Login with GitHub* → en *Account → Plans*, **Hobby**.
3. <https://neon.com> → *Sign up*.
4. <https://upstash.com> → *Sign up*.
5. <https://sentry.io/signup> (opcional, recomendado).
6. <https://uptimerobot.com> → *Register*.
7. <https://search.google.com/search-console> con tu cuenta de Google.

Ten a mano las claves que ya usas en local: `GOOGLE_AI_API_KEY` (Google AI Studio) y
`GROQ_API_KEY` (Groq).

---

## 4. Generar los dos secretos

En PowerShell, dos veces, y guarda cada resultado en un gestor de contraseñas:

```powershell
node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"
```

- El primero es **`INTERNAL_API_KEY`** (lo comparten la web y los servicios).
- El segundo es **`REVALIDATE_SECRET`** (solo la web y GitHub).

Nunca los pegues en el repositorio ni en un issue.

---

## 5. Base de datos en Neon

1. **New Project**
   - *Name*: `blackpink`
   - *Postgres version*: **16** (la misma que usa la copia de seguridad diaria)
   - *Region*: **AWS US East 1 (N. Virginia)**, la más cercana a Vercel y Railway
2. Menú **SQL Editor**, ejecuta:
   ```sql
   CREATE EXTENSION IF NOT EXISTS vector;
   ```
3. Botón **Connect**. Copia dos cadenas:
   - Con **Connection pooling activado** → la *pooled* (su dirección contiene `-pooler`).
   - Con **Connection pooling desactivado** → la *directa*.
4. Construye estas tres URL añadiendo el esquema **al final** de cada cadena:

   | Variable | Cadena de Neon | Añade al final |
   | --- | --- | --- |
   | `DATABASE_URL_CONTENT` | pooled | `&schema=content` |
   | `DIRECT_URL_CONTENT` | directa | `&schema=content` |
   | `DATABASE_URL_CHAT` | pooled | `&schema=chat` |

   Queda algo así:
   `postgresql://usuario:clave@ep-xxxx-pooler.us-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require&schema=content`

**Por qué dos cadenas:** los servicios usan la *pooled*, que reparte muchas conexiones cortas.
Las migraciones necesitan la *directa*, porque el pooler no permite lo que hace Prisma al
cambiar tablas.

**Consumo:** el plan gratuito da 0,5 GB y 100 horas de cómputo al mes, y la base **se apaga sola
tras 5 minutos sin consultas** (la primera consulta después tarda algo más). No la mantengas
despierta con monitores: `/health` de los servicios no toca la base a propósito.

---

## 6. Redis en Upstash

1. **Create Database**
   - *Name*: `blackpink`
   - *Type*: Regional · *Primary Region*: **US-East-1 (N. Virginia)**
   - *Plan*: Free
2. En la pestaña de la base, activa **Eviction** (si se llena, borra lo más viejo en vez de
   dar error: aquí solo hay caché).
3. En **Connect** copia la URL que empieza por **`rediss://`** (con dos «s»: va cifrada). Esa
   es **`REDIS_URL`**.

El plan gratuito da 500.000 comandos al mes. El panel de Upstash enseña cuántos llevas.

---

## 7. Los 5 servicios en Railway

### 7.1 Crear el proyecto y los servicios

1. **New Project → Empty Project**. Ponle de nombre `blackpink`.
2. Repite **cinco veces**: botón **Create → GitHub Repo → `JuanK2550/BLACK-PINK-FANSITE`**.
   La primera vez Railway pide permiso para leer el repositorio: dáselo.
3. En cada servicio, pestaña **Settings**:

   | Ajuste | Valor |
   | --- | --- |
   | *Service Name* | `content-service`, `media-service`, `chatbot-service`, `speech-service` y `api-gateway` (exactamente así: el nombre es su dirección interna) |
   | *Source → Branch* | `main` |
   | *Source → Root Directory* | **vacío** (la raíz del repo: los servicios comparten `shared/`) |
   | *Config-as-code → Railway Config File* | `/backend/<nombre-del-servicio>/railway.json` |
   | *Wait for CI* | **Activado** (no despliega hasta que GitHub Actions termine en verde) |
   | *Deploy → Regions* | **US East (Virginia)** |

   El `railway.json` de cada servicio ya dice qué `Dockerfile` usar, qué carpetas vigilar, la
   ruta de salud y que se reinicie solo si se cae. En `content-service` además **aplica las
   migraciones antes de arrancar** (`preDeployCommand`).

### 7.2 Variables compartidas

*Project Settings → Shared Variables*:

```
NODE_ENV=production
LOG_LEVEL=info
TRUST_PROXY=1
INTERNAL_API_KEY=<el primer secreto del paso 4>
REDIS_URL=<la rediss:// de Upstash>
SENTRY_DSN=
SENTRY_ENVIRONMENT=production
```

`TRUST_PROXY=1` es obligatorio: sin él, los servicios ven la IP del proxy de Railway en lugar
de la del visitante, y el límite de peticiones por IP pasa a ser uno solo para todo el sitio.

### 7.3 Variables de cada servicio

En cada servicio, **Variables → Raw Editor**, pega su bloque y rellena lo que va entre `< >`.
`${{shared.X}}` y `${{servicio.RAILWAY_PRIVATE_DOMAIN}}` son referencias de Railway: se escriben
tal cual y Railway las sustituye.

**content-service**

```
PORT=4001
NODE_ENV=${{shared.NODE_ENV}}
LOG_LEVEL=${{shared.LOG_LEVEL}}
TRUST_PROXY=${{shared.TRUST_PROXY}}
REDIS_URL=${{shared.REDIS_URL}}
SENTRY_DSN=${{shared.SENTRY_DSN}}
SENTRY_ENVIRONMENT=${{shared.SENTRY_ENVIRONMENT}}
DATABASE_URL_CONTENT=<pooled de Neon>&schema=content
DIRECT_URL_CONTENT=<directa de Neon>&schema=content
```

**media-service**

```
PORT=4002
NODE_ENV=${{shared.NODE_ENV}}
LOG_LEVEL=${{shared.LOG_LEVEL}}
TRUST_PROXY=${{shared.TRUST_PROXY}}
REDIS_URL=${{shared.REDIS_URL}}
SENTRY_DSN=${{shared.SENTRY_DSN}}
SENTRY_ENVIRONMENT=${{shared.SENTRY_ENVIRONMENT}}
CONTENT_SERVICE_URL=http://${{content-service.RAILWAY_PRIVATE_DOMAIN}}:4001
```

**chatbot-service**

```
PORT=4003
NODE_ENV=${{shared.NODE_ENV}}
LOG_LEVEL=${{shared.LOG_LEVEL}}
TRUST_PROXY=${{shared.TRUST_PROXY}}
INTERNAL_API_KEY=${{shared.INTERNAL_API_KEY}}
SENTRY_DSN=${{shared.SENTRY_DSN}}
SENTRY_ENVIRONMENT=${{shared.SENTRY_ENVIRONMENT}}
DATABASE_URL_CHAT=<pooled de Neon>&schema=chat
CONTENT_SERVICE_URL=http://${{content-service.RAILWAY_PRIVATE_DOMAIN}}:4001
GOOGLE_AI_API_KEY=<tu clave de Google AI Studio>
GOOGLE_AI_CHAT_MODEL=gemini-3.5-flash-lite
GOOGLE_AI_EMBEDDING_MODEL=gemini-embedding-001
GOOGLE_AI_EMBEDDING_DIM=768
```

**speech-service**

```
PORT=4004
NODE_ENV=${{shared.NODE_ENV}}
LOG_LEVEL=${{shared.LOG_LEVEL}}
TRUST_PROXY=${{shared.TRUST_PROXY}}
SENTRY_DSN=${{shared.SENTRY_DSN}}
SENTRY_ENVIRONMENT=${{shared.SENTRY_ENVIRONMENT}}
WHISPER_PROVIDER=groq
WHISPER_MODEL=whisper-large-v3
GROQ_API_KEY=<tu clave de Groq>
```

**api-gateway**

```
PORT=4000
NODE_ENV=${{shared.NODE_ENV}}
LOG_LEVEL=${{shared.LOG_LEVEL}}
TRUST_PROXY=${{shared.TRUST_PROXY}}
INTERNAL_API_KEY=${{shared.INTERNAL_API_KEY}}
REDIS_URL=${{shared.REDIS_URL}}
SENTRY_DSN=${{shared.SENTRY_DSN}}
SENTRY_ENVIRONMENT=${{shared.SENTRY_ENVIRONMENT}}
ALLOWED_ORIGINS=https://<tu-proyecto>.vercel.app
CONTENT_SERVICE_URL=http://${{content-service.RAILWAY_PRIVATE_DOMAIN}}:4001
MEDIA_SERVICE_URL=http://${{media-service.RAILWAY_PRIVATE_DOMAIN}}:4002
CHATBOT_SERVICE_URL=http://${{chatbot-service.RAILWAY_PRIVATE_DOMAIN}}:4003
SPEECH_SERVICE_URL=http://${{speech-service.RAILWAY_PRIVATE_DOMAIN}}:4004
```

`PORT` no es decorativo: Railway comprueba la salud del servicio en ese puerto. Si falta,
el despliegue se queda en *Healthcheck failed*.

### 7.4 Dirección pública (solo el gateway)

`api-gateway` → *Settings → Networking → Generate Domain* → puerto **4000**. Te da algo como
`https://api-gateway-production-xxxx.up.railway.app`. **Apúntala: es la dirección de la API.**

Los otros cuatro **no llevan dirección pública**. Solo los alcanza el gateway por la red privada.

### 7.5 Desplegar y comprobar

Pulsa **Deploy** (o *Apply changes*) en los cinco. Railway los construye a la vez; tardan unos
minutos. Cuando estén en verde, en PowerShell:

```powershell
curl.exe https://<dirección-del-gateway>/health
# {"status":"ok","service":"api-gateway"}

curl.exe https://<dirección-del-gateway>/health/aggregate
# content-service y media-service en "up"
```

---

## 8. Cargar el contenido (una sola vez, desde tu PC)

Las migraciones ya las aplicó Railway. Falta el contenido. Desde la carpeta del proyecto:

```powershell
$env:DATABASE_URL_CONTENT = "<directa de Neon>&schema=content"
$env:DIRECT_URL_CONTENT = $env:DATABASE_URL_CONTENT
pnpm --filter @blackpink/content-service db:seed
Remove-Item Env:DATABASE_URL_CONTENT, Env:DIRECT_URL_CONTENT
```

Las variables de la sesión mandan sobre tu `.env` local, así que el seed va a Neon y no a tu
Docker. Cierra la ventana al terminar si quieres estar seguro.

Después:

1. Railway → `chatbot-service` → **⋮ → Restart**. PINKY indexa el contenido al arrancar; tarda
   unos minutos por las pausas que protegen la cuota de Gemini.
2. Comprueba que la API devuelve datos:
   ```powershell
   curl.exe "https://<dirección-del-gateway>/api/v1/content/members?locale=es"
   ```

---

## 9. La web en Vercel

### 9.1 Importar

1. **Add New → Project → Import** `JuanK2550/BLACK-PINK-FANSITE`.
2. **Root Directory → Edit → `frontend`**. Vercel detecta Next.js.
3. No toques *Build Command* ni *Install Command*: los fija `frontend/vercel.json`
   (instala con pnpm 11 y compila con Turborepo la web y los paquetes que usa).
4. Deja activado *Include files outside the root directory in the Build Step*.

### 9.2 Variables por entorno

Vercel tiene tres entornos: **Production** (tu dominio), **Preview** (una URL por cada rama o
pull request) y **Development** (solo para `vercel dev`; en tu PC manda el `.env`, así que no
hace falta rellenarlo).

Añádelas en la pantalla de importación y ajusta después en *Settings → Environment Variables*
qué casillas lleva cada una:

| Variable | Production | Preview | Valor |
| --- | :---: | :---: | --- |
| `NEXT_PUBLIC_API_URL` | ✅ | ✅ | `https://<dirección-del-gateway>` |
| `API_GATEWAY_URL` | ✅ | ✅ | La misma |
| `INTERNAL_API_KEY` | ✅ | ✅ | El mismo secreto que en Railway (márcala *Sensitive*) |
| `REVALIDATE_SECRET` | ✅ | — | El segundo secreto del paso 4 (*Sensitive*) |
| `NEXT_PUBLIC_SITE_URL` | ✅ | — | `https://<tu-proyecto>.vercel.app` y, cuando tengas dominio, `https://tudominio.com` |
| `NEXT_PUBLIC_SENTRY_DSN` | ✅ | ✅ | Paso 11 (opcional) |
| `SENTRY_AUTH_TOKEN` · `SENTRY_ORG` · `SENTRY_PROJECT` | ✅ | — | Paso 11 (opcional) |
| `GOOGLE_SITE_VERIFICATION` | ✅ | — | Paso 13 (opcional) |

`NEXT_PUBLIC_SITE_URL` va **solo en Production** a propósito: en una preview el sitio usa su
propia URL y además sale marcado como `noindex`, para que Google no indexe copias de prueba.

### 9.3 Ajustes del proyecto

- *Settings → Build and Deployment → Node.js Version*: **22.x**.
- *Settings → Build and Deployment → Deployment Checks → Add Checks → GitHub*:
  **«Lint, typecheck, test y build»**. Así producción no se actualiza con un `main` en rojo.
- Pestaña **Analytics → Enable** y pestaña **Speed Insights → Enable**. No usan cookies.

### 9.4 Desplegar

**Deploy**. Tarda 3–5 minutos. Abre `https://<tu-proyecto>.vercel.app/es`.

Si activaste Analytics o Speed Insights después del primer despliegue, haz **Redeploy**: sus
rutas se añaden en el siguiente.

---

## 10. Dominio propio (opcional, recomendado para Google)

1. Vercel → *Settings → Domains → Add* → `tudominio.com`. Acepta la redirección de `www`.
2. Vercel te enseña los registros DNS: **cópialos tal cual** en tu registrador. Los certificados
   HTTPS se generan solos.
3. Actualiza y vuelve a desplegar:
   - Vercel: `NEXT_PUBLIC_SITE_URL=https://tudominio.com` → *Redeploy*.
   - Railway, `api-gateway`:
     `ALLOWED_ORIGINS=https://tudominio.com,https://www.tudominio.com,https://<tu-proyecto>.vercel.app`

Sin `ALLOWED_ORIGINS` correcto, las páginas cargan pero **el chat, la voz y el buscador fallan**
(el navegador lo bloquea por CORS). Una preview tampoco puede usarlos salvo que añadas su URL.

---

## 11. Errores en Sentry (opcional, recomendado)

1. Crea dos proyectos: plataforma **Next.js** → `blackpink-web`, y plataforma **Node.js** →
   `blackpink-servicios`.
2. Copia el **DSN** de cada uno:
   - `blackpink-web` → Vercel, `NEXT_PUBLIC_SENTRY_DSN` (Production y Preview).
   - `blackpink-servicios` → Railway, variable compartida `SENTRY_DSN`.
3. Para ver los errores con el código legible: *Settings → Auth Tokens → Create New Token* →
   en Vercel (solo Production) `SENTRY_AUTH_TOKEN`, `SENTRY_ORG` (el identificador de tu
   organización) y `SENTRY_PROJECT=blackpink-web`. Los *source maps* se suben al compilar y se
   borran del despliegue: nadie más puede descargarlos.
4. *Redeploy* en Vercel y reinicia los servicios en Railway.

**Qué se envía y qué no:** solo errores. Sin cuerpos de petición (ni audio ni mensajes del
chat), sin cookies, sin cabeceras salvo el navegador, sin la parte `?…` de las URL, sin IP, sin
grabación de sesiones y sin trazas de rendimiento. De los servicios, solo los errores 500:
los 502–504 son caídas de otro servicio y de esas avisa el monitor del paso 12.

Sin DSN no se carga nada de Sentry: ni en la web ni en los servicios.

---

## 12. Aviso si el sitio se cae (UptimeRobot)

El *healthcheck* de Railway **solo se usa al desplegar**, no vigila después. Railway sí reinicia
un servicio que se cae (`ON_FAILURE` en su `railway.json`), pero no te avisa. Para eso:

*Add New Monitor* → tipo **HTTP(s)**, intervalo **5 minutos**, alerta a tu correo:

| Nombre | URL |
| --- | --- |
| Web | `https://tudominio.com/es` |
| API | `https://<dirección-del-gateway>/health` |
| Contenido | `https://<dirección-del-gateway>/health/aggregate` |

Las tres son seguras de consultar cada 5 minutos: **ninguna despierta la base de datos**
(`/health/aggregate` pregunta a `/health` de cada servicio, que no hace consultas).

Sobre los arranques en frío: en Railway los servicios no se duermen, así que no hace falta
ningún truco para mantenerlos despiertos. Lo único que «se duerme» es Neon, y está bien que lo
haga: es lo que mantiene la base en el plan gratuito.

---

## 13. Aparecer en Google

### 13.1 Lo que el sitio ya hace

- Cada página sale del servidor con su **título, descripción y URL canónica**, en los tres
  idiomas y con `hreflang` para que Google sepa que `/es`, `/en` y `/ko` son la misma página.
- `https://tudominio.com/sitemap.xml` lista todas las páginas, integrantes y discos, y
  `robots.txt` lo anuncia.
- La portada declara el sitio (`WebSite`) con nombre **BLACKPINK Fansite**; los discos y las
  integrantes llevan sus datos estructurados. Ninguno dice que sea la web oficial.
- Así se verá en los resultados (Google puede reescribir la descripción):

  > **BLACKPINK Fansite: discografía, integrantes y cronología**
  > tudominio.com › es
  > Fansite no oficial de BLACKPINK: discografía completa del grupo y de Jisoo, Jennie, Rosé y
  > Lisa, cronología, curiosidades, galería y quiz.

  Esos textos están en `frontend/messages/{es,en,ko}.json` (`Home.metaTitle` y
  `Home.metaDescription`).

### 13.2 Lo que tienes que hacer tú

1. Search Console → **Add property**:
   - Con dominio propio: **Domain** → `tudominio.com` → añade el registro **TXT** que te da en
     tu registrador → *Verify*. Es la mejor opción.
   - Sin dominio: **URL prefix** → `https://<tu-proyecto>.vercel.app` → método **HTML tag** →
     copia solo el valor de `content="…"` en Vercel como `GOOGLE_SITE_VERIFICATION` →
     *Redeploy* → *Verify*.
2. **Sitemaps** → escribe `sitemap.xml` → *Submit*.
3. **URL Inspection** → `https://tudominio.com/es` → **Request indexing**. Repite con `/en` y
   `/ko`.

### 13.3 Qué esperar, sin adornos

- Las primeras páginas suelen aparecer **entre unos días y unas semanas**.
- «blackpink fansite» es una búsqueda con competencia. Lo que más ayuda: **dominio propio**,
  **enlaces desde otros sitios** (comunidades de fans, Reddit, redes) y mantener el contenido al
  día. Nadie puede garantizar un puesto: desconfía de quien lo venda.
- Search Console → *Pages* te dice qué está indexado y por qué algo no lo está.

---

## 14. GitHub

- **Refresco semanal** (*Actions → Refresco de contenido*): crea los secretos `SITE_URL`
  (`https://tudominio.com`) y `REVALIDATE_SECRET`. El paso de reindexar PINKY se salta solo:
  `chatbot-service` no tiene dirección pública, y se reindexa al reiniciarlo.
- **Copia de seguridad diaria** (opcional; Neon ya permite restaurar a un momento reciente):
  secretos `DATABASE_URL_PROD` (la **directa** de Neon) y `BACKUP_PASSPHRASE` (una frase larga),
  y *Actions → Copia de seguridad de la base → Enable workflow*.
- Ya **no hay workflows de despliegue**: Vercel y Railway despliegan solos cuando CI termina en
  verde (*Deployment Checks* y *Wait for CI*).

---

## 15. El día a día después de publicar

| Qué cambias | Qué pasa / qué haces |
| --- | --- |
| Código de la web | `git push` → CI → Vercel publica al pasar CI |
| Código de un servicio | `git push` → CI → Railway redespliega **solo** los servicios afectados |
| Una migración de Prisma | Nada: `content-service` la aplica antes de arrancar |
| Contenido (`seed-data/`) | `git push`, repite el paso 8, vacía la caché (Upstash → pestaña **CLI** → `FLUSHDB`) y reinicia `chatbot-service`. Las páginas se refrescan en menos de una hora, o al momento con *Actions → Refresco de contenido → Run workflow* |

### Registros

- **Railway** → servicio → **Logs**. Son JSON: filtra con `@level:error`, o por texto
  (`/api/v1/chat`). Se guardan 7 días en Hobby. Llevan método, ruta, código y tiempo, **nunca**
  cabeceras de autenticación, cookies, mensajes del chat ni audio.
- **Vercel** → **Logs**: la web. En Hobby solo guarda la última hora; lo que importa llega a
  Sentry.

### Si algo falla

| Síntoma | Causa probable |
| --- | --- |
| La compilación de Vercel falla al generar páginas | `API_GATEWAY_URL` mal escrita o el gateway caído: despliega antes los servicios |
| Railway: *Healthcheck failed* | Falta `PORT` en ese servicio o no coincide con el de la tabla |
| `content-service` falla en *Pre-deploy* | `DIRECT_URL_CONTENT` mal copiada |
| Todo el mundo recibe «demasiadas peticiones» | Falta `TRUST_PROXY=1` |
| El chat o el buscador no responden y la consola habla de CORS | Tu dominio no está en `ALLOWED_ORIGINS` |
| PINKY dice que no está disponible | Falta `GOOGLE_AI_API_KEY`, o no reiniciaste `chatbot-service` tras cargar el contenido |
| El contenido nuevo no aparece | Caché de Upstash: `FLUSHDB` en su CLI, y *Refresco de contenido* |

---

## 16. Cabeceras de seguridad

Las pone `frontend/src/lib/security-headers.ts` en todas las páginas:

- **Content-Security-Policy**: el navegador solo carga código del propio sitio, portadas de
  `i.scdn.co`, llamadas a tu gateway y a Sentry, y **solo deja incrustar el reproductor de
  Spotify**. Nadie puede meter el sitio dentro de otro (`frame-ancestors 'none'`).
  - **YouTube no está permitido**, y es a propósito: el proyecto lo retiró y ninguna página lo
    usa. Permitir un origen que nada usa solo abre una puerta. Si vuelve, se añade
    `https://www.youtube-nocookie.com` a `frame-src` en ese mismo fichero.
  - Lleva `'unsafe-inline'` en scripts porque las páginas se generan estáticas y se refrescan
    solas; con un *nonce* habría que renderizar cada visita, y se perdería esa ventaja.
- **Strict-Transport-Security**: siempre HTTPS durante dos años.
- **X-Frame-Options**, **X-Content-Type-Options** y **Referrer-Policy**.
- **Permissions-Policy**: micrófono solo para el propio sitio (dictado a PINKY); cámara,
  ubicación, pagos y USB para nadie.
- En las previews, **X-Robots-Tag: noindex**.

Compruébalo con `curl.exe -sI https://tudominio.com/es` o en <https://securityheaders.com>.

---

## 17. Lista de comprobación antes de anunciarlo

**Seguridad**

- [ ] `INTERNAL_API_KEY` y `REVALIDATE_SECRET` son los generados en el paso 4, no los de ejemplo
- [ ] Las claves de Gemini y Groq están solo en Railway, nunca en Vercel ni en el repositorio
- [ ] `ALLOWED_ORIGINS` contiene solo tus dominios
- [ ] `TRUST_PROXY=1` en los cinco servicios
- [ ] Solo `api-gateway` tiene dirección pública en Railway
- [ ] `curl.exe -sI https://tudominio.com/es` muestra `content-security-policy` y `strict-transport-security`

**El sitio funciona**

- [ ] `/es`, `/en` y `/ko` cargan, con el aviso de sitio no oficial abajo
- [ ] Una ficha de disco reproduce una canción en el reproductor de Spotify
- [ ] Las portadas, las fotos de integrantes y la galería se ven
- [ ] PINKY responde, y el dictado por voz pide permiso de micrófono y transcribe
- [ ] El buscador y el quiz funcionan; el resultado del quiz se puede compartir
- [ ] Una URL inventada (`/es/no-existe`) enseña la página 404 del sitio

**Google**

- [ ] `https://tudominio.com/sitemap.xml` lista URLs con **tu dominio**, no `localhost` ni `vercel.app`
- [ ] Ver código fuente de `/es`: `<title>`, `<meta name="description">` y `<link rel="canonical">` con tu dominio
- [ ] Search Console verificado y sitemap enviado
- [ ] Una URL de preview responde con `x-robots-tag: noindex`

**Vigilancia y costes**

- [ ] UptimeRobot: los tres monitores en verde
- [ ] Railway → Logs de un servicio: líneas JSON con `"level":"info"`
- [ ] Sentry recibe eventos (si lo configuraste)
- [ ] Railway → *Workspace → Usage → Usage limits*: pon un tope (por ejemplo 10 USD) para que nunca haya sorpresas
- [ ] Neon y Upstash: el consumo del primer día es razonable

---

## Plan B: Render

`infra/render.yaml` describe los mismos 5 servicios para Render.

1. Render → **New → Blueprint** → conecta el repositorio.
2. **Blueprint Path**: `infra/render.yaml`.
3. Render pide los valores marcados como secretos. Para las URL internas: cada servicio privado
   enseña su **Internal Address** (`nombre:puerto`); escríbela como `http://nombre:puerto`.
4. **Deploy Blueprint**.

Diferencias con Railway que conviene saber:

- Los servicios internos son **privados** (`pserv`), y Render **no los ofrece gratis**: los cinco
  van en el plan de pago más pequeño. Cuesta bastante más que Railway; mira el precio actual en
  <https://render.com/pricing> antes de elegirlo.
- Las migraciones van en `preDeployCommand` igual que en Railway, y el despliegue espera a
  CI (`autoDeployTrigger: checksPass`).
- `INTERNAL_API_KEY` la genera Render: cópiala desde el grupo `blackpink-comun` a Vercel.
- `SENTRY_DSN` se añade a mano en el grupo `blackpink-comun` si lo usas.
