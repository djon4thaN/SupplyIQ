# Inspeção da estrutura TED — Fase D4

**Data de inspeção:** 2026-08-19  
**Fonte responsável:** Publications Office of the European Union  
**Status:** validated_with_gaps

## 1. Rotas oficiais verificadas

1. **TED Search API v3** — consulta anônima de avisos publicados por expert query; indicada para selecionar o universo e recuperar campos de identificação.
2. **XML oficial por aviso ou pacotes diários/mensais** — preserva a estrutura original; será a fonte raw canônica da D5.
3. **TED Open Data Service (RDF/SPARQL)** — converte parte dos avisos para eProcurement Ontology no Cellar; útil para inspeção e validação sem substituir o XML raw.
4. **CSV histórico oficial** — cobre campos importantes de contract notices e contract award notices, porém é um subset achatado e a página do dataset informa cobertura até 2023-12-31. Não foi escolhido como raw principal.

## 2. Estrutura real sustentada

- Um aviso eForms é um documento XML e pode representar Planning, Competition, Result, Contract Modification ou Completion.
- Result notices são publicados após assinatura e trazem informações de resultado, vencedor e contrato quando aplicáveis.
- A estrutura possui `Notice`, `Procedure`, `Lot`, `LotResult`, `Tender`, `Contract` e `Organisation` com papéis como Buyer e Winner.
- Todo aviso eForms contém ao menos um lot; o resultado é publicado por lot.
- Nem todo lot possui vencedor e nem todo aviso materializa contrato.
- A ligação Supplier/Winner → Tender → LotResult → Contract deve vir das referências do XML; listas da API não serão alinhadas por posição.

## 3. Subset escolhido

**Identificador:** `sub_ted_001`

- Período fixo: 2025-01-01 a 2025-03-31.
- Tipo: `form-type=result`.
- Escopo: somente versões ativas e mais recentes.
- Sem filtro de país ou CPV.
- Universo recuperado integralmente por paginação.
- Após validar eForms e remover duplicação por `publication-number`, ordenar ascendentemente e selecionar os primeiros 300.
- Baixar o XML oficial de cada publicação selecionada.

O critério é determinístico, não usa escolha manual de registros “interessantes” e preserva avisos sem award/contract quando eles forem válidos.

## 4. Consulta planejada para D5

Endpoint: `POST https://api.ted.europa.eu/v3/notices/search`

Corpo lógico:

```json
{
  "query": "publication-date=[20250101 TO 20250331] AND form-type=result",
  "fields": ["publication-number", "notice-identifier", "notice-version", "publication-date", "form-type", "notice-type", "notice-subtype"],
  "page": 1,
  "limit": 100,
  "scope": "ACTIVE",
  "checkQuerySyntax": true,
  "paginationMode": "PAGE_NUMBER",
  "onlyLatestVersions": true
}
```

A D5 deverá paginar até o fim, registrar a resposta de seleção, ordenar localmente por `publication-number`, limitar a 300 e baixar cada XML.

## 5. Licença e uso

O TED aplica a política de reutilização da Comissão Europeia sob a Decision 2011/833/EU. A reutilização é permitida com atribuição; elementos pertencentes a terceiros continuam sujeitos aos respectivos direitos. Os limites de fair use do TED devem ser respeitados.

## 6. Limitações conhecidas

- O ODS alerta que contagens por UUID do notice podem divergir das contagens por publication number; esta base usará `publication-number` para deduplicação do subset.
- XML eForms e TED Schema coexistem desde 14/11/2022; o subset manterá apenas eForms para reduzir heterogeneidade do MVP.
- As versões do eForms SDK e da eProcurement Ontology evoluem; XPaths e cardinalidades serão confirmados contra cada XML na D5.
- O subset temporal não representa o universo inteiro do TED.
