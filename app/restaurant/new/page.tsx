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
    <main className="mx-auto w-full max-w-2xl px-4 py-8 sm:py-12">
      <Suspense fallback={<p className="alt-secondary">Loading…</p>}>
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
    <div className="flex flex-col gap-6">
      <header className="flex flex-col gap-2">
        <h1 className="alt-h2">Publish a space</h1>
        <p className="alt-lead alt-secondary">
          Publishing as <span className="font-semibold text-ink">{restaurant.name}</span>, {restaurant.location}.
        </p>
      </header>
      <div className="alt-card !p-6 sm:!p-8">
        <PublishForm days={days} />
      </div>
    </div>
  );
}
