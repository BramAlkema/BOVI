# The Cast — contracts named after their popularisers

Each implemented contract carries the name of the thinker whose mechanism it attempts to execute. The suite *is* the lineage, instantiated—but the audit also found that not every name deserves independent state. Some ideas are views, extensions, or factories around another room. Read top-to-bottom and you get the intellectual history of money as a buildable cascade, resting stone by stone on `docs/FOUNDATIONS.md`.

**We join a conversation, we do not found one.** A literature scan (June 2026) confirmed every part of the framework is borrowed and well-homed; the cast below is the honour roll. Where a thinker gives an *executable mechanism* they get a contract or protocol blueprint; where they give the *value theory or the anthropology* they are honoured as a **patron-spirit** (see Notes), because you cannot instantiate a premise. The near-programmable cards, including state, calls, transitions, invariants, and trust boundaries, live in [`docs/book/appendix-executable-canon.md`](../docs/book/appendix-executable-canon.md).

| Contract | Populariser | Executes | Status |
|---|---|---|---|
| `Kocherlakota` | Narayana Kocherlakota | *Money Is Memory* (1998) — the ledger IS the money | **written** |
| `MitchellInnes` | Alfred Mitchell-Innes | *What is Money?* (1913) / *The Credit Theory of Money* (1914) — money **is** credit; claim and obligation are the two views of Kocherlakota's signed position | **view — no separate state** |
| `Mehrling` | Perry Mehrling | the *money view* — all banking is a swap of IOUs; the hierarchy of money. The closest fellow-traveller **educator**; proof a relational/ledger view of money *can* be taught at scale | protocol blueprint |
| (Gesell overlay, inside `Kocherlakota`) | Silvio Gesell | Freigeld / demurrage (1916) — a good medium is a bad store (Stone 6, the melt) | **written** |
| `Schumpeter` | Joseph Schumpeter | *Theorie der wirtschaftlichen Entwicklung* (1911) — a priced, purpose-scored loan; current implementation is first acceptable funder, not yet a lender auction | **written** |
| `Hayek` | Friedrich Hayek | *Denationalisation of Money* (1976) — competing index providers, aimed at the *unit* rather than competing settlement currencies | **written** |
| `Fisher` | Irving Fisher | index numbers + indexation; protect contracts from the money illusion / debt-deflation | **written** |
| `Zelizer` | Viviana Zelizer | *The Social Meaning of Money* — earmarking / "special monies"; money carries relational meaning (the modes, on money) | protocol blueprint |
| `Lietaer` | Bernard Lietaer | complementary currencies + demurrage — a factory composing governed community ledgers; **bridges are an invariant, not a feature** — unbridged, a community ledger is company scrip (`Fishback`). Each community also declares whether its claims are member positions or transferable bearer instruments (the WIR/Wörgl variable) | factory blueprint |
| `Baumol` | William Baumol | the transactions sweep — never leave wealth idle | protocol blueprint |
| `Bagehot` | Walter Bagehot | *Lombard Street* — lend freely, at a penalty rate, against good collateral | protocol blueprint |
| `Galbraith` | J.K. Galbraith | *countervailing power* — concentrate the buyers (the demand union) | protocol blueprint |
| `Greif` | Avner Greif | reputation institutions that let strangers trade — the enforcement teeth (Stone 4's *credit-form residual*: no floor, pay with teeth) | **written** |
| `Keynes` | J.M. Keynes | Bancor / the International Clearing Union — inter-community settlement (rope-of-ropes) | protocol blueprint |
| `Friedman` | Milton Friedman | rules over discretion — governance of the dials (the DialDAO) | **written** |
| `Cantillon` | Richard Cantillon | the Cantillon effect — who gets new money first (the MONETARY skim X-ray; the known-supply *gap*, Stone 4) | protocol blueprint |
| `Stigler` | George Stigler | *The Economics of Information* — the PDA price-discovery checker (the MARKET skim X-ray; the known-*terms* gap) | **written** |
| `Fiske` | Alan Fiske | Relational Models Theory — the four modes as a permission layer (the soul's manners: the gate + the disguise X-ray) | **written** |
| `Bohannan` | Paul Bohannan | spheres of exchange — cross-sphere conversion as *moral violation*; a policy extension to `Fiske`, not another currency | Fiske-extension blueprint |
| `Minsky` | Hyman Minsky | the financial-instability hypothesis — the exposure graph and default waterfall, named after its own prophet as a warning | protocol blueprint |
| `KiyotakiWright` | Kiyotaki & Wright | acceptance feedback in a three-score threshold demonstrator; it is inspired by monetary emergence but does not implement their agent-matching economy | **written** |
| `Brunnermeier` | Markus Brunnermeier | *The Digitalization of Money* — the unbundling router / cross-DCA interop | protocol blueprint |
| `ChallengeBond` | *(crypto-native)* | optimistic fraud-proof + bonding — turns detection into enforcement | **written** |
| `Krugman` | Paul Krugman | the countercyclical stabiliser — the babysitting-co-op fix; rule-bound elasticity (steady *activity*, not the currency's value) | **written** |

## The six stones, cast

So the cascade visibly rests on `FOUNDATIONS.md` — which thinker carries which stone:

- **Stone 1 — the pull** (money pulled by the need for a memory of who-gave-and-didn't-receive): the patron-spirits, no single room — *Menger, Simmel, Graeber*.
- **Stone 2 — the ledger / credit**: `Kocherlakota` (memory) + `MitchellInnes` (credit) + `Mehrling` (balance-sheet hierarchy); `KiyotakiWright` as a toy threshold demonstration of acceptance feedback.
- **Stone 3 — floorless-but-fruitful value**: patron-spirits *Simmel + Patinkin* (premise, not a room); the `KiyotakiWright` guard holds the selection-vs-worth line.
- **Stone 4 — the axioms** (resolution + integrity; the skims live in the sufficiency-gaps): `Cantillon` (known-supply gap), `Stigler` (known-terms gap), `Greif` (the enforcement residual), `Hayek` (the unit/known-ness).
- **Stone 5 — the bolt-ons / unbundling**: `Brunnermeier`, `Lietaer`, `Baumol`, `Fisher` (store/unit/stability sent off the rail to their own tools).
- **Stone 6 — the melt** (medium ≠ store): Gesell overlay, `Lietaer`, `Krugman`, `Fisher`.
- **The institutional layer** (extraction is selected by a power contest): `Galbraith`, `Friedman`, `Minsky`, `Keynes`, and the modes — `Fiske` + `Bohannan` + `Zelizer`.

## Tier 2 — extensions (demonstrations of reach)

The cast above is the building. These are **not stones**: the framework's sufficiency argument does not rest on any of them, and removing the whole tier leaves `FOUNDATIONS.md` untouched. They exist to answer one objection — *this is isolated stuff* — by showing the architecture explaining outcomes outside itself.

**Admission rule.** An entry must show a **monetary parameter driving a non-monetary outcome**, via a published result, isolable to one mechanism. Three of the four most obvious candidates fail it (see the rejects below); a rule that admits everything we like is a preference, not a rule.

Precedent for the tier's *shape*: `Fiske` is already a boundary contract — it describes no ledger machinery, it guards where the record may not go, on the social side. Tier 2 guards the other edge: what the record's parameters do to things that are not records.

| Contract | Populariser | Monetary parameter → non-monetary outcome | Interacts with | Status |
|---|---|---|---|---|
| `Clark` | Colin W. Clark (JPE 1973) | δ > 2r ⇒ liquidating a regenerating stock is profit-maximising, *even for a secure sole owner* | `Kocherlakota` (the Gesell overlay feeds δ and pushes *away* from the threshold), `Friedman` (the dial), `Hayek` (the rod δ is quoted against) | **written** |
| `Mundell` | Robert Mundell (AER 1961) | one unit of account across divergent regions ⇒ asymmetric shocks absorbed by unemployment and emigration, not the exchange rate | `Hayek` (Mundell is the *geography* of the unit, Hayek its competition), `Krugman` (the absorber an area must supply instead), `Keynes` (Bancor as the inter-area settlement this asks for) | blueprint |
| `Forstater` | Forstater (2005); Bundy (1979) | a tax obligation denominated in a currency obtainable only by selling labour ⇒ forced proletarianisation, the migrant-labour system, rural social structure | `Kocherlakota` (Stones 1–2 at regional scale: demand comes from an obligation to clear, not from substance), `Fiske` (an Obligated-mode demand imposed across a boundary), `Greif` (teeth supplied by a state, not a coalition) | blueprint |
| `Sen` | Amartya Sen (*Poverty and Famines*, 1981) | collapse of exchange entitlements at *unchanged* aggregate supply ⇒ famine | the micro-over-aggregate position, whole; `Stigler` (known-terms gap), `Cantillon` (who holds claims first) | blueprint |
| `Suri` | Suri & Jack (*Science* 2016) | ledger reach and transaction cost ⇒ poverty exit and occupational shift (M-PESA) | `KiyotakiWright` (ledger-likeness as a transaction-cost input — and its guard), `Kocherlakota` | blueprint — *citation unverified* |
| `Bernanke` | Bernanke (AER 1983) | destruction of the credit record ⇒ real intermediation cost, output collapse | `Kocherlakota` (the record *is* the money — here it is destroyed), `Greif` (reputation as capital), `Minsky` | blueprint |
| `Eichengreen` | Eichengreen & Sachs (JEH 1985) | anchor rigidity ⇒ recovery timing off gold | `Hayek` (the three-axis anchor grading), `Krugman` (discretion as shock absorber), `Friedman` (rules vs discretion) | blueprint |
| `ChodorowReich` | Chodorow-Reich et al. (QJE 2020) | 86% of currency withdrawn overnight ⇒ employment and real activity | `Kocherlakota` (medium vs record), `Krugman` | blueprint — *citation unverified* |
| `Fishback` | company scrip / truck systems | money that clears against one counterparty only ⇒ immobility, debt peonage | `Fiske` + `Bohannan` (sphere restriction as coercion), `Lietaer` (the bridges, deliberately absent), the extraction thesis | blueprint — *citation unverified* |
**Rejected, on the rule — the exclusions are the load-bearing part:**

- **Radford**, *The Economic Organisation of a P.O.W. Camp* (*Economica* 1945). Tier 1 **evidence** for emergence — it belongs next to `KiyotakiWright`, not here. It is not a monetary parameter driving a non-monetary outcome. Out of *this* tier, not out of the canon.
- **Cagan** (1956), hyperinflation money demand. The outcome is money demand — still monetary. Readmit only if anchored to a real consequence: barter re-emergence, or the collapse of long contracts.
- **Austerity and mortality** (Stuckler & Basu). Fiscal, not monetary; identification contested. Out.
- **Exchange rates and deforestation.** Real depreciation → export agriculture → forest clearing. Tempting because it flatters an audience we would like to reach, which is precisely why it stays out until there is a citation worth defending. A lead, not an entry.
- **Nordhaus / DICE.** An integrated assessment model, not an isolable mechanism. Out on the same grounds `KiyotakiWright` refuses to implement a search economy.

## Notes

- **Patron-spirits — honoured by the whole building, not a single room.** A premise cannot be instantiated, so the framework's deepest debts are named here rather than coded:
  - *value theory* — **Menger** (subjective/marginal value, the building completes it), **Simmel** (value as relation / distance-overcome), **Patinkin** (marginal utility of holding real balances);
  - *substantivist anthropology* — **Graeber** (debt / credit-first, the barter myth demolished), **Polanyi** (forms of integration), **Mauss** (the gift), **Sahlins** (kinship distance);
  - *the relational nature of money, made popular* — **Ingham** (*The Nature of Money*) and **Felix Martin** (*Money: The Unauthorised Biography*) — money as a social technology of transferable credit.
- **There is no `Mises` contract — on purpose.** His distinctive idea (the commodity anchor, the regression theorem) is the one thing the framework deliberately does *not* build. The named absence is the most precise statement of the project: the great subjectivist whose one flinch we refused to instantiate.
- **`Minsky` is the memento-mori.** The most fragile contract (the risk pool / default waterfall) carries the name of the man who explained why such things detonate — a permanent warning label on the layer that needs it most.
- **Two horizontal primitives** every "clever" fix depends on, so build them early: `ChallengeBond` (enforcement teeth) and a ZK-credential module (teeth without surveillance).
- **Two irreducible hard residuals** the cast can de-fang but not dissolve: the inter-community reserve floor (`Keynes`, between truly trustless parties) and decentralized Sybil-resistance (under `Greif`).
- **Every bend relocates a judgement, it does not remove it.** [`docs/JUDGEMENT-REGISTER.md`](../docs/JUDGEMENT-REGISTER.md) enumerates every point where a written contract stops computing and a person decides — classified **adjudicative / epistemic / normative / constitutive**, each marked *close in code* or *refer to a named institution*. Its finding: the canon currently routes almost everything to `Friedman`, i.e. to a vote, which is the wrong guard for epistemic and constitutive judgements. A register of judgement points is also a register of **capture** points; read it both ways.
