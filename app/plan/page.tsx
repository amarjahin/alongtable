import type { Metadata } from "next";
import { Planner } from "./planner";

export const metadata: Metadata = {
  title: "Plan with AI · ALongTable",
  description: "Describe the gathering you want to host and get matching restaurant spaces with a drafted event.",
};

export default function PlanPage() {
  return (
    <main className="mx-auto w-full max-w-2xl px-4 py-8">
      <h1 className="text-2xl font-semibold">Plan an event with AI</h1>
      <p className="mb-6 mt-1 text-sm text-neutral-600">
        Describe the gathering you have in mind. We&apos;ll search available restaurant spaces, suggest the best fits and
        draft your event. Nothing is booked until you review it and publish.
      </p>
      <Planner />
    </main>
  );
}
