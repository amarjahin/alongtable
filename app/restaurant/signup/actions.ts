"use server";

import { redirect } from "next/navigation";
import { clearCurrentRestaurant, setCurrentRestaurant } from "@/lib/session";
import { createRestaurant, findRestaurantByEmail } from "@/lib/spaces";
import type { FormState } from "../actions";

const str = (f: FormData, k: string) => String(f.get(k) ?? "").trim();
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function signUp(_prev: FormState, formData: FormData): Promise<FormState> {
  const values = { name: str(formData, "name"), location: str(formData, "location"), email: str(formData, "email") };
  const errors: Record<string, string> = {};
  if (!values.name) errors.name = "Enter the restaurant name.";
  if (!values.location) errors.location = "Enter the location.";
  if (!EMAIL.test(values.email)) errors.email = "Enter a valid email.";
  else if (await findRestaurantByEmail(values.email)) errors.email = "This email is already registered. Sign in below.";
  if (Object.keys(errors).length) return { errors, values };

  const restaurant = await createRestaurant(values);
  await setCurrentRestaurant(restaurant.id);
  redirect("/restaurant?registered=1");
}

export async function signIn(_prev: FormState, formData: FormData): Promise<FormState> {
  const email = str(formData, "email");
  const restaurant = EMAIL.test(email) ? await findRestaurantByEmail(email) : null;
  if (!restaurant) return { errors: { email: "No restaurant registered with this email." }, values: { email } };
  await setCurrentRestaurant(restaurant.id);
  redirect("/restaurant");
}

export async function signOut() {
  await clearCurrentRestaurant();
  redirect("/restaurant/signup");
}
