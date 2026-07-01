# Chapter 6: The Cold-Start Problem
*or: why pure utility has never bootstrapped a money*

> *Pure utility has never bootstrapped a money network. There is always an engine.*

**Part II — Money as Coordination Infrastructure** · [Index](README.md) · Prev: [Chapter 5](05-why-it-has-value.md) · Next: [Chapter 7](07-four-functions-four-problems.md)

## Opening scaffold

Hayek's *Denationalisation of Money* (1976). Airtight argument. Nobel laureate. Widely read. Nobody used the private currencies. Single anecdote does the framing work.

## Structural beats

1. Hayek's failure.
2. The math (Metcalfe in reverse = cold-start problem).
3. The four engines, each with concrete history (Pix and M-Pesa lead the platform-leverage section).
4. The two-layer pattern — bundled at bootstrap, unbundled at use.
5. The political honesty (every monetary network is paid for by someone).
6. The design space for new money (two-token, state-issued unbundling, network inheritance).
7. The takeaway box.

## Themes

- Technical excellence is not adoption.
- Bootstrapping is the central engineering problem economics ignores.
- Speculation funds infrastructure that non-speculators free-ride on.
- The "real miners" of any monetary network are the early holders, not the protocol workers.

## Twists

- Bitcoin is rehabilitated. The reader, having absorbed earlier scepticism about its hard cap, now sees the hard cap is the bootstrap engine, not a design failure.
- "Decentralised = no institutions needed" gets flipped — speculation IS the institution.

## Subarcs

- Clearing-discipline arc: the four engines are mode-subsidies — coercion = Obligated pays, commodity = prestige-sphere (B/O/I) demand pays, platform = existing relational networks lend theirs, speculation = Value funding itself. "Bundled at bootstrap" is a mode-bundle, not only a function-bundle.
- First appearance of the bootstrap-vs-use-layer distinction that organises Parts III through VII.
- Foreshadows Chapter 22 (the Tally), which will be examined as a use-layer construction needing to inherit network from somewhere else.
- Bitcoin re-evaluation arc reaches its inflection point here.

## Closing scaffold

The rest of this book assumes we have accepted the cold-start problem. Anyone proposing a new money has to answer: who pays the bootstrap?

---

## Draft

In 1976 Friedrich Hayek published *The Denationalisation of Money*. The argument was airtight. National monetary monopolies, he wrote, are the source of inflation, instability, and political mischief. The solution was to let private firms issue competing currencies. Users would gravitate toward whichever currency best preserved purchasing power. Bad money would die. The market would discipline issuers in a way no central bank ever has.

The logic was beautiful. The economics was rigorous. Hayek was a Nobel laureate. The book was widely read.

Nobody used the private currencies. Not then. Not in the half-century since. Hayek's perfect money never happened, not because anyone refuted it, but because nobody had a reason to be the *first* user.

That problem — the reason elegant money designs do not become actual moneys — is what we need to understand before we go any further.

### The math is brutal

A money network's value to any one user is roughly the number of *other* users they can transact with. Metcalfe's law: value scales with the square of the user count. A network of two has one possible exchange relationship. A network of ten has 45. A network of a million has half a trillion.

Run that in reverse and we get the cold-start problem. A network of one has zero relationships. A network of two has one. The early users of a new money get almost no value from it, because there is almost no one to transact with. Their willingness to hold or accept it depends entirely on the *expectation* that other users will arrive — an expectation that, at t=0, has no evidence behind it.

Pure utility cannot solve this. A new payment rail might be 100× faster, 10× cheaper, and infinitely more elegant than the existing options. None of that matters if we cannot pay anyone with it. The first thousand users get effectively nothing for their adoption costs. Without a non-utility reason to hold, they never appear, and the network never crosses the threshold where utility starts to compound.

Every working money in human history has solved this problem somehow. The solutions are not subtle. There are essentially four.

### The four known engines

#### 1. State coercion

The cleanest historical mechanism. A king (or a modern state) demands taxes denominated in a specific token. Citizens must obtain that token to avoid jail. Sellers begin accepting it because their customers have it. The network bootstraps outward from the coercive demand pulse.

This is the chartalist insight: state-issued money is not valuable because we agreed to use it; it is valuable because we are *required* to. Agreement comes after, as the network thickens.

The historical evidence is overwhelming. Lydia, the first state to mint coins (around 600 BCE), did so to pay soldiers. Rome's denarius spread through tax demands and legionary pay. The British pound, the dollar, the euro — every modern fiat currency we use is bootstrapped by the coercive demand for its own units in tax payment. This is not a footnote. It is the engine.

**Who pays**: citizens, by compulsion. **What it buys**: one of the most efficient transaction rails ever invented.

#### 2. Speculative appreciation

A token is designed with credible scarcity. Early users buy it in the belief that later users will buy at higher prices. The token attracts speculative capital long before it has any transaction utility. The capital pays for the infrastructure — exchanges, custody, wallets, payment processors, regulatory work — that eventually makes transaction utility real.

Bitcoin is the textbook case. For its first several years, almost no one used it for transactions. People bought it because the price was rising and they expected it to keep rising. That belief was self-fulfilling for long enough to fund 16 years of infrastructure development. By the time the network was mature enough to support real payment use cases (stablecoins, Lightning channels, remittance corridors for Filipinos and Argentinians), the bootstrap had already been paid for by speculators whose theory was simply *number go up*.

The "real miners" of Bitcoin are not the people running ASICs. They are the people who held through bear markets, built exchanges, integrated payment processors, and convinced merchants. They are paid in capital appreciation rather than block rewards, and their economic contribution to the network's existence is far larger than the proof-of-work miners'.

**Who pays**: speculators, voluntarily, mostly through losses. **What it buys**: a globally distributed, censorship-resistant transaction infrastructure usable by anyone — including the people who do not share the speculative theology.

#### 3. Industrial or ornamental use value

A commodity has *intrinsic* demand for non-monetary purposes — gold for jewellery and electrical contacts, salt for food preservation, cattle for milk and labour, cowries as decorative items. That underlying demand creates a baseline of holders. The commodity then accumulates monetary functions on top of its primary use.

Gold did not become money because we decided it would be useful. Gold became money because enough people already wanted it for *other reasons* that the cold-start was solved before the monetary function had to bootstrap on its own. The same is true of cattle in much of the ancient world, salt in the Roman *salarium*, and cowries across the Indian Ocean trade.

**Who pays**: the original industrial or ornamental users, through demand they would have had anyway. **What it buys**: a money function as a free side-benefit on top of an existing market.

This mechanism is largely unavailable to us as modern designers. We do not have new commodities with universal pre-existing demand. The closest modern analogue is *attention*, but no one has yet figured out how to anchor a token to attention in a way that survives the friction.

#### 4. Platform leverage

A pre-existing platform with a large user base introduces a payment function that piggybacks on the existing network. Users adopt the payment because they are already on the platform; the platform cross-subsidises the payment infrastructure from its other revenue.

This is, by some distance, the most *efficient* known bootstrap mechanism — and the one most actively building money networks today. **Pix**, launched by Brazil's central bank in 2020, hit 150 million users in three years by mandating that all licensed banks integrate it; the state paid the bootstrap, the banks were compelled to host it, and the user-side experience was free. **M-Pesa** achieved 50 million users faster than any other payment network in African history by riding on Safaricom's existing telco network in Kenya. **GCash** in the Philippines and **WeChat Pay / Alipay** in China each bootstrapped on dominant chat or commerce platforms with hundreds of millions of users already in place. **Apple Pay** rode on iPhones that already existed; **PayPal**, in its early years, rode on eBay's auction marketplace.

**Who pays**: the host platform — through direct investment, user-acquisition spend, deliberate cross-subsidy, or state mandate. **What it buys**: a payment rail that inherits the network density of the host from day one.

The trade-off is dependency. A payment rail that inherits its network from a platform is also at the mercy of that platform's politics, business model, and survival.

Before we move on, notice what the four engines are in the vocabulary of Part I. Only one of them — speculation — is Value mode paying for itself, the strange self-funding case where a market pulls itself up by its own expected future. The other three are all *another mode's* demand subsidising the Value rail. State coercion is Obligated mode paying: the tax is rank-imposed clearing, and it buys the till. The commodity bootstrap ran in great part on demand that was ceremonial and prestige-bound — cattle, cowries, the goods of bridewealth and standing (and in part on plain use: salt for the pot) — the Obligated and Immediate spheres paying without meaning to. Platform leverage borrows a network that a web of existing relationships already built. Bundling at the bootstrap layer, in other words, is not only a bundling of functions. It is a bundling of *modes* — and every money carries the birthmark of the mode that paid for it.

### The two-layer pattern

Once we see the four engines clearly, a design pattern emerges that is present in most working money systems but rarely named.

**Every working money is bundled at the bootstrap layer and unbundled at the use layer.**

Fiat is bundled at the bootstrap — state coercion bundles unit-of-account, store-of-value, and medium-of-exchange into the same instrument because the state needs all three for tax administration. It is *partially* unbundled at the use layer by sophisticated users who hold wealth in non-currency assets and only convert when needed. Doña Elena, whom we met in Chapter 1, is the unbundling at the use layer in motion. The five layers running on her iPhone ride on a fiat bootstrap she did not design and cannot escape — but she has constructed a perfectly competent unbundled architecture on top of it.

Bitcoin is bundled at the bootstrap — the hard cap conflates store-of-value into the medium-of-exchange in order to attract speculative capital. It is unbundled at the use layer by users who hold BTC as an appreciation play but transact in stablecoins running on the infrastructure BTC paid for. The bundling at the foundation funded the unbundling at the application.

Mobile money is bundled at the bootstrap — the telco's existing user base subsidises the payment rail. It is unbundled at the use layer where M-Pesa, GCash, or Pix serves only as a transaction rail; users hold their wealth in cattle, real estate, gold, or USD.

The pattern is robust. It also explains why every "purely unbundled" money design from first principles has failed to bootstrap. **There is no such thing as a pure-utility money network.** Pure utility is the *eventual* state of mature networks; it is never the bootstrapping state. Anyone who promises a pure-utility money launch is either misunderstanding the cold-start problem or hiding the bootstrap mechanism.

### The political honesty

Naming the bootstrap is the most politically honest move in monetary theory.

Standard economics pretends money emerges spontaneously from the inefficiencies of barter. (It does not. Barter economies do not exist as a transitional stage.) Crypto evangelism pretends that decentralised protocols escape the need for institutional bootstraps. (They do not. Speculation *is* the institutional bootstrap.) Anthropology describes the bootstraps that already worked in the past without theorising the design problem of *making a new one happen*.

The honest framing is that **every monetary network is paid for by someone**. The four known engines specify who pays and how:

- State coercion: citizens pay through compulsion
- Speculation: speculators pay through appreciation expectations
- Industrial use: the original users of the commodity pay through demand they would have had anyway
- Platform leverage: the host platform pays through cross-subsidy

When we encounter a new money — a new central bank digital currency, a new crypto project, a new fintech rail — the first question is not *"is the technology good?"* It is *"what is the bootstrap, and who pays for it?"* If the answer is *"the technology is so good people will adopt it on its own merits,"* the project will fail, because pure utility has never bootstrapped any money network in human history.

### The design space for new money

This chapter has been mostly diagnostic. Let us close with a brief sketch of where the design frontier actually is.

The unsolved problem of the next decade is whether we can bootstrap an *unbundled* medium-of-exchange. Every existing money is bundled at the bootstrap layer for one of the four reasons above. The minimal-money framework calls for unbundling. These two impulses conflict.

The most plausible synthesis is the **two-token architecture**: a speculative governance or equity token that attracts capital and funds infrastructure, paired with a clean transaction token that holds no appreciation premium and is designed for circulation rather than holding. The bundling lives openly in the speculative token; the use layer is clean. MakerDAO and DAI are an early sketch. None has produced a clean answer yet.

The second candidate is **explicit state-issued unbundling**: a central bank digital currency mandated by design to be a transaction-only instrument — no interest, no savings function, anti-hoarding mechanics built in. The state pays the bootstrap; the design refuses to let the token bundle into store-of-value. Some thoughtful CBDC designs aim at this. Most actual CBDC designs are confused about whether they want to be a transaction tool, a surveillance tool, or a deposit substitute.

The third candidate is **inheriting an existing network entirely**: stablecoins on Ethereum, Lightning channels on Bitcoin, GCash on telco rails, the Tally on top of WhatsApp. This works but trades cold-start for political dependency on the host.

We take no position here on which of these will win. The framework's contribution is to name the problem clearly — that bootstrapping is a real and unsolved engineering challenge, not a footnote — so that we can stop pretending we have escaped it and instead pick our bootstrap honestly.

### What we take away

If we remember one thing from this chapter:

> **Pure utility has never bootstrapped a money network. There is always an engine. The four known engines are state coercion, speculation, pre-existing use value, and platform leverage. When we encounter a new money, we look for the engine before we make any other judgement.**

The framework is honest about this where most monetary thinking is not. The dishonesty in standard economics is treating fiat as if it just emerged. The dishonesty in crypto evangelism is treating speculation as incidental. The dishonesty in techno-utopianism is believing pure design can ignite a network. They are all the same dishonesty: pretending the cold-start problem is not the central engineering challenge of monetary design.

It is. The rest of this book assumes we have accepted that.
