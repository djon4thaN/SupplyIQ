import type { NextFunction, Request, Response } from 'express'
import { answerQuestion } from '../agent/gemini-agent.service.ts'

const maximumMessageLength = 1_000

function invalidMessage(message: string): Error & { statusCode: number } {
  const error = new Error(message) as Error & { statusCode: number }
  error.statusCode = 400
  return error
}

function getMessage(body: unknown): string {
  if (body === null || typeof body !== 'object' || Array.isArray(body)) {
    throw invalidMessage('Request body must be a JSON object.')
  }
  if (Object.keys(body).some((field) => field !== 'message')) {
    throw invalidMessage('Request body contains unsupported fields.')
  }

  const message = (body as { message?: unknown }).message
  if (typeof message !== 'string') {
    throw invalidMessage('The message field must be text.')
  }

  const normalizedMessage = message.trim()
  if (!normalizedMessage) {
    throw invalidMessage('The message field must not be empty.')
  }
  if (normalizedMessage.length > maximumMessageLength) {
    throw invalidMessage(`The message must not exceed ${maximumMessageLength} characters.`)
  }
  return normalizedMessage
}

export async function postChat(
  request: Request,
  response: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const result = await answerQuestion(getMessage(request.body))
    if (result.availabilityCode === 'AI_USAGE_LIMIT_REACHED') {
      response.status(503).json({
        code: result.availabilityCode,
        message: 'The AI service is temporarily unavailable.',
      })
      return
    }

    response.json({
      answer: result.answer,
      sources: result.sources,
      limitations: result.limitations,
      supportLevel: result.supportLevel,
      hasSufficientContext: result.hasSufficientContext,
    })
  } catch (error) {
    if (error && typeof error === 'object' && 'statusCode' in error) {
      next(error)
      return
    }

    const gatewayError = new Error('The agent service is temporarily unavailable.') as Error & { statusCode: number }
    gatewayError.statusCode = 502
    next(gatewayError)
  }
}
