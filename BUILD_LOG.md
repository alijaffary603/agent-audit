# Build Log

## 2026-07-26 — Milestone 1: Repository setup

### Decision: the MVP audits pasted transcripts, not live audio or telephony

AgentAudit will eventually need to sit close to real conversations, but the MVP takes plain pasted transcripts as input. Reasons:

**The audit engine is the product; capture is plumbing.** The risky, differentiating part is whether LLM analysis of a conversation produces findings a reviewer actually trusts. Pasted text tests exactly that with zero capture infrastructure.

**Telephony multiplies scope before value is proven.** Live calls mean a telephony vendor, webhooks, streaming speech-to-text, latency budgets, and per-minute costs — none of which improve the quality of the audit itself.

**Text input keeps iteration fast and deterministic.** The same transcript can be re-run against every prompt and scoring change. Audio introduces transcription errors that confound evaluation of the auditor.

**Compliance stays simple.** Recording calls raises consent and retention obligations that vary by jurisdiction. With pasted transcripts, the user controls exactly what data enters the system.

**Nothing is thrown away later.** Transcripts are the stable interface: when live audio or telephony is added, speech-to-text output will feed the same audit pipeline the MVP builds.

## 2026-07-26 — Milestone 2: Product scope

### Decision: prove the audit on existing transcripts before building any integration

[docs/product-scope.md](docs/product-scope.md) fixes the MVP to a single page that audits one pasted transcript across five conversation categories — and explicitly rules out authentication, a database, live calls, audio uploads, telephony, webhooks, and multi-page UI. Reasons:

**Integrations amplify quality; they don't create it.** The unproven assumption is that an LLM audit of a transcript produces findings a reviewer trusts. If that fails, no capture pipeline rescues the product; if it holds, wiring in sources later is comparatively mechanical. So the MVP spends everything on the report and nothing on plumbing.

**Transcripts are the data users already have.** Every chat and voice platform exports text. Paste-in means a prospective user can test AgentAudit today, against real historical conversations, with no vendor account, no API keys of theirs, no setup.

**Five categories test generality without losing focus.** Support, sales, booking, technical support, and recruiting differ enough in what "good" means that succeeding across all five shows the approach is not a single-rubric trick — while the set stays small enough to evaluate by hand.

**Ephemeral by design lowers the trust barrier.** No login and no database means users can paste sensitive conversations knowing nothing is retained — and it removes the largest compliance and security workload from the MVP.

**Success criteria are written before the code.** The scope doc commits to what "works" means — evidence-anchored findings, planted-failure detection, re-run consistency — so the MVP gets judged against pre-committed goals rather than post-hoc rationalization.

**Schema and architecture are deliberately deferred.** Locking a response schema before seeing real reports would freeze today's guesses; both land in later milestones once the product shape is validated.
