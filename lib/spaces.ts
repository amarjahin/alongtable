// Mock in-memory store for the restaurant UI. Swap the bodies of these
// functions for Supabase queries once Phase 1 (schema) lands; the types and
// signatures are meant to stay the same.

export type Space = {
  id: string;
  restaurantName: string;
  location: string;
  label: string;
  startsAt: string; // ISO, UTC
  endsAt: string; // ISO, UTC
  capacity: number;
  description: string | null;
  priceInfo: string | null;
  status: "available" | "booked";
  event: {
    title: string;
    organizerName: string;
    seatsTaken: number;
    capacity: number;
  } | null;
};

export type NewSpace = Omit<Space, "id" | "status" | "event">;

const g = globalThis as unknown as { __spaces?: Space[] };
const store = (g.__spaces ??= []);

export async function listSpaces(): Promise<Space[]> {
  return [...store].sort((a, b) => a.startsAt.localeCompare(b.startsAt));
}

export async function createSpace(input: NewSpace): Promise<Space> {
  const space: Space = { ...input, id: crypto.randomUUID(), status: "available", event: null };
  store.push(space);
  return space;
}
