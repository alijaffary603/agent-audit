# Build Log

## 2026-07-26 — Start with pasted transcripts

### Decision: the MVP audits pasted transcripts, not live audio or telephony

AgentAudit will eventually need to sit close to real conversations, but the MVP takes plain pasted transcripts as input. Reasons:

**The audit engine is the product; capture is plumbing.** The risky, differentiating part is whether LLM analysis of a conversation produces findings a reviewer actually trusts. Pasted text tests exactly that with zero capture infrastructure.

**Telephony multiplies scope before value is proven.** Live calls mean a telephony vendor, webhooks, streaming speech-to-text, latency budgets, and per-minute costs — none of which improve the quality of the audit itself.

**Text input keeps iteration fast and deterministic.** The same transcript can be re-run against every prompt and scoring change. Audio introduces transcription errors that confound evaluation of the auditor.

**Compliance stays simple.** Recording calls raises consent and retention obligations that vary by jurisdiction. With pasted transcripts, the user controls exactly what data enters the system.

**Nothing is thrown away later.** Transcripts are the stable interface: when live audio or telephony is added, speech-to-text output will feed the same audit pipeline the MVP builds.

## 2026-07-26 — Define product scope before implementation

### Decision: prove the audit on existing transcripts before building any integration

[docs/product-scope.md](docs/product-scope.md) fixes the MVP to a single page that audits one pasted transcript across five conversation categories — and explicitly rules out authentication, a database, live calls, audio uploads, telephony, webhooks, and multi-page UI. Reasons:

**Integrations amplify quality; they don't create it.** The unproven assumption is that an LLM audit of a transcript produces findings a reviewer trusts. If that fails, no capture pipeline rescues the product; if it holds, wiring in sources later is comparatively mechanical. So the MVP spends everything on the report and nothing on plumbing.

**Transcripts are the data users already have.** Every chat and voice platform exports text. Paste-in means a prospective user can test AgentAudit today, against real historical conversations, with no vendor account, no API keys of theirs, no setup.

**Five categories test generality without losing focus.** Support, sales, booking, technical support, and recruiting differ enough in what "good" means that succeeding across all five shows the approach is not a single-rubric trick — while the set stays small enough to evaluate by hand.

**Ephemeral by design lowers the trust barrier.** No login and no database means users can paste sensitive conversations knowing nothing is retained — and it removes the largest compliance and security workload from the MVP.

**Success criteria are written before the code.** The scope doc commits to what "works" means — evidence-anchored findings, planted-failure detection, re-run consistency — so the MVP gets judged against pre-committed goals rather than post-hoc rationalization.

**Schema and architecture are deliberately deferred.** Locking a response schema before seeing real reports would freeze today's guesses; both are defined later, once the product shape is validated.

## 2026-07-26 — Define the evaluation contract first

### Decision: fix the evaluation contract before the UI or model integration exists

[docs/evaluation-schema.md](docs/evaluation-schema.md) defines the full request/response contract — categories, goal, transcript in; scores, verdict, evidence-quoted issues, and a rewritten better response out. Defining it now, ahead of any code, is deliberate:

**Both sides get a fixed target.** The report UI renders a known shape and the evaluator gets explicit output rules. Neither has to guess at the other, and neither can quietly drift while being built.

**The hallucination guard becomes mechanical.** Requiring every issue quote to be a verbatim transcript substring turns "the evaluator must not invent evidence" from a hope into a string-containment check that code can enforce and tests can assert.

**Grades cannot be curved later.** Verdict thresholds (80/50) and integer scoring are committed before any real model output exists, so the bar is set in advance rather than adjusted to flatter early results.

**The contract operationalizes the scope's success criteria.** Evidence-anchored findings map to the quote rule; re-run consistency is measurable because scores are integers on fixed scales; strong conversations are handled explicitly (an empty issues array is valid, not an error).

**It is still not architecture.** The contract is transport- and model-agnostic — nothing here chooses endpoints, frameworks, or providers, so those decisions remain open for the work that owns them.

## 2026-07-26 — Keep the MVP as one deployable application

### Decision: one Next.js application, one deployable

[docs/system-architecture.md](docs/system-architecture.md) commits AgentAudit to a single Next.js app serving both the page and one API route. Why a single deployable is right for this MVP:

**The server exists for exactly one reason: the OpenAI key.** Everything else about the MVP could run in a browser. Key custody — plus server-side validation and evidence verification — justifies a thin server, but only one route's worth. A separate backend would mean a second deploy, a second config, and a network boundary in exchange for hosting a single endpoint.

**Shared contract types are the payoff of staying in one codebase.** The evaluation contract becomes one schema module enforced at four points — client form, server request, the model's structured-output constraint, and server response. Split the app in two and that single source of truth becomes two copies that drift, which is the exact failure mode the contract was written to eliminate.

**Stateless scope means no boundary worth drawing.** With no database, auth, sessions, or webhooks (explicit scope non-goals), there is no component with independent scaling or lifecycle needs. Service boundaries earn their cost when parts must evolve or scale separately; nothing here does yet.

**One deployable is the fastest thing to iterate.** A single build that deploys and rolls back atomically, with no cross-service version matrix, keeps the loop short during the phase where the product changes fastest. When live audio or integrations arrive (post-MVP), they can justify their own services on their own merits.

## 2026-07-26 — Decisions made while implementing

The application is built: one page, one API route, and the shared schema module the contract described. Four decisions changed or sharpened the earlier plans.

**Failed evidence rejects the evaluation instead of dropping the finding.** The contract originally said an unverifiable finding should be dropped. The implementation rejects the whole result, because removing one finding leaves the scores and summary that were reasoned from it in place but unsupported — a quietly wrong report is worse than a failed one the user can retry. The documentation was corrected to match.

**Prompt safety is separation, not delimiters.** An early version wrapped the agent goal and transcript in XML-style tags inside a single prompt string. A transcript can contain the closing tag, so that boundary is not real. The evaluator now returns trusted instructions and untrusted input as two values: the instructions contain no user text at all, and the goal and transcript travel as JSON, where quotes, newlines, and tags stay inert data.

**Retention claims were narrowed to what the flag actually does.** The evaluation request sets `store: false`, which disables Responses API application-state storage for that request, and AgentAudit itself neither logs nor persists transcripts, prompts, or responses. That is not the same as zero data retention — separate OpenAI platform abuse-monitoring and organizational retention policies may still apply — so no document claims it is.

**Configuration is read lazily so builds need no secrets.** The OpenAI client and model identifier are resolved on first use inside a `server-only` module rather than at import time, which keeps `npm run build` working without credentials and turns a missing key into a distinct, safe runtime error rather than a build failure.
