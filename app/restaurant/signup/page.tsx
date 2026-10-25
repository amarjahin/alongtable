import type { Metadata } from "next";
import { SignUpForm } from "./signup-forms";

export const metadata: Metadata = { title: "Register your restaurant · ALongTable" };

export default function SignUpPage() {
  return (
    <main className="mx-auto w-full max-w-xl px-4 py-8">
      <h1 className="text-2xl font-semibold">Register your restaurant</h1>
      <p className="mb-6 mt-1 text-sm text-neutral-600">
        Tell us about your restaurant once. Every space you publish after that reuses these details. Already
        registered? Enter the same name and location to sign back in.
      </p>
      <SignUpForm />
    </main>
  );
}
