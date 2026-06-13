---
title: BOVI RAG Index
type: meta
---

# BOVI Knowledge Base — RAG Index

Queryable summary of the BOVI framework, derived from the project's underlying theory, pedagogy, storyboard, and architectural docs in `../`. Each file is a self-contained chunk with frontmatter for retrieval (title, type, tags, sources, related).

## Structure

```
core/          — foundational concepts (axioms, anchors, mode definitions)
modes/         — one deep file per fairness mode
architecture/  — how money systems are built (cold-start, layers, functions)
pathologies/   — what goes wrong (yield management, surveillance pricing, arms races)
practice/      — what to do (personal PDA, indices, the Tally product)
lineage/       — intellectual heritage (Fiske, substantivist anthropology)
cases/         — real-world examples (crises, currencies, platforms)
pedagogy/      — teaching designs (insights to unlearn/grasp, experiences)
glossary.md    — terms with one-line definitions
source-map.md  — pointers to underlying docs
```

## How to query

Each file has YAML frontmatter with `tags` and `type`. For embedding-based RAG, embed each file's body. For tag-based retrieval, filter on frontmatter. For human browsing, use the index below.

## Full index

### Core concepts
- [Portable Forgetful Ledger](core/portable-forgetful-ledger.md) — what money minimally is
- [Five Axioms of Money](core/five-axioms.md) — the cleaned-up minimum spec
- [Common Knowledge of Acceptance](core/common-knowledge-of-acceptance.md) — the single value axiom
- [Three Anchor Types](core/three-anchor-types.md) — legal, natural, mathematical
- [The Four Fairness Modes](core/four-modes-overview.md) — BOVI summarised
- [Consent as Orthogonal Axis](core/consent-axis.md) — voluntary vs coerced
- [Money as Bundle](core/money-as-bundle.md) — the bundling thesis
- [The Unbundling Thesis](core/unbundling-thesis.md) — functions belong in different tools

### Modes
- [Value Mode](modes/value-mode.md)
- [Balanced Mode](modes/balanced-mode.md)
- [Obligated Mode](modes/obligated-mode.md)
- [Immediate Mode](modes/immediate-mode.md)

### Architecture
- [The Four Functions of Money](architecture/four-functions.md)
- [The Five-Layer Financial Stack](architecture/five-layer-stack.md)
- [The Cold-Start Problem](architecture/cold-start-problem.md)
- [The Four Bootstrap Engines](architecture/four-bootstrap-engines.md)
- [The Two-Layer Pattern](architecture/two-layer-pattern.md)
- [Mode Collision](architecture/mode-collision.md)

### Pathologies
- [Adversarial Mode Forcing](pathologies/adversarial-mode-forcing.md)
- [The Buyer-Obfuscation Arms Race](pathologies/buyer-obfuscation-arms-race.md)
- [Yield Management as Mode Violation](pathologies/yield-management.md)
- [Inflation as Broken Common Knowledge](pathologies/inflation-broken-knowledge.md)

### Practice
- [The Personal PDA](practice/personal-pda.md)
- [Personal Indices](practice/personal-indices.md)
- [The Unbundled Personal Stack](practice/unbundled-personal-stack.md)
- [The Tally — Modern Tally Rope Product](practice/the-tally-product.md)

### Lineage
- [Fiske's Relational Models Theory](lineage/fiske-relational-models.md)
- [Substantivist Anthropology](lineage/substantivist-anthropology.md)
- [The Four Origin Stories of Money](lineage/monetary-origin-stories.md)

### Cases
- [The 2008 Financial Crisis](cases/2008-financial-crisis.md)
- [Weimar Hyperinflation](cases/weimar-hyperinflation.md)
- [Bitcoin](cases/bitcoin.md)
- [CBDCs](cases/cbdcs.md)
- [Mobile Money: M-Pesa, Pix, GCash](cases/mobile-money.md)
- [Argentina: The Big Mac War & Dollarisation](cases/argentina-bigmac-dollarisation.md)
- [Ithaca HOURS & Local Currencies](cases/ithaca-hours.md)
- [Gold Standard Era](cases/gold-standard-era.md)

### Pedagogy
- [Five Insights to Unlearn](pedagogy/insights-to-unlearn.md)
- [Five Insights to Grasp](pedagogy/insights-to-grasp.md)
- [The $20 Bill Revelation](pedagogy/twenty-dollar-revelation.md)
- [The Empathy Machine](pedagogy/empathy-machine.md)
- [The Personal Money Audit](pedagogy/personal-money-audit.md)

### Reference
- [Glossary](glossary.md)
- [Source Map](source-map.md)

## File conventions

- **Frontmatter (YAML)**: `title`, `type`, `tags` (list), `sources` (list of underlying-doc filenames), `related` (list of sibling RAG files)
- **Body**: opens with a one-paragraph definition/summary; then key points; then source-derived detail; then explicit links to related files.
- **Length**: target 200–600 words per file, occasional longer for cases.
- **Voice**: descriptive third-person, no advocacy. Quotes from source docs are marked.
