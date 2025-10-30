# ==========================
# Stage 1: Build
# ==========================
FROM node:22-alpine AS builder
WORKDIR /app

# Dependências do sistema necessárias para build + Prisma + MinIO
RUN apk add --no-cache bash git python3 make g++ openssl openssl-dev

# Copiar package.json e package-lock.json para cache de npm install
COPY package*.json ./
RUN npm install

# Copiar o restante do projeto
COPY . .

# Gerar Prisma Client, Build TypeScript e ajustar aliases
RUN npx prisma generate && \
    npx tsc -p tsconfig.json && \
    npx tscpaths -p tsconfig.json -s ./src -o ./dist

# ==========================
# Stage 2: Production
# ==========================
FROM node:22-alpine AS production
WORKDIR /app

# Dependências necessárias apenas em produção
RUN apk add --no-cache bash postgresql-client openssl

# Copiar arquivos do build
COPY --from=builder /app/package*.json ./
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/docker-entrypoint.sh ./

# Remover dependências dev (opcional)
RUN npm prune --omit=dev || true

# Criar usuário para rodar container com segurança
RUN addgroup -g 1001 -S nodejs && adduser -S nodejs -u 1001 && \
    chmod +x docker-entrypoint.sh && chown -R nodejs:nodejs /app

# Variáveis de ambiente
ENV NODE_ENV=production
ENV PORT=3007
ENV HOST=0.0.0.0

# Rodar como usuário não-root
USER nodejs

# Expor porta
EXPOSE 3007

# Entrypoint
ENTRYPOINT ["./docker-entrypoint.sh"]
