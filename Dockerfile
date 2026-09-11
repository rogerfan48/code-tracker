FROM node:22-alpine AS base

FROM base AS deps
RUN apk add --no-cache libc6-compat
WORKDIR /app
COPY package.json pnpm-lock.yaml ./
RUN corepack enable pnpm && pnpm i --frozen-lockfile

FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
# prisma generate only validates the schema; the URL is never dialed at build time
ENV DATABASE_URL="postgresql://user:password@localhost:5432/db"
RUN corepack enable pnpm && npx prisma generate && pnpm run build

FROM base AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

COPY --from=builder --chown=node:node /app/public ./public
COPY --from=builder --chown=node:node /app/.next/standalone ./
COPY --from=builder --chown=node:node /app/.next/static ./.next/static
COPY --from=builder --chown=node:node /app/prisma ./prisma
COPY --from=builder --chown=node:node /app/prisma.config.ts ./prisma.config.ts
# full node_modules so `prisma migrate deploy` runs with the pinned local CLI
COPY --from=builder --chown=node:node /app/node_modules ./node_modules

USER node
EXPOSE 3000
CMD ["sh", "-c", "npx prisma migrate deploy && node server.js"]
