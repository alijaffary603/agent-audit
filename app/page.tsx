"use client";

import { useState, type SubmitEvent } from "react";

import { AgentGoalInput } from "@/components/agent-goal-input";
import { CategorySelector } from "@/components/category-selector";
import { SampleSelector } from "@/components/sample-selector";
import { TranscriptEditor } from "@/components/transcript-editor";
import type { SampleConversation } from "@/data/samples";
import type { CategoryId } from "@/lib/categories";
import {
  validateEvaluationRequest,
  type EvaluationFieldErrors,
} from "@/lib/request-validation";

export default function Home() {
  const [category, setCategory] = useState<CategoryId>("customer_support");
  const [agentGoal, setAgentGoal] = useState("");
  const [transcript, setTranscript] = useState("");
  const [fieldErrors, setFieldErrors] = useState<EvaluationFieldErrors>({});
  const [validated, setValidated] = useState(false);

  function clearFieldError(field: keyof EvaluationFieldErrors) {
    setFieldErrors((previous) => {
      if (!(field in previous)) return previous;
      const next = { ...previous };
      delete next[field];
      return next;
    });
  }

  function handleCategoryChange(value: CategoryId) {
    setCategory(value);
    clearFieldError("category");
  }

  function handleAgentGoalChange(value: string) {
    setAgentGoal(value);
    clearFieldError("agentGoal");
  }

  function handleTranscriptChange(value: string) {
    setTranscript(value);
    clearFieldError("transcript");
  }

  function handleSubmit(event: SubmitEvent<HTMLFormElement>) {
    event.preventDefault();
    const result = validateEvaluationRequest({
      category,
      agentGoal,
      transcript,
    });
    if (!result.success) {
      setFieldErrors(result.errors);
      setValidated(false);
      return;
    }
    setFieldErrors({});
    setValidated(true);
  }

  function applySample(sample: SampleConversation) {
    setCategory(sample.category);
    setAgentGoal(sample.agentGoal);
    setTranscript(sample.transcript);
    setFieldErrors({});
  }

  function clearConversation() {
    setCategory("customer_support");
    setAgentGoal("");
    setTranscript("");
    setFieldErrors({});
    setValidated(false);
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
              disabled={isPristine}
              className="rounded-md border border-zinc-800 px-2.5 py-1 text-xs font-medium text-zinc-400 enabled:hover:border-zinc-600 enabled:hover:text-zinc-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-zinc-300 disabled:cursor-not-allowed disabled:opacity-40"
            >
              Clear conversation
            </button>
          </div>
          <form onSubmit={handleSubmit} noValidate className="mt-4 space-y-4">
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
              className="block w-full rounded-lg bg-zinc-100 px-4 py-2 text-sm font-semibold text-zinc-900 hover:bg-white focus:outline-none focus-visible:ring-2 focus-visible:ring-zinc-300 focus-visible:ring-offset-2 focus-visible:ring-offset-zinc-950"
            >
              Run audit
            </button>
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
          {validated ? (
            <div className="mt-4 rounded-lg border border-zinc-800 bg-zinc-900/60 px-4 py-3">
              <p role="status" className="text-sm text-zinc-300">
                Request validated. The evaluator will be connected next.
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
