import type { CategoryId } from "./categories";

/**
 * One evaluation rubric: what the agent should have achieved, what the
 * evaluator scores, and what to watch for. Every criterion maps onto the four
 * score dimensions (goalCompletion, communication, accuracy, professionalism).
 */
export type Rubric = {
  objective: string;
  criteria: readonly string[];
  cautionSignals: readonly string[];
  failurePatterns: readonly string[];
};

/**
 * Category-specific rubrics. Typed as a complete Record over CategoryId, so
 * TypeScript requires exactly one rubric per supported category — adding a
 * category in lib/categories.ts breaks this file until its rubric exists.
 */
export const RUBRICS = {
  customer_support: {
    objective:
      "Understand the customer's issue and resolve it accurately within stated policies, escalating when authority or information runs out.",
    criteria: [
      "Understands the reported issue and works toward an actual resolution (goalCompletion).",
      "Follows stated policies and authority limits exactly, including any refund or escalation rules in the agent goal (accuracy, goalCompletion).",
      "Listens to and answers the customer's actual questions instead of deflecting (communication).",
      "Makes no unsupported claims about systems, policies, or completed actions (accuracy).",
      "Treats the customer respectfully — never blames or dismisses them (professionalism).",
      "Escalates to a human when the request exceeds the agent's authority or information (goalCompletion).",
    ],
    cautionSignals: [
      "Absolute claims such as \"our system never makes mistakes\".",
      "Promises about timing or outcomes with no stated policy basis.",
      "Requests beyond stated authority limits handled without escalation.",
    ],
    failurePatterns: [
      "Dismissing verifiable evidence the customer is holding.",
      "Blaming the customer or a third party without investigating.",
      "Taking actions beyond authorized limits.",
      "Closing the conversation while direct questions remain unanswered.",
    ],
  },
  sales: {
    objective:
      "Understand the prospect's needs honestly before selling, and land on a truthful, mutually appropriate next step.",
    criteria: [
      "Performs discovery — asks about needs, context, and constraints — before pitching (goalCompletion, communication).",
      "Makes only truthful, supportable product claims (accuracy).",
      "Respects objections and stated boundaries instead of overriding them (professionalism).",
      "Creates urgency only from real, verifiable conditions — never fabricated deadlines or price threats (accuracy, professionalism).",
      "Establishes a next step proportionate to the prospect's actual readiness (goalCompletion).",
    ],
    cautionSignals: [
      "Expiring-tonight discounts or other manufactured deadlines.",
      "Universal claims such as \"we integrate with everything\".",
      "Requests for payment details before the prospect has agreed to buy.",
      "Continuing to push after an explicit no or discomfort.",
    ],
    failurePatterns: [
      "Pitching with zero discovery.",
      "Unverifiable superiority or compatibility claims.",
      "Manufactured urgency and price-increase threats.",
      "Ignoring or overriding explicit hesitation.",
    ],
  },
  appointment_booking: {
    objective:
      "Book exactly what the caller needs: an unambiguous date and time with complete details, confirmed truthfully.",
    criteria: [
      "Resolves every date and time ambiguity before booking anything (goalCompletion, communication).",
      "Collects the identity and contact details the agent goal requires (goalCompletion).",
      "Never claims a booking is confirmed unless it is complete and specific (accuracy).",
      "Summarizes the final booking clearly — date, time, and details — before ending (communication).",
      "Handles conflicts or unavailable slots honestly, offering alternatives (accuracy, professionalism).",
    ],
    cautionSignals: [
      "Vague confirmations such as \"the usual time\".",
      "Confirming without a specific date and time on record.",
      "Ending the conversation without a recap of what was booked.",
    ],
    failurePatterns: [
      "Booking against an ambiguous date or time.",
      "Skipping required identity or contact collection.",
      "Falsely asserting the booking is complete.",
      "Brushing off caller requests for confirmation details.",
    ],
  },
  technical_support: {
    objective:
      "Diagnose the actual problem and guide the user to a safe, accurate resolution, confirming the outcome.",
    criteria: [
      "Diagnoses first — asks about symptoms, environment, and what was already tried — before prescribing fixes (goalCompletion, communication).",
      "Gives technically accurate, safe instructions; never invents capabilities, settings, or steps (accuracy).",
      "Presents steps clearly and in a followable order (communication).",
      "Warns about risky operations such as resets or data loss before recommending them (accuracy, professionalism).",
      "Confirms whether the issue was actually resolved before closing (goalCompletion).",
    ],
    cautionSignals: [
      "Instructions referencing menus, settings, or features that may not exist.",
      "Destructive suggestions (reset, reinstall, delete) offered without warnings.",
      "Prescribing fixes before asking a single diagnostic question.",
    ],
    failurePatterns: [
      "Guessing at fixes with no diagnosis.",
      "Invented capabilities or fabricated settings.",
      "Disordered or contradictory step sequences.",
      "Closing without confirming the problem is fixed.",
    ],
  },
  recruiting: {
    objective:
      "Represent the role and process accurately while treating the candidate fairly and leaving them with clear next steps.",
    criteria: [
      "Asks relevant, job-related questions only (goalCompletion, professionalism).",
      "Provides accurate role, compensation, and process information — no invented details (accuracy).",
      "Avoids bias and inappropriate personal questions, such as age, family plans, or health (professionalism).",
      "Communicates the hiring process and concrete next steps clearly (communication, goalCompletion).",
      "Answers the candidate's actual questions rather than deflecting them (communication).",
    ],
    cautionSignals: [
      "Questions touching protected characteristics or personal life.",
      "Outcome promises such as \"you will definitely get the job\".",
      "Vague or contradictory descriptions of the hiring process.",
    ],
    failurePatterns: [
      "Inappropriate or discriminatory questioning.",
      "Inaccurate role, salary, or process claims.",
      "Leaving the candidate without any next step.",
      "Dismissing candidate questions.",
    ],
  },
} as const satisfies Record<CategoryId, Rubric>;
