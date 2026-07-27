"use client";

import { useId } from "react";

type AgentGoalInputProps = {
  value: string;
  onChange: (value: string) => void;
  error?: string;
};

/** Matches EvaluationRequestSchema's agentGoal maximum. */
const MAX_LENGTH = 500;

/** From here on, the counter changes style so the remaining space stands out. */
const WARN_AT = 450;

/**
 * Controlled textarea describing what the AI agent was expected to
 * accomplish in the conversation being audited.
 */
export function AgentGoalInput({ value, onChange, error }: AgentGoalInputProps) {
  const id = useId();
  const textareaId = `${id}-agent-goal`;
  const helperId = `${id}-helper`;
  const errorId = `${id}-error`;

  const describedBy = error ? `${helperId} ${errorId}` : helperId;

  return (
    <div>
      <label
        htmlFor={textareaId}
        className="block text-sm font-medium text-zinc-200"
      >
        Agent goal
      </label>
      <div className="mt-1 flex items-baseline justify-between gap-4">
        <p id={helperId} className="text-xs leading-5 text-zinc-500">
          Include the goal and any hard constraints, such as refund limits or
          escalation rules.
        </p>
        <p
          aria-live="polite"
          className={`shrink-0 text-xs leading-5 tabular-nums ${
            value.length >= WARN_AT
              ? "font-medium text-amber-400"
              : "text-zinc-600"
          }`}
        >
          {value.length}/{MAX_LENGTH}
        </p>
      </div>
      <textarea
        id={textareaId}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        aria-describedby={describedBy}
        aria-invalid={error ? true : undefined}
        placeholder="Resolve the customer’s billing issue. Refunds over $50 must be escalated to a human specialist."
        maxLength={MAX_LENGTH}
        rows={3}
        className={`mt-2 block w-full resize-y rounded-lg border bg-zinc-900 px-3 py-2 text-sm text-zinc-100 placeholder:text-zinc-600 focus:ring-2 focus:outline-none ${
          error
            ? "border-red-500 hover:border-red-400 focus:border-red-400 focus:ring-red-400"
            : "border-zinc-700 hover:border-zinc-600 focus:border-zinc-500 focus:ring-zinc-300"
        }`}
      />
      {error !== undefined && (
        <p id={errorId} role="alert" className="mt-2 text-xs leading-5 text-red-400">
          {error}
        </p>
      )}
    </div>
  );
}
