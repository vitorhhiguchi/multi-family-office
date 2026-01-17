# MFO Backend

Backend API para o Multi Family Office - ferramenta de projeção patrimonial.

## Stack Tecnológica

- **Runtime**: Node.js 20
- **Framework**: Fastify 4
- **ORM**: Prisma (PostgreSQL 15)
- **Validação**: Zod
- **Testes**: Jest + Supertest
- **Documentação**: Swagger/OpenAPI

## Arquitetura

```
src/
├── config/        # Configurações (env)
├── lib/           # Bibliotecas (prisma client)
├── schemas/       # Schemas Zod para validação
├── services/      # Lógica de negócio
├── routes/        # Definição de rotas
└── engine/        # Motor de projeção patrimonial
```

## Endpoints Principais

| Método | Rota                       | Descrição                          |
|--------|----------------------------|-------------------------------------|
| POST   | /clients                   | Criar cliente                       |
| GET    | /clients                   | Listar clientes                     |
| POST   | /simulations               | Criar simulação                     |
| GET    | /simulations               | Listar simulações                   |
| POST   | /simulations/:id/version   | Criar nova versão                   |
| POST   | /simulations/:id/duplicate | Duplicar com novo nome              |
| POST   | /assets                    | Criar ativo                         |
| POST   | /assets/:id/records        | Adicionar registro ao ativo         |
| POST   | /assets/:id/quick-update   | Atualizar valor (data atual)        |
| POST   | /movements                 | Criar movimentação                  |
| POST   | /insurances                | Criar seguro                        |
| POST   | /projections               | Gerar projeção patrimonial          |
| POST   | /projections/compare       | Comparar múltiplas simulações       |

## Motor de Projeção

O motor implementa as seguintes regras:

- **Taxa composta**: `(Patrimônio + ResultadoLíquido) * (1 + taxaReal)`
- **Status VIVO**: Projeção normal
- **Status MORTO**: Sem entradas, despesas divididas por 2
- **Status INVÁLIDO**: Apenas renda WORK para, demais continuam

## Comandos

```bash
# Instalar dependências
npm install

# Gerar Prisma Client
npm run prisma:generate

# Executar migrations
npm run prisma:migrate

# Desenvolvimento
npm run dev

# Build
npm run build

# Produção
npm start

# Testes
npm test
npm run test:coverage
npm run test:unit
npm run test:integration

# Lint
npm run lint
npm run lint:fix
```

## Variáveis de Ambiente

```env
DATABASE_URL=postgresql://user:password@localhost:5432/database
PORT=3001
NODE_ENV=development
```

## Docker

```bash
# Build da imagem
docker build -t mfo-backend .

# Executar com docker-compose (na raiz do projeto)
docker compose up --build
```

## Documentação

Swagger UI disponível em: `http://localhost:3001/docs`
