export type KnowledgeBaseRecord = Readonly<Record<string, string>>

export interface EntityIndexRecord extends KnowledgeBaseRecord {
  entity_id: string
  file_path: string
  primary_key: string
  record_count: string
}

export interface KnowledgeBaseDiagnostic {
  tables: readonly string[]
  recordCounts: Readonly<Record<string, number>>
  availableSources: readonly string[]
}

export interface StructuredKnowledgeBase {
  entities: ReadonlyMap<string, readonly KnowledgeBaseRecord[]>
  metadata: {
    entityIndex: readonly EntityIndexRecord[]
    dataDictionary: readonly KnowledgeBaseRecord[]
    relationshipCatalog: readonly KnowledgeBaseRecord[]
    capabilityMatrix: readonly KnowledgeBaseRecord[]
    sources: readonly KnowledgeBaseRecord[]
  }
}
