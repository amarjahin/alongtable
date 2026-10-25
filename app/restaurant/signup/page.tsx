import type { Metadata } from "next";
import { SignInForm, SignUpForm } from "./signup-forms";

export const metadata: Metadata = { title: "Register your restaurant · ALongTable" };

export default function SignUpPage() {
  return (
    <main className="mx-auto w-full max-w-xl px-4 py-8">
      <h1 className="text-2xl font-semibold">Register your restaurant</h1>
      <p className="mb-6 mt-1 text-sm text-neutral-600">
        Tell us about your restaurant once. Every space you publish after that reuses these details.
      </p>
      <SignUpForm />
      <hr className="my-8 border-neutral-200" />
      <h2 className="mb-3 text-lg font-semibold">Already registered?</h2>
      <SignInForm />
    </main>
  );
}
