# SupplyIQ

SupplyIQ é uma aplicação em desenvolvimento para apoiar consultas e fluxos de inteligência de suprimentos, combinando uma interface web, uma API e uma futura Knowledge Base controlada.

## Tecnologias atuais

- Frontend: React, Vite e TypeScript.
- Backend: Node.js, Express e TypeScript.
- Conhecimento: diretório reservado para uma Knowledge Base com regras de ingestão definidas.

## Estrutura do projeto

```text
frontend/        Aplicação web
backend/         API HTTP
knowledge_base/  Base de conhecimento reservada para uso futuro
```

## Como executar

Em dois terminais, instale as dependências e inicie cada serviço:

```bash
cd frontend
npm install
npm run dev
```

```bash
cd backend
npm install
npm run dev
```

O frontend é servido em `http://localhost:5173` e o backend em `http://localhost:3000`. O endpoint de saúde está disponível em `GET /api/health`.

Para validar os builds:

```bash
cd frontend
npm run build
```

```bash
cd backend
npm run build
```

Ainda não há scripts de testes automatizados configurados nos pacotes atuais.

## Uso seguro de `.env`

Crie o arquivo `.env` local do backend a partir de `.env.example`, preenchendo apenas valores do seu ambiente. Nunca versione, compartilhe, exiba em logs ou envie esse arquivo e quaisquer segredos. O `.gitignore` já protege arquivos de ambiente; mantenha essa proteção.

## Status atual

O repositório possui o frontend e a API básicos em funcionamento. A Knowledge Base ainda não foi adicionada e não deve receber dados até uma tarefa específica para isso.
