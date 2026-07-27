import type { EvaluationResult, IssueSeverity, Verdict } from "./schemas";

/** Human-readable verdict names, shared by the dashboard and the export. */
export const VERDICT_LABELS: Record<Verdict, string> = {
  pass: "Pass",
  needs_improvement: "Needs improvement",
  fail: "Fail",
};

/** Human-readable severity names, shared by the dashboard and the export. */
export const SEVERITY_LABELS: Record<IssueSeverity, string> = {
  critical: "Critical",
  high: "High",
  medium: "Medium",
  low: "Low",
};

/** The four score dimensions in display order. */
export const SCORE_DIMENSIONS: readonly {
  key: keyof EvaluationResult["scores"];
  label: string;
}[] = [
  { key: "goalCompletion", label: "Goal completion" },
  { key: "communication", label: "Communication" },
  { key: "accuracy", label: "Accuracy" },
  { key: "professionalism", label: "Professionalism" },
];

/**
 * Renders a completed audit as a readable plain-text report.
 *
 * Deterministic: the same result always produces the same text. The result is
 * never mutated, issue quotes and betterResponse line breaks are reproduced
 * exactly, and no timestamps, identifiers, prompts, model names, or debug
 * details are included.
 */
export function formatEvaluationResult(result: EvaluationResult): string {
  const lines: string[] = [
    "AgentAudit conversation audit",
    "",
    "OVERALL",
    `Score: ${result.overallScore}/100`,
    `Verdict: ${VERDICT_LABELS[result.verdict]}`,
    "",
    "SUMMARY",
    result.summary,
    "",
    "DIMENSION SCORES",
    ...SCORE_DIMENSIONS.map(
      ({ key, label }) => `${label}: ${result.scores[key]}/100`,
    ),
    "",
    "EVIDENCE-BACKED FINDINGS",
  ];

  if (result.issues.length === 0) {
    lines.push("No evidence-backed issues were found.");
  } else {
    result.issues.forEach((issue, index) => {
      if (index > 0) lines.push("");
      lines.push(`${index + 1}. ${SEVERITY_LABELS[issue.severity]}`);
      lines.push(`Quote: ${issue.quote}`);
      lines.push(`Explanation: ${issue.explanation}`);
      lines.push(`Recommendation: ${issue.recommendation}`);
    });
  }

  lines.push("", "STRONGER RESPONSE", result.betterResponse);

  return lines.join("\n");
}
