// Mock in-memory store for the restaurant UI. Swap the bodies of these
// functions for Supabase queries once Phase 1 (schema) lands; the types and
// signatures are meant to stay the same.

export type Restaurant = {
  id: string;
  name: string;
  location: string;
  email: string; // not in the README schema yet: used to sign back in without auth
};

export type Space = {
  id: string;
  restaurantId: string;
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

const g = globalThis as unknown as { __spaces?: Space[]; __restaurants?: Restaurant[] };
const store = (g.__spaces ??= []);
const restaurants = (g.__restaurants ??= []);

export async function createRestaurant(input: Omit<Restaurant, "id">): Promise<Restaurant> {
  const restaurant: Restaurant = { ...input, id: crypto.randomUUID() };
  restaurants.push(restaurant);
  return restaurant;
}

export async function getRestaurant(id: string): Promise<Restaurant | null> {
  return restaurants.find((r) => r.id === id) ?? null;
}

export async function findRestaurantByEmail(email: string): Promise<Restaurant | null> {
  const e = email.trim().toLowerCase();
  return restaurants.find((r) => r.email.toLowerCase() === e) ?? null;
}

export async function listSpaces(restaurantId: string): Promise<Space[]> {
  return store
    .filter((s) => s.restaurantId === restaurantId)
    .sort((a, b) => a.startsAt.localeCompare(b.startsAt));
}

export async function createSpace(input: NewSpace): Promise<Space> {
  const space: Space = { ...input, id: crypto.randomUUID(), status: "available", event: null };
  store.push(space);
  return space;
}

// --- Demo-only helpers -------------------------------------------------------
// Stand in for Phase 3/4 (create event, reserve seat) so the Booked state can be
// seen before those exist. Delete once real events and reservations are wired up.

const DEMO_EVENTS = [
  { title: "Debating Pythagoras", organizerName: "Maya Chen" },
  { title: "Sunday Supper Club", organizerName: "Jonas Weber" },
  { title: "Philosophy & Pasta", organizerName: "Priya Nair" },
];

export async function simulateBooking(restaurantId: string, spaceId: string): Promise<void> {
  const space = store.find((s) => s.id === spaceId && s.restaurantId === restaurantId);
  if (!space || space.status === "booked") return;
  const demo = DEMO_EVENTS[store.filter((s) => s.status === "booked").length % DEMO_EVENTS.length];
  space.status = "booked";
  space.event = { ...demo, seatsTaken: 1, capacity: space.capacity };
}

export async function simulateReservation(restaurantId: string, spaceId: string): Promise<void> {
  const space = store.find((s) => s.id === spaceId && s.restaurantId === restaurantId);
  if (space?.event && space.event.seatsTaken < space.event.capacity) space.event.seatsTaken += 1;
}
