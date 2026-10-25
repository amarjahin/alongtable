import type { Metadata } from "next";
import { Info } from "@phosphor-icons/react/ssr";
import { MapsSetup } from "./maps-setup";
import { SignUpForm } from "./signup-forms";

export const metadata: Metadata = { title: "Register your restaurant · ALongTable" };

export default function SignUpPage() {
  return (
    <main className="mx-auto w-full max-w-xl px-4 py-8 sm:py-12">
      <div className="flex flex-col gap-6">
        <header className="flex flex-col gap-2">
          <h1 className="alt-h2">Register your restaurant</h1>
          <p className="alt-lead alt-secondary">
            Paste your Google Maps link and we&apos;ll fill in your details and suggest spots you could post. You check
            everything before anything goes live.
          </p>
        </header>
        <div className="alt-card !p-6 sm:!p-8">
          <MapsSetup />
        </div>
        <details className="alt-card !p-6 sm:!p-8">
          <summary className="cursor-pointer font-semibold">Enter your details yourself instead</summary>
          <div className="mt-6">
            <SignUpForm />
          </div>
        </details>
        <p className="alt-notice alt-notice--info">
          <Info size={24} aria-hidden="true" className="alt-icon" />
          Already registered? Enter the same name and location to sign back in.
        </p>
      </div>
    </main>
  );
}
