# Adversarial editorial notes — full pass

*A hostile read of the whole book: every chapter, both intermezzi, the preface, epilogue, appendix and Field Book, plus the assemble manifest. The posture is a smart, unsympathetic reviewer looking for the place to stop reading. Findings are ranked by what they cost, not by how easy they are to fix. Nothing here has been applied — these are notes.*

**Coverage.** Every file in `docs/book/` read, drafts included: all 25 chapter files, preface, epilogue, appendix, Field Book, README, weave plan, and `four-friends-and-the-rope.md`. Also the instance `assemble.py`, because the most consequential findings live in the gap between the files and what the build emits. Claims flagged as checkable below were checked against sources, not recalled.

---

## Status — all findings applied

Every item in A, B, C and D is fixed and verified **against the emitted `Content.md`, not against the source files** — which is the only check that means anything, given what section A is about. Build after: `front: 1 · parts: 9 · chapters: 28 · ~56,300 words` (up ~1,500).

Two forks were taken on the plan's recommendations, and either is cheap to reverse:

- **The barista is now a barista.** Ch 1 makes her a 23-year-old who pulls shots for a living, on her day off, paying for a coffee somebody else made. One sentence, and it sharpens the point — the person closest to the machinery is the one who sees least of it.
- **Ch 7's medium/store claim is rescoped to conversion cost.** The conflict is stated as biting *inside a single instrument*, dissolved by a cheap exit, with the bundle holding for centuries because conversion was slow and coming apart now because it is nearly free. Ch 21's just-in-time move now names Ch 7 as the promise it is keeping.

Three items in section E were deliberately **not** changed and remain judgment calls for the author: the superposition metaphor in Ch 15, Ch 20's "Draft insert" heading (the script handles it correctly), and Ch 8's Korea hedge (flagged so nobody tightens it). Section C3's concession was written into Ch 19; Ch 17's version of the same passage was judged already adequately hedged and got only the C6 fix.

Findings are kept below in full, as written, so the next pass can see what was claimed and check the fixes against it.

### The tic the fixes introduced, and its repair

Correcting for accuracy in one sitting gave the book a defensive tic. Six new concessions arrived with near-identical throat-clearing openers — *An objection belongs here immediately… One note before we go on… Be exact about the claim, though… One honesty before we read it… Two honesties before we move on* — and four of them used the same numeral-noun construction. Each was individually right; together they read as a manuscript that keeps stopping to pre-empt its critics, which is not this book's register.

The content stayed; the delivery was varied. Five openers were demoted into clauses or dropped so the substance leads. **One was kept deliberately** — *"One caution, and it is the kind this book should always add to a sentence that pleasing,"* at the cueva in Ch 13. It is the best-written of the six and it sits at the book's most politically exposed claim, where visible self-correction is doing real work. It is now the only explicit concession-framing in the manuscript. Do not delete it for consistency; the consistency was the problem.

### Part IV's asymmetry, and which way it got resolved

The hut tax left Ch 13 at ~1,510 words against siblings of 828–890. Two cuts were genuine — Ch 13's "authority can be wanted" passage was a near-verbatim restatement of Ch 3, which owns that argument, and the cueva caution overlapped the hut tax once both were on the page — bringing it to 1,222. The remaining gap was **not** closed by trimming further. Against an 80,000-word target and a manuscript at ~56,000, three chapters under 900 words was the better reading of the asymmetry: Ch 13 was the right size and its siblings were thin.

So each of the other three modes was given the thing Ch 13 has — **a second case that takes the mode past one anecdote.** Ch 11: Bohannan's Tiv spheres, where general-purpose money dissolves a society's deliberate tiers and the tell is moral disquiet, which is the bridesmaid's feeling at scale. Ch 12: the rotating savings club (tanda, chama, susu, committee, hui, gam'iya) — Balanced mode as functioning infrastructure for hundreds of millions, and the contrast that shows the pathology is not the mode but the mode *without an agreement*. Ch 14: Titmuss on blood, written with the empirical verdict stated against him, keeping only the claim that never depended on supply — pricing gets you a different thing, not less of the same thing.

Part IV now runs **1176 / 1244 / 1222 / 1239**, a spread of 68 words. Each new case was checked for prior use elsewhere in the book first; the ROSCA material is flagged in Ch 12 as owning the mechanism, with Ch 20 keeping the survey.

**One regression was found and reversed.** Ch 6's legal-foreclosure concession had been placed immediately after the Hayek anecdote, which killed the chapter's opening snap — the reader met *nobody used the private currencies* and was then held for three paragraphs of caveat before the cold-start mechanism existed. It now sits after "The math is brutal," where the reader can weigh it against the mechanism and it functions as a stress test rather than a hedge. **General rule: a concession placed before the argument it qualifies reads as anxiety; placed after, it reads as confidence.**

---

## A. Build-blocking — the book is what `assemble.py` emits

The unifying finding of this pass, and the one a reader-style read structurally cannot make: **the manuscript is not the book.** The build takes an explicit manifest and, for chapters that have a `## Draft`, emits only `lines[draft_idx + 1:]`. Anything not in the manifest, and anything above the strip line, is authoring apparatus that will never reach a page. Two live instances, by two different mechanisms:

**A1 — The preface will not appear in the book.** `assemble.py` builds from an explicit `STRUCTURE` manifest, not a glob, and `00-preface.md` is not in it. The file exists, is linked from the README, and is invisible to the build. Written this session, so it has never been through an assemble.

*Fix:* add a front-matter entry to `STRUCTURE`. One caveat to decide first: every entry emits a `# <Part title>` heading, so the preface would sit under a part heading of some kind. "Front matter" reads oddly on a page; consider whether the script should special-case a partless leading file. The nav line is already `is_nav`-compatible, so nothing else needs changing.

**A2 — The hut tax exists only as apparatus (Ch 13).** The weave plan's step 6 was recorded as done, and half of it is: Sen is in Ch 18's prose. The hut tax is not. Ch 13 received beat 4b and two subarc bullets — all of it above the `## Draft` line, all of it stripped at build. The chapter's shipped prose runs *The mode of rank → Penalties dressed as prices → The cueva's lesson → The defence*, with no hut tax anywhere in it.

*Fix:* write the prose beat, or correct `WEAVE-PLAN.md` to say step 6 is half-built. The apparatus is good and specific enough to draft from directly.

*Standing check for future passes:* after any edit intended to change the book, ask whether it landed below the strip line and inside the manifest. Beats, themes, twists and subarcs change what a **writer** does. Only draft prose changes what a **reader** gets.

*Checked and clean:* Ch 22's asymmetry guardrail — the P1 item the weave plan lists as done — **is** in the prose, not just beat 7b. "Who can see whom, and which of us is free to leave" appears in the draft. So subarc 10's arming is genuinely delivered in both Ch 22 and Ch 23.

---

## B. Factual errors — checked, not recalled

**B1 — Gresham's law is stated backwards (Ch 19).** The draft says Gresham holds "when both circulate freely," then presents the forced-currency case as *something other* than Gresham. That inverts the standard result. Gresham's law **requires** the legal-tender or fixed-rate compulsion — bad money drives out good precisely *because* the state forces acceptance at par. The free-choice case, where the good money wins, is **Thiers' law** (Selgin's coinage, after Adolphe Thiers), and Weimar is its stock example.

This matters more than its size. The phenomenon the chapter describes — good money becomes the savings vehicle, bad money becomes a hot potato — is *exactly* Thiers' law, which already has a name the chapter doesn't use. So the passage does the observation correctly and then attaches the wrong law to it, in the book's strongest chapter. A monetary economist stops reading here.

*Fix, and keep it minimal:* name Thiers' law for the phenomenon the chapter already describes correctly, and say that Gresham requires the fixed rate or legal-tender compulsion. That corrects the error without introducing a new synthesis that would then need its own defence — in the chapter that can least afford one.

**B2 — M-Pesa's effect is misstated, and it is in the prose (Ch 9).** The draft reads: "later studies estimated it lifted Kenyan GDP by around two per cent and pulled hundreds of thousands of households out of poverty." The Suri & Jack finding (*Science*, 2016) is that access to M-Pesa lifted **194,000 households — 2% of Kenyan households — out of poverty**. The sentence therefore states the real finding twice: once correctly as "hundreds of thousands of households," and once with the same 2% relabelled onto GDP, which no one found. Two further problems: the 2% figure is itself contested in the development literature, and the canon's own Tier 2 table already flags `Suri` as *citation unverified* — the book is currently more confident than the repo is.

*Fix:* keep the household finding, attribute it, delete the GDP clause. The transaction-cost argument does not need it.

**B2a — Ch 9's beats and prose disagree with each other.** The scaffold says Western Union takes "12% + bad rate"; the draft says "around eight per cent." The scaffold says the fee is "a working-week's wage"; the draft says "most of a day's wage." Only the draft ships, but a discrepancy this size between a chapter's own two layers suggests the numbers were never sourced.

**B3 — Smith's pins contradict between Ch 8 and Ch 22A.** Ch 8 has Smith right: "could make perhaps one pin in a day. Certainly not twenty… ten made upward of forty-eight thousand." Ch 22A says "one worker makes twenty pins a day." Same book, two numbers, and the second misquotes the source.

There's a smaller tension *inside* Ch 8 too: the same paragraph says "perhaps one pin in a day" and then "something like two hundred times more productive," which silently uses the ≤20 upper bound. Smith's own figure gives ~4,800×. The correct number is far better for the argument.

**B4 — Lydia (Ch 6).** "The first state to mint coins (around 600 BCE), did so to pay soldiers" is stated as settled. The purpose of Lydian electrum coinage is genuinely contested — state payments, mercenary pay, and standardisation for trade are all live. The chapter's argument survives a hedge; it does not need the flat claim.

**B5 — Lietaer (Ch 22A).** "A central banker who helped build the euro" is the standard shorthand and it overstates: he worked at the Belgian central bank on the ECU/convergence mechanism. Say that instead; it's more specific and equally impressive.

---

## C. Where a hostile expert attacks

**C1 — Hayek's failure is over-attributed to cold start (Ch 6, repeated in Ch 22A).** The book's opening anecdote treats non-adoption of private currency as pure demand-side evidence — nobody wanted to be first. The obvious rejoinder is never addressed: private currency issuance was **legally foreclosed** in every jurisdiction that mattered — legal tender rules, taxes denominated in the state unit, banking licences, later AML. A critic says the natural experiment was never run, so it cannot be "the clearest proof in the whole literature" (22A's phrasing raises the stake further).

*Fix:* concede the legal barrier in a clause and narrow the claim — the cold-start problem is why the *unregulated* attempts (local currencies, early crypto) also failed to reach escape velocity, which is the honest evidence base.

**C2 — The medium/store conflict is undercut by the book's own Ch 21.** Ch 7 argues the two "cannot be co-optimised in one instrument" because good-to-hold means hoarded means bad medium. Ch 21 then teaches **just-in-time conversion** — hold the store asset, convert at point of purchase — which is precisely the mechanism that dissolves the conflict when conversion is cheap. Doña Elena is the proof. So the book's own protagonist demonstrates that the Ch 7 impossibility is a *friction* claim wearing an *impossibility* claim's clothes.

*Fix:* scope Ch 7 to conversion-cost — the functions conflict *inside one instrument*, and the unbundled stack works because conversion got cheap. That's true, it's the book's actual thesis, and it makes Ch 21 the payoff instead of the counterexample.

**C3 — Andalusia reads monocausal (Chs 17 and 19).** "A rigidity just quietly empties a province over thirty years." Andalusian unemployment was high *before* the euro; the standard alternatives are labour-market dualism, the construction bubble and its bust, and educational composition. The weave plan's own care note says keep this a *consent* case, and the prose has drifted toward causation.

*Fix:* one concessive clause naming the other candidates and narrowing the claim to the adjustment *channel* — the shock had to land somewhere and the exchange rate was not available. That is defensible and doesn't need to win the causal argument.

**C4 — Metcalfe (Ch 6).** Stated as "value scales with the square," illustrated with pair counts (`n(n−1)/2`), and Metcalfe's law is itself contested (Odlyzko's `n log n`). The cold-start argument doesn't need the square — it needs "early value is near zero," which the pair count already delivers. Drop the law, keep the counting.

**C5 — "Inflating at times, collapsing never" (Ch 5).** A hostile reader immediately supplies the ~85–90% purchasing-power loss since 1971. The claim is defensible if "collapsing" means repudiation or hyperinflation, but the sentence doesn't say so and it's sitting inside the book's most load-bearing argument.

**C6 — "Came down and stayed down" (Ch 17)** sits against Ch 18's own acknowledgment of the early-2020s burst. Ch 18 handles it well; Ch 17 should not contradict it three chapters earlier. One clause.

**C7 — The arrangements table (Intermezzo 8A)** prices "No shared record" at 66h, which is the full autarky figure, while its own description says people "trade only when swaps are clean or trust is personal." If any trade happens, the cost is between 28 and 66. The table is explicitly non-literal ("do not worship the numbers") but a reader who checks will find the one row that doesn't match its own label.

**C8 — Comparative vs absolute advantage (8A).** The two-person Adam/Oz case is genuine Ricardo and is introduced as such. The four-person table then assigns each villager the good they are *absolutely* fastest at and is presented as the same lesson. It isn't. Either add a line acknowledging the switch, or rework one row so the four-person case still requires the comparative argument.

**C9 — The cueva passage is the book's most attackable political moment (Ch 13).** "By the only test that matters — consent and exit — the *illegal* exchange is the freer one." Two exposures: "the only test that matters" is stronger than the book's own two-axis framework licenses, and the cueva is freer *for someone holding dollars* — it is downstream of the capital controls, and the person without dollars has no access to it. This is the one passage where a reader who has been told repeatedly that the framework is non-partisan will conclude it leans libertarian.

*Fix:* keep the inversion, which is genuinely good, and add the distributional clause. "Freer for whoever can reach it" is both truer and more consistent with a book that is partisan on visibility and neutral on response.

---

## D. Continuity and arc integrity

**D1 — The Berlin barista is not a barista.** Ch 1 has her *buying* a €4.20 coffee — she is a customer. Every scaffolding reference, README subarc 5, and at least one prose draft (Ch 16: "the Berlin barista, tapping her card without a thought") calls her the barista. This is now in the prose, not just the apparatus.

*Fix:* pick one. Making her a barista in Ch 1 costs a sentence and buys a nice symmetry with Ch 23's coffee shop; renaming her "the Berlin customer" costs a global replace. Either is fine; the current state is a copyedit landmine spread across a dozen files.

**D2 — Off-by-one on two recurring-scene counts.** Ch 2's prose says the bridal party returns "twice more"; the arc is Chs 12, 15 and 22 — three more. And README subarc 3 says the €16 coffee has "three appearances (Chs 4, 11, 16)" while Ch 21's draft uses it a fourth time.

**D3 — The README claims Ch 6 concedes the goldbug's demand; it doesn't.** The concede-the-demand / refuse-the-label move is executed in **Ch 5**, in "The thing it never needed." Ch 6 concedes something different and also valuable — the goldbug's *intellectual lineage* ("not flat-earthers… Econ 101 literalists"). Subarc 10 is currently claiming a beat that lives one chapter earlier.

*Fix:* either correct the arc description, or give Ch 6 the governance concession it is being credited with. The second is better — Ch 6 is where the reader most wants to know whether the book is going to be fair to hard money.

**D4 — `four-friends-and-the-rope.md` is an orphan.** 255 lines, self-declared "a companion artifact, not a chapter," referenced by nothing in the book, and correctly excluded from `assemble.py` with a comment. No defect, but it sits in the chapter directory with no README line saying it exists. Add a "companion artifacts" note, or move it out.

---

## E. Judgment calls, flagged not asserted

- **The superposition metaphor (Ch 15).** The chapter pre-empts its own objection gracefully ("we will not push the metaphor past this sentence"), which mostly earns it. But it is the one place the book reaches for physics glamour, in a book whose central claim is that **folk physics** — value as cargo, pushed from behind — is the error being corrected. Borrowing quantum mechanics to explain modes cuts against that on a level the reader won't articulate but may feel.
- **Ch 20 is labelled "Draft insert" rather than "Draft."** Handled correctly by the assemble script (it recovers the title as a subhead), so this is not a bug — but it is the only chapter with that shape, and the next person to touch the script should know the special case is load-bearing.
- **Dating-app age pricing (Ch 11)** is real and litigated, but stated without attribution in a paragraph of otherwise-sourceable claims.
- **The Field Book's liveness claim.** Its honest-status section is scrupulous about the Tally being a proposal, then says the *Exchange Lens* "exists and is live" and describes a working Tally inside it — with no way for the reader to reach it. The book's own rule is to point at a public URL or not to mention it. Either give the reader the link or soften to "a prototype exists." A claim the reader cannot check is the one kind of sentence this section cannot afford, given that its whole job is to be the honest one.
- **Ch 8's Korea comparison** is hedged well ("something like twenty or thirty times") and the hedge should survive editing. Flagging it so nobody tightens it into a false precision.

---

## F. Working — do not "fix" these

Recorded because a later pass could easily mistake them for problems:

- **The rope arithmetic in 8A checks out**, all of it: the four-trade nets, the 18 gross marks, the clearing sequence, the 22 total, the final zero. Someone did this carefully.
- **The economist interlocutor in 8A** — the one who interrupts to ask *who weaves it, and who pays* — is the single best structural move in the book. It answers the bootstrap objection inside the fable instead of deferring it, and the rope-maker-as-first-platform answer is genuinely elegant.
- **Ch 20's symmetrical-error paragraph** ("stable-fiat users mistake convenience for truth; goldbugs mistake constraint for truth; both are still worshipping a bundle") is the most efficient paragraph in the manuscript.
- **Ch 5's three deckchair tests** are the book's persuasive core and they are doing real work — the Zimbabwe note's collector value in particular, which turns the push picture's best anchor into evidence against it.
- **Ch 23's single instruction** and its refusal of a call to arms. The restraint is the credibility.
