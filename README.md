# MFO - Multi Family Office

Ferramenta para acompanhar o alinhamento dos clientes ao planejamento financeiro, projetar a evolução patrimonial e registrar eventos.

## Estrutura do Projeto

```
mfo-v4/
├── backend/          # API Node.js + Fastify
├── frontend/         # Next.js 14 (a implementar)
└── docker-compose.yml
```

## Requisitos

- Docker e Docker Compose
- Node.js 20+ (para desenvolvimento local)

## Quick Start

```bash
# Subir todos os serviços
docker compose up --build

# Backend disponível em: http://localhost:3001
# Frontend disponível em: http://localhost:3000
# Swagger docs: http://localhost:3001/docs
```

## Desenvolvimento Local

### Backend

```bash
cd backend
npm install
npm run prisma:generate
npm run prisma:migrate
npm run dev
```

### Frontend

```bash
cd frontend
npm install
npm run dev
```

## Funcionalidades

- **Projeção Patrimonial**: Projeção ano a ano até 2060 com taxa real composta
- **Simulações**: Criar, versionar e comparar cenários
- **Alocações**: Ativos financeiros e imobilizados com histórico
- **Movimentações**: Entradas e saídas com frequência flexível
- **Seguros**: Vida e invalidez com impacto na projeção

## Arquitetura

### Backend
- Fastify 4 + TypeScript
- Prisma ORM + PostgreSQL 15
- Zod para validação
- Jest + Supertest para testes

### Frontend
- Next.js 14 (App Router)
- ShadCN/UI (dark-mode)
- TanStack Query
- React Hook Form + Zod
