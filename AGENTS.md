# SupplyIQ — Guia para agentes

## Arquitetura e responsabilidades

- `frontend/`: aplicação web em React, Vite e TypeScript. Concentra a interface, os componentes e os estilos do cliente.
- `backend/`: API HTTP em Express, Node.js e TypeScript. Concentra rotas, controladores, serviços, configurações e middlewares.
- `knowledge_base/`: espaço reservado para a base de conhecimento do produto. Não adicionar conteúdo à base sem uma tarefa explícita.
  - `processed/`: dados estruturados e preparados para consumo controlado.
  - `pdf/normalized/`: única origem de PDFs permitida para o RAG semântico.
  - `raw/`, `validation/` e PDFs originais nunca são fontes de conhecimento para respostas.

Não altere a arquitetura, a divisão de responsabilidades ou a organização de diretórios sem instrução explícita.

## Comandos

Execute os comandos a partir do diretório correspondente:

| Área | Desenvolvimento | Build | Testes |
| --- | --- | --- | --- |
| Frontend | `npm run dev` | `npm run build` | Não há script de teste configurado atualmente; execute-o quando for disponibilizado. |
| Backend | `npm run dev` | `npm run build` | Não há script de teste configurado atualmente; execute-o quando for disponibilizado. |

Após qualquer alteração, execute as validações aplicáveis. Enquanto não houver testes automatizados configurados, execute pelo menos o build da área afetada e registre qualquer limitação encontrada. Quando houver testes, sua execução é obrigatória antes da entrega.

## Segurança e escopo

- Nunca exponha, registre, envie ou versione arquivos `.env`, credenciais, chaves de API ou outros segredos.
- Use arquivos de exemplo para documentar variáveis de ambiente e mantenha os valores reais somente no ambiente local seguro.
- Respeite estritamente o escopo de cada tarefa. Não faça refatorações, mudanças funcionais ou alterações em áreas não solicitadas.

## Regras da Knowledge Base

- Use `processed/` para dados estruturados.
- No RAG semântico, use somente PDFs em `pdf/normalized/`.
- Não ingira `raw/`, `validation/` ou PDFs originais como conhecimento para gerar respostas.
- Preserve as fontes, moedas, unidades, contexto e limitações presentes nos dados.
- Não invente informações, valores, fontes ou conclusões ausentes na base.
