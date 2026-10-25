import type { ReactNode } from "react";

const tones = {
  green: "bg-emerald-50 text-emerald-800 ring-emerald-600/20",
  neutral: "bg-neutral-100 text-neutral-700 ring-neutral-500/20",
};

export function Badge({ tone, children }: { tone: keyof typeof tones; children: ReactNode }) {
  return (
    <span
      className={`inline-flex shrink-0 items-center whitespace-nowrap rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset ${tones[tone]}`}
    >
      {children}
    </span>
  );
}
