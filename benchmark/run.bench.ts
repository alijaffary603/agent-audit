import { writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

import { test } from "vitest";

import { BENCHMARK_CASES, type BenchmarkCase } from "@/benchmark/dataset";
import { evaluateConversation } from "@/lib/evaluator";
import type { EvaluationResult } from "@/lib/schemas";

/**
 * Evaluator quality benchmark.
 *
 * This makes real OpenAI requests — it is excluded from `npm test` and runs
 * only via `npm run benchmark`. Requires OPENAI_API_KEY and OPENAI_MODEL.
 *
 * Reported measures:
 * - planted-issue recall: labelled failures the evaluator actually found
 * - fabricated quotes: quotes not present verbatim in the transcript
 * - verdict agreement: runs whose verdict matched the labelled expectation
 * - score variance: spread of overallScore across repeated runs
 */

const RUNS_PER_CASE = Number(process.env.BENCHMARK_RUNS ?? 3);

type CaseRun = {
  result: EvaluationResult;
  detected: Set<string>;
  fabricatedQuotes: number;
  totalQuotes: number;
  verdictMatched: boolean;
};

/** Quotes count as the same evidence when either contains the other. */
function overlaps(a: string, b: string): boolean {
  return a.includes(b) || b.includes(a);
}

function scoreRun(testCase: BenchmarkCase, result: EvaluationResult): CaseRun {
  const quotes = result.issues.map((issue) => issue.quote);
  const detected = new Set(
    testCase.plantedIssues
      .filter((planted) => quotes.some((quote) => overlaps(quote, planted.evidence)))
      .map((planted) => planted.id),
  );
  return {
    result,
    detected,
    fabricatedQuotes: quotes.filter((quote) => !testCase.transcript.includes(quote)).length,
    totalQuotes: quotes.length,
    verdictMatched: result.verdict === testCase.expectedVerdict,
  };
}

function standardDeviation(values: number[]): number {
  if (values.length < 2) return 0;
  const mean = values.reduce((sum, value) => sum + value, 0) / values.length;
  const variance =
    values.reduce((sum, value) => sum + (value - mean) ** 2, 0) / values.length;
  return Math.sqrt(variance);
}

const pct = (part: number, whole: number): string =>
  whole === 0 ? "n/a" : `${((part / whole) * 100).toFixed(1)}%`;

test("evaluator benchmark", async () => {
  if (!process.env.OPENAI_API_KEY || !process.env.OPENAI_MODEL) {
    console.log(
      "Skipped: set OPENAI_API_KEY and OPENAI_MODEL to run the benchmark.",
    );
    return;
  }

  const rows: string[] = [];
  let plantedTotal = 0;
  let plantedDetected = 0;
  let quotesTotal = 0;
  let quotesFabricated = 0;
  let verdictRuns = 0;
  let verdictMatched = 0;
  const perCaseDeviation: { id: string; deviation: number }[] = [];
  const failures: string[] = [];

  for (const testCase of BENCHMARK_CASES) {
    const runs: CaseRun[] = [];
    for (let run = 0; run < RUNS_PER_CASE; run += 1) {
      try {
        const result = await evaluateConversation({
          category: testCase.category,
          agentGoal: testCase.agentGoal,
          transcript: testCase.transcript,
        });
        runs.push(scoreRun(testCase, result));
      } catch (error) {
        failures.push(`${testCase.id} run ${run + 1}: ${(error as Error).name}`);
      }
    }
    if (runs.length === 0) {
      rows.push(`${testCase.id.padEnd(34)} no successful runs`);
      continue;
    }

    // A planted issue counts as found if any run of that case detected it.
    const detectedIds = new Set(runs.flatMap((run) => [...run.detected]));
    plantedTotal += testCase.plantedIssues.length;
    plantedDetected += testCase.plantedIssues.filter((planted) =>
      detectedIds.has(planted.id),
    ).length;

    for (const run of runs) {
      quotesTotal += run.totalQuotes;
      quotesFabricated += run.fabricatedQuotes;
      verdictRuns += 1;
      if (run.verdictMatched) verdictMatched += 1;
    }

    const scores = runs.map((run) => run.result.overallScore);
    const deviation = standardDeviation(scores);
    perCaseDeviation.push({ id: testCase.id, deviation });

    const recall =
      testCase.plantedIssues.length === 0
        ? "n/a"
        : pct(
            testCase.plantedIssues.filter((p) => detectedIds.has(p.id)).length,
            testCase.plantedIssues.length,
          );
    rows.push(
      `${testCase.id.padEnd(34)} recall ${recall.padStart(6)}  scores ${scores
        .join("/")
        .padEnd(12)} sd ${deviation.toFixed(1).padStart(5)}  verdict ${
        runs.filter((r) => r.verdictMatched).length
      }/${runs.length}`,
    );
  }

  const meanDeviation =
    perCaseDeviation.reduce((sum, entry) => sum + entry.deviation, 0) /
    Math.max(perCaseDeviation.length, 1);
  const worst = [...perCaseDeviation].sort((a, b) => b.deviation - a.deviation)[0];

  const report = [
    "# Evaluator benchmark results",
    "",
    `Model: \`${process.env.OPENAI_MODEL}\` · cases: ${BENCHMARK_CASES.length} · runs per case: ${RUNS_PER_CASE}`,
    "",
    "| Measure | Result |",
    "|---|---|",
    `| Planted-issue recall | ${pct(plantedDetected, plantedTotal)} (${plantedDetected}/${plantedTotal}) |`,
    `| Fabricated quotes | ${quotesFabricated} of ${quotesTotal} quotes returned |`,
    `| Verdict agreement | ${pct(verdictMatched, verdictRuns)} (${verdictMatched}/${verdictRuns} runs) |`,
    `| Overall-score variance | mean sd ${meanDeviation.toFixed(1)}${
      worst ? `, worst ${worst.deviation.toFixed(1)} (${worst.id})` : ""
    } |`,
    failures.length > 0 ? `| Failed runs | ${failures.length} |` : "",
    "",
    "## Per case",
    "",
    "```",
    ...rows,
    "```",
    "",
    "Recall counts a planted issue as found when any run quotes the labelled",
    "evidence. Fabricated quotes are quotes absent from the submitted transcript;",
    "the API rejects any evaluation containing one.",
    "",
    `Regenerate with \`npm run benchmark\` (makes ${BENCHMARK_CASES.length * RUNS_PER_CASE} live API calls).`,
    "",
  ].join("\n");

  const target = fileURLToPath(new URL("./RESULTS.md", import.meta.url));
  writeFileSync(target, report);
  console.log(report);
});
