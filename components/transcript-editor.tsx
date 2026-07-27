"use client";

import { useId, type Ref } from "react";

type TranscriptEditorProps = {
  value: string;
  onChange: (value: string) => void;
  error?: string;
  /** Lets the page focus this control when submission finds it invalid. */
  ref?: Ref<HTMLTextAreaElement>;
};

const PLACEHOLDER = [
  "Customer: I was charged twice this month.",
  "Agent: I do not see a duplicate charge.",
  "Customer: Both charges are on my bank statement.",
].join("\n");

/** Matches EvaluationRequestSchema's transcript maximum. */
const MAX_LENGTH = 50_000;

/** From here on, the counter changes style so the remaining space stands out. */
const WARN_AT = 45_000;

/**
 * Controlled textarea for the full conversation transcript being audited.
 */
export function TranscriptEditor({
  value,
  onChange,
  error,
  ref,
}: TranscriptEditorProps) {
  const id = useId();
  const textareaId = `${id}-transcript`;
  const helperId = `${id}-helper`;
  const errorId = `${id}-error`;

  const describedBy = error ? `${helperId} ${errorId}` : helperId;

  return (
    <div>
      <label
        htmlFor={textareaId}
        className="block text-sm font-medium text-zinc-100"
      >
        Conversation transcript
      </label>
      <div className="mt-1 flex items-baseline justify-between gap-4">
        <p id={helperId} className="text-xs leading-5 text-zinc-400">
          {'One conversation turn per line, each prefixed with a speaker label such as "Customer:" or "Agent:".'}
        </p>
        <p
          aria-live="polite"
          className={`shrink-0 text-xs leading-5 tabular-nums ${
            value.length >= WARN_AT
              ? "font-medium text-amber-400"
              : "text-zinc-400"
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
        placeholder={PLACEHOLDER}
        maxLength={MAX_LENGTH}
        rows={12}
        className={`mt-2 block w-full resize-y rounded-lg border bg-zinc-800/50 px-3 py-2.5 font-mono text-sm leading-6 text-zinc-100 placeholder:text-zinc-500 focus:ring-2 focus:outline-none ${
          error
            ? "border-red-500 hover:border-red-400 focus:border-red-400 focus:ring-red-400/70"
            : "border-zinc-600/80 hover:border-zinc-500 focus:border-indigo-400 focus:ring-indigo-400/60"
        }`}
      />
      {error !== undefined && (
        <p id={errorId} role="alert" className="mt-2 text-xs leading-5 text-red-300">
          {error}
        </p>
      )}
    </div>
  );
}
