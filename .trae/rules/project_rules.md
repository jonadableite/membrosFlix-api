# Regras do Projeto membrosFlix-API

## 📋 Visão Geral do Projeto

O **membrosFlix-API** é uma API REST desenvolvida em Node.js/TypeScript para uma plataforma de membros com funcionalidades de cursos online, sistema de progresso, gamificação e multi-tenancy.

### Tecnologias Principais
- **Runtime**: Node.js com TypeScript (ES2022)
- **Framework**: Express.js
- **ORM**: Prisma com PostgreSQL
- **Cache**: Redis/IORedis
- **Autenticação**: JWT + bcryptjs
- **Validação**: Yup e Zod
- **Testes**: Jest (unit, integration, e2e)
- **Qualidade**: Biome (linting + formatação)
- **WebSocket**: Socket.IO
- **Upload**: Multer + MinIO
- **Email**: Nodemailer
- **Logs**: Winston

## 🏗️ Arquitetura e Estrutura

### Padrão Arquitetural
- **Clean Architecture** com separação clara de responsabilidades
- **Modular Architecture** - cada feature é um módulo independente
- **Repository Pattern** para abstração de dados
- **Service Layer** para lógica de negócio
- **DTO Pattern** para transferência de dados

### Estrutura de Diretórios

```
src/
├── config/          # Configurações (database, env, logger, multer)
├── core/            # Classes base e interfaces comuns
│   ├── base/        # BaseController, BaseService, BaseRepository
│   ├── interfaces/  # Interfaces base
│   └── types/       # Tipos comuns
├── modules/         # Módulos de funcionalidades
│   ├── auth/        # Autenticação e autorização
│   ├── course/      # Gestão de cursos
│   ├── lesson/      # Gestão de aulas
│   ├── notification/# Sistema de notificações
│   └── user/        # Gestão de usuários
├── shared/          # Utilitários compartilhados
│   ├── cache/       # Cliente Redis
│   ├── database/    # Cliente Prisma
│   ├── errors/      # Tratamento de erros
│   ├── middlewares/ # Middlewares globais
│   ├── utils/       # Utilitários diversos
│   └── websocket/   # Configuração Socket.IO
└── routes/          # Roteamento principal
```

### Estrutura de Módulos
Cada módulo DEVE seguir esta estrutura:
```
modules/[nome-modulo]/
├── controllers/     # Controladores HTTP
├── dtos/           # Data Transfer Objects
├── repositories/   # Acesso a dados
├── routes/         # Rotas específicas
└── services/       # Lógica de negócio
```

## 🎯 Regras de Desenvolvimento

### 1. Convenções de Nomenclatura

#### Arquivos e Diretórios
- **Arquivos**: `kebab-case` (ex: `user.service.ts`)
- **Diretórios**: `kebab-case` (ex: `user-management/`)
- **Classes**: `PascalCase` (ex: `UserService`)
- **Interfaces**: `PascalCase` com prefixo `I` opcional (ex: `IUserRepository`)
- **Enums**: `PascalCase` (ex: `UserRole`)
- **Constantes**: `UPPER_SNAKE_CASE` (ex: `MAX_FILE_SIZE`)

#### Variáveis e Funções
- **Variáveis**: `camelCase` (ex: `userName`)
- **Funções**: `camelCase` (ex: `getUserById`)
- **Métodos privados**: prefixo `_` (ex: `_validateUser`)
- **Propriedades booleanas**: prefixo `is`, `has`, `can` (ex: `isActive`)

#### Banco de Dados
- **Tabelas**: `snake_case` em português (ex: `usuarios`, `cursos`)
- **Campos**: `camelCase` no Prisma, `snake_case` no banco
- **Relacionamentos**: nome da entidade relacionada (ex: `user`, `curso`)

### 2. Estrutura de Classes

#### Controllers
```typescript
export class UserController extends BaseController {
  constructor(private userService: UserService) {
    super();
  }

  // Métodos HTTP seguem padrão REST
  async create(req: Request, res: Response): Promise<void> {
    // Implementação
  }
}
```

#### Services
```typescript
export class UserService extends BaseService<User> {
  constructor(private userRepository: UserRepository) {
    super(userRepository);
  }

  // Lógica de negócio específica
  async createUser(data: CreateUserDto): Promise<UserResponseDto> {
    // Implementação
  }
}
```

#### Repositories
```typescript
export class UserRepository extends BaseRepository<User> {
  constructor() {
    super(prisma.user);
  }

  // Métodos de acesso a dados específicos
  async findByEmail(email: string): Promise<User | null> {
    // Implementação
  }
}
```

### 3. DTOs e Validação

#### Estrutura de DTOs
```typescript
// Input DTOs
export interface CreateUserDto {
  name: string;
  email: string;
  password: string;
}

// Response DTOs
export interface UserResponseDto {
  id: string;
  name: string;
  email: string;
  createdAt: Date;
}
```

#### Validação
- **Yup**: Para validação de schemas complexos
- **Zod**: Para validação de tipos simples
- Validação DEVE ser feita no service layer
- Sanitização DEVE ser aplicada em todos os inputs

### 4. Tratamento de Erros

#### Classe AppError
```typescript
// Uso obrigatório da classe AppError
throw AppError.badRequest('Mensagem de erro');
throw AppError.notFound('Recurso não encontrado');
throw AppError.unauthorized('Acesso negado');
```

#### Middleware de Erro
- Todos os erros DEVEM ser tratados pelo middleware global
- Logs DEVEM ser gerados para todos os erros
- Respostas DEVEM seguir formato padronizado

### 5. Autenticação e Autorização

#### JWT
- Tokens DEVEM ter expiração configurável
- Refresh tokens DEVEM ser implementados
- Blacklist de tokens DEVE ser mantida no Redis

#### Middleware de Auth
```typescript
// Uso obrigatório em rotas protegidas
router.use(authMiddleware);
router.use(validateTenantAccess);
```

#### Roles e Permissions
- Sistema baseado em roles: `STUDENT`, `INSTRUCTOR`, `ADMIN`
- Validação de permissões no service layer
- Multi-tenancy DEVE ser respeitado em todas as operações

### 6. Multi-Tenancy

#### Regras Obrigatórias
- Todas as queries DEVEM incluir `tenantId`
- Middleware de tenant DEVE ser aplicado em todas as rotas
- Isolamento de dados DEVE ser garantido
- Configurações por tenant DEVEM ser suportadas

#### Implementação
```typescript
// Exemplo de query com tenant
const users = await prisma.user.findMany({
  where: {
    tenantId: req.tenant.id,
    // outros filtros
  }
});
```

### 7. Cache e Performance

#### Redis
- Cache DEVE ser usado para dados frequentemente acessados
- TTL DEVE ser configurado apropriadamente
- Invalidação de cache DEVE ser implementada

#### Otimizações
- Queries DEVEM usar índices apropriados
- Paginação DEVE ser implementada em listagens
- Rate limiting DEVE ser aplicado

### 8. Testes

#### Estrutura de Testes
```
tests/
├── unit/           # Testes unitários
├── integration/    # Testes de integração
└── e2e/           # Testes end-to-end
```

#### Cobertura Mínima
- **Unit tests**: 80% de cobertura
- **Integration tests**: Cenários principais
- **E2E tests**: Fluxos críticos

#### Convenções
- Arquivos de teste: `*.test.ts` ou `*.spec.ts`
- Mocks DEVEM ser usados para dependências externas
- Setup e teardown DEVEM ser implementados

### 9. Logging e Monitoramento

#### Winston Logger
- Logs estruturados DEVEM ser usados
- Níveis apropriados: `error`, `warn`, `info`, `debug`
- Rotação de logs DEVE ser configurada

#### Métricas
- Health checks DEVEM ser implementados
- Métricas de performance DEVEM ser coletadas
- Alertas DEVEM ser configurados

### 10. Segurança

#### Middlewares Obrigatórios
- Helmet para headers de segurança
- CORS configurado apropriadamente
- Rate limiting por IP e usuário
- Sanitização de inputs
- Proteção contra SQL injection e XSS

#### Validações
- Todas as entradas DEVEM ser validadas
- Senhas DEVEM ser hasheadas com bcrypt
- Dados sensíveis NÃO DEVEM ser logados

## 🚀 Scripts e Comandos

### Desenvolvimento
```bash
npm run dev          # Servidor de desenvolvimento
npm run build        # Build para produção
npm run type-check   # Verificação de tipos
npm run lint         # Linting
npm run format       # Formatação
```

### Banco de Dados
```bash
npm run prisma:generate  # Gerar cliente Prisma
npm run prisma:migrate   # Executar migrações
npm run prisma:studio    # Interface visual
npm run prisma:seed      # Popular banco
```

### Testes
```bash
npm test             # Todos os testes
npm run test:unit    # Testes unitários
npm run test:integration # Testes de integração
npm run test:e2e     # Testes end-to-end
npm run test:coverage # Cobertura de testes
```

## 📦 Dependências Principais

### Produção
- `@prisma/client`: ORM para PostgreSQL
- `express`: Framework web
- `jsonwebtoken`: Autenticação JWT
- `bcryptjs`: Hash de senhas
- `ioredis`: Cliente Redis
- `socket.io`: WebSocket
- `winston`: Sistema de logs
- `helmet`: Segurança HTTP
- `cors`: CORS policy
- `multer`: Upload de arquivos
- `nodemailer`: Envio de emails

### Desenvolvimento
- `typescript`: Linguagem
- `@biomejs/biome`: Linting e formatação
- `jest`: Framework de testes
- `tsx`: Execução TypeScript
- `prisma`: CLI do Prisma

## 🔧 Configurações

### TypeScript
- **Target**: ES2022
- **Module**: ESNext
- **Strict mode**: Habilitado
- **Path mapping**: Configurado para `@/*`
- **Decorators**: Habilitados

### Biome
- **Formatação**: Tabs, 80 caracteres por linha
- **Linting**: Regras rigorosas habilitadas
- **Import organization**: Automático

### Jest
- **Ambiente**: Node.js
- **Projetos**: unit, integration, e2e
- **Coverage**: Relatórios detalhados

## 🚨 Regras Críticas

### ❌ Proibições Absolutas
1. **NUNCA** commitar credenciais ou secrets
2. **NUNCA** fazer queries sem `tenantId` em contexto multi-tenant
3. **NUNCA** retornar senhas em responses
4. **NUNCA** usar `any` type sem justificativa
5. **NUNCA** fazer deploy sem testes passando

### ✅ Obrigações
1. **SEMPRE** validar inputs
2. **SEMPRE** usar transações para operações críticas
3. **SEMPRE** implementar logs apropriados
4. **SEMPRE** seguir padrões de nomenclatura
5. **SEMPRE** documentar APIs complexas

### 🔄 Processo de Desenvolvimento
1. **Feature branch** a partir de `develop`
2. **Testes** DEVEM passar antes do merge
3. **Code review** obrigatório
4. **Lint e format** DEVEM estar ok
5. **Documentação** DEVE ser atualizada

## 📚 Recursos Adicionais

### Documentação
- Swagger/OpenAPI para documentação de APIs
- README atualizado com instruções de setup
- Comentários JSDoc para funções complexas

### Monitoramento
- Health checks em `/health`
- Métricas de performance
- Logs estruturados para análise

### Deploy
- Docker containers
- Variáveis de ambiente configuradas
- Migrações automáticas em produção

---

**Última atualização**: $(date)
**Versão**: 1.0.0
**Mantenedor**: Jonadab Leite (jonadab.leite@gmail.com)