import { Check } from "@phosphor-icons/react/ssr";

// Onboarding progress for /restaurant/signup. The side list shows on desktop
// (≥ 1024px); the top bar replaces it on smaller screens.

export type Step = 1 | 2 | 3 | 4;

export const STEP_LABELS = ["Find your restaurant", "Check details", "Pick dates", "Live"] as const;

const fill = { transition: "background-color var(--alt-dur-toast) var(--alt-ease)" };

export function Steps({ current }: { current: Step }) {
  return (
    <nav aria-label="Setup progress" className="flex flex-col gap-4">
      <p className="alt-label-text alt-secondary">List your restaurant</p>
      <ol className="flex flex-col gap-3">
        {STEP_LABELS.map((label, i) => {
          const n = i + 1;
          const state = n < current ? "done" : n === current ? "current" : "later";
          return (
            <li key={label} aria-current={state === "current" ? "step" : undefined} className="flex min-h-11 items-center gap-3">
              <span
                aria-hidden="true"
                style={fill}
                className={`inline-flex size-7 shrink-0 items-center justify-center rounded-full text-sm font-semibold tabular-nums ${
                  state === "done" ? "bg-basil text-surface" : state === "current" ? "bg-ink text-surface" : "bg-sunken text-ink-soft"
                }`}
              >
                {state === "done" ? <Check size={16} weight="bold" /> : n}
              </span>
              <span
                className={state === "done" ? "font-semibold text-ink" : state === "current" ? "font-extrabold text-ink" : "text-ink-soft"}
              >
                {label}
                {state === "done" && <span className="sr-only"> (done)</span>}
              </span>
            </li>
          );
        })}
      </ol>
    </nav>
  );
}

export function StepBar({ current }: { current: Step }) {
  return (
    <div className="flex flex-col gap-2">
      <p className="alt-label-text" aria-current="step">
        Step {current} of {STEP_LABELS.length} · {STEP_LABELS[current - 1]}
      </p>
      <div className="grid grid-cols-4 gap-1.5" aria-hidden="true">
        {STEP_LABELS.map((label, i) => (
          <span key={label} style={fill} className={`h-1.5 rounded-full ${i + 1 <= current ? "bg-basil" : "bg-divider"}`} />
        ))}
      </div>
    </div>
  );
}
