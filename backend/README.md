# SupplyIQ Backend

API Express criada com Node.js e TypeScript.

```bash
npm install
npm run dev
```

A API inicia em `http://localhost:3000`. Verifique-a em `GET /api/health`.

## Configuração local

Copie `.env.example` para `.env` e preencha as variáveis:

```env
PORT=3000
GEMINI_API_KEY=sua_chave_do_gemini
GEMINI_MODEL=gemini-3.6-flash
```

Insira a chave somente em `GEMINI_API_KEY` no arquivo `.env`. Esse arquivo é ignorado pelo Git e nunca deve ser versionado ou enviado ao frontend. Use `gemini-3.6-flash` em `GEMINI_MODEL`.
