# SupplyIQ - RAG Ingestion Guide

## Add to the project

Copy the entire `knowledge_base/` folder into the project repository.

## Load at runtime

### Structured retrieval

Load CSVs from `processed/` with a CSV/dataframe or relational query layer.
Use IDs and bridge tables for joins. Preserve `source_id`, currency and units.

### Semantic retrieval

Chunk and index only the PDFs in `pdf/normalized/`. Preserve document title,
organization, publication date, official URL and limitations from
`metadata/document_index.csv`.

### Retrieval metadata

Use:

- `metadata/data_dictionary.csv`;
- `metadata/document_index.csv`;
- `metadata/relationship_catalog.csv`;
- `metadata/capability_matrix.csv`;
- `metadata/sources.csv`.

## Do not ingest as answer knowledge

- `raw/`;
- `validation/`;
- `pdf/original/` when the corresponding normalized PDF is already indexed;
- registry, audit and transformation files.

These files must remain in the repository for provenance and verification.

## Mandatory answer rules

- Never compare different currencies without explicit conversion evidence.
- Never infer totals for multi-supplier contracts.
- Keep TED, World Bank and NIST source universes distinguishable.
- Never present general PDF guidance as a fact about a named supplier.
- State when a capability is partial or unsupported.
- Return the real source records/documents used in each answer.
