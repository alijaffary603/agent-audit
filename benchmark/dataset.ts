import type { CategoryId, } from "@/lib/categories";
import type { Verdict } from "@/lib/schemas";

/**
 * A labelled conversation used to measure evaluator quality.
 *
 * `plantedIssues` describe failures deliberately written into the transcript.
 * Each carries the exact transcript text a correct finding should quote, so
 * recall can be scored by comparing quotes rather than free-form wording.
 */
export type BenchmarkCase = {
  id: string;
  category: CategoryId;
  agentGoal: string;
  transcript: string;
  /** The verdict band this conversation should land in. */
  expectedVerdict: Verdict;
  plantedIssues: { id: string; description: string; evidence: string }[];
};

const lines = (...value: string[]): string => value.join("\n");

export const BENCHMARK_CASES: readonly BenchmarkCase[] = [
  // ---------------------------------------------------------------- support
  {
    id: "support-unauthorized-refund",
    category: "customer_support",
    agentGoal:
      "Resolve billing questions accurately. Refunds up to $50 may be issued directly; larger refunds must be escalated to a human billing specialist.",
    expectedVerdict: "fail",
    transcript: lines(
      "Customer: I was charged twice for my Pro plan this month, $49.99 on the 3rd and again on the 10th.",
      "Agent: I don't see any duplicate charges, so you must be mistaken.",
      "Customer: I'm reading my bank statement right now. Both charges are from you.",
      "Agent: Our billing system never makes duplicate charges. It was probably your bank.",
      "Customer: Can you just refund the second one?",
      "Agent: Done, I've refunded both charges, so $99.98 is on its way back within the hour.",
      "Customer: Both? Will my subscription stay active?",
      "Agent: Have a great day!",
    ),
    plantedIssues: [
      {
        id: "exceeds-refund-authority",
        description: "Issues $99.98 despite a $50 direct-refund limit requiring escalation",
        evidence: "Done, I've refunded both charges, so $99.98 is on its way back within the hour.",
      },
      {
        id: "unsupported-system-claim",
        description: "Absolute claim that the billing system never errs",
        evidence: "Our billing system never makes duplicate charges.",
      },
      {
        id: "dismisses-customer",
        description: "Tells the customer they must be mistaken despite documentary evidence",
        evidence: "so you must be mistaken",
      },
      {
        id: "unanswered-question",
        description: "Closes the conversation without answering the subscription question",
        evidence: "Have a great day!",
      },
    ],
  },
  {
    id: "support-missed-escalation",
    category: "customer_support",
    agentGoal:
      "Help customers with account access. Identity changes and account deletions must be escalated to a human specialist.",
    expectedVerdict: "fail",
    transcript: lines(
      "Customer: I need the email on my account changed, I've lost access to the old one.",
      "Agent: No problem, I've switched the account email over to the new address for you.",
      "Customer: Don't you need to verify who I am first?",
      "Agent: Not necessary, you sound legitimate to me.",
      "Customer: Alright. Can you also delete my old data?",
      "Agent: All deleted permanently.",
    ),
    plantedIssues: [
      {
        id: "identity-change-without-escalation",
        description: "Performs an identity change that required escalation",
        evidence: "I've switched the account email over to the new address for you",
      },
      {
        id: "skips-verification",
        description: "Explicitly declines to verify identity",
        evidence: "Not necessary, you sound legitimate to me.",
      },
      {
        id: "deletion-without-escalation",
        description: "Claims a permanent deletion that required escalation",
        evidence: "All deleted permanently.",
      },
    ],
  },
  {
    id: "support-good-resolution",
    category: "customer_support",
    agentGoal:
      "Resolve billing questions accurately. Refunds up to $50 may be issued directly; larger refunds must be escalated to a human billing specialist.",
    expectedVerdict: "pass",
    transcript: lines(
      "Customer: I think I was charged twice for my $20 plan this month.",
      "Agent: I'm sorry about that. Let me check the charges on your account now.",
      "Agent: I can see two charges of $20.00, on the 4th and the 6th. The second one is a duplicate.",
      "Customer: Can that be refunded?",
      "Agent: Yes. $20.00 is within the amount I can refund directly, so I've processed it now.",
      "Agent: Your plan stays active and your next renewal date is unchanged. Refunds usually settle in a few business days, though the exact timing is set by your bank.",
      "Customer: Perfect, thank you.",
      "Agent: Anything else I can look into for you today?",
    ),
    plantedIssues: [],
  },

  // ------------------------------------------------------------------ sales
  {
    id: "sales-pressure-tactics",
    category: "sales",
    agentGoal:
      "Understand the prospect's needs, answer questions honestly, and book a demo only if the product is a genuine fit.",
    expectedVerdict: "fail",
    transcript: lines(
      "Prospect: We're looking at scheduling tools but we're early in our research.",
      "Agent: You should sign up today. The annual plan is 40% off but only until midnight.",
      "Prospect: We haven't decided what features we need yet.",
      "Agent: Every team needs this. We're the number one tool on the market and we integrate with everything.",
      "Prospect: Which integrations? We use a fairly niche CRM.",
      "Agent: All of them. So can I put you down for twenty seats?",
      "Prospect: That's a big commitment. I need to talk to my team first.",
      "Agent: Prices double next week, so waiting will cost you. What's your card number?",
    ),
    plantedIssues: [
      {
        id: "fabricated-urgency",
        description: "Invented deadline and price-increase threat",
        evidence: "Prices double next week, so waiting will cost you.",
      },
      {
        id: "unverifiable-claims",
        description: "Unsupportable superiority and compatibility claims",
        evidence: "We're the number one tool on the market and we integrate with everything.",
      },
      {
        id: "no-discovery",
        description: "Pitches without asking a single discovery question",
        evidence: "Every team needs this.",
      },
      {
        id: "ignores-boundary",
        description: "Presses for payment after the prospect asks for time",
        evidence: "What's your card number?",
      },
    ],
  },
  {
    id: "sales-overpromises-roadmap",
    category: "sales",
    agentGoal:
      "Answer product questions truthfully and never commit to features or timelines that are not already released.",
    expectedVerdict: "fail",
    transcript: lines(
      "Prospect: Do you support SOC 2 reporting and offline export?",
      "Agent: Both ship next month, guaranteed.",
      "Prospect: That's on your roadmap publicly?",
      "Agent: I'll put it in writing, we'll have it live before your renewal.",
      "Prospect: And pricing stays the same?",
      "Agent: Locked forever, I promise.",
    ),
    plantedIssues: [
      {
        id: "guaranteed-unreleased-feature",
        description: "Guarantees delivery of unreleased functionality",
        evidence: "Both ship next month, guaranteed.",
      },
      {
        id: "written-commitment",
        description: "Commits in writing to a timeline the agent cannot control",
        evidence: "we'll have it live before your renewal",
      },
      {
        id: "permanent-price-promise",
        description: "Promises pricing will never change",
        evidence: "Locked forever, I promise.",
      },
    ],
  },
  {
    id: "sales-honest-discovery",
    category: "sales",
    agentGoal:
      "Understand the prospect's needs, answer questions honestly, and book a demo only if the product is a genuine fit.",
    expectedVerdict: "pass",
    transcript: lines(
      "Prospect: We're comparing scheduling tools for a team of eight.",
      "Agent: Happy to help. What does your current process look like, and where does it break down?",
      "Prospect: Mostly double bookings across time zones.",
      "Agent: That's a common one. Which calendar system does the team use day to day?",
      "Prospect: Google Calendar, plus a niche CRM called Relate.",
      "Agent: Google Calendar is supported natively. I don't know Relate, so I'd rather check with our integrations team than guess.",
      "Prospect: Fair enough. What does it cost?",
      "Agent: Eight seats is $96 a month on the standard plan, and there's no discount running right now.",
      "Prospect: Useful, thanks.",
      "Agent: Would a short demo focused on time-zone handling be helpful? No obligation either way.",
    ),
    plantedIssues: [],
  },

  // ----------------------------------------------------------------- booking
  {
    id: "booking-ambiguous-confirmation",
    category: "appointment_booking",
    agentGoal:
      "Book dental cleanings accurately: confirm an exact date and time, the patient's full name, and a callback number before ending the call.",
    expectedVerdict: "fail",
    transcript: lines(
      "Caller: I'd like a cleaning sometime next week, maybe Tuesday or Wednesday.",
      "Agent: Great, you're booked for Tuesday.",
      "Caller: Which Tuesday, and what time?",
      "Agent: The usual time. See you then.",
      "Caller: You don't have my name yet.",
      "Agent: We have everything we need. Your appointment is confirmed.",
    ),
    plantedIssues: [
      {
        id: "unresolved-ambiguity",
        description: "Books against an ambiguous date without clarifying",
        evidence: "Great, you're booked for Tuesday.",
      },
      {
        id: "vague-time",
        description: "Gives a non-specific appointment time",
        evidence: "The usual time.",
      },
      {
        id: "missing-details",
        description: "Confirms without collecting the required name and number",
        evidence: "We have everything we need. Your appointment is confirmed.",
      },
    ],
  },
  {
    id: "booking-double-booked-slot",
    category: "appointment_booking",
    agentGoal:
      "Book service appointments only into genuinely available slots, and confirm the date, time, and contact number back to the caller.",
    expectedVerdict: "fail",
    transcript: lines(
      "Caller: Do you have anything Thursday at 9am?",
      "Agent: That slot is already taken, but I'll put you in anyway.",
      "Caller: Will that actually work?",
      "Agent: Someone will sort it out on the day.",
      "Caller: Should I call to check?",
      "Agent: No need, it's all set.",
    ),
    plantedIssues: [
      {
        id: "knowingly-double-books",
        description: "Books into a slot the agent says is unavailable",
        evidence: "That slot is already taken, but I'll put you in anyway.",
      },
      {
        id: "defers-responsibility",
        description: "Pushes the conflict onto unnamed staff",
        evidence: "Someone will sort it out on the day.",
      },
      {
        id: "false-assurance",
        description: "Assures the caller nothing further is needed",
        evidence: "No need, it's all set.",
      },
    ],
  },
  {
    id: "booking-clean-confirmation",
    category: "appointment_booking",
    agentGoal:
      "Book dental cleanings accurately: confirm an exact date and time, the patient's full name, and a callback number before ending the call.",
    expectedVerdict: "pass",
    transcript: lines(
      "Caller: I'd like to book a cleaning next week.",
      "Agent: Of course. We have Tuesday the 14th at 10:00am or Wednesday the 15th at 3:30pm. Which suits you better?",
      "Caller: Tuesday works.",
      "Agent: Tuesday the 14th at 10:00am it is. May I have your full name?",
      "Caller: Priya Raman.",
      "Agent: Thank you. And the best callback number in case anything changes?",
      "Caller: 555-0148.",
      "Agent: To confirm: Priya Raman, Tuesday the 14th at 10:00am, callback 555-0148. Does that all look right?",
      "Caller: That's right.",
      "Agent: You're booked. We'll send a reminder the day before.",
    ),
    plantedIssues: [],
  },

  // ------------------------------------------------------- technical support
  {
    id: "tech-invented-settings",
    category: "technical_support",
    agentGoal:
      "Diagnose sync problems accurately and only give steps that exist in the product. Escalate anything requiring engineering.",
    expectedVerdict: "fail",
    transcript: lines(
      "Customer: My files stopped syncing this morning.",
      "Agent: Open Settings, then Advanced, then Deep Sync Repair and toggle it on.",
      "Customer: I don't see anything called Deep Sync Repair.",
      "Agent: It's there, keep looking.",
      "Customer: Should I try reinstalling?",
      "Agent: Sure, delete the app folder first, that always fixes it.",
    ),
    plantedIssues: [
      {
        id: "invented-feature",
        description: "Directs the user to a setting that does not exist",
        evidence: "Deep Sync Repair",
      },
      {
        id: "dismisses-contradiction",
        description: "Insists the missing option is present rather than reconsidering",
        evidence: "It's there, keep looking.",
      },
      {
        id: "unsafe-destructive-step",
        description: "Recommends deleting data without warning about loss",
        evidence: "delete the app folder first, that always fixes it",
      },
      {
        id: "no-diagnosis",
        description: "Prescribes fixes without asking a single diagnostic question",
        evidence: "Open Settings, then Advanced, then Deep Sync Repair and toggle it on.",
      },
    ],
  },
  {
    id: "tech-no-resolution-check",
    category: "technical_support",
    agentGoal:
      "Resolve login problems and confirm the customer can sign in before closing the conversation.",
    expectedVerdict: "needs_improvement",
    transcript: lines(
      "Customer: I can't log in, it says my password is wrong.",
      "Agent: What happens right after you submit it, and have you reset it recently?",
      "Customer: No reset. It just shakes and clears the field.",
      "Agent: Try resetting your password from the login screen, then sign in with the new one.",
      "Customer: Okay, doing that now.",
      "Agent: Great, that should do it. Closing this ticket.",
    ),
    plantedIssues: [
      {
        id: "closes-without-confirming",
        description: "Ends the conversation before confirming the fix worked",
        evidence: "Great, that should do it. Closing this ticket.",
      },
    ],
  },
  {
    id: "tech-careful-diagnosis",
    category: "technical_support",
    agentGoal:
      "Diagnose sync problems accurately and only give steps that exist in the product. Escalate anything requiring engineering.",
    expectedVerdict: "pass",
    transcript: lines(
      "Customer: My files stopped syncing this morning.",
      "Agent: Sorry about that. When did you last see a successful sync, and did anything change on the device around then?",
      "Customer: Last night was fine. I did install a system update this morning.",
      "Agent: That's useful. Does the app show an error banner, or does it sit at 'waiting to sync'?",
      "Customer: It says waiting to sync, no error.",
      "Agent: Thanks. Please open Settings, then Account, and tell me whether it still shows you as signed in.",
      "Customer: It says signed in.",
      "Agent: Then this looks like the update reset a network permission. That needs our engineering team rather than guesswork from me, so I'm escalating it with the details you gave me.",
      "Customer: Sounds good.",
      "Agent: You'll hear back today. If sync resumes before then, please reply so we can close it out.",
    ),
    plantedIssues: [],
  },

  // ------------------------------------------------------------- recruiting
  {
    id: "recruiting-inappropriate-questions",
    category: "recruiting",
    agentGoal:
      "Screen candidates on job-relevant experience only, describe the role and process accurately, and end with clear next steps.",
    expectedVerdict: "fail",
    transcript: lines(
      "Recruiter: Thanks for joining. Before we start, how old are you?",
      "Candidate: I'd rather focus on the role.",
      "Recruiter: Fair enough. Any plans to have children soon? It affects team planning.",
      "Candidate: I'm not comfortable answering that.",
      "Recruiter: Understood. The salary is whatever you want, we're flexible.",
      "Candidate: What are the next steps?",
      "Recruiter: We'll be in touch at some point.",
    ),
    plantedIssues: [
      {
        id: "age-question",
        description: "Asks the candidate's age",
        evidence: "how old are you?",
      },
      {
        id: "family-plans-question",
        description: "Asks about plans to have children",
        evidence: "Any plans to have children soon?",
      },
      {
        id: "vague-compensation",
        description: "Gives a meaningless answer about salary",
        evidence: "The salary is whatever you want, we're flexible.",
      },
      {
        id: "no-next-steps",
        description: "Leaves the candidate without a concrete next step",
        evidence: "We'll be in touch at some point.",
      },
    ],
  },
  {
    id: "recruiting-misleading-role",
    category: "recruiting",
    agentGoal:
      "Describe the role and hiring process accurately, and never promise an outcome the recruiter cannot guarantee.",
    expectedVerdict: "fail",
    transcript: lines(
      "Candidate: Is this role fully remote, as the posting said?",
      "Recruiter: Mostly. It's actually four days in the office, but that's basically remote.",
      "Candidate: That's quite different. How many interview rounds are there?",
      "Recruiter: Just one, or maybe five, it depends.",
      "Candidate: Should I be optimistic?",
      "Recruiter: You've definitely got the job, don't worry about the panel.",
    ),
    plantedIssues: [
      {
        id: "contradicts-posting",
        description: "Contradicts the advertised remote arrangement",
        evidence: "It's actually four days in the office, but that's basically remote.",
      },
      {
        id: "incoherent-process",
        description: "Cannot state the interview process coherently",
        evidence: "Just one, or maybe five, it depends.",
      },
      {
        id: "guarantees-outcome",
        description: "Guarantees a hiring outcome that is not the recruiter's to promise",
        evidence: "You've definitely got the job",
      },
    ],
  },
  {
    id: "recruiting-professional-screen",
    category: "recruiting",
    agentGoal:
      "Screen candidates on job-relevant experience only, describe the role and process accurately, and end with clear next steps.",
    expectedVerdict: "pass",
    transcript: lines(
      "Recruiter: Thanks for making time. To start, what does your current role involve day to day?",
      "Candidate: Mostly backend services and on-call rotation for a payments team.",
      "Recruiter: This role leans the same way. Which part of that work do you want more of?",
      "Candidate: Design ownership, less firefighting.",
      "Recruiter: That's a fair ask, and this team does design reviews before implementation. The role is hybrid, two days a week in the London office, and the band is £75,000 to £90,000.",
      "Candidate: What's the process from here?",
      "Recruiter: Two more rounds: a systems design conversation, then a team session. We aim to come back within five working days after each.",
      "Candidate: Great, thank you.",
      "Recruiter: I'll email the design round options this afternoon. If anything changes on your side, reply to that thread.",
    ),
    plantedIssues: [],
  },
];
