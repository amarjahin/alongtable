export type StatTile = { label: string; value: string; note?: string };

export function StatTiles({ items }: { items: StatTile[] }) {
  return (
    <dl className="grid grid-cols-2 gap-3 sm:grid-cols-4">
      {items.map((i) => (
        <div key={i.label} className="rounded-xl border border-neutral-200 bg-white p-4">
          <dt className="text-xs text-neutral-600">{i.label}</dt>
          <dd className="mt-1 text-2xl font-semibold">{i.value}</dd>
          {i.note && <p className="mt-0.5 text-[11px] text-neutral-500">{i.note}</p>}
        </div>
      ))}
    </dl>
  );
}
