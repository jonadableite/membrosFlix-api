# ==========================
# Stage 1: Build
# ==========================
FROM node:22-alpine AS builder
WORKDIR /app

RUN apk add --no-cache bash git python3 make g++ openssl openssl-dev

COPY package*.json ./
RUN npm install

COPY . .

# Build completo com Prisma + TypeScript + tsc-alias
RUN npx prisma generate && \
    npx tsc -p tsconfig.json && \
    npx tscpaths -p tsconfig.json -s ./src -o ./dist

# ==========================
# Stage 2: Production
# ==========================
FROM node:22-alpine AS production
WORKDIR /app

RUN apk add --no-cache bash postgresql-client openssl

COPY --from=builder /app/package*.json ./
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/docker-entrypoint.sh ./

RUN npm prune --omit=dev || true

RUN addgroup -g 1001 -S nodejs && adduser -S nodejs -u 1001 && \
    chmod +x docker-entrypoint.sh && chown -R nodejs:nodejs /app

ENV NODE_ENV=production
ENV PORT=3007
ENV HOST=0.0.0.0

USER nodejs
EXPOSE 3007
ENTRYPOINT ["./docker-entrypoint.sh"]
