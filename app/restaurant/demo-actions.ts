"use server";

import { revalidatePath } from "next/cache";
import { getCurrentRestaurant } from "@/lib/session";
import { simulateBooking, simulateReservation } from "@/lib/spaces";

// Demo-only: disabled outside `next dev`.
async function guard() {
  if (process.env.NODE_ENV !== "development") return null;
  return getCurrentRestaurant();
}

export async function simulateBookingAction(formData: FormData) {
  const restaurant = await guard();
  if (!restaurant) return;
  await simulateBooking(restaurant.id, String(formData.get("spaceId")));
  revalidatePath("/restaurant");
}

export async function simulateReservationAction(formData: FormData) {
  const restaurant = await guard();
  if (!restaurant) return;
  await simulateReservation(restaurant.id, String(formData.get("spaceId")));
  revalidatePath("/restaurant");
}
