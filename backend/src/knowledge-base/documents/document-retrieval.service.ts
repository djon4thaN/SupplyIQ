import { existsSync, readdirSync, readFileSync } from 'node:fs'
import { dirname, relative, resolve, sep } from 'node:path'
import { fileURLToPath } from 'node:url'
import { parse } from 'csv-parse/sync'
import { PDFParse } from 'pdf-parse'

const moduleDirectory = dirname(fileURLToPath(import.meta.url))
const projectRoot = resolve(moduleDirectory, '../../../..')
const knowledgeBaseRoot = resolve(projectRoot, 'knowledge_base')
const normalizedPdfDirectory = resolve(knowledgeBaseRoot, 'pdf/normalized')
const documentIndexPath = resolve(knowledgeBaseRoot, 'metadata/document_index.csv')
const chunkSize = 800
const chunkOverlap = 150

interface DocumentIndexRecord {
  document_id: string
  source_id: string
  document_title: string
  organization: string
  document_date: string
  normalized_pdf_path: string
  limitations: string
}

export interface DocumentChunk {
  chunk_id: string
  document_id: string
  title: string
  organization: string
  date: string
  source_id: string
  limitations: string
  text: string
}

export interface DocumentRetrievalDiagnostic {
  documents: readonly string[]
  chunkCount: number
  loadedNormalizedPdfPaths: readonly string[]
}

export interface DocumentKnowledgeBase {
  chunks: readonly DocumentChunk[]
  documents: readonly DocumentIndexRecord[]
}

class DocumentKnowledgeBaseValidationError extends Error {
  constructor(message: string) {
    super(`Document knowledge base validation failed: ${message}`)
    this.name = 'DocumentKnowledgeBaseValidationError'
  }
}

function assertRequiredFile(filePath: string): void {
  if (!existsSync(filePath)) {
    throw new DocumentKnowledgeBaseValidationError('a required document knowledge base file is missing.')
  }
}

function parseDocumentIndex(): DocumentIndexRecord[] {
  assertRequiredFile(documentIndexPath)

  try {
    const records = parse(readFileSync(documentIndexPath, 'utf-8'), {
      bom: true,
      columns: true,
      record_delimiter: ['\r\n', '\n'],
      relax_column_count: true,
      skip_empty_lines: true,
      trim: true,
    }) as DocumentIndexRecord[]
    const requiredColumns: (keyof DocumentIndexRecord)[] = [
      'document_id',
      'source_id',
      'document_title',
      'organization',
      'document_date',
      'normalized_pdf_path',
      'limitations',
    ]

    if (requiredColumns.some((column) => !(column in (records[0] ?? {})))) {
      throw new DocumentKnowledgeBaseValidationError('the document index has a required column missing.')
    }

    if (records.some((record) => requiredColumns.some((column) => !record[column]))) {
      throw new DocumentKnowledgeBaseValidationError('the document index has an invalid record.')
    }

    return records
  } catch (error) {
    if (error instanceof DocumentKnowledgeBaseValidationError) {
      throw error
    }

    throw new DocumentKnowledgeBaseValidationError('the document index could not be read.')
  }
}

function resolveNormalizedPdf(relativePath: string): string {
  const pdfPath = resolve(knowledgeBaseRoot, relativePath)
  const pathFromNormalizedDirectory = relative(normalizedPdfDirectory, pdfPath)
  const isNormalizedPdf = pathFromNormalizedDirectory !== ''
    && !pathFromNormalizedDirectory.startsWith(`..${sep}`)
    && pathFromNormalizedDirectory !== '..'
    && pdfPath.endsWith('.pdf')

  if (!isNormalizedPdf) {
    throw new DocumentKnowledgeBaseValidationError('an indexed document is outside the normalized PDF directory.')
  }

  assertRequiredFile(pdfPath)
  return pdfPath
}

function createChunks(document: DocumentIndexRecord, extractedText: string): DocumentChunk[] {
  const text = extractedText.replace(/\s+/g, ' ').trim()
  if (!text) {
    throw new DocumentKnowledgeBaseValidationError('a normalized PDF has no extractable text.')
  }

  const chunks: DocumentChunk[] = []
  const step = chunkSize - chunkOverlap

  for (let start = 0, index = 1; start < text.length; start += step, index += 1) {
    chunks.push(Object.freeze({
      chunk_id: `${document.document_id}_chunk_${String(index).padStart(4, '0')}`,
      document_id: document.document_id,
      title: document.document_title,
      organization: document.organization,
      date: document.document_date,
      source_id: document.source_id,
      limitations: document.limitations,
      text: text.slice(start, start + chunkSize),
    }))
  }

  return chunks
}

async function extractPdfText(pdfPath: string): Promise<string> {
  const parser = new PDFParse({ data: new Uint8Array(readFileSync(pdfPath)) })

  try {
    return (await parser.getText()).text
  } catch {
    throw new DocumentKnowledgeBaseValidationError('a normalized PDF could not be processed.')
  } finally {
    await parser.destroy()
  }
}

export async function loadDocumentKnowledgeBase(): Promise<DocumentKnowledgeBase> {
  assertRequiredFile(normalizedPdfDirectory)
  const documents = parseDocumentIndex()
  const indexedPaths = new Set(documents.map((document) => document.normalized_pdf_path))
  const normalizedFiles = readdirSync(normalizedPdfDirectory, { withFileTypes: true })
    .filter((entry) => entry.isFile() && entry.name.endsWith('.pdf'))
    .map((entry) => `pdf/normalized/${entry.name}`)

  if (normalizedFiles.some((filePath) => !indexedPaths.has(filePath))) {
    throw new DocumentKnowledgeBaseValidationError('a normalized PDF is not declared in the document index.')
  }

  const chunks: DocumentChunk[] = []
  for (const document of documents) {
    const pdfPath = resolveNormalizedPdf(document.normalized_pdf_path)
    chunks.push(...createChunks(document, await extractPdfText(pdfPath)))
  }

  return Object.freeze({
    chunks: Object.freeze(chunks),
    documents: Object.freeze(documents.map((document) => Object.freeze({ ...document }))),
  })
}

let documentKnowledgeBase: DocumentKnowledgeBase | undefined

export async function initializeDocumentKnowledgeBase(): Promise<DocumentKnowledgeBase> {
  documentKnowledgeBase ??= await loadDocumentKnowledgeBase()
  return documentKnowledgeBase
}

export function searchDocumentChunks(query: string, limit = 5): readonly DocumentChunk[] {
  const normalizedTerms = [...new Set(query.toLocaleLowerCase().match(/[\p{L}\p{N}]+/gu) ?? [])]
  if (!normalizedTerms.length || limit <= 0) {
    return []
  }

  const chunks = documentKnowledgeBase?.chunks
  if (!chunks) {
    throw new Error('Document knowledge base has not been initialized.')
  }

  return chunks
    .map((chunk) => ({
      chunk,
      score: normalizedTerms.reduce(
        (score, term) => score + (chunk.text.toLocaleLowerCase().split(term).length - 1),
        0,
      ),
    }))
    .filter(({ score }) => score > 0)
    .sort((left, right) => right.score - left.score || left.chunk.chunk_id.localeCompare(right.chunk.chunk_id))
    .slice(0, limit)
    .map(({ chunk }) => chunk)
}

export function getDocumentRetrievalDiagnostic(): DocumentRetrievalDiagnostic {
  if (!documentKnowledgeBase) {
    throw new Error('Document knowledge base has not been initialized.')
  }

  return Object.freeze({
    documents: Object.freeze(documentKnowledgeBase.documents.map(({ document_id }) => document_id)),
    chunkCount: documentKnowledgeBase.chunks.length,
    loadedNormalizedPdfPaths: Object.freeze(
      documentKnowledgeBase.documents.map(({ normalized_pdf_path }) => normalized_pdf_path),
    ),
  })
}
