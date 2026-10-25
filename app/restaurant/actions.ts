"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createSpace } from "@/lib/spaces";
import { seattleToUtc } from "@/lib/time";

export type FormState = {
  errors?: Record<string, string>;
  formError?: string;
  values?: Record<string, string>;
};

const str = (f: FormData, k: string) => String(f.get(k) ?? "").trim();

export async function publishSpace(_prev: FormState, formData: FormData): Promise<FormState> {
  const values = Object.fromEntries(
    ["restaurantName", "location", "label", "date", "startTime", "endTime", "capacity", "description", "priceInfo"].map(
      (k) => [k, str(formData, k)],
    ),
  );
  const errors: Record<string, string> = {};

  if (!values.restaurantName) errors.restaurantName = "Enter the restaurant name.";
  if (!values.location) errors.location = "Enter the location.";
  if (!values.label) errors.label = "Give the space a label, e.g. “Table A”.";

  const capacity = Number(values.capacity);
  if (!Number.isInteger(capacity) || capacity < 1) errors.capacity = "Capacity must be at least 1.";

  let startsAt: Date | null = null;
  let endsAt: Date | null = null;
  if (!values.date) errors.date = "Pick a date.";
  if (!values.startTime) errors.startTime = "Pick a start time.";
  if (!values.endTime) errors.endTime = "Pick an end time.";
  if (values.date && values.startTime && values.endTime) {
    startsAt = seattleToUtc(values.date, values.startTime);
    endsAt = seattleToUtc(values.date, values.endTime);
    if (endsAt <= startsAt) errors.endTime = "End time must be after the start time.";
    else if (startsAt <= new Date()) errors.date = "The date and time must be in the future.";
  }

  if (Object.keys(errors).length || !startsAt || !endsAt) return { errors, values };

  try {
    await createSpace({
      restaurantName: values.restaurantName,
      location: values.location,
      label: values.label,
      startsAt: startsAt.toISOString(),
      endsAt: endsAt.toISOString(),
      capacity,
      description: values.description || null,
      priceInfo: values.priceInfo || null,
    });
  } catch (err) {
    console.error(err);
    return { formError: "We couldn't publish the space. Please try again.", values };
  }

  revalidatePath("/restaurant");
  redirect("/restaurant?published=1");
}
