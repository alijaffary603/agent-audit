"use client";

import { useEffect, useRef, useState, type SubmitEvent } from "react";

import { AgentGoalInput } from "@/components/agent-goal-input";
import { CategorySelector } from "@/components/category-selector";
import { EvaluationResults } from "@/components/evaluation-results";
import { SampleSelector } from "@/components/sample-selector";
import { TranscriptEditor } from "@/components/transcript-editor";
import type { SampleConversation } from "@/data/samples";
import type { CategoryId } from "@/lib/categories";
import {
  EvaluationClientError,
  requestEvaluation,
} from "@/lib/evaluation-client";
import {
  validateEvaluationRequest,
  type EvaluationFieldErrors,
} from "@/lib/request-validation";
import type { EvaluationResult } from "@/lib/schemas";

function isAbortError(error: unknown): boolean {
  return (
    typeof error === "object" &&
    error !== null &&
    (error as { name?: unknown }).name === "AbortError"
  );
}

/** Request fields in the order they appear in the form. */
const FIELD_ORDER = [
  "category",
  "agentGoal",
  "transcript",
] as const satisfies readonly (keyof EvaluationFieldErrors)[];

export default function Home() {
  const [category, setCategory] = useState<CategoryId>("customer_support");
  const [agentGoal, setAgentGoal] = useState("");
  const [transcript, setTranscript] = useState("");
  const [fieldErrors, setFieldErrors] = useState<EvaluationFieldErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [evaluationResult, setEvaluationResult] =
    useState<EvaluationResult | null>(null);
  const [submissionError, setSubmissionError] = useState<string | null>(null);
  /**
   * UI only: whether the workspace has opened into its two-column form. Set
   * when a client-valid submission begins and cleared only by Clear
   * conversation, so loading, errors, and cleared results all keep the
   * workspace open. Never sent to the API and never persisted.
   */
  const [hasStartedAudit, setHasStartedAudit] = useState(false);
  const abortControllerRef = useRef<AbortController | null>(null);
  const resultsRef = useRef<HTMLElement>(null);
  const categoryRef = useRef<HTMLSelectElement>(null);
  const agentGoalRef = useRef<HTMLTextAreaElement>(null);
  const transcriptRef = useRef<HTMLTextAreaElement>(null);

  /**
   * Moves focus to the first field the validator rejected, in form order.
   * The lookup is keyed by the error map's own field names, so a new request
   * field cannot be added without giving it a focus target.
   */
  function focusFirstInvalidField(errors: EvaluationFieldErrors) {
    const focusTargets: Record<
      keyof EvaluationFieldErrors,
      () => HTMLElement | null
    > = {
      category: () => categoryRef.current,
      agentGoal: () => agentGoalRef.current,
      transcript: () => transcriptRef.current,
    };
    for (const field of FIELD_ORDER) {
      if (errors[field] !== undefined) {
        focusTargets[field]()?.focus();
        return;
      }
    }
  }

  // Abort any in-flight evaluation when the page unmounts.
  useEffect(() => {
    return () => {
      abortControllerRef.current?.abort();
    };
  }, []);

  /**
   * On stacked layouts the results panel opens below the form, so bring it
   * into view when it would otherwise sit off-screen. Wide layouts place it
   * beside the form and are left alone.
   */
  useEffect(() => {
    if (!hasStartedAudit) return;
    const region = resultsRef.current;
    if (region === null) return;
    if (window.matchMedia("(min-width: 64rem)").matches) return;
    if (region.getBoundingClientRect().top <= window.innerHeight) return;
    const reduceMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;
    region.scrollIntoView({
      block: "nearest",
      behavior: reduceMotion ? "auto" : "smooth",
    });
  }, [hasStartedAudit]);

  function cancelActiveRequest() {
    abortControllerRef.current?.abort();
    abortControllerRef.current = null;
    setIsSubmitting(false);
  }

  function clearFieldError(field: keyof EvaluationFieldErrors) {
    setFieldErrors((previous) => {
      if (!(field in previous)) return previous;
      const next = { ...previous };
      delete next[field];
      return next;
    });
  }

  /** Any edit invalidates stale outcomes along with that field's error. */
  function handleFieldEdited(field: keyof EvaluationFieldErrors) {
    clearFieldError(field);
    setSubmissionError(null);
    setEvaluationResult(null);
  }

  function handleCategoryChange(value: CategoryId) {
    setCategory(value);
    handleFieldEdited("category");
  }

  function handleAgentGoalChange(value: string) {
    setAgentGoal(value);
    handleFieldEdited("agentGoal");
  }

  function handleTranscriptChange(value: string) {
    setTranscript(value);
    handleFieldEdited("transcript");
  }

  async function handleSubmit(event: SubmitEvent<HTMLFormElement>) {
    event.preventDefault();
    const validation = validateEvaluationRequest({
      category,
      agentGoal,
      transcript,
    });
    if (!validation.success) {
      setFieldErrors(validation.errors);
      setSubmissionError(null);
      setEvaluationResult(null);
      focusFirstInvalidField(validation.errors);
      return;
    }

    setFieldErrors({});
    setSubmissionError(null);
    setEvaluationResult(null);
    // Only a client-valid submission opens the workspace.
    setHasStartedAudit(true);

    // A newer submission owns the state from here on; any previous request
    // is aborted and its handlers become no-ops via the controller check.
    abortControllerRef.current?.abort();
    const controller = new AbortController();
    abortControllerRef.current = controller;
    setIsSubmitting(true);

    try {
      const result = await requestEvaluation(validation.data, controller.signal);
      if (abortControllerRef.current !== controller) return;
      setEvaluationResult(result);
    } catch (error) {
      if (abortControllerRef.current !== controller) return;
      if (isAbortError(error)) return;
      if (error instanceof EvaluationClientError) {
        if (error.fieldErrors !== undefined) setFieldErrors(error.fieldErrors);
        setSubmissionError(error.message);
      } else {
        setSubmissionError("Unable to complete the audit. Please try again.");
      }
    } finally {
      if (abortControllerRef.current === controller) {
        abortControllerRef.current = null;
        setIsSubmitting(false);
      }
    }
  }

  function applySample(sample: SampleConversation) {
    cancelActiveRequest();
    setCategory(sample.category);
    setAgentGoal(sample.agentGoal);
    setTranscript(sample.transcript);
    setFieldErrors({});
    setSubmissionError(null);
    setEvaluationResult(null);
  }

  function clearConversation() {
    cancelActiveRequest();
    setCategory("customer_support");
    setAgentGoal("");
    setTranscript("");
    setFieldErrors({});
    setSubmissionError(null);
    setEvaluationResult(null);
    // Clearing is the only path back to the centered starting layout.
    setHasStartedAudit(false);
  }

  const isPristine =
    category === "customer_support" && agentGoal === "" && transcript === "";

  return (
    <div
      className={`mx-auto flex w-full flex-1 flex-col px-4 py-8 transition-[max-width] duration-[450ms] ease-[cubic-bezier(0.22,1,0.36,1)] motion-reduce:transition-none sm:px-6 sm:py-10 lg:px-10 ${
        hasStartedAudit ? "max-w-6xl" : "max-w-2xl"
      }`}
    >
      <header className="border-b border-zinc-300 pb-6">
        <h1 className="text-2xl font-semibold tracking-tight text-zinc-900 sm:text-3xl">
          AgentAudit
        </h1>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-zinc-600">
          Paste an AI agent conversation transcript and get a structured,
          evidence-backed audit of how the agent performed.
        </p>
      </header>

      {/*
        The second track animates open from zero width instead of the column
        count flipping, so the form panel never snaps to half width before
        settling.
      */}
      <main
        className={`mt-8 grid flex-1 transition-[grid-template-columns,gap] duration-[450ms] ease-[cubic-bezier(0.22,1,0.36,1)] motion-reduce:transition-none ${
          hasStartedAudit
            ? "gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] lg:gap-8"
            : "gap-0 lg:grid-cols-[minmax(0,1fr)_minmax(0,0fr)]"
        }`}
      >
        <section
          aria-labelledby="conversation-input-heading"
          className="flex min-h-64 min-w-0 flex-col rounded-xl border border-zinc-300 bg-white p-5 shadow-sm sm:p-6"
        >
          <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2">
            <h2
              id="conversation-input-heading"
              className="text-sm font-semibold tracking-wide text-zinc-900 uppercase"
            >
              Conversation Input
            </h2>
            <button
              type="button"
              onClick={clearConversation}
              disabled={isPristine || isSubmitting}
              className="rounded-md border border-zinc-300 px-2.5 py-1 text-xs font-medium text-zinc-700 enabled:hover:border-zinc-400 enabled:hover:bg-zinc-100 enabled:hover:text-zinc-900 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Clear conversation
            </button>
          </div>
          <form
            onSubmit={handleSubmit}
            noValidate
            aria-busy={isSubmitting}
            className="mt-4"
          >
            <fieldset
              disabled={isSubmitting}
              className="space-y-4 disabled:opacity-80"
            >
              <SampleSelector onSelect={applySample} />
              <CategorySelector
                ref={categoryRef}
                value={category}
                onChange={handleCategoryChange}
                error={fieldErrors.category}
              />
              <AgentGoalInput
                ref={agentGoalRef}
                value={agentGoal}
                onChange={handleAgentGoalChange}
                error={fieldErrors.agentGoal}
              />
              <TranscriptEditor
                ref={transcriptRef}
                value={transcript}
                onChange={handleTranscriptChange}
                error={fieldErrors.transcript}
              />
              <button
                type="submit"
                className="block w-full rounded-lg bg-zinc-900 px-4 py-2.5 text-sm font-semibold text-white hover:bg-zinc-800 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2 focus-visible:ring-offset-white disabled:cursor-not-allowed disabled:opacity-50"
              >
                {isSubmitting ? "Running audit…" : "Run audit"}
              </button>
            </fieldset>
          </form>
        </section>

        {hasStartedAudit ? (
          <section
            ref={resultsRef}
            aria-labelledby="evaluation-results-heading"
            className="results-enter flex min-h-64 min-w-0 flex-col rounded-xl border border-zinc-300 bg-white p-5 shadow-sm sm:p-6"
          >
            <h2
              id="evaluation-results-heading"
              className="text-sm font-semibold tracking-wide text-zinc-900 uppercase"
            >
              Evaluation Results
            </h2>
            {isSubmitting ? (
              <div className="mt-4 rounded-lg border border-zinc-300 bg-zinc-100 px-4 py-3">
                <p role="status" className="text-sm text-zinc-800">
                  Evaluating the conversation…
                </p>
              </div>
            ) : submissionError !== null ? (
              <div className="mt-4 rounded-lg border border-red-300 bg-red-50 px-4 py-3">
                <p role="alert" className="text-sm break-words text-red-800">
                  {submissionError}
                </p>
              </div>
            ) : evaluationResult !== null ? (
              <EvaluationResults result={evaluationResult} />
            ) : (
              <div className="mt-4 flex flex-1 items-center justify-center rounded-lg border border-dashed border-zinc-300">
                <p className="px-6 py-10 text-center text-sm text-zinc-600">
                  The audit report will render here.
                </p>
              </div>
            )}
          </section>
        ) : null}
      </main>
    </div>
  );
}
