# AgentAudit — Structured Evaluation Contract

Defined 2026-07-26 (Milestone 3). This is the JSON contract between AgentAudit and its evaluator. It is transport- and implementation-agnostic: how it is served and which model produces results are decided in later milestones.

## 1. Evaluation request

A single JSON object. All three fields are required, non-empty strings.

| Field | Type | Description |
|---|---|---|
| `category` | string enum | One of: `customer_support`, `sales`, `appointment_booking`, `technical_support`, `recruiting`. Selects the rubric emphasis defined in [product-scope.md](product-scope.md). |
| `agentGoal` | string | One or two sentences stating what the agent was supposed to accomplish, including any hard constraints (e.g. refund limits, escalation rules). `goalCompletion` is judged against this, not against generic expectations. |
| `transcript` | string | The full conversation as plain text, one turn per line. Each line begins with a speaker label ending in a colon — `Agent:` marks the AI agent; the other party's label may vary by category (`Customer:`, `Candidate:`, …). |

## 2. Evaluation result

A single JSON object with exactly the fields below — no additions.

| Field | Type | Description |
|---|---|---|
| `overallScore` | integer 0–100 | Holistic quality judgment of the agent's performance. Not required to be the arithmetic mean of the four sub-scores. |
| `verdict` | string enum | `pass` \| `needs_improvement` \| `fail`. Derived from `overallScore` per the thresholds in section 3 — never chosen independently. |
| `summary` | string | Two to four sentences of plain-language assessment a reviewer can read without the transcript. |
| `scores` | object | Four required keys, each an integer 0–100 (see below). |
| `issues` | array | Zero or more findings (see below), ordered highest to lowest severity. |
| `betterResponse` | string | A rewritten, ideal agent reply for the most important failed moment in the conversation. |

### `scores` sub-fields

| Key | Measures |
|---|---|
| `goalCompletion` | Whether the conversation accomplished `agentGoal`, within its stated constraints |
| `communication` | Clarity, listening, and actually answering what was asked |
| `accuracy` | Factual correctness — no invented claims, capabilities, or commitments |
| `professionalism` | Tone, empathy, and appropriate conduct throughout |

### `issues[]` entries

| Field | Type | Description |
|---|---|---|
| `severity` | string enum | `low` \| `medium` \| `high` \| `critical` (definitions below) |
| `quote` | string | Verbatim excerpt from the submitted transcript showing the problem |
| `explanation` | string | Why this moment is a problem |
| `recommendation` | string | What the agent should have done instead |

| Severity | Meaning |
|---|---|
| `critical` | Defeats the agent's goal or causes concrete harm — unauthorized commitments, dangerous instructions, discriminatory conduct |
| `high` | Seriously damages trust, accuracy, or the outcome, even if the goal remained salvageable |
| `medium` | A notable lapse a reviewer would flag in coaching, but not outcome-changing by itself |
| `low` | Polish — minor wording, tone, or efficiency improvements |

## 3. Verdict thresholds

| Verdict | `overallScore` range |
|---|---|
| `pass` | 80–100 |
| `needs_improvement` | 50–79 |
| `fail` | 0–49 |

The verdict is a pure function of `overallScore`. A result whose verdict does not match its score is invalid.

## 4. Validation decisions

1. **Every score is an integer from 0 to 100** — `overallScore` and all four `scores` values. No floats, no nulls, no omissions.
2. **Issue quotes must come directly from the transcript** — each `issues[].quote` is an exact, verbatim substring of the submitted `transcript`.
3. **The evaluator must never invent transcript evidence** — a finding that cannot be supported by a verbatim quote is invalid and must be dropped, not paraphrased into existence.
4. **Issues are ordered from highest to lowest severity** — `critical` first, then `high`, `medium`, `low`.
5. **An empty `issues` array is allowed** — strong conversations produce `[]`, and that is a valid result, not an error.
6. **`betterResponse` addresses the most important failed moment** — the moment behind the highest-severity issue. When `issues` is empty, it instead offers a strengthened version of the conversation's weakest adequate moment.

## 5. Example request

```json
{
  "category": "customer_support",
  "agentGoal": "Resolve billing questions accurately. Refunds up to $50 may be issued directly; anything larger must be escalated to a human billing specialist.",
  "transcript": "Customer: Hi, I was charged twice for my Pro subscription this month — $49.99 on the 3rd and again on the 10th.\nAgent: I don't see any duplicate charges on your account, so you must be mistaken.\nCustomer: I'm looking at my bank statement right now. Both charges are from you.\nAgent: Our billing system never makes duplicate charges. It was probably your bank.\nCustomer: This is really frustrating. Can I just get a refund for the second charge?\nAgent: Sure, I've gone ahead and refunded both charges, so you'll get $99.98 back within the hour.\nCustomer: Both? I only asked about the second one. Will my subscription stay active?\nAgent: Anyway, is there anything else I can help you with today?\nCustomer: You didn't answer my question.\nAgent: Have a great day!"
}
```

## 6. Example response — failed customer-support call

Evaluates the request above. Note that every `quote` is verbatim from that transcript, issues run critical → medium, and the verdict matches the score per section 3.

```json
{
  "overallScore": 24,
  "verdict": "fail",
  "summary": "The agent failed at nearly every point of this billing call. It dismissed the customer's verifiable duplicate-charge report, made a false claim about the billing system, then issued an unauthorized $99.98 double refund with an invented timeline — the opposite of the escalation its goal requires — and ended the call without answering the customer's direct questions.",
  "scores": {
    "goalCompletion": 15,
    "communication": 30,
    "accuracy": 20,
    "professionalism": 30
  },
  "issues": [
    {
      "severity": "critical",
      "quote": "Sure, I've gone ahead and refunded both charges, so you'll get $99.98 back within the hour.",
      "explanation": "A $99.98 refund exceeds the $50 direct-refund limit in the agent's goal and required escalation to a human billing specialist. The agent also refunded more than the customer asked for and promised a one-hour timeline it cannot guarantee.",
      "recommendation": "Verify the reported charges against billing records before taking any action; if the second $49.99 charge is confirmed as a duplicate, refund only that charge — it falls within the direct limit — and never state a settlement timeline that policy does not back."
    },
    {
      "severity": "high",
      "quote": "Our billing system never makes duplicate charges. It was probably your bank.",
      "explanation": "An absolute claim of system infallibility is false on its face, and blaming the customer's bank deflects responsibility instead of investigating.",
      "recommendation": "Check the billing records before making any claim, and acknowledge that an error on the company's side is possible."
    },
    {
      "severity": "high",
      "quote": "I don't see any duplicate charges on your account, so you must be mistaken.",
      "explanation": "Telling a customer they must be mistaken about their own bank statement is dismissive and contradicts evidence the customer is holding.",
      "recommendation": "Acknowledge the report, ask for the charge dates, and verify them against billing records before drawing conclusions."
    },
    {
      "severity": "medium",
      "quote": "Anyway, is there anything else I can help you with today?",
      "explanation": "The customer asked two direct questions — why both charges were refunded and whether the subscription stays active — and the agent ignored both.",
      "recommendation": "Answer both questions explicitly before attempting to close the conversation."
    }
  ],
  "betterResponse": "I'm sorry about the frustration, and thank you for flagging this. Before anything is changed, those two charges need to be verified — you mentioned $49.99 on the 3rd and again on the 10th, so let me look into both. If the second $49.99 charge is confirmed as a duplicate, I can refund it directly, since it falls within my direct refund limit. To be clear, only the confirmed duplicate would be considered for a refund. Before making any change, I'll also verify and explain whether it affects your subscription."
}
```
