"use client";

import { useId, type Ref } from "react";

type AgentGoalInputProps = {
  value: string;
  onChange: (value: string) => void;
  error?: string;
  /** Lets the page focus this control when submission finds it invalid. */
  ref?: Ref<HTMLTextAreaElement>;
};

/** Matches EvaluationRequestSchema's agentGoal maximum. */
const MAX_LENGTH = 500;

/** From here on, the counter changes style so the remaining space stands out. */
const WARN_AT = 450;

/**
 * Controlled textarea describing what the AI agent was expected to
 * accomplish in the conversation being audited.
 */
export function AgentGoalInput({
  value,
  onChange,
  error,
  ref,
}: AgentGoalInputProps) {
  const id = useId();
  const textareaId = `${id}-agent-goal`;
  const helperId = `${id}-helper`;
  const errorId = `${id}-error`;

  const describedBy = error ? `${helperId} ${errorId}` : helperId;

  return (
    <div>
      <label
        htmlFor={textareaId}
        className="block text-sm font-medium text-zinc-900"
      >
        Agent goal
      </label>
      <div className="mt-1 flex items-baseline justify-between gap-4">
        <p id={helperId} className="text-xs leading-5 text-zinc-600">
          Include the goal and any hard constraints, such as refund limits or
          escalation rules.
        </p>
        <p
          aria-live="polite"
          className={`shrink-0 text-xs leading-5 tabular-nums ${
            value.length >= WARN_AT
              ? "font-medium text-amber-700"
              : "text-zinc-600"
          }`}
        >
          {value.length}/{MAX_LENGTH}
        </p>
      </div>
      <textarea
        id={textareaId}
        ref={ref}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        aria-describedby={describedBy}
        aria-invalid={error ? true : undefined}
        placeholder="Resolve the customer’s billing issue. Refunds over $50 must be escalated to a human specialist."
        maxLength={MAX_LENGTH}
        rows={3}
        className={`mt-2 block w-full resize-y rounded-lg border bg-zinc-50 px-3 py-2.5 text-sm text-zinc-900 placeholder:text-zinc-500 focus:ring-2 focus:outline-none ${
          error
            ? "border-red-500 hover:border-red-600 focus:border-red-600 focus:ring-red-500/50"
            : "border-zinc-300 hover:border-zinc-400 focus:border-indigo-500 focus:ring-indigo-500/50"
        }`}
      />
      {error !== undefined && (
        <p id={errorId} role="alert" className="mt-2 text-xs leading-5 text-red-700">
          {error}
        </p>
      )}
    </div>
  );
}
