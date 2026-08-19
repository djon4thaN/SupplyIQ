import type { HealthStatus } from '../types/health.ts'

export function getHealthStatus(): HealthStatus {
  return { message: 'API funcionando' }
}
