"use client";

import { useId } from "react";

import { SAMPLES, type SampleConversation } from "@/data/samples";

type SampleSelectorProps = {
  onSelect: (sample: SampleConversation) => void;
};

/**
 * One button per sample conversation. Titles and descriptions render straight
 * from SAMPLES; selecting a sample hands the full fixture to the caller.
 */
export function SampleSelector({ onSelect }: SampleSelectorProps) {
  const id = useId();
  const labelId = `${id}-samples-label`;

  return (
    <div role="group" aria-labelledby={labelId}>
      <p id={labelId} className="text-sm font-medium text-zinc-900">
        Try a sample
      </p>
      <div className="mt-2 space-y-2">
        {SAMPLES.map((sample) => (
          <button
            key={sample.id}
            type="button"
            onClick={() => onSelect(sample)}
            className="block w-full rounded-lg border border-zinc-300 bg-zinc-100 px-3 py-2.5 text-left hover:border-zinc-400 hover:bg-zinc-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
          >
            <span className="block text-sm font-medium text-zinc-900">
              {sample.title}
            </span>
            <span className="mt-0.5 block text-xs leading-5 text-zinc-600">
              {sample.description}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}
