import Link from "next/link";
import { Suspense } from "react";
import { signOut } from "@/app/restaurant/signup/actions";
import { getCurrentRestaurant } from "@/lib/session";

const links = [
  { href: "/events", label: "Find events" },
  { href: "/spaces", label: "Host an event" },
  { href: "/plan", label: "Plan with AI" },
  { href: "/restaurant", label: "For restaurants" },
];

export function Header() {
  return (
    <header className="border-b border-neutral-200 bg-white">
      <nav className="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-x-6 gap-y-2 px-4 py-3">
        <Link href="/" className="text-lg font-semibold">
          ALongTable
        </Link>
        <div className="flex flex-wrap items-center gap-x-5 gap-y-2">
          <ul className="flex flex-wrap gap-x-5 gap-y-1 text-sm">
            {links.map((l) => (
              <li key={l.href} className="whitespace-nowrap">
                <Link href={l.href} className="text-neutral-700 hover:text-neutral-900">
                  {l.label}
                </Link>
              </li>
            ))}
          </ul>
          {/* Reads the session cookie, so it streams in without blocking the rest of the header. */}
          <Suspense fallback={null}>
            <SignedInRestaurant />
          </Suspense>
        </div>
      </nav>
    </header>
  );
}

async function SignedInRestaurant() {
  const restaurant = await getCurrentRestaurant();
  if (!restaurant) return null;

  return (
    <div className="flex items-center gap-3 border-l border-neutral-200 pl-5 text-sm">
      <Link
        href="/restaurant"
        className="whitespace-nowrap font-medium text-neutral-900 hover:underline"
        title="Signed in as a restaurant"
      >
        {restaurant.name}
      </Link>
      <form action={signOut}>
        <button type="submit" className="whitespace-nowrap text-neutral-500 hover:text-neutral-900">
          Sign out
        </button>
      </form>
    </div>
  );
}
