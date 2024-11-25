# MembrosFlix API

API para gerenciamento de cursos, aulas e progresso do usuário para a plataforma MembrosFlix.

## Descrição

Esta API permite criar, listar, visualizar, atualizar e excluir cursos, aulas e o progresso do usuário nos cursos.  Ela utiliza Node.js com Express, Sequelize para persistência de dados, Multer para upload de arquivos e Swagger para documentação.

## Instalação

1. Clone o repositório:

```bash
git clone https://github.com/jonadableite/membrosFlix-api.git

2. Instale as dependências:

cd membrosFlix-api
yarn install
# ou
npm install

3. Configure as variáveis de ambiente:

Crie um arquivo .env na raiz do projeto e configure as seguintes variáveis:

DATABASE_URL=<sua_url_de_conexao_com_o_banco_de_dados>
APP_SECRET=<sua_chave_secreta_para_jwt>
MINIO_ROOT_USER=<seu_minio_root_user>
MINIO_ROOT_PASSWORD=<seu_minio_root_password>
MINIO_SERVER_URL=<sua_minio_server_url>

4. Execute as migrações:

yarn sequelize db:migrate
# ou
npx sequelize-cli db:migrate

Execução

yarn dev
# ou
npm run dev

A API estará disponível em http://localhost:3001.

Documentação
A documentação da API, gerada com Swagger, está disponível em http://localhost:3001/api-docs.

Rotas

Usuários:



POST /users: Cria um novo usuário.

GET /users: Lista todos os usuários (requer autenticação).

GET /users/:id: Exibe um usuário específico (requer autenticação).

PUT /users/:id: Atualiza um usuário (requer autenticação).

DELETE /users/:id: Exclui um usuário (requer autenticação).


Sessões:



POST /sessions: Autentica um usuário e retorna um token JWT.


Cursos:



POST /cursos: Cria um novo curso (requer autenticação).

GET /cursos: Lista todos os cursos (requer autenticação).

GET /cursos/:id: Exibe um curso específico (requer autenticação).

PUT /cursos/:id: Atualiza um curso (requer autenticação).

DELETE /cursos/:id: Exclui um curso (requer autenticação).


Aulas:



POST /cursos/:courseId/aulas: Cria uma nova aula para um curso específico (requer autenticação).

GET /cursos/:courseId/aulas: Lista todas as aulas de um curso específico (requer autenticação).

GET /cursos/:courseId/aulas/:id: Exibe uma aula específica (requer autenticação).

PUT /cursos/:courseId/aulas/:id: Atualiza uma aula (requer autenticação).

DELETE /cursos/:courseId/aulas/:id: Exclui uma aula (requer autenticação).


Progresso do Usuário:



PUT /users/:userId/courses/:courseId/progress: Atualiza o progresso do usuário em um curso (requer autenticação).

GET /users/:userId/courses/:courseId/progress: Exibe o progresso do usuário em um curso (requer autenticação).


Tecnologias

Node.js

Express

Sequelize

PostgreSQL (ou outro banco de dados compatível com Sequelize)

Multer

Swagger

JWT (JSON Web Token)

MinIO

Autor
Jonadab Leite

