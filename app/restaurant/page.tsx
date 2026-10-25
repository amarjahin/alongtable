import type { Metadata } from "next";
import { connection } from "next/server";
import { Suspense } from "react";
import { Badge } from "@/components/ui/badge";
import { Button, ButtonLink } from "@/components/ui/button";
import { getCurrentRestaurant } from "@/lib/session";
import { listSpaces } from "@/lib/spaces";
import { statsByDay, summarize } from "@/lib/stats";
import { formatDate, formatTimeRange, seattleDateKey, upcomingDays } from "@/lib/time";
import { Calendar } from "@/components/dashboard/calendar";
import { GuestsChart } from "@/components/dashboard/guests-chart";
import { StatTiles } from "@/components/dashboard/stat-tiles";
import { SeatBar } from "@/components/ui/seat-bar";
import { simulateBookingAction, simulateReservationAction } from "./demo-actions";
import { signOut } from "./signup/actions";

const DEMO = process.env.NODE_ENV === "development";

export const metadata: Metadata = { title: "My spaces · ALongTable" };

export default function RestaurantPage({
  searchParams,
}: {
  searchParams: Promise<{ published?: string; registered?: string; month?: string }>;
}) {
  return (
    <main className="mx-auto w-full max-w-5xl px-4 py-8">
      <Suspense fallback={<p className="text-sm text-neutral-500">Loading spaces…</p>}>
        <Dashboard searchParams={searchParams} />
      </Suspense>
    </main>
  );
}

async function Dashboard({
  searchParams,
}: {
  searchParams: Promise<{ published?: string; registered?: string; month?: string }>;
}) {
  const [{ published, registered, month: monthParam }, restaurant] = await Promise.all([searchParams, getCurrentRestaurant()]);

  if (!restaurant) {
    return (
      <div className="rounded-xl border border-dashed border-neutral-300 p-10 text-center">
        <h1 className="text-xl font-semibold">List your space</h1>
        <p className="mb-4 mt-1 text-sm text-neutral-600">
          Register your restaurant once, then publish empty tables in a few taps.
        </p>
        <ButtonLink href="/restaurant/signup">Register or sign in</ButtonLink>
      </div>
    );
  }

  await connection(); // the chart and calendar depend on today's date, so render per request
  const spaces = await listSpaces(restaurant.id);
  const summary = summarize(spaces);
  const stats = statsByDay(spaces);
  const todayKey = seattleDateKey(new Date());
  const month = monthParam && /^\d{4}-(0[1-9]|1[0-2])$/.test(monthParam) ? monthParam : todayKey.slice(0, 7);
  const chartDays = upcomingDays(14).map((d) => ({
    key: d.value,
    label: d.label,
    weekday: d.weekday,
    guests: stats[d.value]?.guests ?? 0,
    events: stats[d.value]?.events ?? 0,
    seats: stats[d.value]?.seats ?? 0,
    spaces: stats[d.value]?.spaces ?? 0,
  }));

  return (
    <>
      <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold">{restaurant.name}</h1>
          <p className="text-sm text-neutral-600">{restaurant.location}</p>
        </div>
        <div className="flex gap-2">
          <ButtonLink href="/restaurant/new">Publish a space</ButtonLink>
          <form action={signOut}>
            <Button type="submit" variant="secondary">Sign out</Button>
          </form>
        </div>
      </div>

      {registered && (
        <p role="status" className="mb-4 rounded-lg bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
          Welcome, {restaurant.name}! Publish your first space below.
        </p>
      )}
      {published && (
        <p role="status" className="mb-4 rounded-lg bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
          Space published. It&apos;s now available to book.
        </p>
      )}

      <StatTiles
        items={[
          {
            label: "Est. revenue",
            value: summary.revenue.toLocaleString("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }),
            note: "Guests booked × price per person",
          },
          { label: "Guests booked", value: summary.guests.toLocaleString("en-US") },
          { label: "Events booked", value: summary.events.toLocaleString("en-US") },
          { label: "Spaces available", value: summary.available.toLocaleString("en-US") },
        ]}
      />

      <div className="mt-6 grid gap-4 lg:grid-cols-2">
        <section className="flex flex-col rounded-xl border border-neutral-200 bg-white p-4">
          <h2 className="font-semibold">Seats booked</h2>
          <p className="mb-2 text-sm text-neutral-600">Booked out of total seats, next 14 days</p>
          <GuestsChart days={chartDays} />
        </section>

        <section className="rounded-xl border border-neutral-200 bg-white p-4">
          <Calendar month={month} todayKey={todayKey} stats={stats} />
        </section>
      </div>

      <h2 className="mb-3 mt-8 text-lg font-semibold">My spaces</h2>
      {spaces.length === 0 ? (
        <div className="rounded-xl border border-dashed border-neutral-300 p-10 text-center">
          <p className="font-medium">No spaces yet</p>
          <p className="mb-4 mt-1 text-sm text-neutral-600">Publish your first table to get started.</p>
          <ButtonLink href="/restaurant/new">Publish a space</ButtonLink>
        </div>
      ) : (
        <ul className="grid gap-3 lg:grid-cols-2">
          {spaces.map((s) => {
            const start = new Date(s.startsAt);
            const end = new Date(s.endsAt);
            return (
              <li key={s.id} className="rounded-xl border border-neutral-200 bg-white p-4">
                <div className="flex items-start justify-between gap-3">
                  <p className="font-medium">{s.label}</p>
                  <Badge tone={s.status === "available" ? "green" : "neutral"}>
                    {s.status === "available" ? "Available" : "Booked"}
                  </Badge>
                </div>
                <p className="mt-2 text-sm">
                  {formatDate(start)} · {formatTimeRange(start, end)} · {s.capacity} seats
                </p>
                {(s.description || s.priceInfo) && (
                  <p className="mt-1 text-sm text-neutral-600">
                    {[s.description, s.priceInfo].filter(Boolean).join(" · ")}
                  </p>
                )}
                {s.event && (
                  <div className="mt-3 flex flex-col gap-3 rounded-lg bg-neutral-50 p-3">
                    <p className="text-sm">
                      <span className="font-medium">{s.event.title}</span>
                      <span className="text-neutral-600"> · organized by {s.event.organizerName}</span>
                    </p>
                    <SeatBar taken={s.event.seatsTaken} capacity={s.event.capacity} />
                  </div>
                )}
                {DEMO && (
                  <form className="mt-3 border-t border-dashed border-neutral-200 pt-3">
                    <input type="hidden" name="spaceId" value={s.id} />
                    {s.status === "available" ? (
                      <Button type="submit" variant="secondary" formAction={simulateBookingAction}>
                        Demo: simulate booking
                      </Button>
                    ) : (
                      <Button
                        type="submit"
                        variant="secondary"
                        formAction={simulateReservationAction}
                        disabled={s.event !== null && s.event.seatsTaken >= s.event.capacity}
                      >
                        Demo: a guest joins
                      </Button>
                    )}
                  </form>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </>
  );
}
