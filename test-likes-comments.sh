#!/bin/bash

# Script de Teste de Likes e Comentários
# Testa todos os endpoints junto com a Suzy

echo "🧪 TESTE: Likes e Comentários"
echo "================================"
echo ""

# Cores
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

BASE_URL="http://localhost:3007"

# 1. Registrar usuário de teste
echo "📝 1. Registrando usuário de teste..."
REGISTER_RESPONSE=$(curl -s -X POST $BASE_URL/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Teste Usuario",
    "email": "teste@teste.com",
    "password": "123456",
    "confirmPassword": "123456"
  }')

echo "$REGISTER_RESPONSE" | head -5
echo ""

# 2. Fazer login
echo "🔐 2. Fazendo login..."
LOGIN_RESPONSE=$(curl -s -X POST $BASE_URL/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "teste@teste.com",
    "password": "123456"
  }')

TOKEN=$(echo $LOGIN_RESPONSE | grep -o '"accessToken":"[^"]*' | sed 's/"accessToken":"//')

if [ -z "$TOKEN" ]; then
  echo -e "${RED}❌ Falha no login!${NC}"
  echo "$LOGIN_RESPONSE"
  exit 1
fi

echo -e "${GREEN}✅ Login bem-sucedido!${NC}"
echo "Token: ${TOKEN:0:20}..."
echo ""

# 3. Listar aulas
echo "📚 3. Listando aulas..."
LESSONS_RESPONSE=$(curl -s -X GET "$BASE_URL/api/v1/courses/1/lessons" \
  -H "Authorization: Bearer $TOKEN")

LESSON_ID=$(echo $LESSONS_RESPONSE | grep -o '"id":[0-9]*' | head -1 | sed 's/"id"://')

if [ -z "$LESSON_ID" ]; then
  echo -e "${RED}❌ Nenhuma aula encontrada!${NC}"
  exit 1
fi

echo -e "${GREEN}✅ Aula encontrada: ID $LESSON_ID${NC}"
echo ""

# 4. Dar like na aula
echo "❤️  4. Dando like na aula $LESSON_ID..."
LIKE_RESPONSE=$(curl -s -X POST "$BASE_URL/api/v1/courses/1/lessons/$LESSON_ID/likes" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json")

echo "$LIKE_RESPONSE"
echo ""

# 5. Verificar status de like
echo "🔍 5. Verificando status de like..."
STATUS_RESPONSE=$(curl -s -X GET "$BASE_URL/api/v1/courses/1/lessons/$LESSON_ID/likes/status" \
  -H "Authorization: Bearer $TOKEN")

echo "$STATUS_RESPONSE"
echo ""

# 6. Remover like
echo "💔 6. Removendo like..."
UNLIKE_RESPONSE=$(curl -s -X DELETE "$BASE_URL/api/v1/courses/1/lessons/$LESSON_ID/likes" \
  -H "Authorization: Bearer $TOKEN")

echo "$UNLIKE_RESPONSE"
echo ""

# 7. Criar comentário
echo "💬 7. Criando comentário na aula..."
COMMENT_RESPONSE=$(curl -s -X POST "$BASE_URL/api/v1/courses/1/lessons/$LESSON_ID/comentarios" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "content": "Teste de comentário! 🚀"
  }')

COMMENT_ID=$(echo $COMMENT_RESPONSE | grep -o '"id":[0-9]*' | head -1 | sed 's/"id"://')

echo "$COMMENT_RESPONSE"
echo ""

if [ ! -z "$COMMENT_ID" ]; then
  # 8. Curtir comentário
  echo "❤️  8. Curtindo comentário $COMMENT_ID..."
  COMMENT_LIKE_RESPONSE=$(curl -s -X POST "$BASE_URL/api/v1/courses/1/lessons/$LESSON_ID/comentarios/$COMMENT_ID/likes" \
    -H "Authorization: Bearer $TOKEN" \
    -H "Content-Type: application/json")

  echo "$COMMENT_LIKE_RESPONSE"
  echo ""
fi

# 9. Verificar notificações
echo "🔔 9. Verificando notificações..."
NOTIFICATIONS_RESPONSE=$(curl -s -X GET "$BASE_URL/api/v1/notifications" \
  -H "Authorization: Bearer $TOKEN")

echo "$NOTIFICATIONS_RESPONSE"
echo ""

echo -e "${GREEN}✅ TESTE COMPLETO!${NC}"

