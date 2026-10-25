import Link from "next/link";
import type { DayStats } from "@/lib/stats";

const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const BOOKED = "#2a78d6";
const OPEN = "#b7d3f6";

const shift = (month: string, by: number) => {
  const [y, m] = month.split("-").map(Number);
  const d = new Date(Date.UTC(y, m - 1 + by, 1));
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}`;
};

function EventIcon() {
  return (
    <svg viewBox="0 0 16 16" width={11} height={11} aria-hidden className="shrink-0" fill="none" stroke="currentColor" strokeWidth={1.5}>
      <rect x={2} y={3} width={12} height={11} rx={2} />
      <path d="M2 7h12M5.5 1.5v3M10.5 1.5v3" />
    </svg>
  );
}

const plural = (n: number, one: string, many: string) => `${n} ${n === 1 ? one : many}`;

export function Calendar({
  month,
  todayKey,
  stats,
}: {
  month: string; // "YYYY-MM"
  todayKey: string;
  stats: Record<string, DayStats>;
}) {
  const [y, m] = month.split("-").map(Number);
  const lead = new Date(Date.UTC(y, m - 1, 1)).getUTCDay();
  const count = new Date(Date.UTC(y, m, 0)).getUTCDate();
  const cells: (number | null)[] = [...Array(lead).fill(null), ...Array.from({ length: count }, (_, i) => i + 1)];
  while (cells.length % 7) cells.push(null);
  const rows = Array.from({ length: cells.length / 7 }, (_, r) => cells.slice(r * 7, r * 7 + 7));

  const key = (d: number) => `${month}-${String(d).padStart(2, "0")}`;
  const title = new Date(Date.UTC(y, m - 1, 1)).toLocaleDateString("en-US", { month: "long", year: "numeric", timeZone: "UTC" });
  const nav = "rounded-md border border-neutral-300 px-2 py-0.5 text-sm hover:bg-neutral-50 focus-visible:ring-2 focus-visible:ring-neutral-900 outline-none";

  return (
    <div>
      <div className="mb-2 flex items-center justify-between gap-2">
        <h2 className="font-semibold">Calendar</h2>
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium">{title}</span>
          <Link href={`?month=${shift(month, -1)}`} className={nav} aria-label="Previous month">
            ←
          </Link>
          <Link href={`?month=${shift(month, 1)}`} className={nav} aria-label="Next month">
            →
          </Link>
        </div>
      </div>

      <table className="w-full table-fixed border-separate border-spacing-px text-left">
        <thead>
          <tr>
            {WEEKDAYS.map((w) => (
              <th key={w} className="pb-1 text-center text-xs font-normal text-neutral-600">
                <span className="sm:hidden">{w[0]}</span>
                <span className="hidden sm:inline">{w}</span>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, r) => (
            <tr key={r}>
              {row.map((d, c) => {
                if (d === null) return <td key={c} />;
                const s = stats[key(d)];
                const isToday = key(d) === todayKey;
                const full = s && s.seats > 0 && s.guests >= s.seats;
                const label = s
                  ? `${plural(s.events, "event", "events")}, ${s.guests} of ${s.seats} seats booked, ${s.seats - s.guests} open`
                  : "no spaces";
                return (
                  <td
                    key={c}
                    aria-label={`${title.split(" ")[0]} ${d}: ${label}`}
                    className={`h-14 rounded-md border bg-white align-top ${isToday ? "border-neutral-900" : "border-neutral-200"}`}
                  >
                    <div className="flex h-full flex-col p-1 text-[11px] leading-tight">
                      <div className="flex items-start justify-between gap-1">
                        <span className={isToday ? "font-semibold" : "text-neutral-700"}>{d}</span>
                        {s && s.events > 0 && (
                          <span className="flex items-center gap-0.5 text-neutral-700">
                            <EventIcon />
                            <b className="font-semibold">{s.events}</b>
                          </span>
                        )}
                      </div>
                      {s && s.seats > 0 && (
                        <div className="mt-auto">
                          <p className="font-semibold text-neutral-950">
                            {full ? "Full" : `${s.guests}/${s.seats}`}
                          </p>
                          <div className="mt-0.5 h-1 overflow-hidden rounded-full" style={{ background: OPEN }}>
                            <div className="h-full rounded-full" style={{ width: `${Math.min(100, (s.guests / s.seats) * 100)}%`, background: BOOKED }} />
                          </div>
                        </div>
                      )}
                    </div>
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>

      <p className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-neutral-600">
        <span className="flex items-center gap-1">
          <EventIcon /> events
        </span>
        <span className="flex items-center gap-1.5">
          <span className="inline-block h-1 w-6 overflow-hidden rounded-full" style={{ background: OPEN }}>
            <span className="block h-full w-1/2 rounded-full" style={{ background: BOOKED }} />
          </span>
          seats booked / total
        </span>
      </p>
    </div>
  );
}
