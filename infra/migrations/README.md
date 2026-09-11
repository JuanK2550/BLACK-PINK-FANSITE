# Migraciones

Las migraciones de base de datos **no viven aqui**: cada microservicio es dueno de su
propio schema de Postgres y guarda sus migraciones Prisma junto a su codigo.

| Servicio          | Schema    | Ruta de las migraciones                    |
| ----------------- | --------- | ------------------------------------------ |
| content-service   | `content` | `services/content-service/prisma/migrations` |
| media-service     | `media`   | `services/media-service/prisma/migrations`   |
| chatbot-service   | `chat`    | `services/chatbot-service/prisma/migrations` |

Este directorio queda reservado para scripts SQL transversales que no pertenecen a
ningun servicio concreto (extensiones, roles, mantenimiento). La inicializacion del
contenedor local esta en `infra/postgres/init.sql`.

Desde la raiz del monorepo:

```bash
pnpm db:migrate   # ejecuta la migracion de todos los servicios que la definen
pnpm db:seed      # carga los datos semilla
```

Los esquemas Prisma llegan en la Fase 2.
