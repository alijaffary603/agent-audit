import { SplitText } from "@/components/split-text";

/**
 * Introductory hero above the audit workspace. Static content only — the
 * headline animates once on mount, and the call to action is a plain anchor
 * so it works with or without JavaScript.
 */
export function AgentAuditHero() {
  return (
    <section className="mx-auto flex w-full max-w-6xl flex-1 flex-col justify-center px-4 py-20 sm:px-6 sm:py-24 lg:min-h-[88svh] lg:px-10">
      <div className="max-w-4xl">
        <p className="hero-enter text-xs font-semibold tracking-[0.14em] text-indigo-600 uppercase">
          AI conversation quality assurance
        </p>

        <SplitText
          tag="h1"
          text="Audit any AI agent conversation."
          className="mt-6 text-[2.5rem] leading-[1.05] font-semibold tracking-[-0.03em] text-balance text-zinc-900 sm:text-6xl lg:text-7xl"
          splitType="words"
          delay={140}
          duration={1.05}
          ease="power3.out"
          from={{ opacity: 0, y: 28 }}
          to={{ opacity: 1, y: 0 }}
        />

        <p className="hero-enter hero-enter--2 mt-7 max-w-xl text-base leading-7 text-zinc-600 sm:text-lg sm:leading-8">
          Evaluate goal completion, communication, accuracy, and professionalism
          with evidence-backed findings tied directly to the transcript.
        </p>

        <div className="hero-enter hero-enter--3 mt-10">
          <a
            href="#audit-workspace"
            className="inline-flex items-center rounded-lg border border-zinc-300 bg-white px-5 py-3 text-sm font-semibold text-zinc-900 shadow-[0_1px_2px_rgba(24,24,27,0.05)] transition-colors hover:border-zinc-400 hover:bg-zinc-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2 focus-visible:ring-offset-[#f6f6f7]"
          >
            Start an audit
          </a>
          <p className="mt-6 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-zinc-600">
            <span>Structured evaluation.</span>
            <span
              aria-hidden="true"
              className="h-1 w-1 rounded-full bg-zinc-300"
            />
            <span>Verbatim evidence.</span>
            <span
              aria-hidden="true"
              className="h-1 w-1 rounded-full bg-zinc-300"
            />
            <span>Actionable improvements.</span>
          </p>
        </div>
      </div>
    </section>
  );
}
