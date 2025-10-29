# Regras do Projeto membrosFlix-API para Cursor IDE

Este documento detalha as configurações e regras específicas para o uso do Cursor IDE no projeto `membrosFlix-api`, visando otimizar o fluxo de desenvolvimento, garantir a consistência do código e aproveitar ao máximo os recursos da IDE.

## 1. Configurações Essenciais do Editor

- **Formatação ao Salvar**: Ativada para garantir que o código seja formatado automaticamente ao salvar.
  - `"editor.formatOnSave": true`
- **Formatador Padrão**: Biome é o formatador padrão para arquivos TypeScript e JavaScript.
  - `"editor.defaultFormatter": "biomejs.biome"`
- **Associações de Arquivos**: Garante que arquivos `.ts` e `.tsx` sejam tratados corretamente como TypeScript.
  - `"files.associations": { "*.ts": "typescript", "*.tsx": "typescriptreact" }`

## 2. Linting e Análise de Código (Biome)

- **Biome Habilitado**: O Biome é o linter e formatador oficial do projeto.
  - `"biome.enable": true`
  - `"biome.format.enable": true`
  - `"biome.lint.enable": true`
- **ESLint Desabilitado**: Para evitar conflitos, o ESLint deve ser desabilitado, pois o Biome assume a função de linting.
  - `"eslint.enable": false`

## 3. Depuração (Debugging)

- **Auto Attach Smart**: Configuração para anexar automaticamente o depurador Node.js de forma inteligente.
  - `"debug.javascript.autoAttachFilter": "smart"`
- **Configuração de Lançamento (Launch Configuration)**: Uma configuração padrão para iniciar a aplicação Node.js com o depurador.
  - **Nome**: `Launch Program`
  - **Tipo**: `node`
  - **Requisição**: `launch`
  - **Programa**: `${workspaceFolder}/src/server.ts` (ponto de entrada da aplicação)
  - **Pré-lançamento**: `npm: build` (garante que o projeto seja construído antes de depurar)
  - **Arquivos de Saída**: `${workspaceFolder}/dist/**/*.js` (onde os arquivos compilados são encontrados)

## 4. Snippets de Código (TypeScript)

Snippets úteis para acelerar o desenvolvimento em TypeScript:

- **`log` (console.log)**:
  - **Prefixo**: `log`
  - **Corpo**: `console.log('$1', $1);`
  - **Uso**: Digite `log` e pressione `Tab` para inserir um `console.log` com o nome da variável e seu valor.

- **`imp` (import statement)**:
  - **Prefixo**: `imp`
  - **Corpo**: `import { $1 } from '$2';`
  - **Uso**: Digite `imp` e pressione `Tab` para inserir uma declaração de importação.

- **`edc` (export default class)**:
  - **Prefixo**: `edc`
  - **Corpo**: `export default class $1 {\n  constructor() {\n    $2\n  }\n}`
  - **Uso**: Digite `edc` e pressione `Tab` para criar uma classe exportada por padrão com um construtor.

## 5. Recomendações Adicionais

- **Extensões**: Recomenda-se instalar as extensões do Biome e do Prisma para melhor suporte à linguagem e ferramentas.
- **Atalhos de Teclado**: Personalize atalhos de teclado para ações frequentes, como alternar entre arquivos, executar testes ou formatar documentos.
- **Integração com Terminal**: Utilize o terminal integrado do Cursor para executar comandos `npm`, `git` e outras ferramentas de linha de comando.

## 6. Validação e Manutenção

- **Revisão Periódica**: As configurações devem ser revisadas periodicamente para garantir que continuem alinhadas com as necessidades do projeto e as atualizações das ferramentas.
- **Feedback**: Encoraja-se o feedback da equipe para aprimorar estas configurações e snippets.

---

**Última atualização**: $(date)
**Versão**: 1.0.0
**Mantenedor**: Jonadab Leite (jonadab.leite@gmail.com)