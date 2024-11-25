# MembrosFlix API

API para gerenciamento de cursos, aulas e progresso do usuário para a plataforma MembrosFlix.

## Descrição

Esta API permite criar, listar, visualizar, atualizar e excluir cursos, aulas e o progresso do usuário nos cursos.  Ela utiliza Node.js com Express, Sequelize para persistência de dados, Multer para upload de arquivos e Swagger para documentação.

## Instalação

1. Clone o repositório:

```bash
git clone https://github.com/jonadableite/membrosFlix-api.git
```
2. Instale as dependências:

```bash
cd membrosFlix-api
yarn install
```
# ou
```bash
npm install
```

3. Configure as variáveis de ambiente:

Crie um arquivo .env na raiz do projeto e configure as seguintes variáveis:
```bash
DATABASE_URL=<sua_url_de_conexao_com_o_banco_de_dados>
APP_SECRET=<sua_chave_secreta_para_jwt>
MINIO_ROOT_USER=<seu_minio_root_user>
MINIO_ROOT_PASSWORD=<seu_minio_root_password>
MINIO_SERVER_URL=<sua_minio_server_url>
```

4. Execute as migrações:
```bash
yarn sequelize db:migrate
```
# ou
```bash
npx sequelize-cli db:migrate
```

Execução
```bash
yarn dev
```
# ou
```bash
npm run dev
```

A API estará disponível em http://localhost:3001.

Documentação
A documentação da API, gerada com Swagger, está disponível em http://localhost:3001/api-docs.

# Rotas

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


## Tecnologias

[![Node.js](https://img.shields.io/badge/Node.js-339933?style=for-the-badge&logo=nodedotjs&logoColor=white)](https://nodejs.org/en/)
[![Express.js](https://img.shields.io/badge/Express.js-000000?style=for-the-badge&logo=express&logoColor=white)](https://expressjs.com/)
[![Sequelize](https://img.shields.io/badge/Sequelize-52B0E7?style=for-the-badge&logo=sequelize&logoColor=white)](https://sequelize.org/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-316192?style=for-the-badge&logo=postgresql&logoColor=white)](https://www.postgresql.org/)
[![Multer](https://img.shields.io/badge/Multer-FF5722?style=for-the-badge&logo=multer&logoColor=white)](https://github.com/expressjs/multer)
[![Swagger](https://img.shields.io/badge/Swagger-85EA2D?style=for-the-badge&logo=swagger&logoColor=white)](https://swagger.io/)
[![JWT](https://img.shields.io/badge/JWT-000000?style=for-the-badge&logo=JSON%20web%20tokens&logoColor=white)](https://jwt.io/)
[![MinIO](https://img.shields.io/badge/MinIO-000000?style=for-the-badge&logo=minio&logoColor=white)](https://min.io/)


## Autor

Jonadab Leite
[![LinkedIn](https://img.shields.io/badge/LinkedIn-JonadabLeite-blue?style=flat-square&logo=linkedin)](https://www.linkedin.com/in/jonadableite/)