import type { Metadata } from "next";
import { connection } from "next/server";
import { Suspense } from "react";
import { CalendarBlank, CheckCircle, Clock, HandWaving, Plus } from "@phosphor-icons/react/ssr";
import { Calendar } from "@/components/dashboard/calendar";
import { GuestsChart } from "@/components/dashboard/guests-chart";
import { ImageUpload } from "@/components/dashboard/image-upload";
import { SpacesFilter } from "@/components/dashboard/spaces-filter";
import { StatTiles } from "@/components/dashboard/stat-tiles";
import { Badge } from "@/components/ui/badge";
import { Button, ButtonLink } from "@/components/ui/button";
import { SeatRow } from "@/components/ui/seat-row";
import { getCurrentRestaurant } from "@/lib/session";
import { listSpaces, type Space } from "@/lib/spaces";
import { statsByDay, summarize } from "@/lib/stats";
import { formatDate, formatTimeRange, seattleDateKey, upcomingDays } from "@/lib/time";
import { simulateBookingAction, simulateReservationAction } from "./demo-actions";
import { uploadEventPhoto, uploadRestaurantPhoto } from "./photo-actions";

const DEMO = process.env.NODE_ENV === "development";

export const metadata: Metadata = { title: "My spaces · ALongTable" };

type Params = Promise<{ published?: string; registered?: string; month?: string }>;

const plural = (n: number, one: string, many: string) => `${n.toLocaleString("en-US")} ${n === 1 ? one : many}`;

export default function RestaurantPage({ searchParams }: { searchParams: Params }) {
  return (
    <main className="mx-auto w-full max-w-5xl px-4 py-8 sm:py-12">
      <Suspense fallback={<p className="alt-secondary">Loading your spaces…</p>}>
        <Dashboard searchParams={searchParams} />
      </Suspense>
    </main>
  );
}

/** Mint = booked, apricot = filling up (three quarters full or more), sunken = still open. */
function statusChip(s: Space) {
  if (!s.event) return <Badge tone="neutral">Open</Badge>;
  const { seatsTaken, capacity } = s.event;
  if (seatsTaken >= capacity) return <Badge tone="booked">Full</Badge>;
  if (seatsTaken / capacity >= 0.75) return <Badge tone="filling">Filling up</Badge>;
  return <Badge tone="booked">Booked</Badge>;
}

async function Dashboard({ searchParams }: { searchParams: Params }) {
  const [{ published, registered, month: monthParam }, restaurant] = await Promise.all([
    searchParams,
    getCurrentRestaurant(),
  ]);

  if (!restaurant) {
    return (
      <div className="alt-card mx-auto flex max-w-xl flex-col items-start gap-4 !p-8">
        <HandWaving size={32} aria-hidden="true" />
        <h1 className="alt-h2">List your space</h1>
        <p className="alt-lead alt-secondary">
          Tell us about your restaurant once. After that, publishing an empty table takes a few taps.
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

  // Answer first: the one fact the owner came for, in big type.
  const answer =
    spaces.length === 0
      ? "No spaces yet"
      : summary.events === 0
        ? "No events booked yet"
        : `${plural(summary.events, "event", "events")} booked`;
  const detail =
    spaces.length === 0
      ? "Publish your first table and guests can start booking it."
      : `${plural(summary.guests, "guest", "guests")} booked · ${plural(summary.available, "space", "spaces")} still open`;

  return (
    <div className="flex flex-col gap-8">
      <header className="flex flex-wrap items-end justify-between gap-6">
        <div className="flex flex-col gap-2">
          <p className="alt-label-text alt-secondary">
            {restaurant.name} · {restaurant.location}
          </p>
          <h1 className="alt-display">{answer}</h1>
          <p className="alt-lead alt-secondary">{detail}</p>
        </div>
        <div className="flex items-center gap-2">
          <ButtonLink href="/restaurant/new">
            <Plus size={20} aria-hidden="true" />
            Publish a space
          </ButtonLink>
        </div>
      </header>

      <ImageUpload
        action={uploadRestaurantPhoto}
        photoUrl={restaurant.photoUrl}
        alt={`Inside ${restaurant.name}`}
        addLabel="Add a photo"
        changeLabel="Change photo"
        guidance="Add a photo of your real space, like a table set for service. It shows on your event cards, so guests can picture the evening. Only upload photos you have the right to use."
      />

      {registered && (
        <p role="status" className="alt-notice alt-notice--success">
          <CheckCircle size={24} aria-hidden="true" className="alt-icon" />
          You&apos;re set up. Publish your first space below and guests can book it.
        </p>
      )}
      {published && (
        <p role="status" className="alt-notice alt-notice--success">
          <CheckCircle size={24} aria-hidden="true" className="alt-icon" />
          Your space is live. Guests can book it now.
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
          { label: "Spaces open", value: summary.available.toLocaleString("en-US") },
        ]}
      />

      <div className="grid gap-4 lg:grid-cols-2">
        <section className="alt-card flex flex-col">
          <h2 className="alt-title">Seats booked</h2>
          <p className="alt-secondary mb-4">Booked out of total seats, next 14 days</p>
          <GuestsChart days={chartDays} />
        </section>

        <section className="alt-card">
          <Calendar month={month} todayKey={todayKey} stats={stats} />
        </section>
      </div>

      {spaces.length === 0 ? (
        <section className="flex flex-col gap-4">
          <h2 className="alt-h2">My spaces</h2>
          <div className="alt-card flex flex-col items-start gap-3">
            <p className="alt-title">No spaces yet</p>
            <p className="alt-secondary">Publish your first table to get started.</p>
            <ButtonLink href="/restaurant/new">Publish a space</ButtonLink>
          </div>
        </section>
      ) : (
        <SpacesFilter
          items={spaces.map((s) => {
            const start = new Date(s.startsAt);
            const end = new Date(s.endsAt);
            const seats = s.event ?? { seatsTaken: 0, capacity: s.capacity };
            return {
              id: s.id,
              kind: s.event ? ("booked" as const) : ("open" as const),
              node: (
                <li key={s.id} className="alt-card flex flex-col gap-4">
                  <div className="flex items-start justify-between gap-3">
                    <h3 className="alt-title">{s.label}</h3>
                    {statusChip(s)}
                  </div>

                  <div className="flex flex-col gap-1">
                    <p className="alt-meta">
                      <CalendarBlank size={20} aria-hidden="true" />
                      <span className="text-ink">{formatDate(start)}</span>
                    </p>
                    <p className="alt-meta">
                      <Clock size={20} aria-hidden="true" />
                      <span className="text-ink tabular-nums">{formatTimeRange(start, end)}</span>
                    </p>
                    {(s.description || s.priceInfo) && (
                      <p className="alt-secondary">{[s.description, s.priceInfo].filter(Boolean).join(" · ")}</p>
                    )}
                  </div>

                  {s.event && (
                    <>
                      <p>
                        <span className="font-semibold">{s.event.title}</span>
                        <span className="alt-secondary"> · organized by {s.event.organizerName}</span>
                      </p>
                      <ImageUpload
                        action={uploadEventPhoto}
                        hidden={{ name: "eventId", value: s.event.id }}
                        photoUrl={s.event.photoUrl}
                        alt={s.event.title}
                        addLabel="Add event photo"
                        changeLabel="Change event photo"
                        size="sm"
                      />
                    </>
                  )}
                  <SeatRow total={seats.capacity} taken={seats.seatsTaken} />

                  {DEMO && (
                    <form className="border-t border-divider pt-4">
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
              ),
            };
          })}
        />
      )}
    </div>
  );
}
