# BLACKPINK Fansite

> **Sitio de fans no oficial. No afiliado a YG Entertainment ni a BLACKPINK.**
> Proyecto informativo y sin ánimo de lucro. La música se reproduce **solo** con el
> reproductor oficial de Spotify: el sitio no aloja audio ni vídeo con copyright.

Web en tres idiomas (español, inglés y coreano) con la discografía completa del grupo y de
cada integrante, cronología, curiosidades, premios, galería, quiz, comparador de integrantes
y un chatbot (PINKY) que responde sobre el contenido del sitio, también por voz.

---

## Qué hay en cada carpeta

```
BLACKPINK/
├── frontend/                 La página web (Next.js 15)
│   ├── messages/             Textos en es, en y ko
│   ├── public/               Fotos de integrantes y galería
│   └── src/
│       ├── app/[locale]/     Una carpeta por página (discografia, integrantes, quiz…)
│       ├── components/       Componentes por sección:
│       │   ├── chat/         Chat de PINKY (pinky/ = el león, voice/ = grabar y escuchar)
│       │   ├── discography/  Discos, portadas y listas de canciones
│       │   ├── members/      Fichas, fotos y comparador de integrantes
│       │   ├── home/  gallery/  group/  quiz/  timeline/  trivia/
│       │   └── layout/       Cabecera de página, estructura común, SEO
│       ├── lib/              Llamadas a la API, formato de fechas, SEO…
│       └── styles/           Estilos globales
│
├── backend/                  Los 5 servicios (NestJS)
│   ├── api-gateway/          Puerta de entrada: la web solo habla con él (4000)
│   ├── content-service/      Contenido y base de datos (4001)
│   │   └── prisma/           Esquema, migraciones y datos (seed-data/)
│   ├── media-service/        Playlists y reproductores de Spotify (4002)
│   ├── chatbot-service/      Chatbot PINKY con Google Gemini (4003)
│   └── speech-service/       Transcripción de voz con Whisper (4004)
│
├── shared/                   Código que usan varias partes
│   ├── ui/                   Componentes de interfaz (layout, controls, media, effects…)
│   ├── types/                Tipos de la API, comunes a web y servicios
│   ├── service-core/         Configuración común de los servicios
│   └── config/               ESLint, TypeScript y los colores del diseño
│
├── infra/                    Docker y scripts (Spotify, galería, copias de seguridad)
├── e2e/                      Pruebas en el navegador (Playwright)
└── .github/                  CI, despliegues y plantillas
```

Cada archivo de código empieza con una línea que resume qué hace.

---

## Qué es cada archivo de la raíz

Son la configuración de las herramientas. **Tienen que estar aquí**: cada herramienta busca
su archivo en la raíz y por su nombre exacto.

| Archivo | Para qué sirve |
| --- | --- |
| `package.json` | Comandos (`pnpm …`), dependencias y la configuración de Prettier, lint-staged, commitlint y las versiones |
| `pnpm-workspace.yaml` | Dice qué carpetas son paquetes del proyecto |
| `pnpm-lock.yaml` | Versión exacta de cada dependencia. **No se edita a mano** |
| `tsconfig.json` | Configuración de TypeScript |
| `turbo.json` | Ordena las tareas (qué se compila antes que qué) y guarda caché |
| `eslint.config.mjs` | Reglas de revisión del código |
| `.gitignore` · `.prettierignore` · `.dockerignore` | Qué se ignora en Git, al formatear y al construir imágenes |
| `.nvmrc` · `.npmrc` · `.editorconfig` | Versión de Node, ajustes de instalación y del editor |
| `.env` | Tus claves. **Nunca se sube** · `.env.example` es la plantilla vacía |
| `.husky/` | Revisiones automáticas antes de cada commit |
| `.github/` | CI, despliegues, plantillas y la configuración de Lighthouse |
| `README.md` · `DEPLOY.md` · `SECURITY.md` · `LICENSE` | Esta guía, cómo publicar el sitio paso a paso, cómo reportar fallos de seguridad y la licencia |

---

## Cómo arrancarlo en local

Requisitos: **Node.js 22**, **pnpm 10** (`npm install -g pnpm`) y **Docker**.

```bash
pnpm install          # instala todo
pnpm setup            # crea el .env a partir de .env.example
pnpm docker:up:deps   # arranca PostgreSQL y Redis en Docker
pnpm db:migrate       # crea las tablas
pnpm db:seed          # carga el contenido
pnpm dev              # arranca la web y los 5 servicios
```

Después abre <http://localhost:3000>.

### Claves de API (en el `.env`)

| Clave | Para qué | Dónde se consigue |
| --- | --- | --- |
| `GOOGLE_AI_API_KEY` | Chatbot PINKY | <https://aistudio.google.com/apikey> |
| `GROQ_API_KEY` | Dictar mensajes por voz | <https://console.groq.com> |
| `SPOTIFY_CLIENT_ID` / `_SECRET` | Solo los scripts de `infra/` | <https://developer.spotify.com/dashboard> |

Sin claves la web funciona igual; solo el chat y la voz dicen que no están disponibles.
Las claves nunca llegan al navegador.

---

## Comandos

| Comando | Qué hace |
| --- | --- |
| `pnpm dev` | Web + servicios |
| `pnpm dev:web` / `pnpm dev:services` | Solo la web / solo los servicios |
| `pnpm build` | Compila todo |
| `pnpm lint` · `pnpm typecheck` · `pnpm format` | Revisión de código, tipos y formato |
| `pnpm test` | Pruebas de la web y los servicios |
| `pnpm test:e2e` | Pruebas en el navegador (escritorio y móvil) |
| `pnpm check:contrast` | Contraste de colores (AA) |
| `pnpm check:spotify` · `pnpm check:gallery` | Base y galería contra sus volcados |
| `pnpm db:seed` | Vuelve a cargar el contenido |
| `pnpm db:reset` | **Borra** la base, migra y vuelve a cargar |
| `pnpm db:backup` | Copia de seguridad en `infra/backups/` |
| `pnpm docker:up` · `pnpm docker:down` | Todos los servicios en Docker |

---

## Cómo se añade o corrige contenido

Todo el contenido está en `backend/content-service/prisma/seed-data/`: `albums.ts`,
`solo-works.ts`, `members.ts`, `timeline.ts`, `trivia.ts`, `quiz.ts` y `awards.ts`.

1. Edita el archivo. Cada dato lleva `source` (de dónde sale) y `verified`.
   **Lo que tiene `verified: false` no se publica.**
2. `pnpm db:seed` para cargarlo.
3. Si es un disco o una canción nueva, `node infra/scripts/spotify-ids.mjs --write` y
   `node infra/scripts/spotify-covers.mjs --write` buscan su reproductor y su portada.

Las fechas de lanzamiento se guardan en hora de Corea (KST) y, si hay edición digital y
física, se guarda la física.

---

## Publicar el sitio

**Todo el proceso, paso a paso y en orden, está en [DEPLOY.md](./DEPLOY.md).** En resumen:

Todo con planes gratuitos y sin tarjeta:

| Pieza | Dónde |
| --- | --- |
| Web | Vercel (`frontend/vercel.json`) |
| 5 servicios, juntos en un solo servicio | Render Free (`infra/todo-en-uno/`, `infra/render.yaml`) |
| Base de datos | Neon (PostgreSQL con pgvector) |
| Caché | Upstash (Redis) |
| Disponibilidad y errores | UptimeRobot y Sentry |

Vercel y Render despliegan solos cuando CI termina en verde en `main`; las migraciones se
aplican al arrancar la API.

### Configuración en GitHub

1. **Secretos** (*Settings → Secrets and variables → Actions*), todos opcionales:

   | Secreto | Lo usa |
   | --- | --- |
   | `SITE_URL`, `REVALIDATE_SECRET` | Refresco semanal de las páginas |
   | `DATABASE_URL_PROD`, `BACKUP_PASSPHRASE` | Copia de seguridad diaria |
   | `GOOGLE_AI_API_KEY` | Pruebas del chat real |
   | `LHCI_GITHUB_APP_TOKEN` | Lighthouse en los pull requests |

   `REVALIDATE_SECRET` e `INTERNAL_API_KEY` deben tener **al menos 24 caracteres**.

2. **Protección de `main`**: ya está activa contra borrado y reescritura de la historia.
   Si algún día se trabaja con pull requests, se pueden exigir además los checks
   «Lint, typecheck, test y build» y «Playwright (escritorio y móvil) + axe»
   (*Settings → Branches*).

3. **`db-backup` y la publicación de versiones están apagados** en *Actions* hasta que haya
   producción: sin sus secretos fallarían todos los días. Se encienden ahí mismo.

---

## Privacidad

- **Chat:** las preguntas se envían a Google Gemini. En el plan gratuito Google puede usarlas
  para entrenar sus modelos, por eso PINKY no pide datos personales y no se guarda la
  conversación.
- **Voz:** al dictar, el audio va a Groq para transcribirlo. Este proyecto no lo guarda en
  ningún sitio (ni disco, ni base de datos, ni logs). Escuchar las respuestas lo hace el
  propio navegador y no envía nada.
- **Estadísticas:** en producción, Vercel Web Analytics y Speed Insights, sin cookies.
- **Errores:** si se configura Sentry, solo le llegan errores, sin cuerpos de petición,
  cookies, IP ni grabación de sesiones.

---

## Reglas del proyecto

1. Nada de audio ni vídeo con copyright: solo el reproductor oficial de Spotify.
2. Imágenes con licencia libre y siempre con su crédito (`/creditos`).
3. PINKY es un personaje original, nunca el rostro de una persona real.
4. El chatbot solo habla del contenido del sitio y nunca inventa datos personales.
5. El aviso de sitio no oficial se ve en todas las páginas.

---

## Licencia

Código: [MIT](./LICENSE). El contenido y las marcas de terceros no están cubiertos por esa
licencia.
