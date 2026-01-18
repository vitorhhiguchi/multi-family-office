# MFO Backend

API RESTful desenvolvida com Fastify e Prisma para o sistema Multi Family Office.

## Instalação

```bash
npm install
```

## Configuração

Copie o arquivo `.env.example` para `.env` e configure a URL do banco de dados:

```env
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/mfo_db?schema=public"
```

## Banco de Dados

Utilizamos Prisma ORM.

- Rodar migrações: `npx prisma migrate dev`
- Visualizar banco (Prisma Studio): `npx prisma studio`
- Seed (dados de teste): `npm run seed`

## Scripts

- `npm run dev`: Inicia o servidor em modo de desenvolvimento.
- `npm run build`: Compila o projeto.
- `npm start`: Inicia o servidor de produção.

## Estrutura de Pastas

- `src/controllers`: Controladores das rotas.
- `src/services`: Lógica de negócios.
- `src/engine`: Motores de cálculo (Projeção).
- `src/routes`: Definição de rotas da API.
- `prisma/schema.prisma`: Schema do banco de dados.

## Principais Endpoints

- `GET /simulations`: Lista simulações.
- `POST /projections`: Gera dados de projeção.
- `POST /assets`: Cria novas alocações.
