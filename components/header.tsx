import Link from "next/link";

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
        <ul className="flex flex-wrap gap-x-5 gap-y-1 text-sm">
          {links.map((l) => (
            <li key={l.href} className="whitespace-nowrap">
              <Link href={l.href} className="text-neutral-700 hover:text-neutral-900">
                {l.label}
              </Link>
            </li>
          ))}
        </ul>
      </nav>
    </header>
  );
}
