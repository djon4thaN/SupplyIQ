import type { NextFunction, Request, Response } from 'express'

interface PublicHttpError {
  statusCode?: unknown
  status?: unknown
}

export function errorHandler(
  error: unknown,
  _request: Request,
  response: Response,
  _next: NextFunction,
): void {
  const candidate = error as PublicHttpError | null
  const statusCode = candidate && typeof candidate.statusCode === 'number'
    ? candidate.statusCode
    : candidate && candidate.status === 400
      ? 400
    : 500
  const safeStatusCode = statusCode === 400 || statusCode === 502 ? statusCode : 500

  console.error('Request processing failed.')
  response.status(safeStatusCode).json({
    message: safeStatusCode === 400
      ? 'Invalid request.'
      : safeStatusCode === 502
        ? 'Agent service unavailable.'
        : 'Internal server error.',
  })
}
