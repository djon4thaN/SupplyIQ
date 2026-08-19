import type { DocumentChunk } from '../knowledge-base/documents/document-retrieval.service.ts'
import type { KnowledgeBaseRecord } from '../knowledge-base/types.ts'

export interface UserRetrievalQuery {
  question: string
  maxStructuredResults?: number
  maxDocumentResults?: number
}

export interface RetrievalSource {
  sourceId: string
  name: string
  organization: string
  url: string
  limitations: string
}

export interface StructuredRetrievalResult {
  table: string
  record: KnowledgeBaseRecord
  sources: readonly RetrievalSource[]
  limitations: readonly string[]
}

export interface DocumentRetrievalResult {
  chunk: DocumentChunk
  sources: readonly RetrievalSource[]
  limitations: readonly string[]
}

export type CapabilitySupportLevel = 'full' | 'partial' | 'unsupported'

export interface CapabilitySupport {
  level: CapabilitySupportLevel
  capabilityId?: string
  limitations: readonly string[]
}

export interface HybridRetrievalResult {
  query: string
  structuredResults: readonly StructuredRetrievalResult[]
  documentResults: readonly DocumentRetrievalResult[]
  sources: readonly RetrievalSource[]
  limitations: readonly string[]
  capability: CapabilitySupport
}
