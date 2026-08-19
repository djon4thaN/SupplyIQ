# Data Quality Report - SupplyIQ Knowledge Base

**Data:** 2026-08-19  
**Versao:** 1.0.2-clean  
**Status:** `validated_with_gaps`

## 1. Dados estruturados

| Arquivo | Registros |
|---|---:|
| suppliers.csv | 879 |
| buyers.csv | 286 |
| products.csv | 152 |
| projects.csv | 146 |
| procurement_notices.csv | 300 |
| procurement_procedures.csv | 274 |
| procurement_lots.csv | 846 |
| procurement_awards.csv | 1.137 |
| procurement_contracts.csv | 1.028 |
| categories.csv | 222 |
| supplier_products.csv | 186 |
| supplier_projects.csv | 300 |
| product_projects.csv | 154 |
| notice_buyers.csv | 349 |
| award_suppliers.csv | 1.083 |
| contract_suppliers.csv | 1.162 |

## 2. Cobertura por fonte

- Suppliers: 106 NIST, 488 TED e 285 World Bank.
- Projects: 19 NIST e 127 World Bank.
- Contracts: 740 TED e 288 World Bank.
- Awards: 849 TED e 288 World Bank.
- Os universos das fontes permanecem separados e rastreaveis por `source_id`.

## 3. Valores e moedas

- TED possui 670 awards com valor e moeda.
- World Bank possui 278 contratos/awards com total canonico em USD.
- Dez contratos World Bank com multiplos fornecedores permanecem sem total canonico.
- Valores por fornecedor continuam preservados nas tabelas bridge.
- Comparacoes devem ocorrer somente dentro da mesma moeda e granularidade.
- Nenhuma conversao cambial deve ser presumida.

## 4. Relacionamentos e duplicidades

- Duplicatas exatas causadas por repeticao da ingestao World Bank foram removidas.
- Nenhum registro unico foi removido.
- Foreign keys das relacoes materializadas foram revalidadas.
- Referencias NIST orfas ou ambiguas nao foram inventadas.
- Candidatos a duplicidade de entidade permanecem registrados sem merge automatico.

## 5. Documentos

- Dois PDFs oficiais foram preservados em `pdf/original/`.
- Dois PDFs normalizados e pesquisaveis estao em `pdf/normalized/`.
- Supplier selection: referencia historica do Reino Unido, publicada em 2016.
- Contract management: orientacao da Irlanda do Norte, publicada em 2017.
- Esses documentos fornecem orientacao geral e nao fatos sobre fornecedores especificos.

## 6. Categorias

- 218 codigos CPV do TED foram validados.
- Os rotulos oficiais desses codigos continuam pendentes.
- Quatro categorias World Bank possuem nomes normalizados.

## 7. Uso recomendado

Carregar no runtime do agente:

- `processed/` para consultas estruturadas;
- `pdf/normalized/` para retrieval semantico;
- `metadata/data_dictionary.csv`;
- `metadata/document_index.csv`;
- `metadata/relationship_catalog.csv`;
- `metadata/capability_matrix.csv`.

Nao carregar `raw/` ou `validation/` como conhecimento de resposta.

## 8. Conclusao

A qualidade e suficiente para um MVP academico robusto. As tres lacunas abertas
estao explicitamente documentadas e nao impedem a integracao.
