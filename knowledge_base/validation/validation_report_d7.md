# Validation Report — SupplyIQ D7

**Fase:** D7 — Avaliar lacunas e decidir se World Bank é necessário  
**Data:** 2026-08-19  
**Status:** validated_with_gaps

## Decisão

**World Bank é necessário para o MVP, com subset controlado.**

O TED possui 740 contratos processados, porém 0 registros com `contract_value` direto. O dataset oficial World Bank `DS00005` é contratual, usa `WB Contract Number`, cobre contratos IPF desde FY2020, possui data de assinatura e declara valores contratuais. Isso cobre uma lacuna relevante para perguntas de comparação de contratos dentro da mesma moeda.

## Escopo aprovado

- Fonte selecionada: `Contract Awards in Investment Project Financing (Since FY 2020)`.
- Fonte oficial: World Bank Group / Finances One.
- Licença: CC BY 4.0.
- O site reporta 288.036 linhas, 21 colunas, atualização diária e cobertura global desde FY2020 em 2026-08-19.
- A ingestão deve começar pela inspeção das colunas reais e por um subset fixo e reproduzível.
- Os dados World Bank formarão um universo separado; não preencherão contratos TED e não serão fundidos por nome.

## Fontes rejeitadas como primárias

- `Corporate Procurement Contract Awards`: útil apenas para grandes contratos internos do WBG, acima de US$100 mil, e não representa todos os contratos.
- Resumos e visualizações derivados: não substituem o dataset contratual base.

## Limitações oficiais

- Dados inseridos pelos Borrowers no STEP.
- País do fornecedor representa registro legal, não necessariamente origem real.
- Subcontratados e cofinanciamento não são incluídos.
- Valores de joint ventures podem ser divididos igualmente entre participantes.
- O Procurement Group não garante completude ou exatidão.

## Validação

- Verificações D7: 15.
- Aprovadas: 15.
- Falhas: 0.
- Nenhum dado World Bank foi baixado nesta fase decisória.
