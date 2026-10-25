import "server-only";
import { supabase } from "@/lib/supabase";

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

type SpaceWithBookingRow = {
  id: string;
  restaurant_name: string;
  restaurant_location: string;
  label: string;
  starts_at: string;
  ends_at: string;
  capacity: number;
  description: string | null;
  price_info: string | null;
  status: "available" | "booked";
  event_id: string | null;
  event_title: string | null;
  organizer_name: string | null;
  event_capacity: number | null;
  seats_taken: number | null;
};

export async function listSpaces(): Promise<Space[]> {
  const { data, error } = await supabase()
    .from("spaces_with_booking")
    .select("*")
    .order("starts_at")
    .order("label")
    .returns<SpaceWithBookingRow[]>();
  if (error) throw new Error(`listSpaces: ${error.message}`);

  return data.map((r) => ({
    id: r.id,
    restaurantName: r.restaurant_name,
    location: r.restaurant_location,
    label: r.label,
    startsAt: r.starts_at,
    endsAt: r.ends_at,
    capacity: r.capacity,
    description: r.description,
    priceInfo: r.price_info,
    status: r.status,
    event: r.event_id
      ? {
          title: r.event_title!,
          organizerName: r.organizer_name!,
          seatsTaken: r.seats_taken ?? 0,
          capacity: r.event_capacity!,
        }
      : null,
  }));
}

export async function createSpace(input: NewSpace): Promise<Space> {
  const restaurantId = await findOrCreateRestaurant(input.restaurantName, input.location);

  const { data, error } = await supabase()
    .from("spaces")
    .insert({
      restaurant_id: restaurantId,
      label: input.label,
      starts_at: input.startsAt,
      ends_at: input.endsAt,
      capacity: input.capacity,
      description: input.description,
      price_info: input.priceInfo,
    })
    .select("id")
    .single();
  if (error) throw new Error(`createSpace: ${error.message}`);

  return { ...input, id: data.id, status: "available", event: null };
}

// The data model matches restaurants on lower(trim(name)) and lower(trim(location)).
async function findOrCreateRestaurant(name: string, location: string): Promise<string> {
  name = name.trim();
  location = location.trim();

  const existing = await findRestaurant(name, location);
  if (existing) return existing;

  const { data, error } = await supabase()
    .from("restaurants")
    .insert({ name, location })
    .select("id")
    .single();
  if (!error) return data.id;

  // Another request created it between our lookup and insert.
  if (error.code === "23505") {
    const raced = await findRestaurant(name, location);
    if (raced) return raced;
  }
  throw new Error(`findOrCreateRestaurant: ${error.message}`);
}

async function findRestaurant(name: string, location: string): Promise<string | null> {
  const { data, error } = await supabase()
    .from("restaurants")
    .select("id, name, location")
    .ilike("name", escapeLike(name))
    .ilike("location", escapeLike(location));
  if (error) throw new Error(`findRestaurant: ${error.message}`);

  const key = (s: string) => s.trim().toLowerCase();
  const match = data.find((r) => key(r.name) === key(name) && key(r.location) === key(location));
  return match?.id ?? null;
}

// ilike without wildcards is a case-insensitive equality check.
function escapeLike(s: string): string {
  return s.replace(/[\\%_]/g, (c) => `\\${c}`);
}
