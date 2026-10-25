import type { Metadata } from "next";
import { Suspense } from "react";
import { SpaceCard } from "@/components/space-card";
import { listAvailableSpaces } from "@/lib/spaces";

export const metadata: Metadata = { title: "Host an event · ALongTable" };

export default function SpacesPage() {
  return (
    <main className="mx-auto w-full max-w-2xl px-4 py-8">
      <h1 className="text-2xl font-semibold">Host an event</h1>
      <p className="mb-6 mt-1 text-sm text-neutral-600">
        Pick an available restaurant space and turn it into an event others can join.
      </p>
      <Suspense fallback={<p className="text-sm text-neutral-500">Loading spaces…</p>}>
        <Spaces />
      </Suspense>
    </main>
  );
}

async function Spaces() {
  const spaces = await listAvailableSpaces();

  if (spaces.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-neutral-300 p-10 text-center">
        <p className="font-medium">No spaces available right now</p>
        <p className="mt-1 text-sm text-neutral-600">Check back soon. Restaurants publish new tables often.</p>
      </div>
    );
  }

  return (
    <ul className="flex flex-col gap-3">
      {spaces.map((s) => (
        <li key={s.id}>
          <SpaceCard space={s} />
        </li>
      ))}
    </ul>
  );
}
