"use client";

import { useEffect, useRef, useState, type KeyboardEvent, type PointerEvent } from "react";

export type DayPoint = { key: string; label: string; weekday: string; guests: number; events: number };

// Chart tokens (single series: blue 450, hairline grid, muted axis text).
const LINE = "#2a78d6";
const GRID = "#e1e0d9";
const AXIS = "#c3c2b7";
const MUTED = "#898781";

const H = 240;
const M = { t: 20, r: 20, b: 28, l: 36 };

export function GuestsChart({ days }: { days: DayPoint[] }) {
  const [active, setActive] = useState<number | null>(null);
  const [W, setW] = useState(640); // drawn at the container's real width so text stays readable on phones
  const box = useRef<HTMLDivElement>(null);
  const svg = useRef<SVGSVGElement>(null);

  useEffect(() => {
    const el = box.current;
    if (!el) return;
    const ro = new ResizeObserver(([e]) => setW(Math.max(280, Math.round(e.contentRect.width))));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);
  const n = days.length;

  const max = Math.max(0, ...days.map((d) => d.guests));
  const step = Math.max(1, Math.ceil(max / 4));
  const top = step * 4;
  const x = (i: number) => M.l + (i / (n - 1)) * (W - M.l - M.r);
  const y = (v: number) => M.t + (1 - v / top) * (H - M.t - M.b);

  const line = days.map((d, i) => `${i ? "L" : "M"}${x(i)},${y(d.guests)}`).join(" ");
  const area = `${line} L${x(n - 1)},${y(0)} L${x(0)},${y(0)} Z`;
  const peak = max > 0 ? days.findIndex((d) => d.guests === max) : -1;
  const a = active === null ? null : days[active];

  function onPointer(e: PointerEvent<SVGSVGElement>) {
    const r = svg.current!.getBoundingClientRect();
    const px = ((e.clientX - r.left) / r.width) * W;
    setActive(Math.min(n - 1, Math.max(0, Math.round(((px - M.l) / (W - M.l - M.r)) * (n - 1)))));
  }

  function onKey(e: KeyboardEvent<SVGSVGElement>) {
    if (e.key === "ArrowRight") setActive((i) => Math.min(n - 1, (i ?? -1) + 1));
    else if (e.key === "ArrowLeft") setActive((i) => Math.max(0, (i ?? n) - 1));
    else if (e.key === "Escape") setActive(null);
    else return;
    e.preventDefault();
  }

  const ticks = Array.from({ length: 5 }, (_, i) => i * step);

  return (
    <div>
      <div ref={box} className="relative">
        <svg
          ref={svg}
          viewBox={`0 0 ${W} ${H}`}
          className="block h-auto w-full touch-pan-y rounded outline-none focus-visible:ring-2 focus-visible:ring-neutral-900"
          tabIndex={0}
          role="img"
          aria-label={`Line chart of guests booked per event day for the next ${n} days. Use the left and right arrow keys to read each day.`}
          onPointerMove={onPointer}
          onPointerLeave={() => setActive(null)}
          onBlur={() => setActive(null)}
          onKeyDown={onKey}
        >
          {ticks.map((t) => (
            <g key={t}>
              <line x1={M.l} x2={W - M.r} y1={y(t)} y2={y(t)} stroke={t === 0 ? AXIS : GRID} strokeWidth={1} />
              <text x={M.l - 8} y={y(t) + 4} textAnchor="end" fontSize={11} fill={MUTED}>
                {t}
              </text>
            </g>
          ))}
          {days.map((d, i) =>
            i % (W < 480 ? 4 : 3) === 0 ? (
              <text key={d.key} x={x(i)} y={H - 8} textAnchor="middle" fontSize={11} fill={MUTED}>
                {d.label}
              </text>
            ) : null,
          )}

          <path d={area} fill={LINE} fillOpacity={0.1} />
          <path d={line} fill="none" stroke={LINE} strokeWidth={2} strokeLinejoin="round" strokeLinecap="round" />

          {peak >= 0 && active !== peak && (
            <>
              <circle cx={x(peak)} cy={y(max)} r={4} fill={LINE} stroke="#fff" strokeWidth={2} />
              <text
                x={x(peak)}
                y={y(max) - 10}
                textAnchor={peak === 0 ? "start" : peak === n - 1 ? "end" : "middle"}
                fontSize={12}
                fontWeight={600}
                fill="#0b0b0b"
              >
                {max}
              </text>
            </>
          )}
          {active !== null && a && (
            <>
              <line x1={x(active)} x2={x(active)} y1={M.t} y2={y(0)} stroke={AXIS} strokeWidth={1} />
              <circle cx={x(active)} cy={y(a.guests)} r={4} fill={LINE} stroke="#fff" strokeWidth={2} />
            </>
          )}
        </svg>

        {a && active !== null && (
          <div
            className="pointer-events-none absolute top-2 z-10 min-w-32 rounded-lg border border-neutral-200 bg-white px-3 py-2 text-xs shadow-sm"
            style={{
              left: `${(x(active) / W) * 100}%`,
              transform: active > n / 2 ? "translateX(calc(-100% - 12px))" : "translateX(12px)",
            }}
          >
            <p className="text-neutral-600">
              {a.weekday === "Today" ? "Today" : a.weekday}, {a.label}
            </p>
            <p className="mt-1 flex items-center gap-2">
              <span className="inline-block h-0.5 w-3 rounded" style={{ background: LINE }} />
              <span className="text-sm font-semibold text-neutral-950">{a.guests}</span>
              <span className="text-neutral-600">{a.guests === 1 ? "guest" : "guests"}</span>
            </p>
            <p className="mt-0.5 text-neutral-600">
              {a.events} {a.events === 1 ? "event" : "events"}
            </p>
          </div>
        )}

        {max === 0 && (
          <p className="pointer-events-none absolute inset-x-0 top-1/3 text-center text-sm text-neutral-600">
            No guests booked yet
          </p>
        )}
      </div>

      <p className="sr-only" aria-live="polite">
        {a ? `${a.weekday} ${a.label}: ${a.guests} ${a.guests === 1 ? "guest" : "guests"}, ${a.events} ${a.events === 1 ? "event" : "events"}` : ""}
      </p>

      <details className="mt-3 text-sm">
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
