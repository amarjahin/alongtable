"use server";

import { redirect } from "next/navigation";
import { after } from "next/server";
import { clearCurrentRestaurant, setCurrentRestaurant } from "@/lib/session";
import { registerRestaurant } from "@/lib/spaces";
import type { FormState } from "../actions";
import { pinRestaurant } from "@/lib/restaurant-pins";

const str = (f: FormData, k: string) => String(f.get(k) ?? "").trim();

/** Register a restaurant, or sign back in if its name and location are already registered. */
export async function signUp(_prev: FormState, formData: FormData): Promise<FormState> {
  const values = { name: str(formData, "name"), location: str(formData, "location") };
  const errors: Record<string, string> = {};
  if (!values.name) errors.name = "Enter the restaurant name.";
  if (!values.location) errors.location = "Enter the location.";
  if (Object.keys(errors).length) return { errors, values };

  let restaurant;
  try {
    restaurant = await registerRestaurant(values.name, values.location);
  } catch (err) {
    console.error("signUp failed", err);
    return { errors: { form: "We couldn't register your restaurant. Please try again." }, values };
  }
  await setCurrentRestaurant(restaurant.id);
  after(() => pinRestaurant(restaurant.id, restaurant.name, restaurant.location, null)); // map pin, after the response
  redirect("/restaurant?registered=1");
}

export async function signOut() {
  await clearCurrentRestaurant();
  redirect("/restaurant/signup");
}
