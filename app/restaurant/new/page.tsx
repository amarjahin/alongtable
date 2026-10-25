import type { Metadata } from "next";
import { PublishForm } from "./publish-form";

export const metadata: Metadata = { title: "Publish a space · ALongTable" };

export default function NewSpacePage() {
  return (
    <main className="mx-auto w-full max-w-xl px-4 py-8">
      <h1 className="text-2xl font-semibold">Publish a space</h1>
      <p className="mb-6 mt-1 text-sm text-neutral-600">
        List unused seating so someone can turn it into an event.
      </p>
      <PublishForm />
    </main>
  );
}
