# MFO - Wealth Protection Tool (Anka)

Ferramenta de Multi Family Office para projeção patrimonial, consolidação de ativos e planejamento financeiro de longo prazo.

## Estrutura do Projeto

O projeto é um monorepo dividido em:

- `/backend`: API Node.js com Fastify e Prisma (PostgreSQL).
- `/frontend`: Aplicação Web Next.js 14 com Tailwind CSS e Shadcn/UI.

## Pré-requisitos

- Node.js 18+
- Docker e Docker Compose (para o banco de dados)
- Git

## Como Rodar o Projeto

1. **Clone o repositório:**
   ```bash
   git clone <url-do-repo>
   cd mfo-v4
   ```

2. **Inicie o Banco de Dados:**
   Na raiz do projeto:
   ```bash
   docker-compose up -d
   ```

3. **Backend:**
   Abra um terminal e vá para a pasta `backend`:
   ```bash
   cd backend
   npm install
   npx prisma migrate dev
   npm run seed  # (Opcional) Popula com dados iniciais
   npm run dev
   ```
   A API rodará em `http://localhost:3333`.

4. **Frontend:**
   Abra outro terminal e vá para a pasta `frontend`:
   ```bash
   cd frontend
   npm install
   npm run dev
   ```
   Acesse a aplicação em `http://localhost:3000`.

## Funcionalidades Principais

- **Projeção Patrimonial**: Gráficos interativos até 2060.
- **Simulações**: Cenários (Otimista, Conservador) e versão histórica.
- **Alocações**: Gestão de ativos financeiros e imobiliários (com financiamento).
- **Consolidação**: Visão unificada do patrimônio.
- **Histórico**: Versionamento seguro de simulações passadas.

## Tecnologias

- **Backend**: Fastify, Prisma ORM, PostgreSQL, Zod, TypeScript.
- **Frontend**: Next.js (App Router), React Query, Recharts, TailwindCSS, Shadcn/UI.
