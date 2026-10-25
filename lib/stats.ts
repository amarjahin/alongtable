import type { Space } from "@/lib/spaces";
import { seattleDateKey } from "@/lib/time";

export type DayStats = { events: number; guests: number };

/** Booked events and guests per Seattle calendar day (keyed "YYYY-MM-DD"). */
export function statsByDay(spaces: Space[]): Record<string, DayStats> {
  const out: Record<string, DayStats> = {};
  for (const s of spaces) {
    if (!s.event) continue;
    const key = seattleDateKey(new Date(s.startsAt));
    const day = (out[key] ??= { events: 0, guests: 0 });
    day.events += 1;
    day.guests += s.event.seatsTaken;
  }
  return out;
}

export function summarize(spaces: Space[]) {
  const booked = spaces.filter((s) => s.event);
  return {
    available: spaces.filter((s) => s.status === "available").length,
    events: booked.length,
    guests: booked.reduce((n, s) => n + (s.event?.seatsTaken ?? 0), 0),
  };
}
