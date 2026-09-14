# Publicar el sitio gratis

Guía paso a paso para poner el sitio en internet **sin pagar nada y sin tarjeta**, en el orden
exacto en el que hay que hacerlo. Al final hay una lista de comprobación para antes de
anunciarlo.

---

## 1. Qué va dónde

| Pieza | Dónde | Plan |
| --- | --- | --- |
| Web (`frontend/`) | **Vercel** | Hobby (gratis) |
| Los 5 servicios (`backend/`), juntos | **Render** | Free |
| PostgreSQL + pgvector | **Neon** | Free |
| Redis (caché) | **Upstash** | Free |
| Chatbot PINKY | **Google AI Studio** (Gemini) | Gratis |
| Dictado por voz | **Groq** | Gratis |
| Aviso si el sitio se cae (y lo mantiene despierto) | **UptimeRobot** | Free |
| Errores (opcional) | **Sentry** | Developer (gratis) |
| Aparecer en Google | **Google Search Console** | Gratis |

La dirección será `https://<nombre-del-proyecto>.vercel.app`. Google la indexa igual que un
dominio propio. Un dominio propio (`.com`) se paga y es opcional: se puede añadir más adelante
sin cambiar nada del código.

### ¿Vercel o Firebase? Vercel

- **Next.js es de Vercel.** Las páginas que se refrescan solas, las imágenes, los idiomas y la
  tarjeta del quiz funcionan sin configurar nada, y el plan Hobby es gratis.
- **Firebase App Hosting exige el plan Blaze**, que pide tarjeta. Tampoco aloja los 5 servicios.
- **Para Google da igual dónde esté alojado.** Lo que cuenta es que el HTML llegue pintado con
  título, descripción y `sitemap.xml`, y eso ya lo hace el sitio.
- El plan Hobby es para uso **no comercial**: un sitio de fans sin anuncios encaja.

### ¿Por qué los 5 servicios juntos?

El plan gratuito de Render da **un servicio con 512 MB de memoria**, y cinco servicios separados
no caben en lo gratis de ninguna plataforma. `infra/todo-en-uno/` los arranca en un solo
proceso: el código sigue separado por servicios y en local todo funciona igual que antes.
Medido en esta máquina: **unos 150 MB con los cinco en marcha**.

Dos cosas que conviene saber:

- Un servicio gratuito de Render **se duerme tras 15 minutos sin visitas** y tarda cerca de un
  minuto en despertar. Lo evita el monitor del paso 8, que lo visita cada 5 minutos. Render da
  750 horas gratis al mes, y un mes entero son 744: alcanza justo para uno encendido siempre.
- Si Render se cae, **la web sigue viéndose** (Vercel guarda las páginas ya generadas). Lo que
  deja de funcionar mientras tanto son el chat, la voz y el buscador.

---

## 2. Orden

```
Neon + Upstash  →  Render  →  UptimeRobot  →  cargar contenido  →  Vercel
      →  ajustar CORS  →  Google Search Console  →  lista de comprobación
```

La web va **después** de la API: al compilar, Vercel le pide los datos para generar las páginas.

---

## 3. Cuentas

Entra en todas con **«Continue with GitHub»** (usuario `JuanK2550`). Si alguna pide tarjeta,
detente: ninguna de estas debería pedirla.

1. <https://neon.com>
2. <https://upstash.com>
3. <https://render.com>
4. <https://vercel.com/signup> → plan **Hobby**
5. <https://uptimerobot.com>
6. <https://search.google.com/search-console> (con tu cuenta de Google)
7. <https://sentry.io/signup> (opcional)

Ten a mano las claves que ya usas en local: `GOOGLE_AI_API_KEY` (de
<https://aistudio.google.com/apikey>) y `GROQ_API_KEY` (de <https://console.groq.com>).

---

## 4. Generar los dos secretos

En PowerShell, dos veces, y guarda cada resultado en un gestor de contraseñas o un archivo que
no subas a GitHub:

```powershell
node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"
```

- El primero es **`INTERNAL_API_KEY`** (lo comparten la web y la API).
- El segundo es **`REVALIDATE_SECRET`** (solo la web y GitHub).

---

## 5. Base de datos en Neon

1. **New Project**
   - *Name*: `blackpink`
   - *Postgres version*: **16**
   - *Region*: **AWS US East 1 (N. Virginia)**
2. Menú **SQL Editor**, pega esto y pulsa *Run*:
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

**Por qué dos cadenas:** la API usa la *pooled*, que reparte muchas conexiones cortas; las
migraciones necesitan la *directa*.

**Consumo:** el plan gratuito da 0,5 GB y 100 horas de cómputo al mes, y la base **se apaga sola
tras 5 minutos sin consultas**. No la mantengas despierta: el monitor del paso 8 visita
`/health`, que no toca la base a propósito.

---

## 6. Redis en Upstash

1. **Create Database**
   - *Name*: `blackpink`
   - *Primary Region*: **US-East-1 (N. Virginia)**
   - *Plan*: Free
2. Activa **Eviction** (si se llena, borra lo más viejo en vez de dar error).
3. En **Connect** copia la URL que empieza por **`rediss://`** (con dos «s»). Esa es
   **`REDIS_URL`**.

El plan gratuito da 500.000 comandos al mes; el panel enseña cuántos llevas.

---

## 7. La API en Render

### 7.1 Crear el servicio

1. **New → Web Service → Git Provider → GitHub** y elige `JuanK2550/BLACK-PINK-FANSITE`.
2. Rellena:

   | Campo | Valor |
   | --- | --- |
   | *Name* | `blackpink-api` |
   | *Language* | **Docker** |
   | *Branch* | `main` |
   | *Region* | **Virginia (US East)** |
   | *Root Directory* | vacío |
   | *Dockerfile Path* | `infra/todo-en-uno/Dockerfile` |
   | *Docker Build Context Directory* | `.` |
   | *Instance Type* | **Free** |

3. **Environment Variables** → *Add from .env* o una a una:

   ```
   NODE_ENV=production
   LOG_LEVEL=info
   TRUST_PROXY=1
   INTERNAL_API_KEY=<el primer secreto del paso 4>
   DATABASE_URL_CONTENT=<pooled de Neon>&schema=content
   DIRECT_URL_CONTENT=<directa de Neon>&schema=content
   DATABASE_URL_CHAT=<pooled de Neon>&schema=chat
   REDIS_URL=<la rediss:// de Upstash>
   ALLOWED_ORIGINS=https://blackpink-fansite.vercel.app
   GOOGLE_AI_API_KEY=<tu clave de Google AI Studio>
   GROQ_API_KEY=<tu clave de Groq>
   ```

   `ALLOWED_ORIGINS` se corrige en el paso 11 si Vercel te da otra dirección.

4. **Advanced**:
   - *Health Check Path*: `/health`
   - *Auto-Deploy*: **After CI Checks Pass** (no despliega un `main` en rojo)
5. **Deploy Web Service**. La primera vez tarda unos 10 minutos. Al terminar, arriba aparece la
   dirección: algo como `https://blackpink-api.onrender.com`. **Apúntala: es la dirección de la
   API.**

(Atajo equivalente: *New → Blueprint*, *Blueprint Path* `infra/render.yaml`. Crea lo mismo y te
pide las variables secretas.)

### 7.2 Qué hace al arrancar

- Aplica las migraciones de la base (`prisma migrate deploy`) antes de arrancar nada.
- Arranca content, media, chatbot y voz en puertos internos, y el gateway en el puerto público.
- `TRUST_PROXY=1` es obligatorio: sin él, todos los visitantes llegan con la IP del proxy de
  Render y el límite de peticiones por IP pasa a ser uno solo para todo el sitio.

### 7.3 Comprobar

En PowerShell:

```powershell
curl.exe https://<dirección-de-render>/health
# {"status":"ok","service":"api-gateway"}

curl.exe https://<dirección-de-render>/health/aggregate
# content-service y media-service en "up"
```

---

## 8. Mantenerla despierta y recibir avisos (UptimeRobot)

*Add New Monitor* → tipo **HTTP(s)**, intervalo **5 minutes**, avisos a tu correo:

| Nombre | URL |
| --- | --- |
| API | `https://<dirección-de-render>/health` |

Visitarla cada 5 minutos impide que Render la duerma, y además te avisa por correo si se cae.
Ese `/health` no consulta la base, así que Neon sigue apagándose cuando nadie la usa.

Cuando la web esté publicada (paso 10), añade un segundo monitor con
`https://<tu-proyecto>.vercel.app/es`.

---

## 9. Cargar el contenido (una sola vez, desde tu PC)

Las migraciones ya las aplicó Render. Falta el contenido. Desde la carpeta del proyecto:

```powershell
$env:DATABASE_URL_CONTENT = "<directa de Neon>&schema=content"
$env:DIRECT_URL_CONTENT = $env:DATABASE_URL_CONTENT
pnpm --filter @blackpink/content-service db:seed
pnpm --filter @blackpink/content-service db:orphans -- --fix
Remove-Item Env:DATABASE_URL_CONTENT, Env:DIRECT_URL_CONTENT
```

Las variables de la sesión mandan sobre tu `.env` local, así que el seed va a Neon y no a tu
Docker. `db:orphans --fix` borra las filas que el seed ya no genera: al corregir el texto de un
hito o de una curiosidad se crea una fila nueva, y sin este paso la versión vieja seguiría
publicada al lado. La primera vez no borra nada.

Después:

1. Render → `blackpink-api` → **Manual Deploy → Restart service**. PINKY indexa el contenido al
   arrancar; tarda unos minutos por las pausas que protegen la cuota de Gemini.
2. Comprueba que la API devuelve datos:
   ```powershell
   curl.exe "https://<dirección-de-render>/api/v1/content/members?locale=es"
   ```

---

## 10. La web en Vercel

### 10.1 Importar

1. **Add New → Project → Import** `JuanK2550/BLACK-PINK-FANSITE`.
2. *Project Name*: `blackpink-fansite`. Será tu dirección: `blackpink-fansite.vercel.app`
   (si está cogido, Vercel te propone otro).
3. **Root Directory → Edit → `frontend`**. Vercel detecta Next.js.
4. No toques *Build Command* ni *Install Command*: los fija `frontend/vercel.json`.

### 10.2 Variables

Añádelas en la pantalla de importación. Después, en *Settings → Environment Variables*, deja
cada una solo en los entornos que marca la tabla:

| Variable | Production | Preview | Valor |
| --- | :---: | :---: | --- |
| `NEXT_PUBLIC_API_URL` | ✅ | ✅ | `https://<dirección-de-render>` |
| `API_GATEWAY_URL` | ✅ | ✅ | La misma |
| `INTERNAL_API_KEY` | ✅ | ✅ | El mismo secreto que en Render (márcala *Sensitive*) |
| `REVALIDATE_SECRET` | ✅ | — | El segundo secreto del paso 4 (*Sensitive*) |
| `NEXT_PUBLIC_SITE_URL` | ✅ | — | `https://blackpink-fansite.vercel.app` (la tuya) |
| `NEXT_PUBLIC_SENTRY_DSN` | ✅ | ✅ | Paso 13 (opcional) |
| `GOOGLE_SITE_VERIFICATION` | ✅ | — | Paso 12 |

- **Production** es tu dirección pública; **Preview** son copias de prueba por cada rama.
- `NEXT_PUBLIC_SITE_URL` va **solo en Production**: las previews usan su propia URL y salen
  marcadas `noindex`, para que Google no indexe copias de prueba.
- **Development** no hace falta: en tu PC manda el `.env`.

### 10.3 Ajustes

- *Settings → Build and Deployment → Node.js Version*: **22.x**.
- *Settings → Build and Deployment → Deployment Checks → Add Checks → GitHub*:
  **«Lint, typecheck, test y build»**. Si esa opción no aparece en tu plan, sáltala.
- Opcional: pestaña **Analytics → Enable** y **Speed Insights → Enable** (gratis y sin
  cookies). **Después** añade `VERCEL_ANALYTICS=1` y `VERCEL_SPEED_INSIGHTS=1` en
  Production. Sin activarlos en el panel, su script da 404 en cada página; por eso el sitio
  no lo carga hasta que la variable lo pide.

### 10.4 Desplegar

Antes de pulsar **Deploy**, abre `https://<dirección-de-render>/health` en el navegador para
asegurarte de que la API está despierta. Luego **Deploy**: tarda 3–5 minutos. Abre
`https://blackpink-fansite.vercel.app/es`.

Si activaste Analytics después del primer despliegue, haz **Redeploy**.

---

## 11. Ajustar CORS

Si Vercel te dio una dirección distinta de `blackpink-fansite.vercel.app`, en Render →
*Environment* cambia:

```
ALLOWED_ORIGINS=https://<tu-dirección>.vercel.app
```

Sin esto las páginas cargan, pero **el chat, la voz y el buscador fallan** (el navegador los
bloquea por CORS).

---

## 12. Aparecer en Google

### 12.1 Lo que el sitio ya hace

- Cada página sale del servidor con **título, descripción y URL canónica**, en los tres idiomas y
  con `hreflang`.
- `/sitemap.xml` lista todas las páginas, integrantes y discos, y `robots.txt` lo anuncia.
- La portada declara el sitio con el nombre **BLACKPINK Fansite**, sin decir nunca que sea la web
  oficial.
- Así se verá en los resultados (Google puede reescribir la descripción):

  > **BLACKPINK Fansite: discografía, integrantes y cronología**
  > blackpink-fansite.vercel.app › es
  > Fansite no oficial de BLACKPINK: discografía completa del grupo y de Jisoo, Jennie, Rosé y
  > Lisa, cronología, curiosidades, galería y quiz.

### 12.2 Lo que tienes que hacer

1. Search Console → **Add property → URL prefix** → `https://blackpink-fansite.vercel.app`.
2. Método **HTML tag**: copia solo el valor que va entre las comillas de `content="…"`.
3. En Vercel crea `GOOGLE_SITE_VERIFICATION` con ese valor (Production) → *Redeploy*.
4. Vuelve a Search Console → **Verify**.
5. **Sitemaps** → escribe `sitemap.xml` → **Submit**.
6. **URL Inspection** → `https://blackpink-fansite.vercel.app/es` → **Request indexing**. Repite
   con `/en` y `/ko`.

### 12.3 Qué esperar, sin adornos

- Las primeras páginas suelen aparecer **entre unos días y unas semanas** después.
- «blackpink fansite» tiene competencia. Lo que más ayuda: **enlaces desde otros sitios**
  (comunidades de fans, Reddit, redes) y mantener el contenido al día. Nadie puede garantizar un
  puesto.
- Search Console → *Pages* te dice qué está indexado y por qué algo no lo está.

---

## 13. Errores en Sentry (opcional)

1. Crea dos proyectos: **Next.js** → `blackpink-web`, y **Node.js** → `blackpink-api`.
2. DSN de `blackpink-web` → Vercel, `NEXT_PUBLIC_SENTRY_DSN` → *Redeploy*.
3. DSN de `blackpink-api` → Render, `SENTRY_DSN` → se reinicia solo.

Solo se envían errores: sin cuerpos de petición (ni audio ni mensajes del chat), sin cookies,
sin IP y sin grabar sesiones. Sin DSN no se carga nada de Sentry.

---

## 14. GitHub

- **Refresco semanal** (*Actions → Refresco de contenido*): crea los secretos `SITE_URL`
  (`https://blackpink-fansite.vercel.app`) y `REVALIDATE_SECRET`. El paso de reindexar PINKY se
  salta solo: se reindexa al reiniciar el servicio en Render.
- La **copia de seguridad diaria** queda apagada: Neon ya permite restaurar a un momento reciente.

---

## 15. El día a día después de publicar

| Qué cambias | Qué pasa / qué haces |
| --- | --- |
| Código de la web | `git push` → CI en verde → Vercel publica |
| Código de un servicio | `git push` → CI en verde → Render reconstruye la API (~10 min) |
| Una migración de Prisma | Nada: se aplica al arrancar |
| Contenido (`seed-data/`) | `git push`, repite el paso 9, vacía la caché (Upstash → pestaña **CLI** → `FLUSHDB`) y *Restart service* en Render. Las páginas se refrescan en menos de una hora, o al momento con *Actions → Refresco de contenido → Run workflow* |

### Registros

- **Render** → `blackpink-api` → **Logs**. Son JSON: busca `"level":"error"` o una ruta
  (`/api/v1/chat`). Llevan método, ruta, código y tiempo; **nunca** cookies, claves, mensajes del
  chat ni audio.
- **Vercel** → **Logs** para la web (en Hobby solo guarda la última hora).

### Si algo falla

| Síntoma | Causa probable |
| --- | --- |
| La compilación de Vercel falla al generar páginas | La API estaba dormida o `API_GATEWAY_URL` está mal: abre `/health` y *Redeploy* |
| Render: el despliegue falla al arrancar | Mira *Logs*: casi siempre una URL de Neon mal copiada |
| Todo el mundo recibe «demasiadas peticiones» | Falta `TRUST_PROXY=1` en Render |
| El chat o el buscador no responden y la consola habla de CORS | Tu dirección no está en `ALLOWED_ORIGINS` |
| PINKY dice que no está disponible | Falta `GOOGLE_AI_API_KEY`, o no reiniciaste tras cargar el contenido |
| La primera visita del día tarda un minuto | El monitor de UptimeRobot está pausado: Render durmió la API |
| El contenido nuevo no aparece | Caché de Upstash: `FLUSHDB` en su CLI, y *Refresco de contenido* |

---

## 16. Cabeceras de seguridad

Las pone `frontend/src/lib/security-headers.ts` en todas las páginas:

- **Content-Security-Policy**: el navegador solo carga código del propio sitio, portadas de
  `i.scdn.co`, llamadas a tu API y a Sentry, y **solo deja incrustar el reproductor de
  Spotify**. Nadie puede meter el sitio dentro de otro.
  - **YouTube no está permitido a propósito**: el proyecto lo retiró y ninguna página lo usa.
    Si vuelve, se añade `https://www.youtube-nocookie.com` a `frame-src` en ese fichero.
  - Lleva `'unsafe-inline'` en scripts porque las páginas se generan estáticas; con un *nonce*
    habría que renderizar cada visita.
- **Strict-Transport-Security**, **X-Frame-Options**, **X-Content-Type-Options** y
  **Referrer-Policy**.
- **Permissions-Policy**: micrófono solo para el propio sitio (dictado a PINKY); cámara,
  ubicación y pagos para nadie.
- En las previews, **X-Robots-Tag: noindex**.

Compruébalo en <https://securityheaders.com>.

---

## 17. Lista de comprobación antes de anunciarlo

**Seguridad**

- [ ] `INTERNAL_API_KEY` y `REVALIDATE_SECRET` son los generados en el paso 4
- [ ] Las claves de Gemini y Groq están solo en Render, nunca en Vercel ni en GitHub
- [ ] `ALLOWED_ORIGINS` contiene solo tu dirección de Vercel
- [ ] <https://securityheaders.com> con tu dirección da nota A o superior

**El sitio funciona**

- [ ] `/es`, `/en` y `/ko` cargan, con el aviso de sitio no oficial abajo
- [ ] Una ficha de disco reproduce una canción en el reproductor de Spotify
- [ ] Las portadas, las fotos de integrantes y la galería se ven
- [ ] PINKY responde, y el dictado por voz pide permiso de micrófono y transcribe
- [ ] El buscador y el quiz funcionan
- [ ] Una URL inventada (`/es/no-existe`) enseña la página 404 del sitio
- [ ] El límite por IP es por persona: busca 25 veces seguidas desde el PC hasta ver «demasiadas
      peticiones», y comprueba que desde el móvil con datos el buscador sigue funcionando

**Google**

- [ ] `/sitemap.xml` lista URLs con tu dirección de Vercel, no `localhost`
- [ ] Search Console verificado y sitemap enviado
- [ ] Una URL de preview responde con `x-robots-tag: noindex`

**Vigilancia y cuotas**

- [ ] UptimeRobot: los monitores en verde
- [ ] Render → Logs: líneas JSON con `"level":"info"`
- [ ] Neon y Upstash: el consumo del primer día es razonable
