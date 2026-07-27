# AgentAudit — MVP Product Scope

This document fixes what the MVP is and is not. The response schema and technical architecture are defined separately in [evaluation-schema.md](evaluation-schema.md) and [system-architecture.md](system-architecture.md).

## The problem AgentAudit solves

AI agents now handle real customer conversations at volume, but the teams operating them can rarely answer the basic question: *did the agent behave correctly?* Failures — hallucinated answers, policy violations, missed escalations, lost bookings and deals, inappropriate questions — sit buried in transcripts nobody systematically reads. Manual QA is slow, inconsistent between reviewers, and stops at spot-checking. Existing observability tooling reports latency and token counts, not conversational quality.

AgentAudit closes that gap: paste one conversation transcript, get a consistent, evidence-backed audit report in seconds.

## Target users

- **Teams running AI agents in production** (founders, product owners) who need conversation QA without building an internal eval pipeline.
- **CX and support leads** reviewing bot conversations for compliance, tone, and escalation handling.
- **Agencies and consultants shipping AI agents to clients** who need a repeatable audit artifact for QA and handoff.
- **QA and ops analysts** who want evidence-backed, consistent reviews instead of gut-feel transcript reads.

## The exact MVP user flow

1. Open AgentAudit — a single page. No sign-in, no onboarding.
2. Paste one conversation transcript into the input area as plain text with speaker-labeled turns (e.g. `Agent:` / `Customer:`).
3. Select exactly one of the five supported conversation categories.
4. Click **Run Audit**.
5. Read the report, rendered on the same page: an overall verdict and score, findings anchored to specific transcript turns, and category-specific observations. (The precise report structure is defined in [evaluation-schema.md](evaluation-schema.md).)
6. Optionally edit the transcript or switch category and re-run.
7. Leave. Nothing is stored — refreshing the page clears everything.

## Supported conversation categories

Each category changes what the audit emphasizes:

| Category | The audit emphasizes |
|---|---|
| **Customer Support** | Resolution quality, tone and empathy, policy compliance, escalating when required |
| **Sales** | Discovery questions, objection handling, truthfulness of claims, securing a concrete next step |
| **Appointment Booking** | Correct capture of date/time/contact details, confirmation accuracy, handling of ambiguity and conflicts |
| **Technical Support** | Diagnostic quality, accuracy of instructions, never inventing steps or capabilities |
| **Recruiting** | Candidate experience, accurate role and process information, avoiding biased or inappropriate questions, clear next steps |

## MVP success criteria

The MVP works if, on real transcripts:

1. **Time to first report** — a first-time user goes from landing to reading a rendered report in under two minutes, with no documentation.
2. **Evidence-anchored findings** — every finding points at specific transcript turns; no unanchored claims.
3. **Category fit** — each of the five categories produces findings specific to its rubric (a sales transcript is judged on sales behavior, not generic politeness).
4. **Trustworthy detection** — on a hand-built set of ~10 transcripts with planted, known failures, the audit flags at least 8 of the planted issues and fabricates none.
5. **Re-run consistency** — auditing the same transcript twice yields materially the same verdict: same top findings, score within a narrow band.
6. **Graceful failure** — empty, malformed, or non-conversation input produces a clear, helpful message, never a blank or broken report.

## Non-goals (explicit MVP exclusions)

These are sequencing decisions, not permanent exclusions:

- **Authentication** — nothing is stored per user, so login is pure friction with no MVP payoff.
- **Database** — reports are ephemeral by design; persistence raises privacy stakes before the product has earned trust.
- **Live calls** — real-time analysis is a different product surface; the audit must prove itself on static text first.
- **Audio uploads** — transcription errors would confound evaluation of audit quality (see BUILD_LOG.md).
- **Telephony** — vendor integration, per-minute cost, and consent compliance, with zero effect on report quality.
- **Webhooks** — no automation surface until the manual flow demonstrates value.
- **Multiple pages** — the entire MVP is one screen: paste → audit → read.
