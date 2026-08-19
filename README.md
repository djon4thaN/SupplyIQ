# SupplyIQ

SupplyIQ is a procurement intelligence application that combines a React web interface, an Express API, a controlled Knowledge Base, hybrid retrieval, and Gemini-powered grounded answers.

## Features

- Chat interface with persistent local conversation history.
- Suggested questions that are validated against the internal retrieval capabilities.
- Hybrid retrieval over structured records and normalized PDF document chunks.
- Grounded Gemini responses with sources, support level, and limitations.
- Safe handling of unavailable AI services, including a clear usage-limit message.

## Architecture

- **Frontend:** React, Vite, and TypeScript. It renders the chat, suggested-question cards, sources, and safe availability messages.
- **Backend:** Node.js, Express, and TypeScript. It validates requests, retrieves Knowledge Base context, calls Gemini, and returns safe API responses.
- **Knowledge Base:** Controlled structured data and normalized PDFs used by retrieval only.

## Repository structure

```text
frontend/                    React and Vite client
backend/                     Express API and Gemini agent
knowledge_base/
  processed/                 Allowed structured retrieval data
  pdf/normalized/            Allowed PDFs for semantic document retrieval
  metadata/                  Source, entity, document, and capability metadata
AGENTS.md                    Repository rules for contributors and agents
```

## Requirements

- Node.js 24 or later
- npm
- A Gemini API key and an available Gemini model for grounded answer generation

## Installation

Install dependencies independently for each application:

```bash
cd frontend
npm install
```

```bash
cd backend
npm install
```

## Backend configuration

Create the local backend environment file from the provided example:

```bash
cd backend
copy .env.example .env
```

Set the required local values in `.env` according to `.env.example`. Do not commit, share, log, or paste the resulting file. The backend requires a Gemini API key and a model name; `PORT` is optional and defaults to `3000`.

## Running the application

Start the backend in one terminal:

```bash
cd backend
npm run dev
```

Start the frontend in a second terminal:

```bash
cd frontend
npm run dev
```

The frontend is served by Vite and the backend defaults to `http://localhost:3000`.

## API checks

Verify that the API is available:

```bash
curl http://localhost:3000/api/health
```

Send a chat request:

```bash
curl -X POST http://localhost:3000/api/chat \
  -H "Content-Type: application/json" \
  -d '{"message":"What factors should be considered when evaluating a supplier?"}'
```

The chat response includes grounded answer content only when Gemini successfully generates it from the retrieved context. If the API usage limit has been reached, the backend returns the safe code `AI_USAGE_LIMIT_REACHED`; the frontend displays a temporary-unavailability message without exposing provider details.

## Knowledge Base behavior

Structured retrieval reads only `knowledge_base/processed/`. Document retrieval reads only PDFs under `knowledge_base/pdf/normalized/`, with their declared metadata. The application does not use `raw/`, `validation/`, or original PDFs as answer sources.

Capabilities are declared in Knowledge Base metadata. Suggested questions are selected only when retrieval returns supported capability context; they do not make unsupported market, quarterly, or cost-reduction claims.

## Security

- Never commit `.env`, API keys, or credentials.
- The API validates incoming chat payloads and returns only safe public error messages.
- Gemini errors are reduced to safe local diagnostics; prompts, provider payloads, keys, and stack traces are not sent to the frontend.
- Grounding rules prohibit answers that are not supported by retrieved Knowledge Base context.

## Limitations

- Answers depend on the available structured records and normalized documents.
- Document guidance may be historic or jurisdiction-specific and is presented with source limitations.
- Gemini availability depends on the configured model and API quota. When the API usage limit is reached, grounded generation is temporarily unavailable and the client is informed safely.
- There are currently no automated test scripts; build and endpoint checks are used for delivery validation.

## Commit history

Recent delivery-oriented changes include:

- `fix: align suggested questions with validated retrieval`
- `fix: align suggested questions with knowledge base`
- `feat: add local chat history`
- `docs: finalize project documentation and AI availability UX`
