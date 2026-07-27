/**
 * The conversation categories AgentAudit supports.
 *
 * Single source of truth: identifiers, labels, and evaluation focus live in
 * one readonly structure, and the `CategoryId` union is derived from it — see
 * docs/product-scope.md for the product definition of each category.
 */
export const CATEGORIES = [
  {
    id: "customer_support",
    label: "Customer Support",
    description:
      "Resolution quality, tone and empathy, policy compliance, and escalating when required.",
  },
  {
    id: "sales",
    label: "Sales",
    description:
      "Discovery questions, objection handling, truthfulness of claims, and securing a concrete next step.",
  },
  {
    id: "appointment_booking",
    label: "Appointment Booking",
    description:
      "Correct capture of date, time, and contact details, confirmation accuracy, and handling of ambiguity and conflicts.",
  },
  {
    id: "technical_support",
    label: "Technical Support",
    description:
      "Diagnostic quality, accuracy of instructions, and never inventing steps or capabilities.",
  },
  {
    id: "recruiting",
    label: "Recruiting",
    description:
      "Candidate experience, accurate role and process information, avoiding biased or inappropriate questions, and clear next steps.",
  },
] as const satisfies readonly {
  id: string;
  label: string;
  description: string;
}[];

/** One supported category entry: stable id, display label, evaluation focus. */
export type Category = (typeof CATEGORIES)[number];

/** Stable category identifier union, derived from the data above. */
export type CategoryId = Category["id"];
