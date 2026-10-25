import Link from "next/link";
import type { AvailableSpace } from "@/lib/spaces";
import { formatDate, formatTimeRange } from "@/lib/time";

export function SpaceCard({ space }: { space: AvailableSpace }) {
  const start = new Date(space.startsAt);
  const end = new Date(space.endsAt);

  return (
    <Link
      href={`/spaces/${space.id}`}
      className="block rounded-xl border border-neutral-200 bg-white p-4 transition-colors hover:border-neutral-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neutral-900"
    >
      <p className="font-medium">
        {space.restaurantName} · {space.label}
      </p>
      <p className="text-sm text-neutral-600">{space.location}</p>
      <p className="mt-2 text-sm">
        {formatDate(start)} · {formatTimeRange(start, end)} · {space.capacity} seats
      </p>
    </Link>
  );
}
