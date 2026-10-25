import type { Metadata } from "next";
import { Suspense } from "react";
import { Badge } from "@/components/ui/badge";
import { ButtonLink } from "@/components/ui/button";
import { listSpaces } from "@/lib/spaces";
import { formatDate, formatTimeRange } from "@/lib/time";

export const metadata: Metadata = { title: "My spaces · ALongTable" };
export default function RestaurantPage({
  searchParams,
}: {
  searchParams: Promise<{ published?: string }>;
}) {
  return (
    <main className="mx-auto w-full max-w-2xl px-4 py-8">
      <div className="mb-6 flex items-center justify-between gap-4">
        <h1 className="text-2xl font-semibold">My spaces</h1>
        <ButtonLink href="/restaurant/new">Publish a space</ButtonLink>
      </div>
      <Suspense fallback={<p className="text-sm text-neutral-500">Loading spaces…</p>}>
        <Spaces searchParams={searchParams} />
      </Suspense>
    </main>
  );
}

async function Spaces({ searchParams }: { searchParams: Promise<{ published?: string }> }) {
  const { published } = await searchParams;
  const spaces = await listSpaces();

  return (
    <>
      {published && (
        <p role="status" className="mb-4 rounded-lg bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
          Space published. It&apos;s now available to book.
        </p>
      )}

      {spaces.length === 0 ? (
        <div className="rounded-xl border border-dashed border-neutral-300 p-10 text-center">
          <p className="font-medium">No spaces yet</p>
          <p className="mb-4 mt-1 text-sm text-neutral-600">Publish your first table to get started.</p>
          <ButtonLink href="/restaurant/new">Publish a space</ButtonLink>
        </div>
      ) : (
        <ul className="flex flex-col gap-3">
          {spaces.map((s) => {
            const start = new Date(s.startsAt);
            const end = new Date(s.endsAt);
            return (
              <li key={s.id} className="rounded-xl border border-neutral-200 bg-white p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-medium">
                      {s.restaurantName} · {s.label}
                    </p>
                    <p className="text-sm text-neutral-600">{s.location}</p>
                  </div>
                  <Badge tone={s.status === "available" ? "green" : "neutral"}>
                    {s.status === "available" ? "Available" : "Booked"}
                  </Badge>
                </div>
                <p className="mt-2 text-sm">
                  {formatDate(start)} · {formatTimeRange(start, end)} · {s.capacity} seats
                </p>
                {s.event && (
                  <p className="mt-3 rounded-lg bg-neutral-50 px-3 py-2 text-sm">
                    <span className="font-medium">{s.event.title}</span> by {s.event.organizerName} ·{" "}
                    {s.event.seatsTaken}/{s.event.capacity} seats taken
                  </p>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </>
  );
}
