# Usar imagem oficial do Node.js com Alpine Linux
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

# Instalar dependências
RUN npm ci --omit=dev

# Copiar código fonte
COPY . .

# Gerar cliente Prisma
RUN npx prisma generate

# Variáveis de ambiente
ENV PORT=3007
ENV HOST=0.0.0.0
ENV NODE_ENV=production

# Expor porta
EXPOSE 3007

# Comando para iniciar a aplicação
CMD ["npm", "start"]
