# Extraction and the Modes

*Money's network concentration **is** its extraction mechanism. The four fairness modes are extraction's channels — and its costumes.*

## The structural claim

Money has value because it is a **network with winner-take-most pull**: the medium that lowers the most transaction friction gets the steepest pull, crowds out rivals, and concentrates (the liquidity hierarchy, the M0–M4 ladder). But that same concentration is **market power**. Whoever sits at the centre of the dominant rail — the issuer, the unit of account, the payment platform — holds structural power and earns rents: seigniorage, the spread, interchange fees, float, data.

So the property that makes money *work* (network dominance) is the property that makes it *extractive*. You cannot have the value-generating concentration without the extraction-enabling concentration. **Money is an extraction site by construction.** The only open questions are *who is at the centre* and *how visible the hand is*.

## The grammar of disguises

The economists can model *that* extraction happens. What they don't supply is *how it dresses* so the extracted party experiences it as legitimate. That is the role of the modes: extraction flows through whichever mode is socially operative, and each mode hands it a different cover story.

| Mode | Cover story | What it launders |
|---|---|---|
| **Obligated** (authority) | *"you owe it — rank, law, contract, the tax"* | tribute, unavoidable fees, late penalties, the inflation tax |
| **Value** (market) | *"it's just the price — supply and demand"* | monopoly rents, surge/yield pricing, the 4.7× card APR |
| **Balanced** (accounting) | *"fair's fair, we're square"* | lopsided contracts dressed as reciprocal — "you agreed to the terms" |
| **Immediate** (belonging) | *"we're family, don't keep score"* | unpaid care work, "do it for the team," the firm that calls itself a family |

The same act of taking looks **owed, market, fair, or loving** depending on the costume — which is exactly why the extracted party doesn't revolt. This *grammar of extraction's disguises* is the part the formal literature does not have.

## Two layers of camouflage, one X-ray

- **Push picture = meta-camouflage.** Makes the whole arrangement look like a law of nature: *"money just is gold," "we just are out of money."*
- **The operative mode = local camouflage.** Makes a specific taking look legitimate: *"it's just the price," "you owe it."*

The framework is the X-ray for both. **Pull-literacy** strips the first (money is a *pulled, concentrated network* — therefore there is a centre earning rents). **Mode-literacy** strips the second (names which cover story is running). Together they convert an invisible, naturalised extraction into a visible, contestable **choice** — which is the operational meaning of the canon principle *make extraction explicit*.

## Honest scope

Extraction is not absent from the literature — it is **scattered and treated as special cases**:

- the **inflation tax / seigniorage** is fully formalised (issuer extraction; Lagos–Wright prices its welfare cost);
- search models have **bilateral bargaining power** (local, pairwise surplus capture);
- **Brunnermeier–James–Landau** worry explicitly about **platform market power** (Big Tech / dominant stablecoin rents, walled gardens);
- **Graeber** has extraction as a **moral/historical** theme (creditor-class power, debt peonage, "pay your debts" as creditor ideology).

What is **BOVI-original** is the *unification*: (1) extraction as a **generic structural feature** of money's network concentration, not a pathology; (2) the **modes-as-costumes grammar** of how it is disguised; (3) welding the **Obligated/extraction machinery to the value theory in one frame**. Each piece exists somewhere; the synthesis does not.

It is **necessary, not sufficient.** Making extraction explicit is *discourse, not power* — visibility is upstream of mobilisation, not a substitute for it (Bryan named the Cross of Gold and lost). The claim is only that visibility is today's binding constraint: most extraction is currently invisible, so it cannot even be contested.

## See also

- `docs/THE-THEORY-OF-MONEY-RECENSION.md` — the value theory (pull, network concentration, §7 governance/elasticity).
- `docs/TWO-REGIME-PEDAGOGY.md` — push as the weak-field limit; the inoculation mission and its limits.
- Canon: the four modes (Fiske / RMT); *make extraction explicit* as a design principle; the Obligated mode.
- `contracts/Fiske.sol` — the grammar made enforceable: `flagIfTaboo` fires when extraction (interest/price/fee) flows through a relationship tagged **Immediate** (the "we're family" costume, detected), and `requireTouchable` hard-stops the chain from ever recording an Immediate bond. The contract serves the modes; the *assignment* (which mode) stays a human/oracle call, and the *moral force* stays in people.
