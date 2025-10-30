# Stage 1: Build
FROM node:22-alpine AS builder

WORKDIR /app

# Instalar dependências do sistema necessárias para build
RUN apk add --no-cache \
    bash \
    git \
    python3 \
    make \
    g++ \
    openssl \
    openssl-dev

# Copiar arquivos de dependências primeiro (cache layer)
COPY package*.json ./
COPY prisma ./prisma

# Instalar todas as dependências (incluindo devDependencies para build)
RUN npm ci

# Gerar cliente Prisma (necessário antes do build)
RUN npx prisma generate

# Copiar arquivos de configuração necessários para build
COPY tsconfig.json ./
COPY src ./src
COPY docker-entrypoint.sh ./

# Copiar types (removido do .dockerignore - necessário para declarações TypeScript)
# O diretório types contém env.d.ts com tipos globais do Node.js
COPY types ./types

# Stage 2: Production
FROM node:22-alpine AS production

WORKDIR /app

# Instalar apenas dependências de runtime
RUN apk add --no-cache \
    bash \
    postgresql-client \
    openssl

# Copiar apenas arquivos necessários do builder
COPY --from=builder /app/package*.json ./
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=builder /app/docker-entrypoint.sh ./

# Criar usuário não-root para segurança
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001 && \
    chmod +x docker-entrypoint.sh && \
    chown -R nodejs:nodejs /app

# Variáveis de ambiente
ENV PORT=3007
ENV HOST=0.0.0.0
ENV NODE_ENV=production

USER nodejs

# Expor porta
EXPOSE 3007

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=40s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3007/health', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})"

# Usar entrypoint para executar migrations antes de iniciar
ENTRYPOINT ["./docker-entrypoint.sh"]
