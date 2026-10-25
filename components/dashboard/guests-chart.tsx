"use client";

import { useEffect, useRef, useState, type KeyboardEvent, type PointerEvent } from "react";

export type DayPoint = {
  key: string;
  label: string;
  weekday: string;
  /** Seats reserved by guests. */
  guests: number;
  events: number;
  /** Seats on offer that day (booked + still open). */
  seats: number;
  spaces: number;
};

// Chart tokens: booked = blue 450, open seats = blue 150 (same hue, lighter), hover = blue 550.
const BOOKED = "#2a78d6";
const BOOKED_ACTIVE = "#1c5cab";
const OPEN = "#b7d3f6";
const GRID = "#e1e0d9";
const AXIS = "#c3c2b7";
const BAND = "#f4f3ef";
const MUTED = "#898781";

const MIN_H = 176;
const M = { t: 18, r: 8, b: 34, l: 28 };
const MAX_BAR = 24;
const GAP = 2;

/** Column with a rounded top (radius `r`, capped) and a square base, growing from the baseline. */
function columnPath(x: number, y: number, w: number, h: number, r: number) {
  const k = Math.min(r, w / 2, h);
  return `M${x},${y + h} V${y + k} Q${x},${y} ${x + k},${y} H${x + w - k} Q${x + w},${y} ${x + w},${y + k} V${y + h} Z`;
}

/** Round a tick spacing up to 1, 2, 5 or 10 times a power of ten, so the axis shows round numbers. */
function niceStep(raw: number) {
  if (raw <= 1) return 1;
  const pow = 10 ** Math.floor(Math.log10(raw));
  const f = raw / pow;
  return (f <= 1 ? 1 : f <= 2 ? 2 : f <= 5 ? 5 : 10) * pow;
}

const plural = (n: number, one: string, many: string) => `${n} ${n === 1 ? one : many}`;

export function GuestsChart({ days }: { days: DayPoint[] }) {
  const [active, setActive] = useState<number | null>(null);
  // Drawn at the container's real size so text stays readable and the chart fills its card.
  const [W, setW] = useState(480);
  const [H, setH] = useState(MIN_H);
  const box = useRef<HTMLDivElement>(null);
  const svg = useRef<SVGSVGElement>(null);
  const n = days.length;

  useEffect(() => {
    const el = box.current;
    if (!el) return;
    const ro = new ResizeObserver(([e]) => {
      setW(Math.max(260, Math.round(e.contentRect.width)));
      setH(Math.max(MIN_H, Math.round(e.contentRect.height)));
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const max = Math.max(0, ...days.map((d) => d.seats));
  const step = niceStep(max / 4);
  const top = Math.max(step, Math.ceil(max / step) * step);
  const plotW = W - M.l - M.r;
  const band = plotW / n;
  const barW = Math.max(4, Math.min(MAX_BAR, band - GAP * 2));
  const cx = (i: number) => M.l + band * i + band / 2;
  const y = (v: number) => M.t + (1 - v / top) * (H - M.t - M.b);
  const ticks = Array.from({ length: top / step + 1 }, (_, i) => i * step);
  const a = active === null ? null : days[active];

  function onPointer(e: PointerEvent<SVGSVGElement>) {
    const r = svg.current!.getBoundingClientRect();
    const px = ((e.clientX - r.left) / r.width) * W;
    setActive(Math.min(n - 1, Math.max(0, Math.floor((px - M.l) / band))));
  }

  function onKey(e: KeyboardEvent<SVGSVGElement>) {
    if (e.key === "ArrowRight") setActive((i) => Math.min(n - 1, (i ?? -1) + 1));
    else if (e.key === "ArrowLeft") setActive((i) => Math.max(0, (i ?? n) - 1));
    else if (e.key === "Escape") setActive(null);
    else return;
    e.preventDefault();
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <p className="mb-2 flex items-center gap-4 text-xs text-neutral-600">
        <span className="flex items-center gap-1.5">
          <span className="inline-block h-2.5 w-3 rounded-sm" style={{ background: BOOKED }} /> Booked
        </span>
        <span className="flex items-center gap-1.5">
          <span className="inline-block h-2.5 w-3 rounded-sm" style={{ background: OPEN }} /> Open seats
        </span>
      </p>

      <div ref={box} className="relative min-h-44 flex-1">
        <svg
          ref={svg}
          viewBox={`0 0 ${W} ${H}`}
          className="absolute inset-0 block h-full w-full touch-pan-y rounded outline-none focus-visible:ring-2 focus-visible:ring-neutral-900"
          tabIndex={0}
          role="img"
          aria-label={`Bar chart of seats booked out of total seats for each of the next ${n} days. Use the left and right arrow keys to read each day.`}
          onPointerMove={onPointer}
          onPointerLeave={() => setActive(null)}
          onBlur={() => setActive(null)}
          onKeyDown={onKey}
        >
          {active !== null && <rect x={M.l + band * active} y={M.t} width={band} height={H - M.t - M.b} fill={BAND} />}

          {ticks.map((t) => (
            <g key={t}>
              <line x1={M.l} x2={W - M.r} y1={y(t)} y2={y(t)} stroke={t === 0 ? AXIS : GRID} strokeWidth={1} />
              <text x={M.l - 6} y={y(t) + 4} textAnchor="end" fontSize={11} fill={MUTED}>
                {t}
              </text>
            </g>
          ))}

          {days.map((d, i) => {
            const [month, day] = d.label.split(" ");
            const x = cx(i) - barW / 2;
            const full = d.seats > 0 && d.guests >= d.seats;
            return (
              <g key={d.key}>
                {d.seats > 0 && (
                  <path d={columnPath(x, y(d.seats), barW, y(0) - y(d.seats), 4)} fill={OPEN} />
                )}
                {d.guests > 0 && (
                  <path
                    d={columnPath(x, y(d.guests), barW, y(0) - y(d.guests), full ? 4 : 0)}
                    fill={active === i ? BOOKED_ACTIVE : BOOKED}
                  />
                )}
                <text x={cx(i)} y={H - 18} textAnchor="middle" fontSize={11} fill={MUTED}>
                  {day}
                </text>
                {(i === 0 || day === "1") && (
                  <text x={cx(i)} y={H - 5} textAnchor="middle" fontSize={11} fontWeight={600} fill={MUTED}>
                    {month}
                  </text>
                )}
              </g>
            );
          })}
        </svg>

        {a && active !== null && (
          <div
            className="pointer-events-none absolute top-1 z-10 min-w-36 rounded-lg border border-neutral-200 bg-white px-3 py-2 text-xs shadow-sm"
            style={{
              left: `${(cx(active) / W) * 100}%`,
              transform: active > n / 2 ? "translateX(calc(-100% - 12px))" : "translateX(12px)",
            }}
          >
            <p className="text-neutral-600">
              {a.weekday === "Today" ? "Today" : a.weekday}, {a.label}
            </p>
            {a.seats === 0 ? (
              <p className="mt-1 text-neutral-600">No spaces published</p>
            ) : (
              <>
                <p className="mt-1 flex items-center gap-2">
                  <span className="inline-block h-2 w-3 rounded-sm" style={{ background: BOOKED }} />
                  <span className="text-sm font-semibold text-neutral-950">
                    {a.guests} of {a.seats}
                  </span>
                  <span className="text-neutral-600">seats booked</span>
                </p>
                <p className="mt-0.5 flex items-center gap-2">
                  <span className="inline-block h-2 w-3 rounded-sm" style={{ background: OPEN }} />
                  <span className="text-neutral-600">{a.seats - a.guests} open</span>
                </p>
                <p className="mt-0.5 text-neutral-600">
                  {plural(a.spaces, "space", "spaces")} · {plural(a.events, "event", "events")}
                </p>
              </>
            )}
          </div>
        )}

        {max === 0 && active === null && (
          <p className="pointer-events-none absolute inset-x-0 top-1/3 text-center text-sm text-neutral-600">
            No spaces published in the next {n} days
          </p>
        )}
      </div>

      <p className="sr-only" aria-live="polite">
        {a
          ? a.seats === 0
            ? `${a.weekday} ${a.label}: no spaces published`
            : `${a.weekday} ${a.label}: ${a.guests} of ${a.seats} seats booked, ${a.seats - a.guests} open, ${plural(a.events, "event", "events")}`
          : ""}
      </p>

      <details className="mt-2 text-sm">
        <summary className="cursor-pointer text-neutral-600 hover:text-neutral-900">View as table</summary>
        <table className="mt-2 w-full text-left text-xs">
          <thead className="text-neutral-600">
            <tr>
              <th className="py-1 font-medium">Day</th>
              <th className="py-1 font-medium">Events</th>
              <th className="py-1 font-medium">Booked</th>
              <th className="py-1 font-medium">Open</th>
              <th className="py-1 font-medium">Total seats</th>
            </tr>
          </thead>
          <tbody>
            {days.map((d) => (
              <tr key={d.key} className="border-t border-neutral-100">
                <td className="py-1">
                  {d.weekday}, {d.label}
                </td>
                <td className="py-1 tabular-nums">{d.events}</td>
                <td className="py-1 tabular-nums">{d.guests}</td>
                <td className="py-1 tabular-nums">{d.seats - d.guests}</td>
                <td className="py-1 tabular-nums">{d.seats}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </details>
    </div>
  );
}
