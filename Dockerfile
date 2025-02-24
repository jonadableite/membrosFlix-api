# Use uma imagem Node.js oficial como base
FROM node:20-alpine3.19

# Definir diretório de trabalho no container
WORKDIR /app

# Instalar dependências do sistema necessárias
RUN apk add --no-cache \
    bash \
    git \
    openssh \
    postgresql-client

# Copiar package.json e package-lock.json
COPY package*.json ./
COPY prisma ./prisma

# Instalar dependências
RUN npm ci

# Gerar cliente Prisma
RUN npx prisma generate

# Copiar código fonte
COPY . .

# Variáveis de ambiente
ENV PORT=3007
ENV HOST=0.0.0.0
ENV NODE_ENV=production

# Expor porta
EXPOSE 3007

# Comando para iniciar a aplicação
CMD ["npm", "run", "prod:start"]
