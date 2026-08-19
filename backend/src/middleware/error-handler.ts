import type { NextFunction, Request, Response } from 'express'

export function errorHandler(
  error: unknown,
  _request: Request,
  response: Response,
  _next: NextFunction,
): void {
  void error
  console.error('Erro interno ao processar a requisição.')
  response.status(500).json({ message: 'Erro interno do servidor' })
}
