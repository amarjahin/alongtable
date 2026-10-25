import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { EventCard } from "@/components/event-card";
import { EventsMap, type MapEvent } from "@/components/events-map";
import { ButtonLink } from "@/components/ui/button";
import { listUpcomingEvents } from "@/lib/events";

export const metadata: Metadata = { title: "Find events · ALongTable" };

type View = "list" | "map";

const views: { id: View; label: string; href: string }[] = [
  { id: "list", label: "List", href: "/events" },
  { id: "map", label: "Map", href: "/events?view=map" },
];

export default function EventsPage({ searchParams }: PageProps<"/events">) {
  return (
    <main className="mx-auto w-full max-w-2xl px-4 py-8">
      <h1 className="text-2xl font-semibold">Find events</h1>
      <p className="mb-4 mt-1 text-sm text-neutral-600">
        Upcoming gatherings at local restaurants. Reserve a seat and meet new people.
      </p>
      <Suspense fallback={<p className="text-sm text-neutral-500">Loading events…</p>}>
        {searchParams.then(({ view }) => (
          <Events view={view === "map" ? "map" : "list"} />
        ))}
      </Suspense>
    </main>
  );
}

async function Events({ view }: { view: View }) {
  const events = await listUpcomingEvents();

  const toggle = (
    // Same tab style as Host an event: the active tab is a white surface on a sunken track.
    <nav aria-label="View" className="mb-4 inline-flex gap-1 rounded-control bg-sunken p-1">
      {views.map((v) => (
        <Link
          key={v.id}
          href={v.href}
          aria-current={v.id === view ? "page" : undefined}
          className={`flex min-h-11 items-center whitespace-nowrap rounded-small px-4 font-semibold ${
            v.id === view ? "bg-surface text-ink" : "text-ink-soft hover:text-ink"
          }`}
        >
          {v.label}
        </Link>
      ))}
    </nav>
  );

  if (events.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-neutral-300 p-10 text-center">
        <p className="font-medium">No events yet</p>
        <p className="mb-4 mt-1 text-sm text-neutral-600">Book a restaurant space and be the first to host.</p>
        <ButtonLink href="/spaces">Host an event</ButtonLink>
      </div>
    );
  }

  if (view === "map") {
    // Only what the map needs crosses to the browser.
    const mapped: MapEvent[] = events.flatMap((e) =>
      e.lat != null && e.lng != null
        ? [{ id: e.id, title: e.title, startsAt: e.startsAt, endsAt: e.endsAt, seatsLeft: e.seatsLeft, restaurantName: e.restaurantName, location: e.location, lat: e.lat, lng: e.lng }]
        : [],
    );
    return (
      <>
        {toggle}
        <EventsMap events={mapped} unmapped={events.length - mapped.length} />
      </>
    );
  }

  return (
    <>
      {toggle}
      <ul className="flex flex-col gap-3">
        {events.map((e) => (
          <li key={e.id}>
            <EventCard event={e} />
          </li>
        ))}
      </ul>
    </>
  );
}
