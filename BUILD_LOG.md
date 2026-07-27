# Build Log

## 2026-07-26 — Milestone 1: Repository setup

### Decision: the MVP audits pasted transcripts, not live audio or telephony

AgentAudit will eventually need to sit close to real conversations, but the MVP takes plain pasted transcripts as input. Reasons:

**The audit engine is the product; capture is plumbing.** The risky, differentiating part is whether LLM analysis of a conversation produces findings a reviewer actually trusts. Pasted text tests exactly that with zero capture infrastructure.

**Telephony multiplies scope before value is proven.** Live calls mean a telephony vendor, webhooks, streaming speech-to-text, latency budgets, and per-minute costs — none of which improve the quality of the audit itself.

**Text input keeps iteration fast and deterministic.** The same transcript can be re-run against every prompt and scoring change. Audio introduces transcription errors that confound evaluation of the auditor.

**Compliance stays simple.** Recording calls raises consent and retention obligations that vary by jurisdiction. With pasted transcripts, the user controls exactly what data enters the system.

**Nothing is thrown away later.** Transcripts are the stable interface: when live audio or telephony is added, speech-to-text output will feed the same audit pipeline the MVP builds.
