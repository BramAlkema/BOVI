# Plan — resolving the mode↔monetary-function mapping

**Status:** diagnosis settled, recommendation pending one research input. Written after the tally-rope ruling (commit `668a167`), which fixed the symptoms this document addresses at the root.

## The problem

`docs/theory.md` §"BOVI Mapping to Monetary Functions" assigns each mode one of the four textbook functions of money. Two independent things are wrong with it, and they need separating because they have different fixes.

### Fault 1 — the ledger was assigned to one mode

The repo carries **two different formal footings** for the modes, and only one is credited.

**Footing A — Fiske's measurement scales.** `FOUNDATIONS.md:39`, `MODES-MONEY-FUSION-PLAN.md:9` and the Epilogue all use Fiske's own mapping of the relational models onto the four classic scale types: CS = nominal, AR = ordinal, EM = **interval**, MP = **ratio**. On this reading the modes are "the four resolutions a ledger can keep," and money is "the ratio/instant-clearing discipline made infrastructural." Status is stated honestly: *packaging of Fiske, no new theorem.*

**Footing B — monetary functions.** `theory.md:41` and `rag/lineage/fiske-relational-models.md:51` instead map the models onto monetary functions: EM → "distributed ledger; tracks obligations across time," MP → "medium of exchange," AR → "required payment medium," CS → "direct reciprocity anchor." No pedigree is given for this mapping anywhere.

**The generator of the error is the step from A to B.** Footing A says EM is the *interval* resolution — one of four resolutions a ledger can keep. Footing B collapses that into EM *being* the ledger. But under Footing A **all four modes are ledger resolutions**, so the ledger cannot belong to any one of them. That single conflation produced every symptom fixed in `668a167`: proto-cuneiform tablets, exchequer tallies, double-entry bookkeeping, blockchains and the tally rope all filed under Balanced because they keep records.

Footing A also independently settles the tally-rope ruling: the rope prices goods in a common metric, prices are a **ratio** scale, ratio is **MP**, MP is **Value**.

### Fault 2 — the textbook four are treated as a natural partition

Handing each mode exactly one textbook function presents that list as exhaustive and cleanly divisible. This is the framework's own named failure mode #4 (`CANON.md:417`) — "treating the textbook four functions as definitional: writing as if they belong together" — and it contradicts Quirk 14, which holds that the list "is not a description of money's nature; it is a description of forced bundling," each function belonging in its own tool.

Note that the RAG layer's `architecture/four-functions.md` states Quirk 14 correctly. The inconsistency is `theory.md` against the rest of the canon, not a corpus-wide confusion.

## Scope — every site, verified

| file | what is there | fault |
|---|---|---|
| `docs/theory.md:39–43` | the mapping table; source of the rest | 1 + 2 |
| `docs/theory.md:48–66` | Balanced Mode section — already carries a correction note from `668a167` | 1 |
| `docs/rag/lineage/fiske-relational-models.md:51–56` | "The mapping at a glance" table | 1 + 2 |
| `docs/rag/pedagogy/twenty-dollar-revelation.md:25` | gloss "Equality Matching — the ledger function" | 1 only — the *scenario* is correct B mode, only the label is wrong |

Already fixed at the symptom level in `668a167`: `rag/modes/balanced-mode.md`, `rag/glossary.md`, `rag/practice/the-tally-product.md`, plus the new diagnosis rule in `rag/core/four-modes-overview.md`.

## The decision to make

**Fault 1 has an obvious fix** — retire the ledger-to-EM assignment, keep Footing A, state that all four modes are ledger resolutions. That is already half-done by the correction note in `theory.md` and the diagnosis rule in `four-modes-overview.md`.

**Fault 2 is the real decision**, and there are three options:

1. **Retire Footing B entirely.** Keep only Fiske's scale mapping. Cleanest and most defensible; costs whatever explanatory work the function mapping was doing.
2. **Reinterpret it as the bundling explanation.** Rewrite so the table no longer says *mode X = function Y* but instead: a general-purpose money must serve all four disciplines, and each discipline stresses different properties — which is *why* the four functions get forcibly bundled. This converts a Quirk 14 violation into a Quirk 14 derivation, and would make the table earn its place. Risk: the 1:1 reading creeps back unless the presentation forbids it.
3. **Replace it with special-purpose money (Polanyi / Dalton).** If the anthropology supports the claim that monetary functions were historically carried by *different objects in the same society*, with all-purpose money the unusual modern fusion, then the framework's unbundling thesis gains a mid-century pedigree and the mode↔function question becomes empirical rather than taxonomic — *which discipline did each special-purpose money serve?* The Rai case is already a worked instance: rai carried prescribed O-mode obligations while pearl-shells carried V-mode small change.

**Pending input:** a research agent is checking (a) whether Fiske himself says anything about money or monetary functions, (b) whether anyone in economic anthropology or sociology has made the models→functions mapping, (c) the exact Polanyi/Dalton formulation of special-purpose money and whether the separability claim survived the substantivist/formalist criticism, and (d) the provenance of the four-function list itself (usually credited to Jevons 1875).

**Provisional recommendation, to be confirmed or dropped on that evidence: 2 + 3.** Reinterpret the table as an account of *why* bundling happens, with Polanyi/Dalton supplying the pedigree and the historical evidence that unbundled monies are the norm rather than the exception. This fits the framework's "borrowed = strength" posture, converts an uncredited invention into a sourced claim, and the Rai case already instantiates it. Fall back to option 1 if the separability claim turns out to be contested enough that leaning on it would overclaim.

## Execution, once the option is chosen

1. Rewrite `theory.md` §"BOVI Mapping to Monetary Functions" per the chosen option. Keep the existing correction note; fold it in rather than stacking a second one.
2. Bring `rag/lineage/fiske-relational-models.md`'s table into line — it is the RAG mirror of the same claim and must not diverge again.
3. Fix the one-line gloss in `twenty-dollar-revelation.md`; leave the teaching scenario untouched.
4. State Footing A once, canonically, with its Fiske citation, and have the other sites reference it rather than restate it. Divergent restatement is what produced this.
5. If option 3 is adopted, add `docs/rag/lineage/special-purpose-money.md` following the lineage-doc pattern, and cross-link it from `core/unbundling-thesis.md` and `cases/rai-stones-yap.md`.

## Second, smaller item — the naming collision

Two different devices share the name "tally rope," and the glossary merges them:

- the **five-knight peg mechanism** (`Ye Tally Rope.pdf`, `tally-rope-sketch.html`) — a price-revealing device: pegs slide, tensions reveal exchange rates
- the **four-peg village netting rope** (book Intermezzo 8A) — a settlement ledger that nets residuals

Both are Value-mode, so this does not disturb the ruling; it is a naming problem only. Proposal: keep "tally rope" for 8A's settlement device, since that is what the book and the product are named after, and give the PDF mechanism a distinct name in the glossary. Low priority, but worth doing before the two get conflated in the book.

## Verification

1. `grep -rn "Monetary Function\|Fiske Model\|ledger function" docs/` returns only intended sites.
2. No file assigns the ledger, or any record-keeping technology, to a single mode.
3. `theory.md` and `rag/lineage/fiske-relational-models.md` agree with each other and with `FOUNDATIONS.md:39`.
4. Any surviving mode↔function statement passes failure mode #4 — it must not read as "these four functions belong together, one per mode."
5. Re-run the `668a167` residual check: no stale "canonical Balanced-mode artifact" phrasing anywhere.
