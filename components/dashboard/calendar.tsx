import Link from "next/link";
import type { DayStats } from "@/lib/stats";

// One-hue sequential ramp (blue 100–250): more guests, darker cell.
const RAMP = ["#cde2fb", "#b7d3f6", "#9ec5f4", "#86b6ef"];
const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

const shift = (month: string, by: number) => {
  const [y, m] = month.split("-").map(Number);
  const d = new Date(Date.UTC(y, m - 1 + by, 1));
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}`;
};

function Icon({ kind }: { kind: "event" | "guest" }) {
  return (
    <svg viewBox="0 0 16 16" width={12} height={12} aria-hidden className="shrink-0" fill="none" stroke="currentColor" strokeWidth={1.5}>
      {kind === "event" ? (
        <>
          <rect x={2} y={3} width={12} height={11} rx={2} />
          <path d="M2 7h12M5.5 1.5v3M10.5 1.5v3" />
        </>
      ) : (
        <>
          <circle cx={8} cy={5.5} r={2.5} />
          <path d="M3 14c0-3 2.2-4.5 5-4.5s5 1.5 5 4.5" />
        </>
      )}
    </svg>
  );
}

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
  const maxGuests = Math.max(0, ...Array.from({ length: count }, (_, i) => stats[key(i + 1)]?.guests ?? 0));
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
                const bucket = s ? Math.min(RAMP.length - 1, Math.ceil((s.guests / Math.max(1, maxGuests)) * RAMP.length) - 1) : -1;
                const isToday = key(d) === todayKey;
                return (
                  <td
                    key={c}
                    aria-label={`${title.split(" ")[0]} ${d}: ${s ? `${s.events} ${s.events === 1 ? "event" : "events"}, ${s.guests} ${s.guests === 1 ? "guest" : "guests"}` : "no events"}`}
                    className={`h-12 rounded-md border align-top sm:h-11 ${isToday ? "border-neutral-900" : "border-neutral-200"}`}
                    style={{ backgroundColor: bucket >= 0 ? RAMP[Math.max(0, bucket)] : "#fff" }}
                  >
                    <div className="flex h-full flex-col p-1 text-[11px] leading-tight">
                      <span className={isToday ? "font-semibold" : "text-neutral-700"}>{d}</span>
                      {s && (
                        <div className="mt-auto flex flex-col text-neutral-950 sm:flex-row sm:gap-2">
                          <span className="flex items-center gap-1">
                            <Icon kind="event" />
                            <b className="font-semibold">{s.events}</b>
                          </span>
                          <span className="flex items-center gap-1">
                            <Icon kind="guest" />
                            <b className="font-semibold">{s.guests}</b>
                          </span>
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
        <span className="flex items-center gap-1"><Icon kind="event" /> events that day</span>
        <span className="flex items-center gap-1"><Icon kind="guest" /> guests booked</span>
        <span className="flex items-center gap-1">
          fewer
          {RAMP.map((c) => (
            <span key={c} className="inline-block h-3 w-4 rounded-sm border border-neutral-200" style={{ background: c }} />
          ))}
          more guests
        </span>
      </p>
    </div>
  );
}
