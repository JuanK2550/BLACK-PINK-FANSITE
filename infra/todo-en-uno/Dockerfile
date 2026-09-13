# syntax=docker/dockerfile:1
# Imagen única con los 5 servicios, para el plan gratuito de Render.

FROM node:22-alpine AS builder
RUN corepack enable && apk add --no-cache libc6-compat
WORKDIR /app

COPY . .
RUN pnpm install --frozen-lockfile
RUN pnpm turbo run build \
  --filter=@blackpink/api-gateway... \
  --filter=@blackpink/content-service... \
  --filter=@blackpink/media-service... \
  --filter=@blackpink/chatbot-service... \
  --filter=@blackpink/speech-service...

# Solo dependencias de producción, compartidas entre los cinco (una copia de Nest, no cinco).
RUN rm -rf node_modules frontend shared/ui e2e \
  && find backend shared -maxdepth 2 -name node_modules -type d -prune -exec rm -rf {} + \
  && pnpm install --frozen-lockfile --prod --offline --config.shamefully-hoist=true \
  --filter=@blackpink/api-gateway... \
  --filter=@blackpink/content-service... \
  --filter=@blackpink/media-service... \
  --filter=@blackpink/chatbot-service... \
  --filter=@blackpink/speech-service...

FROM node:22-alpine AS runner
ENV NODE_ENV=production \
  SERVICES_DIR=/app/backend \
  PORT=10000
WORKDIR /app

RUN addgroup -S nodejs -g 1001 && adduser -S nestjs -u 1001 -G nodejs

COPY --from=builder --chown=nestjs:nodejs /app/node_modules ./node_modules
COPY --from=builder --chown=nestjs:nodejs /app/package.json ./package.json
COPY --from=builder --chown=nestjs:nodejs /app/shared ./shared
COPY --from=builder --chown=nestjs:nodejs /app/backend ./backend
COPY --from=builder --chown=nestjs:nodejs /app/infra/todo-en-uno/start.mjs ./start.mjs

USER nestjs
EXPOSE 10000

CMD ["node", "start.mjs"]
