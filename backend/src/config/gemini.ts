import { GoogleGenAI } from '@google/genai'

export interface GeminiConfiguration {
  client: GoogleGenAI
  model: string
}

function getRequiredEnvironmentVariable(name: 'GEMINI_API_KEY' | 'GEMINI_MODEL'): string {
  const value = process.env[name]?.trim()

  if (!value) {
    throw new Error(`Configuração do Gemini ausente: ${name}.`)
  }

  return value
}

export function createGeminiConfiguration(): GeminiConfiguration {
  const apiKey = getRequiredEnvironmentVariable('GEMINI_API_KEY')
  const model = getRequiredEnvironmentVariable('GEMINI_MODEL')

  return {
    client: new GoogleGenAI({ apiKey }),
    model,
  }
}
