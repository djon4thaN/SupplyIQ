import type { Request, Response } from 'express'

export function notFoundHandler(request: Request, response: Response): void {
  response.status(404).json({ message: `Rota não encontrada: ${request.method} ${request.originalUrl}` })
}
