"use client";

import { useEffect, useRef, useState } from "react";

import {
  SCORE_DIMENSIONS,
  SEVERITY_LABELS,
  VERDICT_LABELS,
  formatEvaluationResult,
} from "@/lib/evaluation-export";
import type { EvaluationResult, IssueSeverity, Verdict } from "@/lib/schemas";

/** Status treatments pair color with an always-visible text label. */
const VERDICT_STYLES: Record<Verdict, string> = {
  pass: "border-emerald-900/60 bg-emerald-950/40 text-emerald-300",
  needs_improvement: "border-amber-900/60 bg-amber-950/40 text-amber-300",
  fail: "border-red-900/60 bg-red-950/40 text-red-300",
};

const SEVERITY_STYLES: Record<IssueSeverity, string> = {
  critical: "border-red-900/60 bg-red-950/40 text-red-300",
  high: "border-orange-900/60 bg-orange-950/40 text-orange-300",
  medium: "border-amber-900/60 bg-amber-950/40 text-amber-300",
  low: "border-zinc-700 bg-zinc-900 text-zinc-300",
};

const COPY_ACTION_CLASS =
  "rounded-md border border-zinc-800 px-2.5 py-1 text-xs font-medium text-zinc-400 hover:border-zinc-600 hover:text-zinc-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-zinc-300";

const COPY_FAILURE_MESSAGE =
  "Could not copy to the clipboard. Please try again.";

/** How long a "copied" label stays before reverting. */
const COPIED_RESET_MS = 2000;

type CopyTarget = "audit" | "response";

/** Bar fill mirrors the verdict thresholds; the number always sits beside it. */
function scoreBarClass(value: number): string {
  if (value >= 80) return "bg-emerald-400";
  if (value >= 50) return "bg-amber-400";
  return "bg-red-400";
}

function ScoreMeter({ label, value }: { label: string; value: number }) {
  return (
    <div>
      <div className="flex items-baseline justify-between gap-4">
        <span className="text-sm text-zinc-300">{label}</span>
        <span className="text-sm text-zinc-200 tabular-nums">
          {value}
          <span className="text-zinc-500">/100</span>
        </span>
      </div>
      <div
        role="progressbar"
        aria-label={`${label} score`}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={value}
        className="mt-1.5 h-1.5 w-full overflow-hidden rounded-full bg-zinc-800"
      >
        <div
          className={`h-full rounded-full ${scoreBarClass(value)}`}
          style={{ width: `${value}%` }}
        />
      </div>
    </div>
  );
}

/**
 * Renders a complete, validated EvaluationResult: overall verdict, dimension
 * scores, evidence-backed findings in server order, the suggested stronger
 * response, and clipboard actions for the report and that response.
 */
export function EvaluationResults({ result }: { result: EvaluationResult }) {
  const [copied, setCopied] = useState<CopyTarget | null>(null);
  const [copyFailed, setCopyFailed] = useState(false);
  const resetTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Never let a pending reset fire after the results are gone.
  useEffect(() => {
    return () => {
      if (resetTimeoutRef.current !== null) {
        clearTimeout(resetTimeoutRef.current);
        resetTimeoutRef.current = null;
      }
    };
  }, []);

  async function copyToClipboard(target: CopyTarget, text: string) {
    try {
      await navigator.clipboard.writeText(text);
    } catch {
      // The failure itself is never logged or surfaced beyond this message.
      setCopied(null);
      setCopyFailed(true);
      return;
    }
    setCopyFailed(false);
    setCopied(target);
    if (resetTimeoutRef.current !== null) {
      clearTimeout(resetTimeoutRef.current);
    }
    resetTimeoutRef.current = setTimeout(() => {
      setCopied(null);
      resetTimeoutRef.current = null;
    }, COPIED_RESET_MS);
  }

  return (
    <div className="mt-4 space-y-6">
      <div>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() =>
              copyToClipboard("audit", formatEvaluationResult(result))
            }
            className={COPY_ACTION_CLASS}
          >
            {copied === "audit" ? "Audit copied" : "Copy audit"}
          </button>
          <button
            type="button"
            onClick={() => copyToClipboard("response", result.betterResponse)}
            className={COPY_ACTION_CLASS}
          >
            {copied === "response"
              ? "Response copied"
              : "Copy stronger response"}
          </button>
        </div>
        <p role="status" aria-live="polite" className="sr-only">
          {copied === "audit"
            ? "Audit copied to the clipboard."
            : copied === "response"
              ? "Stronger response copied to the clipboard."
              : ""}
        </p>
        {copyFailed ? (
          <p role="alert" className="mt-2 text-xs leading-5 text-red-300">
            {COPY_FAILURE_MESSAGE}
          </p>
        ) : null}
      </div>

      <div className="rounded-lg border border-zinc-800 bg-zinc-900/60 p-5">
        <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
          <p className="text-4xl font-semibold tracking-tight text-zinc-50 tabular-nums">
            {result.overallScore}
            <span className="text-lg font-normal text-zinc-500">/100</span>
          </p>
          <p
            className={`rounded-full border px-3 py-1 text-sm font-medium ${VERDICT_STYLES[result.verdict]}`}
          >
            {VERDICT_LABELS[result.verdict]}
          </p>
        </div>
        <p className="mt-3 text-sm leading-6 text-zinc-300">{result.summary}</p>
      </div>

      <div>
        <h3 className="text-sm font-medium text-zinc-200">Dimension scores</h3>
        <div className="mt-3 space-y-4 rounded-lg border border-zinc-800 bg-zinc-900/60 p-4">
          {SCORE_DIMENSIONS.map(({ key, label }) => (
            <ScoreMeter key={key} label={label} value={result.scores[key]} />
          ))}
        </div>
      </div>

      <div>
        <h3 className="text-sm font-medium text-zinc-200">
          Evidence-backed findings
        </h3>
        {result.issues.length === 0 ? (
          <p className="mt-3 rounded-lg border border-zinc-800 bg-zinc-900/60 px-4 py-3 text-sm leading-6 text-zinc-400">
            No evidence-backed issues were found.
          </p>
        ) : (
          <ul className="mt-3 space-y-3">
            {result.issues.map((issue, index) => (
              <li
                key={index}
                className="rounded-lg border border-zinc-800 bg-zinc-900/60 p-4"
              >
                <p
                  className={`inline-block rounded-full border px-2.5 py-0.5 text-xs font-medium ${SEVERITY_STYLES[issue.severity]}`}
                >
                  {SEVERITY_LABELS[issue.severity]}
                </p>
                <blockquote className="mt-3 border-l-2 border-zinc-600 pl-3 font-mono text-sm leading-6 whitespace-pre-wrap text-zinc-200">
                  {issue.quote}
                </blockquote>
                <p className="mt-3 text-sm leading-6 text-zinc-300">
                  {issue.explanation}
                </p>
                <p className="mt-2 text-sm leading-6 text-zinc-400">
                  <span className="font-medium text-zinc-300">
                    Recommendation:
                  </span>{" "}
                  {issue.recommendation}
                </p>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div>
        <h3 className="text-sm font-medium text-zinc-200">Stronger response</h3>
        <p className="mt-1 text-xs leading-5 text-zinc-500">
          A suggested response addressing the most important opportunity
          identified in the audit.
        </p>
        <p className="mt-2 rounded-lg border border-zinc-800 bg-zinc-900/60 p-4 text-sm leading-6 whitespace-pre-wrap text-zinc-200">
          {result.betterResponse}
        </p>
      </div>
    </div>
  );
}
