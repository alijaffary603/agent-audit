# AgentAudit

AgentAudit turns transcripts of AI agent conversations into structured audit reports. Paste a transcript and get flagged findings — policy violations, hallucinations, missed escalations, tone problems — with per-turn evidence and an overall quality score.

## Why transcripts first?

The MVP deliberately starts with pasted transcripts rather than live audio or telephony. The reasoning is documented in [BUILD_LOG.md](BUILD_LOG.md).

## Planned stack

- Next.js + TypeScript
- OpenAI API for transcript analysis

## Setup

Copy the environment template and add your key:

```bash
cp .env.example .env
```

## Status

The product scope, evaluation contract, and system architecture are defined in [docs/](docs/). The next step is scaffolding the Next.js application.
