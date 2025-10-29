import swaggerJsdoc from "swagger-jsdoc";

const options = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "MembrosFlix API",
      version: "1.0.0",
      description: `
# MembrosFlix API Documentation

Uma plataforma completa de cursos online com sistema multi-tenant, RBAC/ABAC, e notificações em tempo real.

## 🚀 Funcionalidades

- **Multi-tenant**: Isolamento completo entre organizações
- **RBAC/ABAC**: Controle de acesso baseado em roles e atributos
- **Notificações**: Sistema de eventos com email e WebSocket
- **Observabilidade**: Logs estruturados e health checks
- **Segurança**: Rate limiting, sanitização e validação

## 🔐 Autenticação

Todas as rotas protegidas requerem um token JWT no header:
\`\`\`
Authorization: Bearer <seu-jwt-token>
\`\`\`

## 🏢 Multi-tenancy

Cada requisição deve incluir o contexto do tenant:
- Header: \`X-Tenant-ID: <tenant-id>\`
- Subdomain: \`tenant1.membrosflix.com\`
- JWT: Inclui \`tenantId\` no payload

## 📊 Health Checks

- \`GET /health\` - Status geral do sistema
- \`GET /health/ready\` - Readiness check (Kubernetes)
- \`GET /health/live\` - Liveness check (Kubernetes)
- \`GET /health/detailed\` - Health check detalhado

## 🎯 Roles

- **ADMIN**: Acesso total ao sistema (multi-tenant)
- **INSTRUCTOR**: Gerenciar cursos e aulas da organização
- **STUDENT**: Acessar conteúdo de cursos matriculados
      `,
      contact: {
        name: "Jonadab Leite",
        email: "jonadab.leite@gmail.com",
        url: "https://github.com/jonadableite",
      },
      license: {
        name: "ISC",
        url: "https://opensource.org/licenses/ISC",
      },
    },
    servers: [
      {
        url: process.env.API_URL || "http://localhost:3007",
        description: "Development server",
      },
      {
        url: "https://api.membrosflix.com",
        description: "Production server",
      },
    ],
    tags: [
      {
        name: "Health",
        description: "Health check endpoints",
      },
      {
        name: "Auth",
        description: "Authentication and authorization",
      },
      {
        name: "Users",
        description: "User management",
      },
      {
        name: "Courses",
        description: "Course management",
      },
      {
        name: "Lessons",
        description: "Lesson management",
      },
      {
        name: "Notifications",
        description: "Notification system",
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: "http",
          scheme: "bearer",
          bearerFormat: "JWT",
          description: "JWT token for authentication",
        },
        tenantHeader: {
          type: "apiKey",
          in: "header",
          name: "X-Tenant-ID",
          description: "Tenant ID for multi-tenant isolation",
        },
      },
      schemas: {
        Error: {
          type: "object",
          properties: {
            success: {
              type: "boolean",
              example: false,
            },
            message: {
              type: "string",
              example: "Error message",
            },
            error: {
              type: "string",
              example: "Error type",
            },
            statusCode: {
              type: "integer",
              example: 400,
            },
            details: {
              type: "object",
              description: "Additional error details",
            },
          },
        },
        Success: {
          type: "object",
          properties: {
            success: {
              type: "boolean",
              example: true,
            },
            message: {
              type: "string",
              example: "Operation successful",
            },
            data: {
              type: "object",
              description: "Response data",
            },
          },
        },
        Pagination: {
          type: "object",
          properties: {
            page: {
              type: "integer",
              example: 1,
            },
            limit: {
              type: "integer",
              example: 10,
            },
            total: {
              type: "integer",
              example: 100,
            },
            totalPages: {
              type: "integer",
              example: 10,
            },
          },
        },
        User: {
          type: "object",
          properties: {
            id: {
              type: "string",
              format: "uuid",
              example: "123e4567-e89b-12d3-a456-426614174000",
            },
            name: {
              type: "string",
              example: "João Silva",
            },
            email: {
              type: "string",
              format: "email",
              example: "joao@example.com",
            },
            role: {
              type: "string",
              enum: ["STUDENT", "INSTRUCTOR", "ADMIN"],
              example: "STUDENT",
            },
            status: {
              type: "boolean",
              example: true,
            },
            createdAt: {
              type: "string",
              format: "date-time",
              example: "2024-01-01T00:00:00.000Z",
            },
            updatedAt: {
              type: "string",
              format: "date-time",
              example: "2024-01-01T00:00:00.000Z",
            },
          },
        },
        Course: {
          type: "object",
          properties: {
            id: {
              type: "integer",
              example: 1,
            },
            title: {
              type: "string",
              example: "Curso de JavaScript",
            },
            description: {
              type: "string",
              example: "Aprenda JavaScript do zero",
            },
            status: {
              type: "string",
              enum: ["DRAFT", "PUBLISHED", "ARCHIVED"],
              example: "PUBLISHED",
            },
            totalAulas: {
              type: "integer",
              example: 10,
            },
            slug: {
              type: "string",
              example: "curso-javascript",
            },
            createdAt: {
              type: "string",
              format: "date-time",
              example: "2024-01-01T00:00:00.000Z",
            },
            updatedAt: {
              type: "string",
              format: "date-time",
              example: "2024-01-01T00:00:00.000Z",
            },
          },
        },
        Lesson: {
          type: "object",
          properties: {
            id: {
              type: "integer",
              example: 1,
            },
            name: {
              type: "string",
              example: "Introdução ao JavaScript",
            },
            description: {
              type: "string",
              example: "Primeira aula do curso",
            },
            duration: {
              type: "integer",
              example: 60,
            },
            courseId: {
              type: "integer",
              example: 1,
            },
            ordemAula: {
              type: "integer",
              example: 1,
            },
            status: {
              type: "string",
              enum: ["DRAFT", "PUBLISHED", "ARCHIVED"],
              example: "PUBLISHED",
            },
            isPreview: {
              type: "boolean",
              example: false,
            },
            createdAt: {
              type: "string",
              format: "date-time",
              example: "2024-01-01T00:00:00.000Z",
            },
            updatedAt: {
              type: "string",
              format: "date-time",
              example: "2024-01-01T00:00:00.000Z",
            },
          },
        },
        Notification: {
          type: "object",
          properties: {
            id: {
              type: "string",
              format: "uuid",
              example: "123e4567-e89b-12d3-a456-426614174000",
            },
            tipo: {
              type: "string",
              enum: ["NOVA_AULA", "NOVO_COMENTARIO", "PROGRESSO", "CONQUISTA", "INDICACAO", "CURSO_NOVO", "MENSAGEM", "BOAS_VINDAS"],
              example: "NOVA_AULA",
            },
            mensagem: {
              type: "string",
              example: "Nova aula disponível: Introdução ao JavaScript",
            },
            lida: {
              type: "boolean",
              example: false,
            },
            dados: {
              type: "object",
              description: "Additional notification data",
            },
            criadoEm: {
              type: "string",
              format: "date-time",
              example: "2024-01-01T00:00:00.000Z",
            },
            atualizadoEm: {
              type: "string",
              format: "date-time",
              example: "2024-01-01T00:00:00.000Z",
            },
          },
        },
      },
    },
    security: [
      {
        bearerAuth: [],
        tenantHeader: [],
      },
    ],
  },
  apis: ["./src/modules/*/routes/*.ts", "./src/routes/*.ts", "./src/shared/health/*.ts"],
};

const swaggerSpec = swaggerJsdoc(options);

export default swaggerSpec;
