"use client";

import { useState } from "react";

import { AgentGoalInput } from "@/components/agent-goal-input";
import { CategorySelector } from "@/components/category-selector";
import { TranscriptEditor } from "@/components/transcript-editor";
import type { CategoryId } from "@/lib/categories";

export default function Home() {
  const [category, setCategory] = useState<CategoryId>("customer_support");
  const [agentGoal, setAgentGoal] = useState("");
  const [transcript, setTranscript] = useState("");

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
          <h2
            id="conversation-input-heading"
            className="text-sm font-medium tracking-wide text-zinc-200 uppercase"
          >
            Conversation Input
          </h2>
          <div className="mt-4 space-y-4">
            <CategorySelector value={category} onChange={setCategory} />
            <AgentGoalInput value={agentGoal} onChange={setAgentGoal} />
            <TranscriptEditor value={transcript} onChange={setTranscript} />
          </div>
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
          <div className="mt-4 flex flex-1 items-center justify-center rounded-lg border border-dashed border-zinc-800">
            <p className="px-6 py-10 text-center text-sm text-zinc-500">
              The audit report will render here.
            </p>
          </div>
        </section>
      </main>
    </div>
  );
}
