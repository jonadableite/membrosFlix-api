#!/bin/sh
set -e

echo "🚀 Starting MembrosFlix API..."

# Gerar Prisma Client (garantir que está atualizado)
echo "🔨 Generating Prisma Client..."
npx prisma generate

# Executar migrations em produção (se necessário)
if [ -n "$DATABASE_URL" ]; then
  echo "🔄 Running database migrations..."
  npx prisma migrate deploy || {
    echo "⚠️ No pending migrations or migration failed, continuing..."
  }
fi

# Iniciar aplicação
echo "✨ Starting application..."
exec node --optimize-for-size --max-old-space-size=460 dist/server.js

