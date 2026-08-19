import { app } from './app.ts'
import { createGeminiConfiguration } from './config/gemini.ts'

const port = Number(process.env.PORT) || 3000

try {
  createGeminiConfiguration()

  app.listen(port, () => {
    console.log(`API disponível em http://localhost:${port}`)
  })
} catch {
  console.error(
    'Não foi possível iniciar a API: configure GEMINI_API_KEY e GEMINI_MODEL no ambiente.',
  )
  process.exitCode = 1
}
