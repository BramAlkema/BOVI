# Do Freshman Money Chapters Re-Objectify Value?

## An adversarial corpus test

### The claim

This study tests:

> **Most major freshman economics textbook lineages teach money through an objectifying model of value, even when the same books teach subjective valuation elsewhere.**

“Objective” does not mean fact-based, quantitative, or politically neutral here. It means that value is presented as though it were:

- a property residing in a thing;
- a quantity money can measure;
- a substance money can contain through time; or
- something injected into money by backing, scarcity, or decree.

The rival model is relational or intersubjective: people value things; prices are public settlement ratios; and a monetary instrument works when people expect others to accept claims denominated in it. Gold, Bitcoin, and fiat can all be understood this way. Mining technology, protocol technology, and law are different governance and coordination technologies, not different metaphysical sources of value.

The study is not designed to show that economists deny subjective preferences. Most do not. It tests whether freshman pedagogy silently changes ontology when it reaches money.

---

## Claim ladder

| Level | Claim | Evidence needed | Status after pilot |
|---|---|---|---|
| 1. Lexical residue | Most texts use expressions such as “intrinsic value,” “store of value,” or “measure of value.” | Word and phrase counts with context. | Very plausible, but theoretically weak. |
| 2. Objectifying pedagogy | Most money chapters give students at least two unqualified object-like propositions about value. | Pre-registered proposition codes, full-chapter context, and a majority of independent textbook lineages. | Supported by the small pilot; not yet established for the target corpus. |
| 3. Ontological switch | Most books teach preference-dependent valuation in microeconomics but object-like value in the money chapter without explaining the transition. | Within-book comparison of the value/demand chapter and the money chapter. | Strongest and most interesting version; not yet fully coded. |
| 4. Coherent objective-value theory | Most authors consistently argue that value exists independently of valuers. | Book-wide philosophical consistency. | Probably false. The pilot already contains explicit acceptance, demand, and trust language. |

The primary target should be Levels 2 and 3. Level 1 is too easy to win; Level 4 overstates what the books say.

---

## Population and denominator

The phrase “most freshman textbooks” is too elastic to test. Freeze the target as:

> **The ten independent textbook lineages most often assigned in English-language US introductory economics courses during the study’s syllabus window, plus the two highest-reach open textbooks, using one current edition per lineage.**

Before reading the money chapters:

1. Freeze the syllabus source, query, date range, course labels, and ranking rule.
2. Select one current edition from each independent lineage.
3. Count adaptations and remixes only once. An OpenStax derivative is not a second independent observation.
4. Publish the inclusion and exclusion list.
5. Treat reform and heterodox books as a separate control stratum, not extra votes in the primary denominator.

Report two results:

- **lineage prevalence:** each textbook lineage counts once;
- **exposure prevalence:** weight each lineage by its share of observed syllabus assignments.

The first answers “most major texts?” The second answers the more important pedagogical question: “are most students exposed?”

### Material to code

For every included book, collect:

- the complete money chapter;
- its glossary, chapter summary, figures, captions, and assessment questions;
- the book’s first treatment of preferences, demand, willingness to pay, or consumer surplus;
- edition, publication year, stable page or section identifiers, and access provenance.

A slide deck can prove that a formulation is present. It cannot prove that the full chapter contains no correction.

---

## Primary objectification codebook

Code propositions, not isolated words. `●` means present, `◐` mixed or locally qualified, `○` absent, and `?` not verifiable from the material acquired.

| Code | Objectifying move | Count it when the text teaches… | Do not count it when… |
|---|---|---|---|
| `O1-L` | Intrinsic-value lexicon | a taxonomy of things with and without “intrinsic,” “inherent,” or “real” value. | This is a lexical flag only; it never decides the primary outcome by itself. |
| `O1-S` | Value substance | that a thing has value in itself or independently of users, uses, demand, or expectations. | “Value apart from use as money” is explicitly explained as demand for jewelry, food, industrial use, and so forth. |
| `O2` | Measurement collapse | that money, a unit of account, or a price measures **value** as such. | Money merely quotes, records, or compares prices or contractual amounts. |
| `O3` | Container metaphor | that value or wealth is held, stored, or preserved **inside** a note, coin, account, or asset. | The text says only that an asset transfers purchasing power through time. |
| `O4` | External value injection | that backing, government decree, legal-tender status, or generic “faith” gives money its value. | Law, taxation, convertibility, or backing is presented as one mechanism affecting demand, expectations, acceptance, or governance. |
| `O5` | Scarcity essentialism | that scarcity, non-reproducibility, a hard cap, or attachment to “something real” is inherently what makes money sound or valuable. | Supply rules are treated as one transparent governance variable among others. |

### Secondary narrative codes

These are important but do not determine the primary objectification result.

| Code | Narrative | Count it when… | Why it remains secondary |
|---|---|---|---|
| `N1` | Barter origin | barter → commodity → backed paper → fiat is taught as actual general history. | A false origin story does not by itself prove an objective ontology. A counterfactual barter model also does not establish a historical claim. |
| `N2` | Function bundling | medium, unit, store, and deferred payment are taught as the natural functions of one thing. | Bundling can be bad engineering without implying intrinsic value. |
| `N3` | Stock ontology | bank balances are taught as prior stuff that banks receive and then lend onward. | This is a separate curriculum-lag claim and should not inflate the value-ontology result. |

### Relational counter-codes

| Code | Relational move | Count it only when the text explicitly… |
|---|---|---|
| `R1` | Subjective valuation | locates valuation in persons, preferences, uses, or willingness to pay. |
| `R2` | Price–value distinction | says that price is an observable settlement term and is not identical to anyone’s value. |
| `R3` | Recursive acceptance | explains that I accept money because I expect others to accept or use it. “Generally accepted” by itself is not enough. |
| `R4` | Ledger or claim ontology | describes money as a record, IOU, asset–liability relation, or transferable claim. |
| `R5` | Anchor–source separation | distinguishes the law, commodity, protocol, or institutional anchor from the source of users’ valuation. |
| `R6` | Function separation | treats medium, unit, storage, and deferred contracts as separable tools or design problems. |

### Local qualification rule

Read the target proposition together with its paragraph and the adjacent paragraph on each side.

- If that window explicitly translates “intrinsic” into nonmonetary demand, `O1-L = ●` but `O1-S = ○`.
- If “store of value” is immediately defined as transferring purchasing power, `O3 = ○`.
- If legal tender or taxes are explained through expected acceptance, `O4 = ◐` or `○`, depending on the causal wording.
- A correction elsewhere in the chapter is recorded under `R1–R6`. It does not erase a contradictory objectifying proposition; it makes the chapter ontologically mixed.

This prevents both easy attacks: counting every use of “value” as metaphysics, and allowing one relational sentence to sanitize an entire objectifying chapter.

---

## Decision rule

A textbook money chapter meets the primary **objectifying-pedagogy** criterion when:

1. it contains at least two direct codes among `O1-S`, `O2`, `O3`, `O4`, and `O5`; and
2. those codes survive the local qualification rule.

`O1-L`, `N1`, `N2`, and `N3` cannot produce a positive result on their own.

Also report, without changing the rule after coding:

- **loose:** at least one direct `O` code;
- **primary:** at least two direct `O` codes;
- **strong consistency:** at least two direct `O` codes and no `R2–R5` correction anywhere in the chapter.

The corpus claim succeeds if more than half of the frozen independent lineages meet the pre-registered primary rule. If the corpus is a census of the defined top titles, report the finite-corpus fraction directly. Use confidence intervals only for a stated generalization beyond that corpus.

---

## Pilot adversarial comparison

This is a codebook stress test, not the final sample. The books were selected purposively, several are not current, and some current commercial chapters are available only through mirrors or teaching slides.

| Text and evidence | `O1-L` | `O1-S` | `O2` | `O3` | `O4` | `O5` | Relational counterevidence | Primary result |
|---|:---:|:---:|:---:|:---:|:---:|:---:|---|---|
| Mateer, Coppock & O’Roark, *Essentials of Economics* 3e, [official Ch. 17](https://nerd.wwnorton.com/ebooks/epub/essentialecon3/EPUB/content/3.6.1-chapter17.xhtml) | ● | ○ | ● | ● | ● | ● | Defines money by general acceptance and notes that people want goods, not money. It nevertheless attributes fiat’s value to mandate, describes backing as “something real,” and treats money as a measuring stick and wealth container. | **Yes—strong.** |
| OpenStax, *Principles of Economics* 3e, [§27.1](https://openstax.org/books/principles-economics-3e/pages/27-1-defining-money-by-its-functions) | ● | ○ | ● | ● | ◐ | ○ | Says buyers and sellers must widely accept money and that commodity value comes from other uses. Yet it calls the unit a ruler for values and says holding money stores value. Fiat is framed through decree plus undifferentiated faith and trust. | **Yes.** |
| Mankiw, *Principles of Economics* 10e, [current chapter teaching slides](https://studylib.net/doc/27812880/interactive-ch-30-the-monetary-system-10e-edited) | ● | ○ | ● | ○ | ● | ○ | Store is carefully defined as transfer of purchasing power. “Intrinsic” can mean nonmonetary demand rather than value independent of valuers. No recursive-acceptance correction appears in the acquired slides; the full chapter must still be checked. | **Provisional yes.** Presence verified; absence of correction is not. |
| Rittenberg & Tregarthen, *Economics: Principles* v2.0, [Ch. 24](https://2012books.lardbucket.org/books/economics-principles-v2.0/s27-the-nature-and-creation-of-mon.html) | ● | ○ | ● | ● | ◐ | ○ | Explicitly says money is defined by what people do and ultimately works through acceptability, not intrinsic value or decree; the Swiss dinar is a strong counterexample. The same section nevertheless says money measures value and value is stored in paper. | **Yes, but self-contradicting.** |
| Case, Fair & Oster, *Principles of Macroeconomics* 13e, [accessible full-text copy](https://studylib.net/doc/27014386/principles-of-macroeconomics-213) | ● | ○ | ○ | ○ | ● | ○ | Defines the unit as a way to quote prices and the store as transport of purchasing power. Its commodity example makes value demand-dependent, defeating a strong intrinsic-value reading. The fiat discussion still leans on legal tender and taxes as the answer. | **No under primary rule; mixed under loose rule.** |
| CORE Econ, *The Economy* 1.0, [Unit 10](https://books.core-econ.org/the-economy-v1/book/text/10.html) | ○ | ○ | ○ | ○ | ○ | ○ | Defines acceptance recursively—others take it because they can use it—and uses the Irish bank closure to teach trust, circulating claims, and bank-created deposits. | **No—relational counterexample.** |

### Strongest prosecution and strongest defence

| Text | Strongest evidence for objectifying pedagogy | Strongest defence of the text |
|---|---|---|
| *Essentials* | In one teaching sequence, commodity backing connects money to the “real,” fiat gets value from government mandate, money measures relative values, and store-of-value means holding wealth. | The opening definition is acceptance-based, and “value apart from money” can mean ordinary nonmonetary demand. |
| OpenStax | The unit of account is explicitly a ruler for values and holding money is explicitly described as storing value. These are direct, student-facing propositions, not inferred philosophy. | The chapter also stresses widespread acceptance and identifies practical uses of gold. Its barter section is framed partly as a counterfactual. |
| Mankiw | The summary says the unit supplies a measure for economic values, while fiat is used because of decree. The formulations occur in compressed recap material students are expected to retain. | The store function is framed as purchasing-power transfer, and the “intrinsic” distinction can be read as monetary versus nonmonetary demand. Full-chapter counterevidence has not yet been acquired. |
| Rittenberg–Tregarthen | It uses the clearest container sentence in the pilot and defines the unit as measuring value. | It later rejects intrinsic value and decree as the basis of money and makes acceptability decisive. This is evidence for an ontological switch, not a coherent objective theory. |
| Case–Fair–Oster | Fiat’s apparently puzzling value is resolved primarily through government acceptance, legal tender, and tax payment. | Its unit and store definitions avoid measurement and container collapse, while its micro treatment makes willingness to pay person-dependent. A hostile coder should not label the whole chapter objective. |
| CORE | Very little: it still calls money a medium and speaks of purchasing power, but those are not sufficient under this codebook. | Recursive expectations, trust, claims, balance sheets, and endogenous deposit creation organize the chapter. It is a genuine counterexample. |

---

## Pilot result and sensitivity

Among the five independent lineages for which a complete money chapter was inspectable, three meet the primary rule:

- Mateer–Coppock–O’Roark;
- OpenStax;
- Rittenberg–Tregarthen.

Case–Fair–Oster and CORE do not. That is **3/5**.

Adding the current Mankiw teaching material gives a provisional **4/6**, but the missing full-chapter correction check means it should not be treated as a completed observation.

| Rule | Completed pilot result | Interpretation |
|---|---:|---|
| Any `O1-L` lexical residue | 4/5 | Easy to demonstrate, easy to dismiss. |
| At least one direct `O` code | 4/5 | Shows broad objectifying language, but one loose proposition may be accidental. |
| At least two direct `O` codes | 3/5 | Pilot majority under the proposed primary rule. The rule must be frozen before the confirmatory corpus is coded. |
| At least two direct codes and no chapter-level relational correction | 2/5 | Does **not** support the claim that most books have a coherent objective ontology. |

The pilot therefore supports a precise thesis:

> **The recurring problem is not that every textbook consistently believes value is objective. It is that money chapters repeatedly make objectifying claims and then coexist with, or revert from, subjective and relational explanations without marking the change.**

That unmarked switch is pedagogically more consequential than an explicit philosophical error. Students can repeat that preferences are subjective while still imagining that market prices reveal objective value and that money stores, measures, or receives that value.

---

## The within-book test: catching the ontological switch

For each textbook, add a second comparison row:

| Microeconomics proposition | Money-chapter proposition | Bridge supplied? | Switch? |
|---|---|---|---|
| “Different people have different willingness to pay.” | “Money measures the value of goods.” | Does the text explain that a price is a public settlement ratio produced from heterogeneous bids, not the value of the good? | Yes if no bridge. |
| “Demand changes with preferences.” | “Commodity money has intrinsic value.” | Does the text translate “intrinsic” into contingent nonmonetary demand? | Yes if no bridge. |
| “Consumer surplus exists because value to a buyer can exceed price.” | “Money stores value.” | Does the text say what is carried through time—purchasing power, a claim, expected resale, or value itself? | Yes if no bridge. |
| “Institutions shape incentives and exchange.” | “Fiat has value because government decrees it.” | Does the text explain law as a coordination and demand technology rather than a value source? | Yes if no bridge. |

This makes the test adversarial in the proper sense: every book supplies its own control. We do not impose an exotic theory from outside; we ask whether its money chapter remains compatible with its own account of preferences and demand.

---

## What would falsify or materially weaken the claim?

The study must count against itself if:

- six or more of the frozen ten lineages fail the primary rule;
- the result disappears when `O1-L` is excluded;
- “store of value” is usually defined as purchasing-power transfer rather than a container;
- “intrinsic value” is usually and locally defined as contingent nonmonetary demand;
- most books explicitly distinguish price from value;
- most chapters explain law, tax, backing, protocol, or commodity use through recursive acceptance rather than value injection;
- blinded coders cannot reliably distinguish objectifying from relational propositions;
- adaptations from one source lineage created the apparent majority;
- the unweighted result is positive but adoption-weighted exposure is not;
- the same-book micro comparison usually supplies an explicit bridge.

No post-hoc redefinition of “objective” is allowed to rescue a failed result.

---

## Execution protocol

1. **Freeze the corpus.** Obtain syllabus-ranked titles and current editions before coding.
2. **Freeze this codebook.** Revise it only on texts excluded from the final corpus.
3. **Acquire full chapters.** Mark inaccessible books missing; do not infer absence from slides or previews.
4. **Extract proposition windows.** Include the paragraph and adjacent context, source location, and pedagogical location: body, figure, glossary, summary, or assessment.
5. **Blind the extracts.** Remove author, publisher, and hypothesis-facing labels; randomize order.
6. **Double-code independently.** Use two coders and report agreement for each code. Adjudicate only after both submit.
7. **Run the same-book control.** Code the book’s preferences/willingness-to-pay treatment and whether it bridges to money.
8. **Publish the raw matrix.** Readers should be able to recompute loose, primary, and strong-consistency results.
9. **Report both denominators.** Independent lineages and assignment-weighted student exposure.
10. **Keep other curriculum errors separate.** Barter history, function bundling, and the money multiplier may explain the pedagogy, but they do not get smuggled into the primary ontology score.

---

## Corpus still to acquire

The final sample should not be chosen from this list by convenience. It should be generated by the frozen syllabus ranking. The following obvious lineages remain acquisition candidates:

- Krugman & Wells, current *Macroeconomics*;
- Hubbard & O’Brien, current *Economics*;
- McConnell, Brue & Flynn, current *Economics*;
- Acemoglu, Laibson & List, current *Economics*;
- Samuelson/Nordhaus as a separate longitudinal series, not a current-edition vote.

Keep CORE Econ 2.0 and *Principles of Economics: Scarcity and Social Provisioning* as reform controls. Keep the Samuelson editions as a historical transmission arm. Neither should be used to manipulate the current-majority denominator.

---

## Bottom line

The pilot does not yet prove that most freshman texts are objective. It does show that the proposition is empirically live and that a non-trivial majority appears under a strict rule even after granting each book its strongest defence.

The likely publishable finding is sharper than “economics believes in objective value”:

> **Freshman economics teaches subjective valuation, then frequently re-objectifies value when it teaches money. The contradiction is carried by its metaphors, definitions, summaries, and origin stories rather than by an explicit philosophical argument.**

That is the hypothesis the full corpus should now be allowed to defeat.
