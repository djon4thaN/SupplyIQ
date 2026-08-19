# Validation Report — SupplyIQ D6

**Fase:** D6 — Validar valores, moedas, buyers, suppliers e categorias  
**Data:** 2026-08-19  
**Status:** validated_with_gaps

## Resultado

- Verificações automáticas: 23; falhas: 0.
- Valores monetários negativos: 0.
- Moeda ausente quando há valor: 0.
- Awards com `award_value`: 670/849 (78.92%).
- Contracts com `contract_value`: 0/740.
- Outliers sinalizados: 29; nenhum foi corrigido automaticamente.
- Buyers com nome e país: 286/286.
- Suppliers TED com país: 488/488.
- Suppliers NIST sem país: 106.
- Códigos CPV válidos: 218/218.
- Categorias sem descrição: 218.

## Regras preservadas

- Nenhuma soma entre moedas diferentes.
- Nenhuma soma entre procedure, lot, award e contract.
- Valores em `award_suppliers.csv` são repetidos em coadjudicações e não representam parcelas somáveis.
- Outliers e candidatos a duplicidade foram mantidos e apenas sinalizados.
- `contract_value` não foi inferido a partir de `award_value`.

## Lacunas

- Valor direto do contrato não está disponível no subset.
- Descrições oficiais CPV ainda precisam de enriquecimento controlado.
- Candidatos de duplicidade exigem confirmação por identificador oficial.
- Países dos fornecedores NIST não foram inferidos.
