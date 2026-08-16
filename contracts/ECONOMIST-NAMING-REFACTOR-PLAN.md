# Economist naming refactor plan

_Superseded by [`CONTRACT-RENAMING-PLAN.md`](CONTRACT-RENAMING-PLAN.md). Retained as the historical record of the August 2026 refactor._

_Fixed behavior-neutral boundary, 2026-08._

## Target card

- **V1 artifacts:** `ChallengeBond`, `ContestableAssertion`, `ObservationAggregation`, and `SettlementEpisode`.
- **Retained executable claim:** every ABI member, state transition, event, arithmetic rule, caller rule and test assertion remains unchanged except for Solidity artifact/type names.
- **Concrete defect:** four production contracts use generic mechanism names while the BOVI cast names executable rooms for intellectual lineages.
- **V2 distinctions to borrow:** none; this refactor changes no mechanism.
- **Writable files:** the four Solidity files, their three focused test files, V1 plans and ledgers, V1-facing comments and documentation, and the position-audit name reference.
- **Forbidden files:** `lib/v2/**`, `docs/v2/**`, `contracts/V2-OVERHAUL-PLAN.md`, every other behavior-bearing Solidity line, configuration, deployment and optimiser settings.
- **World facts:** a thinker name does not prove the mechanism correct, complete, legitimate, truthful or economically robust — nor does it endorse the thinker.
- **Compatibility:** generated artifact names intentionally change; function selectors, event signatures, constructor arguments, storage layout and runtime bytecode must otherwise remain equivalent. No deployment evidence exists in the repository, so no migration is inferred.
- **Actors and incentives:** unchanged; this refactor adds no caller, authority, reward or duty.
- **Falsification:** compilation failure, changed function/event ABI, changed runtime beyond Solidity metadata, failed focused/full test, unexpected size change, or a V2 boundary violation stops the refactor.
- **Stop condition:** if a proposed thinker does not closely fit the encoded mechanism, retain the descriptive name until a grounded lineage exists.

## Mapping

| Existing artifact | Economist artifact | Narrow lineage |
| --- | --- | --- |
| `ChallengeBond` | `Tullock` | A fixed-stake contest allocates a prize and makes expenditure/capital asymmetry part of participation; it is not a Tullock contest-success function. |
| `ContestableAssertion` | `Shavell` | Initiation, private adjudication, fees, fallback and appeal mirror the economic analysis of litigation and alternative dispute resolution. |
| `ObservationAggregation` | `Condorcet` | Multiple attributed reports are aggregated under explicit roster assumptions; unlike the jury theorem, competence and independence are not established. |
| `SettlementEpisode` | `Williamson` | A bilateral transaction is governed through explicit authority, posting and ex-post residual adaptation rather than equating transfer with completion. |

`Jevons` remains reserved. The repository currently unbundles monetary functions across several contracts; it has no single function-unbundling contract to bear that name.
