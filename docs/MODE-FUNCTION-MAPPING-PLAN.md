# Plan — resolving the mode↔monetary-function mapping

**Status: EXECUTED** in commit `e9326b9`. All eight steps landed; the verification below passed. Retained as the record of why the change was made and which sources were and were not read. Written after the tally-rope ruling (commit `668a167`), which fixed at the root the symptoms this document addresses.

Remaining open, by design: the naming collision (below), and whether any true mode↔instrument correspondence exists — the plan removed a false one without asserting a replacement.

**Update, same day, both gates resolved.** (1) The candidate correspondence was staked as `SCALE-LADDER.md` with pre-registered kill conditions and **killed** by its adversarial specimen pass — K1 fired three times (exchequer tallies, wergild, Nuer bridewealth), K2 on kula, K3 worse than specified; the open question above is closed **in the negative** (no scale law; portfolios and singularization, as the anthropology already said). The file stands as post-mortem. (2) Source retrieval: **Melitz 1970 obtained in full** (MPRA author deposit) — the "reinforces separability while destroying the dichotomy" reading is supported, recorded with the qualification that it is our inference from his affirmations, not his self-description; Goldberg 2005, Polanyi 1957/1968 and Dalton 1965 are exhausted on open routes and moved to the library-pull list — joined, after the argument run-through, by **Fiske & Tetlock 1997 and McGraw & Tetlock 2005** (cited as Quirk 15's mechanism at abstract level; the 1997 experiments' strongest results concern sacred trade-offs, the mundane-scale application is the framework's extrapolation — pull both before the book leans on them). The "hoarding subordinate" gloss on Polanyi's uses was unverified and has been dropped from `special-purpose-money.md`. The naming collision was settled in the consolidation pass (settlement rope / knights' peg-rail).

**Decision in one line:** retire the mode↔monetary-function mapping, which is uncredited and contradicted by Fiske, and reground the unbundling claim on Jevons's own separability passage plus the Polanyi–Dalton–Kuroda literature.

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

## What the literature says (research completed)

**The mapping is the project's own invention, and Fiske contradicts it.** [WELL-SOURCED]

- Fiske, on his own UCLA relational-models page: *"Market Pricing (MP) relationships are oriented to socially meaningful ratios or rates such as prices, wages, interest, rents, tithes, or cost-benefit analyses.* **Money need not be the medium***."* MP is defined by proportionality — the ratio scale — not by money. His MP examples include cost-effectiveness standards, equity-in-proportion-to-contribution and spending time efficiently.
- **The structural objection is decisive.** Fiske partitions *kinds of relationship*; the four functions partition *uses of one instrument*. These are orthogonal cuts, so a 1:1 assignment is not a refinement of Fiske — it is a different taxonomy wearing his labels.
- Fiske already places prescribed transfers *inside* AR and EM ("offerings of filial piety," "restitution in kind"), which is precisely why he gives MP no monopoly on money.
- **No published source makes this mapping.** Searched across Zelizer, Dodd, Ingham, Hart, Maurer, Haslam's RMT overview, and recent RMT literature. [NOT FOUND]

**Jevons asserted separability himself, in the founding text of the four-function list.** [WELL-SOURCED — this is the most important finding]

*Money and the Mechanism of Exchange* (1875), ch. III: *"We might certainly employ one substance as a medium of exchange, a second as a measure of value, a third as a standard of value, and a fourth as a store of value."* With historical cases: Elizabethan silver as common measure, gold for large payments, and corn required by statute (18 Eliz. c. VI, 1576) as the standard of value for college leases.

The framework's unbundling thesis therefore does not need heterodox licensing. It is a **recovery of what the list's own author said**, eighty years before Polanyi — which is a far stronger position than arguing against the list.

**Polanyi/Dalton separability is uncontested.** [WELL-SOURCED] Polanyi's money-uses (payment, standard, exchange, with hoarding subordinate) were *separately institutionalised*, so different objects carried different uses in the same society and all-purpose money is the unusual case. Dalton's special- vs general-purpose vocabulary (1965) systematised it; Bohannan's Tiv spheres are the ethnographic exhibit. Crucially, **Melitz's 1970 attack reinforces separability rather than refuting it** — his argument is that modern money is special-purpose too. What was abandoned is the evolutionary story, the primitive/modern dichotomy, and strong sphere-boundedness (Guyer 2004 on the Tiv; Akin & Robbins 1999 on Melanesians building *new* spheres to channel general-purpose money). The successor without evolutionary baggage is Kuroda (2008) on concurrent complementary monies: "One money could do what another money could not."

**Two further findings with direct consequences:**

- **An equivocation is doing hidden work.** `theory.md` gives AR "required payment medium." That is *Polanyi's payment use* — bridewealth, wergeld, fines, tribute, tax, an amount prescribed by rank or occasion. The textbook fourth function is *Jevons's standard of deferred payment* — a unit for denominating future contracts. Fusing the two is where much of the table's apparent tidiness comes from. Separated, AR maps cleanly onto Polanyi's payment use, and **Grierson (1977)** — who derives the money of account from wergeld tariffs — is the citation for it.
- **Quirk 15 has a pedigree the repo does not claim.** Fiske & Tetlock, "Taboo Trade-offs" (*Political Psychology* 1997) and McGraw & Tetlock (2005) are the real Fiske-meets-money literature: applying MP norms to CS/AR/EM relationships produces moral outrage and "constitutive incommensurability." That is the framework's mode-collision claim, and specifically Quirk 15 (Splitwise corrupting Immediate mode), with an established citation behind it.

**One internal contradiction to resolve while here.** `theory.md`'s table says the $20 *is* MP's medium of exchange; `rag/core/money-as-bundle.md` says the same $20 *simultaneously serves* all four modes. Both cannot stand.

## Decision — retire and reground

**Retire the 1:1 mapping (option 1) and reground the claim on sourced material (option 3). Do not adopt option 2.** Reinterpreting the table as a bundling explanation was the provisional recommendation; it falls because the table's coherence depends on the AR equivocation above, and because Fiske cannot carry a function mapping in principle. The bundling *argument* survives and is worth keeping — but as prose grounded in Jevons and Polanyi, not as a 4×4 table presented as Fiske's.

The replacement rests on three pillars, in descending order of strength:

1. **Jevons 1875** — separability asserted by the author of the list. Makes unbundling a recovery, not a heresy.
2. **Polanyi / Dalton / Kuroda** — different objects carried different uses in the same society; concurrent monies are the historical norm. The Rai case is a worked instance: rai carried prescribed O-mode obligations while pearl-shells carried V-mode small change.
3. **Fiske & Tetlock / Zelizer** — the genuine relationship↔money literature, supporting mode collision and earmarking rather than a function mapping.

**Honest positioning, to be stated in the docs:** Fiske supplies the relationship typology; Polanyi, Dalton and Kuroda supply the instrument typology; **the correspondence between them is the framework's own contribution.** That is defensible and citable. Claiming the mapping is *in* Fiske is not, and the repo currently implies it by placing the table under his name.

## Execution

1. **`theory.md` §"BOVI Mapping to Monetary Functions"** — drop the Monetary Function column. Keep the Fiske Model ↔ BOVI Mode correspondence, which is the defensible part, and retitle the section accordingly. Replace the function column with Fiske's scale types (Footing A), which is what the rest of the canon already uses. Fold the existing correction note in rather than stacking a second one.
2. **`rag/lineage/fiske-relational-models.md:51–56`** — same change; it is the RAG mirror and must not diverge again. Add the "Money need not be the medium" quotation, since this doc's job is to represent Fiske accurately and it currently does the opposite.
3. **`twenty-dollar-revelation.md:25`** — change the gloss "Equality Matching — the ledger function" to name the discipline, not a function. Leave the teaching scenario untouched; it is correct.
4. **State Footing A once, canonically**, with its Fiske citation, and have the other sites reference rather than restate it. Divergent restatement is what produced this.
5. **Add `docs/rag/lineage/special-purpose-money.md`** on the lineage-doc pattern: Jevons's separability passage and the 1576 corn statute, Polanyi's money-uses, Dalton's special-vs-general vocabulary, Bohannan's spheres, the Melitz correction, Guyer and Akin & Robbins on what was abandoned, Kuroda on concurrent monies. Cross-link from `core/unbundling-thesis.md`, `architecture/four-functions.md` and `cases/rai-stones-yap.md`.
6. **Resolve the $20 contradiction** — reconcile `money-as-bundle.md` with whatever survives in `theory.md`. With the function column gone, the bundle claim stands unopposed, but check the wording.
7. **Credit Quirk 15 properly** — add Fiske & Tetlock (1997) and McGraw & Tetlock (2005) to `CANON.md` Quirk 15 and to `rag/architecture/mode-collision.md`. This is free pedigree for a claim the framework currently presents as its own.
8. **Add the Jevons passage to `architecture/four-functions.md`** — that doc argues the list is a bundling artefact, and the strongest evidence is that its author said the functions were separable. It belongs there.

Items 7 and 8 are independent of the rest and can land first; they are pure additions with no risk.

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
6. No document implies the mode↔function mapping is Fiske's. Where a correspondence is asserted, it is labelled as the framework's own contribution.
7. Sources actually obtained are marked as such. Of the material above, Fiske's relational-models page and the Jevons chapter were read directly; **Fiske 1991 and 1992, Dalton 1965, Polanyi 1957 and Melitz 1970 were not** — reached through secondaries only. Anything quoted from them must be verified against the original before it enters a canon doc, per the `FUTURE-OBLIGATIONS-LINEAGE.md` ✅/⚠️ convention.

## Open items not resolved here

- **The naming collision** (below) is a separate, low-priority fix.
- **`theory.md`'s remaining EM row** maps Balanced to "unit of account, store of value" in the *Monetary Function* column being retired; if any function language survives elsewhere in that table, it needs the same scrutiny.
- **Whether the four modes need any instrument-side correspondence at all** is left open. The plan removes a false one; it does not assert that a true one exists. The Rai case suggests correspondences are discoverable empirically, case by case, which may be the honest ceiling.
