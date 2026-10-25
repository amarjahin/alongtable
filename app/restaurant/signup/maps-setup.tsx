"use client";

import { useRef, useState, type FormEvent, type ReactNode, type Ref } from "react";
import { flushSync } from "react-dom";
import Link from "next/link";
import { Switch } from "@base-ui/react/switch";
import { CheckCircle, CircleNotch, Info, MapPin, WarningCircle } from "@phosphor-icons/react/ssr";
import { StepBar, Steps, type Step } from "@/components/onboarding/steps";
import { Button, ButtonLink } from "@/components/ui/button";
import { SeatRow } from "@/components/ui/seat-row";
import type { RestaurantProfile, SpotSuggestion } from "@/lib/onboarding";
import { PRICES, SLOTS } from "@/lib/space-options";
import { getSuggestions, publishSuggestion, registerFromProfile } from "./onboard-actions";
import { SAMPLE_PROFILE } from "./sample-profile";

type Stage = "link" | "researching" | "review" | "suggesting" | "suggestions" | "live";
type Source = "live" | "sample" | "manual";
/** A Pick-dates row after a publish attempt. */
type RowState = { status: "published" } | { status: "failed"; error: string };

const icon = { size: 24, "aria-hidden": true, className: "alt-icon" } as const;

const STEP_OF: Record<Stage, Step> = { link: 1, researching: 1, review: 2, suggesting: 2, suggestions: 3, live: 4 };

/** The step list (desktop) or progress bar (mobile) beside the current step's card. */
function Layout({ step, back, top, title, lead, children, after }: {
  step: Step;
  back: boolean;
  top?: ReactNode;
  title: string;
  lead?: ReactNode;
  children: ReactNode;
  after?: ReactNode;
}) {
  return (
    <div className="flex items-start gap-12">
      <aside className="hidden w-60 shrink-0 pt-2 lg:block">
        <Steps current={step} />
      </aside>
      <div className="flex min-w-0 max-w-[640px] flex-1 flex-col gap-6">
        <div className="lg:hidden">
          <StepBar current={step} />
        </div>
        <div key={step} className={`alt-step-in ${back ? "alt-step-in--back" : ""} flex flex-col gap-6`}>
          <header className="flex flex-col gap-2">
            {top}
            <h1 className="alt-h2">{title}</h1>
            {lead && <p className="alt-lead alt-secondary">{lead}</p>}
          </header>
          <div className="alt-card !p-6 sm:!p-8">{children}</div>
          {after}
        </div>
      </div>
    </div>
  );
}

/** A profile with only what the owner typed; suggestSpots treats it as "estimate". */
function manualProfile(name: string, location: string): RestaurantProfile {
  return { name, location, address: null, cuisine: null, priceRange: null, summary: null, hours: [], areas: [], sources: [], confidence: "low", missing: [], lat: null, lng: null };
}

export function MapsSetup() {
  const [stage, setStageRaw] = useState<Stage>("link");
  const stageRef = useRef<Stage>("link");
  const [back, setBack] = useState(false);
  const [link, setLink] = useState("");
  const [linkError, setLinkError] = useState<string | null>(null);
  const [steps, setSteps] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [profile, setProfile] = useState<RestaurantProfile | null>(null);
  const [source, setSource] = useState<Source>("live");
  const [name, setName] = useState("");
  const [location, setLocation] = useState("");
  const [manualOpen, setManualOpen] = useState(false);
  const [manualName, setManualName] = useState("");
  const [manualLocation, setManualLocation] = useState("");
  const [manualErrors, setManualErrors] = useState<{ name?: string; location?: string }>({});
  const manualNameRef = useRef<HTMLInputElement>(null);
  const [returning, setReturning] = useState(false);
  const [suggestions, setSuggestions] = useState<SpotSuggestion[]>([]);
  const [basis, setBasis] = useState<"hours" | "estimate">("hours");
  const [selected, setSelected] = useState<Record<number, boolean>>({});
  const [rows, setRows] = useState<Record<number, RowState>>({});
  const [publishing, setPublishing] = useState(false);
  const [pickError, setPickError] = useState(false);
  const [shake, setShake] = useState(0);
  const [failure, setFailure] = useState<{ failed: number; of: number } | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  // Remember the direction so the next step card slides in from the correct side.
  function setStage(next: Stage) {
    setBack(STEP_OF[next] < STEP_OF[stageRef.current]);
    stageRef.current = next;
    setStageRaw(next);
  }

  function applyProfile(p: RestaurantProfile, from: Source) {
    setProfile(p);
    setSource(from);
    setName(p.name);
    setLocation(p.location);
    setError(null);
    setStage("review");
  }

  /** "Enter my details myself": open the manual form and put the cursor in Restaurant name. */
  function openManual() {
    flushSync(() => setManualOpen(true));
    manualNameRef.current?.focus();
  }

  async function lookUp(e: FormEvent) {
    e.preventDefault();
    if (!link.trim()) {
      setLinkError("Paste your restaurant's Google Maps link.");
      return;
    }
    setLinkError(null);
    abortRef.current?.abort();
    const abort = new AbortController();
    abortRef.current = abort;
    const timeout = setTimeout(() => abort.abort(), 120_000);
    setStage("researching");
    setSteps([]);
    setError(null);

    try {
      const res = await fetch("/api/onboard", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ link: link.trim() }),
        signal: abort.signal,
      });
      if (!res.ok || !res.body) {
        const body = await res.json().catch(() => null);
        throw new Error(body?.error ?? "We couldn't look up your restaurant.");
      }
      const reader = res.body.pipeThrough(new TextDecoderStream()).getReader();
      let buffer = "";
      while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        buffer += value;
        const lines = buffer.split("\n");
        buffer = lines.pop() ?? "";
        for (const line of lines) {
          if (!line.trim()) continue;
          const msg = JSON.parse(line);
          if (msg.type === "step") setSteps((s) => [...s, msg.message]);
          else if (msg.type === "profile") return applyProfile(msg.profile, "live");
          else if (msg.type === "error") throw new Error(msg.message);
        }
      }
      throw new Error("The lookup stopped before finishing. Please try again.");
    } catch (err) {
      if (abort.signal.aborted && abortRef.current !== abort) return;
      setError(abort.signal.aborted ? "The lookup took too long. Please try again." : (err as Error).message);
      setStage("link");
    } finally {
      clearTimeout(timeout);
    }
  }

  async function confirm(e: FormEvent) {
    e.preventDefault();
    if (!profile) return;
    await registerAndSuggest(profile, name, location);
  }

  /** Register (or sign back in), then ask for dates. Shared by the Maps and manual paths. */
  async function registerAndSuggest(p: RestaurantProfile, n: string, loc: string) {
    setError(null);
    setStage("suggesting");
    const pin = p.lat != null && p.lng != null ? { lat: p.lat, lng: p.lng } : null;
    const reg = await registerFromProfile(n, loc, pin);
    if (!reg.ok) {
      setError(reg.error);
      setStage("review");
      return;
    }
    setReturning(reg.returning);
    const res = await getSuggestions({ ...p, name: n, location: loc });
    if (!res.ok) {
      setError(res.error);
      setSuggestions([]);
    } else {
      setSuggestions(res.suggestions);
      setBasis(res.basis);
    }
    // The first two dates start switched on; the rest are the owner's call.
    setSelected({ 0: true, 1: true });
    setRows({});
    setFailure(null);
    setPickError(false);
    setStage("suggestions");
  }

  async function submitManual(e: FormEvent) {
    e.preventDefault();
    const n = manualName.trim();
    const loc = manualLocation.trim();
    const errors = { name: n ? undefined : "Enter the restaurant name.", location: loc ? undefined : "Enter the location." };
    setManualErrors(errors);
    if (errors.name || errors.location) return;
    const p = manualProfile(n, loc);
    setProfile(p);
    setSource("manual");
    setName(n);
    setLocation(loc);
    await registerAndSuggest(p, n, loc);
  }

  /**
   * Publish every selected date that isn't live yet, one after another so each error
   * stays with its row. The AI only suggested these; this runs on the owner's tap.
   */
  async function publishSelected() {
    const todo = suggestions.map((_, i) => i).filter((i) => selected[i] && rows[i]?.status !== "published");
    if (todo.length === 0) {
      setPickError(true);
      setShake((k) => k + 1);
      return;
    }
    setPickError(false);
    setPublishing(true);
    const next = { ...rows };
    let failed = 0;
    for (const i of todo) {
      const res = await publishSuggestion(suggestions[i]);
      next[i] = res.ok ? { status: "published" } : { status: "failed", error: res.error };
      if (!res.ok) failed++;
      setRows({ ...next });
    }
    setPublishing(false);
    setFailure(failed ? { failed, of: todo.length } : null);
    if (!failed) setStage("live");
  }

  // ---- Stage: paste link / researching -----------------------------------
  if (stage === "link" || stage === "researching") {
    const running = stage === "researching";
    return (
      <Layout
        step={1}
        back={back}
        title="Find your restaurant"
        lead="Paste your Google Maps link and we'll fill in your details and suggest dates you could post. You check everything before anything goes live."
        after={
          <>
            <details
              id="manual-details"
              className="alt-card !p-6 sm:!p-8"
              open={manualOpen}
              onToggle={(e) => setManualOpen(e.currentTarget.open)}
            >
              <summary className="cursor-pointer py-2.5 font-semibold">Enter your details yourself instead</summary>
              <form onSubmit={submitManual} noValidate className="mt-6 flex flex-col gap-6">
                <TextInput
                  id="manual-name"
                  label="Restaurant name"
                  value={manualName}
                  onChange={setManualName}
                  error={manualErrors.name}
                  placeholder="Il Nido"
                  inputRef={manualNameRef}
                />
                <TextInput
                  id="manual-location"
                  label="Location"
                  value={manualLocation}
                  onChange={setManualLocation}
                  error={manualErrors.location}
                  placeholder="West Seattle, Seattle, WA"
                  help="Neighborhood and city."
                />
                <Button type="submit" className="alt-button--block">
                  Continue
                </Button>
              </form>
            </details>
            <p className="alt-notice alt-notice--info">
              <Info {...icon} />
              Already registered? Enter the same name and location to sign back in.
            </p>
          </>
        }
      >
        <div className="flex flex-col gap-5">
          <form onSubmit={lookUp} className="flex flex-col gap-4">
            <div className="alt-field">
              <label htmlFor="maps-link" className="alt-label flex items-center gap-2">
                <MapPin size={20} aria-hidden="true" />
                Your Google Maps link
              </label>
              <input
                id="maps-link"
                type="url"
                inputMode="url"
                className="alt-input"
                placeholder="https://maps.app.goo.gl/…"
                value={link}
                onChange={(e) => setLink(e.target.value)}
                disabled={running}
                aria-invalid={linkError ? true : undefined}
                aria-describedby={linkError ? "maps-link-help maps-link-error" : "maps-link-help"}
              />
              <p id="maps-link-help" className="alt-help">In Google Maps, open your restaurant, tap Share, then Copy link.</p>
              {linkError && (
                <p id="maps-link-error" role="alert" className="alt-error">
                  {linkError}
                </p>
              )}
            </div>
            <Button type="submit" disabled={running} className="alt-button--block">
              {running ? "Looking up your restaurant…" : "Look up my restaurant"}
            </Button>
          </form>

          {running && (
            <ol aria-live="polite" aria-label="Progress" className="alt-list">
              {(steps.length ? steps : ["Reading your link"]).map((s, i, all) => (
                <li key={i} className="alt-row">
                  <span className={i === all.length - 1 ? "text-ink" : "alt-secondary"}>{s}</span>
                  {i < all.length - 1 && <CheckCircle size={20} aria-hidden="true" className="text-basil" />}
                </li>
              ))}
            </ol>
          )}

          {error && (
            <div role="alert" className="alt-notice alt-notice--problem">
              <WarningCircle {...icon} />
              <div className="flex flex-col items-start gap-3">
                <div className="flex flex-col gap-1">
                  <span>We couldn&apos;t find that restaurant</span>
                  <span className="font-normal">{error}</span>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <Button variant="secondary" onClick={openManual} aria-controls="manual-details">
                    Enter my details myself
                  </Button>
                  <Button variant="quiet" onClick={() => applyProfile(SAMPLE_PROFILE, "sample")}>
                    Try with a sample restaurant
                  </Button>
                </div>
              </div>
            </div>
          )}
        </div>
      </Layout>
    );
  }

  // ---- Stage: review profile ----------------------------------------------
  if ((stage === "review" || stage === "suggesting") && profile) {
    const busy = stage === "suggesting";
    return (
      <Layout
        step={2}
        back={back}
        title="Check your details"
        lead={source === "manual" ? "Here's what you entered. Fix anything that's wrong." : "Here's what we found. Check it and fix anything that's wrong."}
      >
        <form onSubmit={confirm} className="flex flex-col gap-5">
          <span className={`alt-chip ${source === "live" ? "alt-chip--info" : ""} self-start`}>
            {source === "live" ? "From Google and the web" : source === "sample" ? "Sample restaurant" : "Added by you"}
          </span>
          {source === "sample" && (
            <p className="alt-notice alt-notice--info">
              <Info {...icon} />
              This is a sample restaurant so you can see how setup works. Change the name and location to your own.
            </p>
          )}
          <div className="alt-field">
            <label htmlFor="profile-name" className="alt-label">Restaurant name</label>
            <input id="profile-name" className="alt-input" value={name} onChange={(e) => setName(e.target.value)} disabled={busy} />
          </div>
          <div className="alt-field">
            <label htmlFor="profile-location" className="alt-label">Location</label>
            <input id="profile-location" className="alt-input" value={location} onChange={(e) => setLocation(e.target.value)} disabled={busy} />
            <p className="alt-help">Neighborhood and city, e.g. Capitol Hill, Seattle, WA.</p>
          </div>

          <ProfileDetails profile={profile} />

          {error && (
            <p role="alert" className="alt-notice alt-notice--problem">
              <WarningCircle {...icon} />
              {error}
            </p>
          )}
          <Button type="submit" disabled={busy || !name.trim() || !location.trim()} className="alt-button--block">
            {busy ? "Finding good dates…" : "Looks right"}
          </Button>
          {!busy && (
            <button type="button" className="alt-link self-center" onClick={() => setStage("link")}>
              Use a different link
            </button>
          )}
        </form>
      </Layout>
    );
  }

  // ---- Stage: live --------------------------------------------------------
  if (stage === "live") {
    const live = suggestions.filter((_, i) => rows[i]?.status === "published");
    const one = live.length === 1;
    return (
      <Layout
        step={4}
        back={back}
        top={
          <span className="mb-4 inline-flex size-[72px] items-center justify-center rounded-full bg-mint" aria-hidden="true">
            <svg viewBox="0 0 24 24" width="36" height="36" fill="none">
              <path
                className="alt-draw"
                d="M5 12.5l4.5 4.5L19 7.5"
                style={{ stroke: "var(--alt-basil)", strokeWidth: 2.5, strokeLinecap: "round", strokeLinejoin: "round" }}
              />
            </svg>
          </span>
        }
        title={one ? "Your space is live" : `Your ${live.length} spaces are live`}
        lead={`Hosts can book ${one ? "it" : "them"} now. You'll see bookings on your dashboard.`}
      >
        <div className="flex flex-col gap-6">
          <ul className="flex flex-col gap-3" aria-label="Published spaces">
            {live.map((s, i) => (
              <li
                key={`${s.date}-${s.slot}-${s.area}`}
                className="alt-rise flex flex-col gap-3 rounded-control bg-sunken p-4"
                style={{ animationDelay: `calc(var(--alt-stagger-row) * ${i})` }}
              >
                <div className="alt-row__main">
                  <span className="alt-row__title">{whenLabel(s)}</span>
                  <span className="alt-secondary">
                    {s.area} · {s.capacity} seats open
                  </span>
                </div>
                <SeatRow total={s.capacity} taken={0} pop count={false} />
              </li>
            ))}
          </ul>
          <ButtonLink href={returning ? "/restaurant" : "/restaurant?registered=1"} className="alt-button--block">
            Go to my dashboard
          </ButtonLink>
        </div>
      </Layout>
    );
  }

  // ---- Stage: pick dates --------------------------------------------------
  const count = suggestions.filter((_, i) => selected[i] && rows[i]?.status !== "published").length;
  const dashboard = returning
    ? { href: "/restaurant", label: "Go to my dashboard" }
    : { href: "/restaurant?registered=1", label: "Skip for now" };
  return (
    <Layout
      step={3}
      back={back}
      title="Which dates could use more guests?"
      lead={
        suggestions.length > 0 ? (
          <>
            {basis === "hours"
              ? "Picked from your opening hours, at times that are often quieter for restaurants like yours."
              : "We couldn't confirm your opening hours, so these times are estimates. Check them before publishing."}{" "}
            Nothing is posted until you tap Publish.
          </>
        ) : undefined
      }
    >
      {suggestions.length > 0 ? (
        <div className="flex flex-col gap-5">
          <ul key={shake} className={`alt-list rounded-control bg-sunken !px-4 ${shake ? "alt-shake" : ""}`} aria-label="Suggested dates">
            {suggestions.map((s, i) => (
              <DateRow
                key={i}
                s={s}
                index={i}
                checked={!!selected[i]}
                state={rows[i]}
                disabled={publishing}
                onChange={(on) => {
                  setSelected((x) => ({ ...x, [i]: on }));
                  if (on) setPickError(false);
                }}
              />
            ))}
          </ul>

          {pickError && (
            <p id="pick-error" role="alert" className="alt-error">
              Pick at least one date to continue.
            </p>
          )}

          {failure && !publishing && (
            <div role="status" className="alt-notice alt-notice--filling">
              <Info {...icon} />
              <div className="flex flex-col gap-1">
                <span className="font-semibold">
                  We couldn&apos;t publish {failure.failed} of {failure.of} {failure.of === 1 ? "date" : "dates"}
                </span>
                <span>Your choices are saved. Check your connection and try again.</span>
              </div>
            </div>
          )}

          <Button
            onClick={publishSelected}
            disabled={publishing}
            className="alt-button--block"
            aria-describedby={pickError ? "pick-error" : undefined}
          >
            {publishing ? (
              <>
                <CircleNotch size={20} aria-hidden="true" className="motion-safe:animate-spin" />
                Publishing…
              </>
            ) : failure ? (
              "Try again"
            ) : (
              `Publish ${count} ${count === 1 ? "space" : "spaces"}`
            )}
          </Button>
          <ButtonLink href={dashboard.href} variant="quiet" className="self-center">
            {dashboard.label}
          </ButtonLink>
        </div>
      ) : (
        <div className="flex flex-col gap-5">
          <p className="alt-notice alt-notice--info">
            <Info {...icon} />
            {error ?? "We couldn't find a good date to suggest right now."} You can publish one yourself.
          </p>
          <ButtonLink href="/restaurant/new" className="alt-button--block">
            Publish a space yourself
          </ButtonLink>
          <ButtonLink href={dashboard.href} variant="quiet" className="self-center">
            {dashboard.label}
          </ButtonLink>
        </div>
      )}
    </Layout>
  );
}

// ---------------------------------------------------------------------------

function TextInput({ id, label, value, onChange, error, help, placeholder, inputRef }: {
  id: string;
  label: string;
  value: string;
  onChange: (v: string) => void;
  error?: string;
  help?: string;
  placeholder?: string;
  inputRef?: Ref<HTMLInputElement>;
}) {
  const describedBy = [help && `${id}-help`, error && `${id}-error`].filter(Boolean).join(" ") || undefined;
  return (
    <div className="alt-field">
      <label htmlFor={id} className="alt-label">
        {label}
      </label>
      <input
        ref={inputRef}
        id={id}
        className="alt-input"
        value={value}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
        aria-invalid={error ? true : undefined}
        aria-describedby={describedBy}
      />
      {help && (
        <p id={`${id}-help`} className="alt-help">
          {help}
        </p>
      )}
      {error && (
        <p id={`${id}-error`} role="alert" className="alt-error">
          {error}
        </p>
      )}
    </div>
  );
}

function ProfileDetails({ profile }: { profile: RestaurantProfile }) {
  const facts = [
    profile.cuisine && ["Cuisine", [profile.cuisine, profile.priceRange].filter(Boolean).join(" · ")],
    profile.address && ["Address", profile.address],
    profile.hours.length > 0 && ["Hours", formatHours(profile.hours)],
    profile.areas.length > 0 && ["Seating", profile.areas.join(", ")],
  ].filter(Boolean) as [string, string][];

  if (facts.length === 0 && !profile.summary) return null;
  return (
    <section aria-label="What we found" className="rounded-control bg-sunken p-4">
      {profile.summary && <p className="mb-2">{profile.summary}</p>}
      <dl className="alt-list">
        {facts.map(([k, v]) => (
          <div key={k} className="alt-row !items-start">
            <dt className="alt-secondary shrink-0">{k}</dt>
            <dd className="text-right">{v}</dd>
          </div>
        ))}
      </dl>
      {profile.missing.length > 0 && <p className="alt-help mt-2">We couldn&apos;t confirm: {profile.missing.join("; ")}.</p>}
      {profile.sources.length > 0 && (
        <p className="alt-help mt-2">
          Sources:{" "}
          {profile.sources.map((s, i) => (
            <span key={s.url}>
              {i > 0 && ", "}
              <a href={s.url} target="_blank" rel="noopener noreferrer" className="alt-link">
                {s.title || new URL(s.url).hostname}
              </a>
            </span>
          ))}
        </p>
      )}
    </section>
  );
}

/** "Tue, Oct 27 · Dinner 6–9 PM" */
function whenLabel(s: SpotSuggestion): string {
  const slot = SLOTS.find((x) => x.value === s.slot);
  return `${formatDay(s.date)} · ${slot?.label} ${slot?.hint.replace(/ – /g, "–")}`;
}

function DateRow({ s, index, checked, state, disabled, onChange }: {
  s: SpotSuggestion;
  index: number;
  checked: boolean;
  state?: RowState;
  disabled: boolean;
  onChange: (on: boolean) => void;
}) {
  const price = PRICES.find((p) => p.value === s.price);
  const editParams = new URLSearchParams({ area: s.area, date: s.date, slot: s.slot, capacity: String(s.capacity), price: s.price });
  for (const f of s.features) editParams.append("features", f);
  const when = whenLabel(s);
  const published = state?.status === "published";

  return (
    <li className="alt-row alt-rise !items-start !py-4" style={{ animationDelay: `calc(var(--alt-stagger-row) * ${index})` }}>
      <div className="alt-row__main flex-1 !gap-1">
        <span className="alt-row__title">{when}</span>
        <span>
          {s.area} · {s.capacity} seats{price?.info ? ` · ${price.label}` : ""}
          {s.features.length ? ` · ${s.features.join(", ")}` : ""}
        </span>
        <div className="flex flex-wrap items-center justify-between gap-x-3">
          <span className="alt-row__meta">{s.reason}</span>
          {!published && (
            <Link href={`/restaurant/new?${editParams}`} className="alt-button alt-button--quiet !px-0">
              Edit first
            </Link>
          )}
        </div>
        {state?.status === "failed" && (
          <p className="alt-error flex items-center gap-2">
            <WarningCircle size={20} aria-hidden="true" />
            {state.error}
          </p>
        )}
      </div>
      {published ? (
        <span className="alt-chip alt-chip--booked shrink-0">Published</span>
      ) : (
        <label className="inline-flex min-h-11 min-w-11 shrink-0 cursor-pointer items-center justify-center">
          <Switch.Root className="alt-switch" checked={checked} onCheckedChange={onChange} disabled={disabled} aria-label={when}>
            <Switch.Thumb className="alt-switch__thumb" />
          </Switch.Root>
        </label>
      )}
    </li>
  );
}

function formatDay(date: string): string {
  const [y, m, d] = date.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d, 12)).toLocaleDateString("en-US", {
    timeZone: "UTC",
    weekday: "short",
    month: "short",
    day: "numeric",
  });
}

function formatTime(hhmm: string): string {
  const [h, m] = hhmm.split(":").map(Number);
  const suffix = h >= 12 && h < 24 ? "PM" : "AM";
  const h12 = h % 12 || 12;
  return m ? `${h12}:${String(m).padStart(2, "0")} ${suffix}` : `${h12} ${suffix}`;
}

/** "Tue–Thu 11:30 AM–9:30 PM; Fri–Sat 10 AM–11 PM" */
function formatHours(hours: RestaurantProfile["hours"]): string {
  const order = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
  const byDay = new Map<string, string>();
  for (const h of hours) {
    const range = `${formatTime(h.opens)}–${formatTime(h.closes)}`;
    byDay.set(h.day, byDay.has(h.day) ? `${byDay.get(h.day)}, ${range}` : range);
  }
  const groups: { from: string; to: string; range: string }[] = [];
  for (const day of order) {
    const range = byDay.get(day);
    if (!range) continue;
    const last = groups[groups.length - 1];
    if (last && last.range === range && order.indexOf(day) === order.indexOf(last.to) + 1) last.to = day;
    else groups.push({ from: day, to: day, range });
  }
  return groups.map((g) => `${g.from === g.to ? g.from : `${g.from}–${g.to}`} ${g.range}`).join("; ");
}
