import type { Request, Response } from 'express'
import { getHealthStatus } from '../services/health.service.ts'

export function getHealth(_request: Request, response: Response): void {
  response.json(getHealthStatus())
}
