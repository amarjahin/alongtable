import type { Metadata } from "next";
import Link from "next/link";
import { Suspense, type ReactNode } from "react";
import { EventCard } from "@/components/event-card";
import { ButtonLink } from "@/components/ui/button";
import { listUpcomingEvents } from "@/lib/events";

export const metadata: Metadata = {
  title: "ALongTable · Turn empty tables into thriving communities",
  description:
    "Restaurants list empty tables, anyone turns one into an event, and others reserve a seat. Find a gathering near you or host your own.",
};

export default function Home() {
  return (
    <main className="w-full">
      <Hero />
      <HowItWorks />
      <UpcomingEvents />
      <ForRestaurants />
      <Footer />
    </main>
  );
}

function Hero() {
  return (
    <section className="mx-auto max-w-3xl px-4 pb-14 pt-16 text-center sm:pt-24">
      <h1 className="text-balance text-4xl font-semibold tracking-tight sm:text-5xl">
        Turn empty tables into thriving communities.
      </h1>
      <p className="mx-auto mt-4 max-w-xl text-pretty text-lg text-neutral-600">
        Restaurants fill their slow nights. People meet over a shared table.
      </p>
      <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
        <ButtonLink href="/events">Find an event</ButtonLink>
        <ButtonLink href="/spaces" variant="secondary">
          Host an event
        </ButtonLink>
        <ButtonLink href="/restaurant" variant="secondary">
          List your space
        </ButtonLink>
      </div>
    </section>
  );
}

const steps: { title: string; body: string; icon: ReactNode }[] = [
  {
    title: "A restaurant lists a table",
    body: "Owners publish empty seating for a date and time, with how many people it fits.",
    icon: (
      // Storefront
      <path d="M3 9.5 4.5 4h15L21 9.5M3 9.5a3 3 0 0 0 6 0m-6 0h18m-12 0a3 3 0 0 0 6 0m0 0a3 3 0 0 0 6 0M5 12v8h14v-8M10 20v-5h4v5" />
    ),
  },
  {
    title: "Someone turns it into an event",
    body: "Anyone books the space, names the gathering, and sets how many spots are open.",
    icon: (
      // Calendar with a plus
      <path d="M4 6h16v14H4zM4 10h16M8 3v4m8-4v4m-4 6v5m-2.5-2.5h5" />
    ),
  },
  {
    title: "Others join for a seat",
    body: "People browse upcoming events and reserve a seat with just a name and email.",
    icon: (
      // Two people
      <path d="M9 11a3 3 0 1 0 0-6 3 3 0 0 0 0 6Zm-6 9a6 6 0 0 1 12 0M16 11a3 3 0 1 0 0-6m2 15h3a6 6 0 0 0-4.5-5.8" />
    ),
  },
];

function HowItWorks() {
  return (
    <section className="border-y border-neutral-200 bg-neutral-50">
      <div className="mx-auto max-w-5xl px-4 py-14">
        <h2 className="text-center text-2xl font-semibold">How it works</h2>
        <ol className="mt-8 grid gap-6 sm:grid-cols-3">
          {steps.map((s, i) => (
            <li key={s.title} className="rounded-xl border border-neutral-200 bg-white p-5">
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth={1.5}
                strokeLinecap="round"
                strokeLinejoin="round"
                className="size-8 text-neutral-900"
                aria-hidden
              >
                {s.icon}
              </svg>
              <p className="mt-4 text-xs font-medium uppercase tracking-wide text-neutral-500">Step {i + 1}</p>
              <h3 className="mt-1 font-semibold">{s.title}</h3>
              <p className="mt-1 text-sm text-neutral-600">{s.body}</p>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}

function UpcomingEvents() {
  return (
    <section className="mx-auto max-w-5xl px-4 py-14">
      <div className="flex items-end justify-between gap-4">
        <h2 className="text-2xl font-semibold">Upcoming events</h2>
        <Link href="/events" className="text-sm font-medium text-neutral-700 hover:text-neutral-900">
          See all →
        </Link>
      </div>
      <Suspense fallback={<p className="mt-6 text-sm text-neutral-500">Loading events…</p>}>
        <EventList />
      </Suspense>
    </section>
  );
}

async function EventList() {
  const events = await listUpcomingEvents({ limit: 3 });

  if (events.length === 0) {
    return (
      <div className="mt-6 rounded-xl border border-dashed border-neutral-300 p-10 text-center">
        <p className="font-medium">Be the first to host</p>
        <p className="mb-4 mt-1 text-sm text-neutral-600">No events yet. Book a restaurant space and start one.</p>
        <ButtonLink href="/spaces">Host an event</ButtonLink>
      </div>
    );
  }

  return (
    <ul className="mt-6 grid gap-4 md:grid-cols-3">
      {events.map((e) => (
        <li key={e.id}>
          <EventCard event={e} />
        </li>
      ))}
    </ul>
  );
}

function ForRestaurants() {
  return (
    <section className="mx-auto max-w-5xl px-4 pb-14">
      <div className="flex flex-col items-start gap-6 rounded-2xl bg-neutral-900 p-8 text-white sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-2xl font-semibold">Own a restaurant?</h2>
          <ul className="mt-3 flex flex-col gap-1 text-sm text-neutral-300">
            <li>Fill off-peak seats with new groups of guests.</li>
            <li>No setup cost. Publish an empty table in a few taps.</li>
            <li>No payments run through ALongTable in V0.</li>
          </ul>
        </div>
        <Link
          href="/restaurant"
          className="inline-flex shrink-0 items-center justify-center rounded-lg bg-white px-4 py-2.5 text-sm font-medium text-neutral-900 transition-colors hover:bg-neutral-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-neutral-900"
        >
          List your space
        </Link>
      </div>
    </section>
  );
}

function Footer() {
  return (
    <footer className="border-t border-neutral-200">
      <p className="mx-auto max-w-5xl px-4 py-6 text-center text-sm text-neutral-500">
        ALongTable is a V0 hackathon prototype connecting restaurants with people who want to gather.{" "}
        <a href="https://github.com/amarjahin/alongtable" className="font-medium underline hover:text-neutral-900">
          View the code on GitHub
        </a>
      </p>
    </footer>
  );
}
