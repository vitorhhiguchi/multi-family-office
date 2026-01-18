# MFO Frontend

Aplicação Web desenvolvida com Next.js 14, Tailwind CSS e Shadcn/UI.

## Instalação

```bash
npm install
```

## Configuração

Copie o arquivo `.env.example` para `.env.local` se necessário (embora o padrão funcione para dev local).

```env
NEXT_PUBLIC_API_URL=http://localhost:3333
```

## Scripts

- `npm run dev`: Inicia o servidor de desenvolvimento.
- `npm run build`: Gera o build de produção.
- `npm start`: Inicia o servidor de produção.
- `npm run lint`: Verifica erros de linting.

## Estrutura de Pastas

- `src/app`: Rotas e páginas (App Router).
- `src/components`: Componentes React reutilizáveis.
- `src/hooks`: Custom hooks (ex: React Query).
- `src/services`: Funções de comunicação com API.
- `src/lib`: Utilitários e configurações.

## Design System

O projeto utiliza Shadcn/UI com Tailwind CSS. As cores e temas estão definidos em `globals.css` e `tailwind.config.ts`.
- Cores de destaque: `#6777FA` (Azul/Roxo), `#03B6AD` (Teal), `#48F7A1` (Verde Neon).
