import type { Metadata } from "next";
import { Info } from "@phosphor-icons/react/ssr";
import { SignUpForm } from "./signup-forms";

export const metadata: Metadata = { title: "Register your restaurant · ALongTable" };

export default function SignUpPage() {
  return (
    <main className="mx-auto w-full max-w-xl px-4 py-8 sm:py-12">
      <div className="flex flex-col gap-6">
        <header className="flex flex-col gap-2">
          <h1 className="alt-h2">Register your restaurant</h1>
          <p className="alt-lead alt-secondary">
            Tell us about your restaurant once. Every space you publish after that reuses these details.
          </p>
        </header>
        <div className="alt-card !p-6 sm:!p-8">
          <SignUpForm />
        </div>
        <p className="alt-notice alt-notice--info">
          <Info size={24} aria-hidden="true" className="alt-icon" />
          Already registered? Enter the same name and location to sign back in.
        </p>
      </div>
    </main>
  );
}
