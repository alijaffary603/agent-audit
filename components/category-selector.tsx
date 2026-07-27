"use client";

import { useId } from "react";

import { CATEGORIES, type CategoryId } from "@/lib/categories";

type CategorySelectorProps = {
  value: CategoryId;
  onChange: (value: CategoryId) => void;
};

/**
 * Controlled selector for the supported conversation categories. Options,
 * labels, and descriptions all come from CATEGORIES — nothing is duplicated
 * here.
 */
export function CategorySelector({ value, onChange }: CategorySelectorProps) {
  const id = useId();
  const selectId = `${id}-category`;
  const helperId = `${id}-helper`;
  const descriptionId = `${id}-description`;

  const selected = CATEGORIES.find((category) => category.id === value);

  return (
    <div>
      <label
        htmlFor={selectId}
        className="block text-sm font-medium text-zinc-200"
      >
        Conversation category
      </label>
      <p id={helperId} className="mt-1 text-xs leading-5 text-zinc-500">
        Sets what the evaluation emphasizes for this conversation.
      </p>
      <select
        id={selectId}
        value={value}
        // Options are rendered exclusively from CATEGORIES, so the DOM value
        // is always a valid CategoryId.
        onChange={(event) => onChange(event.target.value as CategoryId)}
        aria-describedby={`${helperId} ${descriptionId}`}
        className="mt-2 block w-full rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm text-zinc-100 hover:border-zinc-600 focus:border-zinc-500 focus:ring-2 focus:ring-zinc-300 focus:outline-none"
      >
        {CATEGORIES.map((category) => (
          <option key={category.id} value={category.id}>
            {category.label}
          </option>
        ))}
      </select>
      <p
        id={descriptionId}
        aria-live="polite"
        className="mt-2 text-xs leading-5 text-zinc-400"
      >
        <span className="font-medium text-zinc-300">Evaluates:</span>{" "}
        {selected?.description}
      </p>
    </div>
  );
}
