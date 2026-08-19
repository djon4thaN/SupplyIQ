import {
  initializeDocumentKnowledgeBase,
  searchDocumentChunks,
} from '../knowledge-base/documents/document-retrieval.service.ts'
import { initializeStructuredKnowledgeBase } from '../knowledge-base/structured-knowledge-base.service.ts'
import type { KnowledgeBaseRecord } from '../knowledge-base/types.ts'
import type {
  CapabilitySupport,
  DocumentRetrievalResult,
  HybridRetrievalResult,
  RetrievalSource,
  StructuredRetrievalResult,
  UserRetrievalQuery,
} from './types.ts'

const maximumQuestionLength = 1_000
const defaultStructuredResultLimit = 10
const defaultDocumentResultLimit = 5
const maximumResultLimit = 20

class RetrievalInputError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'RetrievalInputError'
  }
}

function normalizeText(value: string): string {
  return value.normalize('NFKC').replace(/\s+/g, ' ').trim()
}

function getTerms(value: string): string[] {
  return [...new Set(normalizeText(value).toLocaleLowerCase().match(/[\p{L}\p{N}]+/gu) ?? [])]
}

function getResultLimit(value: number | undefined, fallback: number): number {
  if (value === undefined) {
    return fallback
  }

  if (!Number.isSafeInteger(value) || value < 1) {
    throw new RetrievalInputError('Retrieval result limits must be positive integers.')
  }

  return Math.min(value, maximumResultLimit)
}

function getSource(record: KnowledgeBaseRecord, sourceId: string): RetrievalSource {
  return Object.freeze({
    sourceId,
    name: record.source_name || sourceId,
    organization: record.responsible_organization || 'Not specified',
    url: record.source_url || '',
    limitations: record.limitations || 'Source limitations were not specified.',
  })
}

function getSourceIds(record: KnowledgeBaseRecord, fallbackSourceIds: string): string[] {
  const sourceIds = record.source_id || fallbackSourceIds
  return sourceIds.split('|').map((sourceId) => sourceId.trim()).filter(Boolean)
}

function getRecordScore(record: KnowledgeBaseRecord, terms: readonly string[]): number {
  const searchableText = Object.values(record).join(' ').toLocaleLowerCase()
  return terms.reduce((score, term) => score + (searchableText.split(term).length - 1), 0)
}

function getPresentStrings(values: readonly (string | undefined)[]): string[] {
  return values.filter((value): value is string => Boolean(value))
}

function getCapabilitySupport(question: string, capabilities: readonly KnowledgeBaseRecord[]): CapabilitySupport {
  const terms = getTerms(question)
  const matchingCapability = capabilities
    .map((capability) => ({
      capability,
      score: getTerms(capability.example_question ?? '')
        .filter((term) => terms.includes(term)).length,
    }))
    .filter(({ score }) => score > 0)
    .sort((left, right) => right.score - left.score || (left.capability.capability_id ?? '').localeCompare(right.capability.capability_id ?? ''))
    .at(0)?.capability

  if (!matchingCapability) {
    return Object.freeze({
      level: 'unsupported',
      limitations: Object.freeze([
        'No declared capability could be matched to this question; retrieval results are not a supported answer.',
      ]),
    })
  }

  const isSupported = matchingCapability.supported === 'true'
  const level = isSupported && matchingCapability.support_level === 'full' ? 'full' : 'partial'
  const limitations = [matchingCapability.limitations].filter(Boolean)

  return Object.freeze({
    level: isSupported ? level : 'unsupported',
    capabilityId: matchingCapability.capability_id,
    limitations: Object.freeze(limitations),
  })
}

export async function retrieveHybridContext(query: UserRetrievalQuery): Promise<HybridRetrievalResult> {
  if (query.question.length > maximumQuestionLength) {
    throw new RetrievalInputError(`Retrieval question must not exceed ${maximumQuestionLength} characters.`)
  }

  const normalizedQuestion = normalizeText(query.question)
  if (!normalizedQuestion) {
    throw new RetrievalInputError('Retrieval question must not be empty.')
  }

  const structuredLimit = getResultLimit(query.maxStructuredResults, defaultStructuredResultLimit)
  const documentLimit = getResultLimit(query.maxDocumentResults, defaultDocumentResultLimit)
  const terms = getTerms(normalizedQuestion)
  const structuredKnowledgeBase = initializeStructuredKnowledgeBase()
  await initializeDocumentKnowledgeBase()

  const sourceRecords = new Map(
    structuredKnowledgeBase.metadata.sources.map((source) => [source.source_id, source]),
  )
  const entityIndex = new Map(
    structuredKnowledgeBase.metadata.entityIndex.map((entity) => [entity.entity_id, entity]),
  )
  const structuredResults = [...structuredKnowledgeBase.entities.entries()]
    .flatMap(([table, records]) => records.map((record) => ({ table, record, score: getRecordScore(record, terms) })))
    .filter(({ score }) => score > 0)
    .sort((left, right) => right.score - left.score || left.table.localeCompare(right.table))
    .slice(0, structuredLimit)
    .map(({ table, record }): StructuredRetrievalResult => {
      const sourceIds = getSourceIds(record, entityIndex.get(table)?.source_ids ?? '')
      const sources = sourceIds.map((sourceId) => getSource(sourceRecords.get(sourceId) ?? {}, sourceId))
      const entityLimitations = entityIndex.get(table)?.limitations
      const limitations = getPresentStrings([
        entityLimitations,
        ...sources.map((source) => source.limitations),
        'Structured records are returned as stored; no monetary aggregation, currency conversion, or multi-supplier contract total inference has been performed.',
      ])

      return Object.freeze({
        table,
        record,
        sources: Object.freeze(sources),
        limitations: Object.freeze([...new Set(limitations)]),
      })
    })

  const documentResults = searchDocumentChunks(normalizedQuestion, documentLimit)
    .map((chunk): DocumentRetrievalResult => {
      const source = getSource(sourceRecords.get(chunk.source_id) ?? {}, chunk.source_id)
      return Object.freeze({
        chunk,
        sources: Object.freeze([source]),
        limitations: Object.freeze([...new Set([chunk.limitations, source.limitations].filter(Boolean))]),
      })
    })
  const sources = [...new Map(
    [...structuredResults, ...documentResults]
      .flatMap((result) => result.sources)
      .map((source) => [source.sourceId, source]),
  ).values()]
  const capability = getCapabilitySupport(normalizedQuestion, structuredKnowledgeBase.metadata.capabilityMatrix)
  const limitations = [
    ...capability.limitations,
    ...structuredResults.flatMap((result) => result.limitations),
    ...documentResults.flatMap((result) => result.limitations),
    'Document guidance is contextual evidence only and is not a fact about any supplier or a current universal legal rule.',
  ]

  return Object.freeze({
    query: normalizedQuestion,
    structuredResults: Object.freeze(structuredResults),
    documentResults: Object.freeze(documentResults),
    sources: Object.freeze(sources),
    limitations: Object.freeze([...new Set(limitations)]),
    capability,
  })
}
