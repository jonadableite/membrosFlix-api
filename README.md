# MembrosF lix API

> Backend API RESTful para plataforma de cursos online

## 🚀 Stack

- **Runtime**: Node.js v22+
- **Framework**: Express.js
- **Language**: TypeScript
- **ORM**: Prisma
- **Database**: PostgreSQL
- **Auth**: JWT + bcrypt
- **Validation**: Zod
- **Real-time**: Socket.io
- **Storage**: MinIO
- **Logger**: Winston

## 📁 Estrutura

```
src/
├── modules/          # Features (DDD)
│   ├── auth/         # Autenticação
│   ├── user/         # Usuários
│   ├── course/       # Cursos
│   ├── lesson/       # Aulas
│   ├── comment/      # Comentários
│   ├── like/         # Likes
│   └── notification/ # Notificações
├── shared/           # Código compartilhado
│   ├── database/     # Prisma client
│   ├── errors/       # Error handling
│   ├── events/       # Event emitter
│   ├── logger/       # Winston
│   └── middlewares/  # Express middlewares
├── config/           # Configurações
├── core/             # Base classes
└── server.ts         # Entry point
```

## ⚡ Quick Start

```bash
# Install
npm install

# Setup database
npx prisma generate
npx prisma migrate dev

# Configure .env
cp .env.example .env
# Edit .env with your credentials

# Start
npm run dev  # Port 3007
```

## 🔐 Environment Variables

```bash
DATABASE_URL="postgresql://user:pass@localhost:5432/membrosflix"
JWT_SECRET="minimum-32-characters"
DEFAULT_TENANT_ID="uuid"
MINIO_ENDPOINT="endpoint"
MINIO_ACCESS_KEY="key"
MINIO_SECRET_KEY="secret"
PORT="3007"
```

## 📡 API Endpoints

### Auth

```
POST /api/v1/auth/login       # Login
POST /api/v1/auth/register    # Signup
GET  /api/v1/auth/me          # Current user
```

### Courses

```
GET  /api/v1/courses          # List
GET  /api/v1/courses/:id      # Details
```

### Lessons

```
GET  /api/v1/courses/:courseId/lessons        # List
GET  /api/v1/courses/:courseId/lessons/:id    # Details
POST /api/v1/courses/:courseId/lessons        # Create (admin)
```

### Comments & Likes

```
GET  /api/v1/courses/:courseId/lessons/:id/comentarios     # List
POST /api/v1/courses/:courseId/lessons/:id/comentarios     # Create
POST /api/v1/courses/:courseId/lessons/:id/likes           # Toggle like
GET  /api/v1/courses/:courseId/lessons/:id/likes/status    # Like status
```

### Notifications

```
GET /api/v1/notifications     # List
PUT /api/v1/notifications/:id # Mark as read
```

## 🏗️ Architecture

### SOLID Principles

```
Request → Route → Controller → Service → Repository → Prisma → Database
```

**Exemplo:**

```typescript
// Controller (HTTP handling)
export class LessonController {
  constructor(private service: LessonService) {}

  show = asyncHandler(async (req, res) => {
    const lesson = await this.service.findById(+req.params.id);
    res.json({ success: true, data: lesson });
  });
}

// Service (Business logic)
export class LessonService {
  constructor(private repository: LessonRepository) {}

  async findById(id: number) {
    const lesson = await this.repository.findById(id);
    if (!lesson) throw AppError.notFound("Aula não encontrada");
    return lesson;
  }
}

// Repository (Data access)
export class LessonRepository {
  async findById(id: number) {
    return prisma.aula.findUnique({ where: { id } });
  }
}
```

## 🔄 Event-Driven

```typescript
// Emit event
const event = AppEventEmitter.createEvent("lesson.created", tenantId, userId, {
  lessonId,
  courseId,
  lessonName,
});
await AppEventEmitter.getInstance().emit(event);

// Subscribe to event
eventEmitter.subscribe("lesson.created", {
  handle: async (event) => {
    // Create notifications for students
  },
});
```

## 🧪 Testing

```bash
# Health check
curl http://localhost:3007/health

# Login
curl -X POST http://localhost:3007/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"brayan@gmail.com","password":"123456"}'

# Get courses (with token)
curl -H "Authorization: Bearer <token>" \
  http://localhost:3007/api/v1/courses
```

## 🐛 Common Issues

```bash
# Check TypeScript
npx tsc --noEmit

# See Prisma queries
DEBUG="prisma:query" npm run dev

# Socket.io debug
DEBUG="socket.io*" npm run dev
```

## 📚 Documentation

- **Arquitetura**: [../. github/suzy/MEMBROSFLIX_ARCHITECTURE.md](../.github/suzy/MEMBROSFLIX_ARCHITECTURE.md)
- **Desenvolvimento**: [../.github/suzy/DEVELOPMENT_GUIDE.md](../.github/suzy/DEVELOPMENT_GUIDE.md)
- **Troubleshooting**: [../.github/suzy/TROUBLESHOOTING.md](../.github/suzy/TROUBLESHOOTING.md)
- **API Reference**: [../.github/suzy/API_REFERENCE.md](../.github/suzy/API_REFERENCE.md)

---

**Versão**: 1.0.0  
**Port**: 3007
