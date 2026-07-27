"use client";

import { useId } from "react";

import { CATEGORIES, type CategoryId } from "@/lib/categories";

type CategorySelectorProps = {
  value: CategoryId;
  onChange: (value: CategoryId) => void;
  error?: string;
};

/**
 * Controlled selector for the supported conversation categories. Options,
 * labels, and descriptions all come from CATEGORIES — nothing is duplicated
 * here.
 */
export function CategorySelector({
  value,
  onChange,
  error,
}: CategorySelectorProps) {
  const id = useId();
  const selectId = `${id}-category`;
  const helperId = `${id}-helper`;
  const descriptionId = `${id}-description`;
  const errorId = `${id}-error`;

  const describedBy = error
    ? `${helperId} ${descriptionId} ${errorId}`
    : `${helperId} ${descriptionId}`;

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
        aria-describedby={describedBy}
        aria-invalid={error ? true : undefined}
        className={`mt-2 block w-full rounded-lg border bg-zinc-900 px-3 py-2 text-sm text-zinc-100 focus:ring-2 focus:outline-none ${
          error
            ? "border-red-500 hover:border-red-400 focus:border-red-400 focus:ring-red-400"
            : "border-zinc-700 hover:border-zinc-600 focus:border-zinc-500 focus:ring-zinc-300"
        }`}
      >
        {CATEGORIES.map((category) => (
          <option key={category.id} value={category.id}>
            {category.label}
          </option>
        ))}
      </select>
      {error !== undefined && (
        <p id={errorId} role="alert" className="mt-2 text-xs leading-5 text-red-400">
          {error}
        </p>
      )}
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
