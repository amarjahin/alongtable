"use client";

import { useEffect, useRef, useState, type KeyboardEvent, type PointerEvent } from "react";

export type DayPoint = { key: string; label: string; weekday: string; guests: number; events: number };

// Chart tokens (single series: blue 450, hover blue 550, hairline grid, muted axis text).
const BAR = "#2a78d6";
const BAR_ACTIVE = "#1c5cab";
const GRID = "#e1e0d9";
const AXIS = "#c3c2b7";
const BAND = "#f4f3ef";
const MUTED = "#898781";

const MIN_H = 176;
const M = { t: 18, r: 8, b: 34, l: 28 };
const MAX_BAR = 24;
const GAP = 2;

/** Column with a 4px rounded top and a square base, so it grows from the baseline. */
function columnPath(x: number, y: number, w: number, h: number) {
  const r = Math.min(4, w / 2, h);
  return `M${x},${y + h} V${y + r} Q${x},${y} ${x + r},${y} H${x + w - r} Q${x + w},${y} ${x + w},${y + r} V${y + h} Z`;
}

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

  const max = Math.max(0, ...days.map((d) => d.guests));
  const step = Math.max(1, Math.ceil(max / 3));
  const top = step * 3;
  const plotW = W - M.l - M.r;
  const band = plotW / n;
  const barW = Math.max(4, Math.min(MAX_BAR, band - GAP * 2));
  const cx = (i: number) => M.l + band * i + band / 2;
  const y = (v: number) => M.t + (1 - v / top) * (H - M.t - M.b);
  const peak = max > 0 ? days.findIndex((d) => d.guests === max) : -1;
  const ticks = [0, 1, 2, 3].map((i) => i * step);
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
      <div ref={box} className="relative min-h-44 flex-1">
        <svg
          ref={svg}
          viewBox={`0 0 ${W} ${H}`}
          className="absolute inset-0 block h-full w-full touch-pan-y rounded outline-none focus-visible:ring-2 focus-visible:ring-neutral-900"
          tabIndex={0}
          role="img"
          aria-label={`Bar chart of guests booked per event day for the next ${n} days. Use the left and right arrow keys to read each day.`}
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
            return (
              <g key={d.key}>
                {d.guests > 0 && (
                  <path
                    d={columnPath(cx(i) - barW / 2, y(d.guests), barW, y(0) - y(d.guests))}
                    fill={active === i ? BAR_ACTIVE : BAR}
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

          {peak >= 0 && (
            <text x={cx(peak)} y={y(max) - 5} textAnchor="middle" fontSize={12} fontWeight={600} fill="#0b0b0b">
              {max}
            </text>
          )}
        </svg>

        {a && active !== null && (
          <div
            className="pointer-events-none absolute top-1 z-10 min-w-32 rounded-lg border border-neutral-200 bg-white px-3 py-2 text-xs shadow-sm"
            style={{
              left: `${(cx(active) / W) * 100}%`,
              transform: active > n / 2 ? "translateX(calc(-100% - 12px))" : "translateX(12px)",
            }}
          >
            <p className="text-neutral-600">
              {a.weekday === "Today" ? "Today" : a.weekday}, {a.label}
            </p>
            <p className="mt-1 flex items-center gap-2">
              <span className="inline-block h-2 w-3 rounded-sm" style={{ background: BAR }} />
              <span className="text-sm font-semibold text-neutral-950">{a.guests}</span>
              <span className="text-neutral-600">{a.guests === 1 ? "guest" : "guests"}</span>
            </p>
            <p className="mt-0.5 text-neutral-600">
              {a.events} {a.events === 1 ? "event" : "events"}
            </p>
          </div>
        )}

        {max === 0 && active === null && (
          <p className="pointer-events-none absolute inset-x-0 top-1/3 text-center text-sm text-neutral-600">
            No guests booked yet
          </p>
        )}
      </div>

      <p className="sr-only" aria-live="polite">
        {a ? `${a.weekday} ${a.label}: ${a.guests} ${a.guests === 1 ? "guest" : "guests"}, ${a.events} ${a.events === 1 ? "event" : "events"}` : ""}
      </p>

      <details className="mt-2 text-sm">
        <summary className="cursor-pointer text-neutral-600 hover:text-neutral-900">View as table</summary>
        <table className="mt-2 w-full text-left text-xs">
          <thead className="text-neutral-600">
            <tr>
              <th className="py-1 font-medium">Day</th>
              <th className="py-1 font-medium">Events</th>
              <th className="py-1 font-medium">Guests booked</th>
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
              </tr>
            ))}
          </tbody>
        </table>
      </details>
    </div>
  );
}
