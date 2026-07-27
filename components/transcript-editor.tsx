"use client";

import { useId } from "react";

type TranscriptEditorProps = {
  value: string;
  onChange: (value: string) => void;
};

const PLACEHOLDER = [
  "Customer: I was charged twice this month.",
  "Agent: I do not see a duplicate charge.",
  "Customer: Both charges are on my bank statement.",
].join("\n");

/**
 * Controlled textarea for the full conversation transcript being audited.
 */
export function TranscriptEditor({ value, onChange }: TranscriptEditorProps) {
  const id = useId();
  const textareaId = `${id}-transcript`;
  const helperId = `${id}-helper`;

  return (
    <div>
      <label
        htmlFor={textareaId}
        className="block text-sm font-medium text-zinc-200"
      >
        Conversation transcript
      </label>
      <p id={helperId} className="mt-1 text-xs leading-5 text-zinc-500">
        {'One conversation turn per line, each prefixed with a speaker label such as "Customer:" or "Agent:".'}
      </p>
      <textarea
        id={textareaId}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        aria-describedby={helperId}
        placeholder={PLACEHOLDER}
        maxLength={50000}
        rows={12}
        className="mt-2 block w-full resize-y rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-2 font-mono text-sm leading-6 text-zinc-100 placeholder:text-zinc-600 hover:border-zinc-600 focus:border-zinc-500 focus:ring-2 focus:ring-zinc-300 focus:outline-none"
      />
    </div>
  );
}
