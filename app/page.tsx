"use client";

import { useEffect, useRef, useState, type SubmitEvent } from "react";

import { AgentGoalInput } from "@/components/agent-goal-input";
import { CategorySelector } from "@/components/category-selector";
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

export default function Home() {
  const [category, setCategory] = useState<CategoryId>("customer_support");
  const [agentGoal, setAgentGoal] = useState("");
  const [transcript, setTranscript] = useState("");
  const [fieldErrors, setFieldErrors] = useState<EvaluationFieldErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [evaluationResult, setEvaluationResult] =
    useState<EvaluationResult | null>(null);
  const [submissionError, setSubmissionError] = useState<string | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  // Abort any in-flight evaluation when the page unmounts.
  useEffect(() => {
    return () => {
      abortControllerRef.current?.abort();
    };
  }, []);

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
      return;
    }

    setFieldErrors({});
    setSubmissionError(null);
    setEvaluationResult(null);

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
  }

  const isPristine =
    category === "customer_support" && agentGoal === "" && transcript === "";

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-1 flex-col px-6 py-10 sm:px-10">
      <header className="border-b border-zinc-800 pb-6">
        <h1 className="text-2xl font-semibold tracking-tight text-zinc-50">
          AgentAudit
        </h1>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-zinc-400">
          Paste an AI agent conversation transcript and get a structured,
          evidence-backed audit of how the agent performed.
        </p>
      </header>

      <main className="mt-8 grid flex-1 gap-6 lg:grid-cols-2">
        <section
          aria-labelledby="conversation-input-heading"
          className="flex min-h-64 flex-col rounded-xl border border-zinc-800 bg-zinc-900/40 p-6"
        >
          <div className="flex items-center justify-between gap-4">
            <h2
              id="conversation-input-heading"
              className="text-sm font-medium tracking-wide text-zinc-200 uppercase"
            >
              Conversation Input
            </h2>
            <button
              type="button"
              onClick={clearConversation}
              disabled={isPristine || isSubmitting}
              className="rounded-md border border-zinc-800 px-2.5 py-1 text-xs font-medium text-zinc-400 enabled:hover:border-zinc-600 enabled:hover:text-zinc-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-zinc-300 disabled:cursor-not-allowed disabled:opacity-40"
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
              className="space-y-4 disabled:opacity-70"
            >
              <SampleSelector onSelect={applySample} />
              <CategorySelector
                value={category}
                onChange={handleCategoryChange}
                error={fieldErrors.category}
              />
              <AgentGoalInput
                value={agentGoal}
                onChange={handleAgentGoalChange}
                error={fieldErrors.agentGoal}
              />
              <TranscriptEditor
                value={transcript}
                onChange={handleTranscriptChange}
                error={fieldErrors.transcript}
              />
              <button
                type="submit"
                className="block w-full rounded-lg bg-zinc-100 px-4 py-2 text-sm font-semibold text-zinc-900 hover:bg-white focus:outline-none focus-visible:ring-2 focus-visible:ring-zinc-300 focus-visible:ring-offset-2 focus-visible:ring-offset-zinc-950 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isSubmitting ? "Running audit…" : "Run audit"}
              </button>
            </fieldset>
          </form>
        </section>

        <section
          aria-labelledby="evaluation-results-heading"
          className="flex min-h-64 flex-col rounded-xl border border-zinc-800 bg-zinc-900/40 p-6"
        >
          <h2
            id="evaluation-results-heading"
            className="text-sm font-medium tracking-wide text-zinc-200 uppercase"
          >
            Evaluation Results
          </h2>
          {isSubmitting ? (
            <div className="mt-4 rounded-lg border border-zinc-800 bg-zinc-900/60 px-4 py-3">
              <p role="status" className="text-sm text-zinc-300">
                Evaluating the conversation…
              </p>
            </div>
          ) : submissionError !== null ? (
            <div className="mt-4 rounded-lg border border-red-900/60 bg-red-950/30 px-4 py-3">
              <p role="alert" className="text-sm text-red-300">
                {submissionError}
              </p>
            </div>
          ) : evaluationResult !== null ? (
            <div className="mt-4 rounded-lg border border-zinc-800 bg-zinc-900/60 px-4 py-3">
              <p role="status" className="text-sm text-zinc-300">
                Audit complete. Detailed results are ready.
              </p>
            </div>
          ) : (
            <div className="mt-4 flex flex-1 items-center justify-center rounded-lg border border-dashed border-zinc-800">
              <p className="px-6 py-10 text-center text-sm text-zinc-500">
                The audit report will render here.
              </p>
            </div>
          )}
        </section>
      </main>
    </div>
  );
}
