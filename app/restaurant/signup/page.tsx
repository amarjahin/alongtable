import type { Metadata } from "next";
import { Info } from "@phosphor-icons/react/ssr";
import { MapsSetup } from "./maps-setup";
import { SignUpForm } from "./signup-forms";

export const metadata: Metadata = { title: "List your restaurant · ALongTable" };

export default function SignUpPage() {
  return (
    <main className="mx-auto w-full max-w-5xl px-4 py-8 sm:py-12">
      <MapsSetup
        manual={
          <>
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
          </>
        }
      />
    </main>
  );
}
