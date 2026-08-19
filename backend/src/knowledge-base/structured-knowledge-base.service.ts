import { existsSync, readdirSync, readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, relative, resolve, sep } from 'node:path'
import { parse } from 'csv-parse/sync'
import type {
  EntityIndexRecord,
  KnowledgeBaseDiagnostic,
  KnowledgeBaseRecord,
  StructuredKnowledgeBase,
} from './types.ts'

const moduleDirectory = dirname(fileURLToPath(import.meta.url))
const projectRoot = resolve(moduleDirectory, '../../..')
const knowledgeBaseRoot = resolve(projectRoot, 'knowledge_base')
const processedDirectory = resolve(knowledgeBaseRoot, 'processed')

const metadataFiles = {
  entityIndex: 'metadata/entity_index.csv',
  dataDictionary: 'metadata/data_dictionary.csv',
  relationshipCatalog: 'metadata/relationship_catalog.csv',
  capabilityMatrix: 'metadata/capability_matrix.csv',
  sources: 'metadata/sources.csv',
} as const

class KnowledgeBaseValidationError extends Error {
  constructor(message: string) {
    super(`Knowledge base validation failed: ${message}`)
    this.name = 'KnowledgeBaseValidationError'
  }
}

function assertRequiredFile(filePath: string): void {
  if (!existsSync(filePath)) {
    throw new KnowledgeBaseValidationError('a required knowledge base file is missing.')
  }
}

function parseCsv(filePath: string): KnowledgeBaseRecord[] {
  assertRequiredFile(filePath)

  try {
    return parse(readFileSync(filePath, 'utf-8'), {
      bom: true,
      columns: true,
      record_delimiter: ['\r\n', '\n'],
      relax_column_count: true,
      skip_empty_lines: true,
      trim: true,
    }) as KnowledgeBaseRecord[]
  } catch {
    throw new KnowledgeBaseValidationError('a required knowledge base file could not be read.')
  }
}

function assertColumns(rows: readonly KnowledgeBaseRecord[], requiredColumns: readonly string[]): void {
  const columns = Object.keys(rows[0] ?? {})

  if (requiredColumns.some((column) => !columns.includes(column))) {
    throw new KnowledgeBaseValidationError('a required column is missing.')
  }
}

function resolveProcessedFile(relativePath: string): string {
  const filePath = resolve(knowledgeBaseRoot, relativePath)
  const pathFromProcessedDirectory = relative(processedDirectory, filePath)
  const isInsideProcessedDirectory = pathFromProcessedDirectory !== ''
    && !pathFromProcessedDirectory.startsWith(`..${sep}`)
    && pathFromProcessedDirectory !== '..'

  if (!isInsideProcessedDirectory || !filePath.endsWith('.csv')) {
    throw new KnowledgeBaseValidationError('an indexed table is outside the allowed structured data directory.')
  }

  return filePath
}

function loadMetadata(): StructuredKnowledgeBase['metadata'] {
  const entityIndex = parseCsv(resolve(knowledgeBaseRoot, metadataFiles.entityIndex)) as EntityIndexRecord[]
  assertColumns(entityIndex, ['entity_id', 'file_path', 'primary_key', 'record_count'])

  const dataDictionary = parseCsv(resolve(knowledgeBaseRoot, metadataFiles.dataDictionary))
  const relationshipCatalog = parseCsv(resolve(knowledgeBaseRoot, metadataFiles.relationshipCatalog))
  const capabilityMatrix = parseCsv(resolve(knowledgeBaseRoot, metadataFiles.capabilityMatrix))
  const sources = parseCsv(resolve(knowledgeBaseRoot, metadataFiles.sources))
  assertColumns(sources, ['source_id'])

  return { entityIndex, dataDictionary, relationshipCatalog, capabilityMatrix, sources }
}

export function loadStructuredKnowledgeBase(): StructuredKnowledgeBase {
  assertRequiredFile(processedDirectory)
  const metadata = loadMetadata()
  const indexedFiles = new Set(metadata.entityIndex.map(({ file_path }) => file_path))
  const processedFiles = readdirSync(processedDirectory, { withFileTypes: true })
    .filter((entry) => entry.isFile() && entry.name.endsWith('.csv'))
    .map((entry) => `processed/${entry.name}`)

  if (processedFiles.some((filePath) => !indexedFiles.has(filePath))) {
    throw new KnowledgeBaseValidationError('a structured data table is not declared in the entity index.')
  }

  const entities = new Map<string, readonly KnowledgeBaseRecord[]>()

  for (const entity of metadata.entityIndex) {
    const recordCount = Number(entity.record_count)
    if (!entity.entity_id || !entity.primary_key || !Number.isSafeInteger(recordCount) || recordCount < 0) {
      throw new KnowledgeBaseValidationError('the entity index contains an invalid declaration.')
    }

    const rows = parseCsv(resolveProcessedFile(entity.file_path))
    assertColumns(rows, [entity.primary_key])

    if (rows.length !== recordCount) {
      throw new KnowledgeBaseValidationError('a structured data table has an unexpected record count.')
    }

    if (rows.some((row) => !row[entity.primary_key])) {
      throw new KnowledgeBaseValidationError('a structured data table has an empty primary key.')
    }

    entities.set(entity.entity_id, Object.freeze(rows.map((row) => Object.freeze({ ...row }))))
  }

  return Object.freeze({
    entities,
    metadata: Object.freeze({
      entityIndex: Object.freeze(metadata.entityIndex.map((row) => Object.freeze({ ...row }))),
      dataDictionary: Object.freeze(metadata.dataDictionary.map((row) => Object.freeze({ ...row }))),
      relationshipCatalog: Object.freeze(metadata.relationshipCatalog.map((row) => Object.freeze({ ...row }))),
      capabilityMatrix: Object.freeze(metadata.capabilityMatrix.map((row) => Object.freeze({ ...row }))),
      sources: Object.freeze(metadata.sources.map((row) => Object.freeze({ ...row }))),
    }),
  })
}

let knowledgeBase: StructuredKnowledgeBase | undefined

export function initializeStructuredKnowledgeBase(): StructuredKnowledgeBase {
  knowledgeBase ??= loadStructuredKnowledgeBase()
  return knowledgeBase
}

export function getKnowledgeBaseDiagnostic(): KnowledgeBaseDiagnostic {
  const loadedKnowledgeBase = knowledgeBase ?? initializeStructuredKnowledgeBase()
  const tables = [...loadedKnowledgeBase.entities.keys()]
  const recordCounts = Object.fromEntries(
    tables.map((table) => [table, loadedKnowledgeBase.entities.get(table)?.length ?? 0]),
  )

  return Object.freeze({
    tables: Object.freeze(tables),
    recordCounts: Object.freeze(recordCounts),
    availableSources: Object.freeze(
      loadedKnowledgeBase.metadata.sources.map((source) => source.source_id).filter(Boolean),
    ),
  })
}
