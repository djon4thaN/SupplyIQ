import { app } from './app.ts'
import { createGeminiConfiguration } from './config/gemini.ts'
import { initializeStructuredKnowledgeBase } from './knowledge-base/structured-knowledge-base.service.ts'

const port = Number(process.env.PORT) || 3000

try {
  createGeminiConfiguration()
} catch {
  console.error(
    'Não foi possível iniciar a API: configure GEMINI_API_KEY e GEMINI_MODEL no ambiente.',
  )
  process.exitCode = 1
}

try {
  initializeStructuredKnowledgeBase()
} catch {
  console.error('Não foi possível iniciar a API: a Knowledge Base estruturada não está disponível.')
  process.exitCode = 1
}

if (!process.exitCode) {
  app.listen(port, () => {
    console.log(`API disponível em http://localhost:${port}`)
  })
}
