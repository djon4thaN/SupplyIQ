# SupplyIQ Knowledge Base - VS Code Ready

Status: `validated_with_gaps`  
Version: `1.0.2-clean`  
Prepared: `2026-08-19`

This package contains the complete, cleaned and auditable Knowledge Base for
the SupplyIQ MVP.

## Runtime content

- `processed/`: canonical structured data for filters, joins and aggregations;
- `pdf/normalized/`: searchable textual guidance for semantic retrieval;
- `metadata/`: schemas, provenance, relationships and capability limits.

## Audit content

- `raw/`: preserved source files;
- `pdf/original/`: official source PDFs;
- `validation/`: quality checks, gaps, conflicts and transformation history.

Do not ingest `raw/` or `validation/` into the response RAG. Keep them in the
repository for reproducibility and audit only.

Read `RAG_INGESTION_GUIDE.md` before implementing retrieval.

## Known limitations

- CPV labels are pending for 218 valid TED codes.
- Ten multi-supplier World Bank contracts have no inferred canonical total.
- One World Bank training PDF is URL-only due to redistribution uncertainty.
- NIST is sample data; TED and World Bank are deterministic subsets.
- Guidance PDFs are contextual and must not be treated as supplier-specific
  facts or universal legal rules.
