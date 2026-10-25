// The seat row (brand/DESIGN.md): one circle per seat. Ink = taken, dashed = open.
// Above 12 seats it becomes a bar. Always paired with the words, so the circles are
// for glancing and the words are for certainty.

export function seatWords(open: number, total: number) {
  if (open === 0) return "Table's full";
  if (open === 1) return "1 seat open";
  return `${open} of ${total} seats open`;
}

export function SeatRow({ total, taken, large = false }: { total: number; taken: number; large?: boolean }) {
  const t = Math.max(0, total);
  const k = Math.min(t, Math.max(0, taken));

  return (
    <div>
      {t > 12 ? (
        <div className="alt-seat-bar" role="img" aria-label={`${k} of ${t} seats taken`}>
          <span style={{ width: `${(k / t) * 100}%` }} />
        </div>
      ) : (
        <ul className={`alt-seats ${large ? "alt-seats--lg" : ""}`} role="img" aria-label={`${k} of ${t} seats taken`}>
          {Array.from({ length: t }, (_, i) => (
            <li key={i} className="alt-seat" data-state={i < k ? "taken" : "open"} />
          ))}
        </ul>
      )}
      <p className="alt-seat-count">{seatWords(t - k, t)}</p>
    </div>
  );
}
