import type { RetrievalSource } from '../retrieval/types.ts'

export type AgentSupportLevel = 'full' | 'partial' | 'unsupported'

export interface AgentAnswer {
  answer: string
  sources: readonly RetrievalSource[]
  limitations: readonly string[]
  supportLevel: AgentSupportLevel
  hasSufficientContext: boolean
}
