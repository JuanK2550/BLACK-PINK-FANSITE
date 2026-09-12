# syntax=docker/dockerfile:1
# Imagen Docker del servicio de voz.

FROM node:26-alpine AS builder
RUN corepack enable && apk add --no-cache libc6-compat
WORKDIR /app

COPY . .
RUN pnpm install --frozen-lockfile
RUN pnpm turbo run build --filter=@blackpink/speech-service...
RUN pnpm deploy --filter=@blackpink/speech-service --prod --legacy /prod

FROM node:26-alpine AS runner
ENV NODE_ENV=production
WORKDIR /app

RUN addgroup -S nodejs -g 1001 && adduser -S nestjs -u 1001 -G nodejs

COPY --from=builder --chown=nestjs:nodejs /prod/node_modules ./node_modules
COPY --from=builder --chown=nestjs:nodejs /prod/dist ./dist
COPY --from=builder --chown=nestjs:nodejs /prod/package.json ./package.json

USER nestjs
EXPOSE 4004
ENV SPEECH_SERVICE_PORT=4004

HEALTHCHECK --interval=30s --timeout=5s --start-period=20s --retries=3   CMD node -e "fetch('http://127.0.0.1:4004/health').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"

CMD ["node", "dist/main.js"]
