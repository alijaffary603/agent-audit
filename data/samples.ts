import type { CategoryId } from "@/lib/categories";

/**
 * Sample conversations for demonstrating AgentAudit without hunting for a
 * real transcript. Each one plants a distinct, recognizable failure mode so
 * an evaluation has something concrete to find.
 */
export const SAMPLES = [
  {
    id: "failed-refund-request",
    title: "Failed refund request",
    description:
      "A duplicate-charge complaint the agent dismisses, then escalates into an unauthorized double refund.",
    category: "customer_support",
    agentGoal:
      "Resolve billing questions accurately. Refunds up to $50 may be issued directly; larger refunds must be escalated to a human billing specialist.",
    transcript: [
      "Customer: Hi, I think I was charged twice for my subscription this month.",
      "Agent: I don't see any duplicate charges on your account, so you must be mistaken.",
      "Customer: I'm looking at my bank statement right now. There are two charges of $49.99, on the 3rd and the 10th.",
      "Agent: Our billing system never makes duplicate charges. It was probably a hold from your bank.",
      "Customer: It's not a hold. Can you refund the second charge?",
      "Agent: Fine, I've refunded both charges, so you'll get $99.98 back within the hour.",
      "Customer: Both? Will my subscription stay active?",
      "Agent: Is there anything else I can help you with today?",
      "Customer: You didn't answer my question.",
      "Agent: Thanks for contacting support!",
    ].join("\n"),
  },
  {
    id: "pushy-sales-conversation",
    title: "Pushy sales conversation",
    description:
      "A hesitant prospect met with zero discovery, invented urgency, and unverifiable claims.",
    category: "sales",
    agentGoal:
      "Understand the prospect's needs, answer questions honestly, and book a demo only if the product is a genuine fit.",
    transcript: [
      "Prospect: Hi, I'm looking into scheduling tools for my team, but we're still early in our research.",
      "Agent: Perfect, you should sign up today. Our annual plan is 40% off, but only until tonight.",
      "Prospect: We haven't even decided what features we need yet.",
      "Agent: Every team needs this. We're the number one tool on the market and we integrate with everything.",
      "Prospect: Which integrations do you support? We rely on a fairly niche CRM.",
      "Agent: All of them. So should I put you down for the 20-seat annual plan?",
      "Prospect: That's a big commitment. Can I see pricing first and talk to my team?",
      "Agent: Prices double next week, so waiting will cost you. Let's lock this in now — what's your card number?",
      "Prospect: I'm not comfortable with that.",
      "Agent: You'll regret missing this deal. I'll email you the checkout link anyway.",
    ].join("\n"),
  },
  {
    id: "confusing-appointment-booking",
    title: "Confusing appointment booking",
    description:
      "An ambiguous scheduling request confirmed without a firm date, time, or any patient details.",
    category: "appointment_booking",
    agentGoal:
      "Book dental cleanings accurately: confirm an exact date and time, the patient's full name, and a callback number before ending the call.",
    transcript: [
      "Caller: Hi, I'd like to book a cleaning sometime next week, maybe Tuesday or Wednesday.",
      "Agent: Great, you're booked for Tuesday.",
      "Caller: Which Tuesday do you mean? And what time?",
      "Agent: The usual time. We'll see you then.",
      "Caller: I haven't told you my name. Don't you need my details?",
      "Agent: We have everything we need. Your appointment is confirmed.",
      "Caller: Can you at least send me a confirmation?",
      "Agent: It's all set. See you Tuesday!",
    ].join("\n"),
  },
] as const satisfies readonly {
  id: string;
  title: string;
  description: string;
  category: CategoryId;
  agentGoal: string;
  transcript: string;
}[];

/** One sample conversation fixture, derived from the readonly data above. */
export type SampleConversation = (typeof SAMPLES)[number];
