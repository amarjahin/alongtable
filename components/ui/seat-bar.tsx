export function SeatBar({ taken, capacity }: { taken: number; capacity: number }) {
  const left = capacity - taken;
  return (
    <div>
      <div
        role="progressbar"
        aria-label="Seats taken"
        aria-valuenow={taken}
        aria-valuemin={0}
        aria-valuemax={capacity}
        className="h-2 overflow-hidden rounded-full bg-neutral-200"
      >
        <div className="h-full rounded-full bg-neutral-900" style={{ width: `${(taken / capacity) * 100}%` }} />
      </div>
      <p className="mt-1.5 text-xs text-neutral-600">
        {taken} of {capacity} seats taken · {left === 0 ? "Full" : `${left} left`}
      </p>
    </div>
  );
}
