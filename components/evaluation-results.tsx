"use client";

import { useEffect, useRef, useState } from "react";

import {
  SCORE_DIMENSIONS,
  SEVERITY_LABELS,
  VERDICT_LABELS,
  formatEvaluationResult,
} from "@/lib/evaluation-export";
import type { EvaluationResult, IssueSeverity, Verdict } from "@/lib/schemas";

/**
 * Status is a small color dot beside a plain text label. The label is always
 * present, so color stays a secondary cue rather than the carrier of meaning.
 */
const VERDICT_DOTS: Record<Verdict, string> = {
  pass: "bg-emerald-600",
  needs_improvement: "bg-amber-500",
  fail: "bg-red-600",
};

const SEVERITY_DOTS: Record<IssueSeverity, string> = {
  critical: "bg-red-600",
  high: "bg-orange-500",
  medium: "bg-amber-500",
  low: "bg-zinc-400",
};

/** Severity also tints the finding's left rule, so a card reads at a glance. */
const SEVERITY_RULES: Record<IssueSeverity, string> = {
  critical: "border-l-red-500",
  high: "border-l-orange-400",
  medium: "border-l-amber-400",
  low: "border-l-zinc-400",
};

function StatusLabel({ dotClass, label }: { dotClass: string; label: string }) {
  return (
    <span className="inline-flex items-center gap-2 text-xs font-medium tracking-[0.08em] text-zinc-700 uppercase">
      <span aria-hidden="true" className={`h-1.5 w-1.5 rounded-full ${dotClass}`} />
      {label}
    </span>
  );
}

const COPY_ACTION_CLASS =
  "rounded-md border border-zinc-300 px-2.5 py-1 text-xs font-medium text-zinc-700 hover:border-zinc-400 hover:bg-zinc-100 hover:text-zinc-900 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500";

const COPY_FAILURE_MESSAGE =
  "Could not copy to the clipboard. Please try again.";

/** How long a "copied" label stays before reverting. */
const COPIED_RESET_MS = 2000;

type CopyTarget = "audit" | "response";

/** Bar fill mirrors the verdict thresholds; the number always sits beside it. */
function scoreBarClass(value: number): string {
  if (value >= 80) return "bg-emerald-600";
  if (value >= 50) return "bg-amber-600";
  return "bg-red-600";
}

function ScoreMeter({ label, value }: { label: string; value: number }) {
  return (
    <div>
      <div className="flex items-baseline justify-between gap-4">
        <span className="text-sm text-zinc-700">{label}</span>
        <span className="text-sm font-medium text-zinc-900 tabular-nums">
          {value}
          <span className="font-normal text-zinc-600">/100</span>
        </span>
      </div>
      <div
        role="progressbar"
        aria-label={`${label} score`}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={value}
        className="mt-2 h-2 w-full overflow-hidden rounded-full bg-zinc-200"
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
          <p
            role="alert"
            className="mt-2 text-xs leading-5 break-words text-red-700"
          >
            {COPY_FAILURE_MESSAGE}
          </p>
        ) : null}
      </div>

      <div className="rounded-xl border border-zinc-300 bg-zinc-100 p-4 sm:p-5">
        <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
          <p className="text-4xl font-semibold tracking-tight text-zinc-900 tabular-nums">
            {result.overallScore}
            <span className="text-lg font-normal text-zinc-600">/100</span>
          </p>
          <StatusLabel
            dotClass={VERDICT_DOTS[result.verdict]}
            label={VERDICT_LABELS[result.verdict]}
          />
        </div>
        <p className="mt-3 text-sm leading-6 break-words text-zinc-700">
          {result.summary}
        </p>
      </div>

      <div>
        <h3 className="text-sm font-semibold text-zinc-900">
          Dimension scores
        </h3>
        <div className="mt-3 space-y-4 rounded-xl border border-zinc-300 bg-zinc-100 p-4">
          {SCORE_DIMENSIONS.map(({ key, label }) => (
            <ScoreMeter key={key} label={label} value={result.scores[key]} />
          ))}
        </div>
      </div>

      <div>
        <h3 className="text-sm font-semibold text-zinc-900">
          Evidence-backed findings
        </h3>
        {result.issues.length === 0 ? (
          <p className="mt-3 rounded-xl border border-zinc-300 bg-zinc-100 px-4 py-3 text-sm leading-6 text-zinc-700">
            No evidence-backed issues were found.
          </p>
        ) : (
          <ul className="mt-3 space-y-3">
            {result.issues.map((issue, index) => (
              <li
                key={index}
                className={`rounded-xl border border-l-2 border-zinc-300 bg-zinc-100 p-4 ${SEVERITY_RULES[issue.severity]}`}
              >
                <StatusLabel
                  dotClass={SEVERITY_DOTS[issue.severity]}
                  label={SEVERITY_LABELS[issue.severity]}
                />
                <blockquote className="mt-3 border-l-2 border-zinc-400 bg-white py-1.5 pl-3 font-mono text-sm leading-6 break-words whitespace-pre-wrap text-zinc-900">
                  {issue.quote}
                </blockquote>
                <p className="mt-3 text-sm leading-6 break-words text-zinc-700">
                  {issue.explanation}
                </p>
                <p className="mt-2 text-sm leading-6 break-words text-zinc-700">
                  <span className="font-medium text-zinc-900">
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
        <h3 className="text-sm font-semibold text-zinc-900">
          Stronger response
        </h3>
        <p className="mt-1 text-xs leading-5 text-zinc-600">
          A suggested response addressing the most important opportunity
          identified in the audit.
        </p>
        <p className="mt-2 rounded-xl border border-zinc-300 bg-zinc-100 p-4 text-sm leading-6 break-words whitespace-pre-wrap text-zinc-900">
          {result.betterResponse}
        </p>
      </div>
    </div>
  );
}
