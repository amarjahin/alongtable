import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { connection } from "next/server";
import { Suspense } from "react";
import { getCurrentRestaurant } from "@/lib/session";
import { upcomingDays } from "@/lib/time";
import { PublishForm } from "./publish-form";

export const metadata: Metadata = { title: "Publish a space · ALongTable" };

export default function NewSpacePage() {
  return (
    <main className="mx-auto w-full max-w-xl px-4 py-8">
      <Suspense fallback={<p className="text-sm text-neutral-500">Loading…</p>}>
        <Content />
      </Suspense>
    </main>
  );
}

async function Content() {
  const restaurant = await getCurrentRestaurant();
  if (!restaurant) redirect("/restaurant/signup");
  await connection(); // the day tiles depend on today's date, so render per request
  const days = upcomingDays(14);
  return (
    <>
      <h1 className="text-2xl font-semibold">Publish a space</h1>
      <p className="mb-6 mt-1 text-sm text-neutral-600">
        Publishing as <span className="font-medium">{restaurant.name}</span>, {restaurant.location}.
      </p>
      <PublishForm days={days} />
    </>
  );
}
