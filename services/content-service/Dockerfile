# syntax=docker/dockerfile:1

# --- Etapa 1: build ----------------------------------------------------------
FROM node:22-alpine AS builder
RUN corepack enable && apk add --no-cache libc6-compat
WORKDIR /app

# El contexto de build es la raiz del monorepo (ver infra/docker-compose.yml).
COPY . .
RUN pnpm install --frozen-lockfile
RUN pnpm turbo run build --filter=@blackpink/content-service...
# Extrae el servicio con solo sus dependencias de produccion.
RUN pnpm deploy --filter=@blackpink/content-service --prod --legacy /prod

# --- Etapa 2: runtime (slim) -------------------------------------------------
FROM node:22-alpine AS runner
ENV NODE_ENV=production
WORKDIR /app

RUN addgroup -S nodejs -g 1001 && adduser -S nestjs -u 1001 -G nodejs

COPY --from=builder --chown=nestjs:nodejs /prod/node_modules ./node_modules
COPY --from=builder --chown=nestjs:nodejs /prod/dist ./dist
COPY --from=builder --chown=nestjs:nodejs /prod/package.json ./package.json
# El cliente de Prisma se genera fuera de dist/ y el codigo compilado lo
# requiere con una ruta relativa (../../prisma/generated/client). Sin esta
# copia la imagen arranca y revienta en la primera consulta.
COPY --from=builder --chown=nestjs:nodejs /prod/prisma ./prisma

USER nestjs
EXPOSE 4001
ENV CONTENT_SERVICE_PORT=4001

HEALTHCHECK --interval=30s --timeout=5s --start-period=20s --retries=3   CMD node -e "fetch('http://127.0.0.1:4001/health').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"

CMD ["node", "dist/main.js"]
