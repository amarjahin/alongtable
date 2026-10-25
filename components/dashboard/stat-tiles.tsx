export function StatTiles({ items }: { items: { label: string; value: number }[] }) {
  return (
    <dl className="grid grid-cols-3 gap-3">
      {items.map((i) => (
        <div key={i.label} className="rounded-xl border border-neutral-200 bg-white p-4">
          <dt className="text-xs text-neutral-600">{i.label}</dt>
          <dd className="mt-1 text-2xl font-semibold">{i.value.toLocaleString("en-US")}</dd>
        </div>
      ))}
    </dl>
  );
}
