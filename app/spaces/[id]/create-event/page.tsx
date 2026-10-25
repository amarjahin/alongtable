import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { connection } from "next/server";
import { Suspense } from "react";
import { getSpace } from "@/lib/spaces";
import { formatDate, formatTimeRange } from "@/lib/time";
import { CreateEventForm } from "./create-event-form";

export const metadata: Metadata = { title: "Create an event · ALongTable" };

export default function CreateEventPage({ params }: PageProps<"/spaces/[id]/create-event">) {
  return (
    <main className="mx-auto w-full max-w-xl px-4 py-8">
      <Suspense fallback={<p className="text-sm text-neutral-500">Loading…</p>}>
        {params.then(({ id }) => (
          <Content id={id} />
        ))}
      </Suspense>
    </main>
  );
}

async function Content({ id }: { id: string }) {
  const space = await getSpace(id);
  if (!space) notFound();

  // Reading the clock is request-time work under Cache Components.
  await connection();
  const start = new Date(space.startsAt);
  const end = new Date(space.endsAt);
  const bookable = space.status === "available" && start > new Date();

  return (
    <>
      <Link href={`/spaces/${space.id}`} className="text-sm text-neutral-600 hover:text-neutral-900">
        ← Back to space
      </Link>
      <h1 className="mt-4 text-2xl font-semibold">Create an event</h1>

      <section aria-label="Space you're booking" className="mb-6 mt-4 rounded-xl border border-neutral-200 bg-neutral-50 p-4">
        <p className="text-xs font-medium uppercase tracking-wide text-neutral-500">You&apos;re booking</p>
        <p className="mt-1 font-medium">
          {space.restaurantName} · {space.label}
        </p>
        <p className="text-sm text-neutral-600">{space.location}</p>
        <p className="mt-2 text-sm">
          {formatDate(start)} · {formatTimeRange(start, end)} · up to {space.capacity} seats
        </p>
        {space.priceInfo && <p className="text-sm text-neutral-600">{space.priceInfo}</p>}
      </section>

      {bookable ? (
        <CreateEventForm spaceId={space.id} capacity={space.capacity} />
      ) : (
        <p role="status" className="rounded-lg bg-neutral-100 px-4 py-3 text-sm text-neutral-700">
          {space.status === "booked" ? "This space has already been booked." : "This space is no longer available."}{" "}
          <Link href="/spaces" className="font-medium underline">
            Browse other spaces
          </Link>
        </p>
      )}
    </>
  );
}
