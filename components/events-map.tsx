"use client";

import "maplibre-gl/dist/maplibre-gl.css";
import { useEffect, useMemo, useRef, useState } from "react";
import type { Map as MapLibreMap, Marker } from "maplibre-gl";
import { EventCard } from "@/components/event-card";
import type { Event } from "@/lib/events";

// /events: a map of upcoming events (one pin per restaurant) with the event list beside it
// on the right (below it on phones). Tapping a pin narrows the list to that restaurant;
// hovering a list item highlights its pin. Tiles: OpenFreeMap (free, no key; OpenStreetMap data).

type Place = { key: string; name: string; location: string; lat: number; lng: number; count: number };

const STYLE_URL = "https://tiles.openfreemap.org/styles/liberty";
const SEATTLE: [number, number] = [-122.335, 47.608];

// Set once; MapLibre adds its own positioning classes to the same element, so state is shown
// with data attributes rather than by replacing className.
const pinClass =
  "flex h-9 min-w-9 cursor-pointer items-center justify-center rounded-full border-2 border-white bg-basil px-2 text-sm font-semibold text-white shadow-md outline-none transition-transform focus-visible:shadow-[var(--alt-focus)] data-[selected=true]:bg-ink data-[hovered=true]:scale-125";

const placeKey = (e: Pick<Event, "restaurantName" | "lat" | "lng">) =>
  e.lat != null && e.lng != null ? `${e.restaurantName}|${e.lat.toFixed(5)}|${e.lng.toFixed(5)}` : null;

export function EventsMap({ events }: { events: Event[] }) {
  const places = useMemo(() => groupByPlace(events), [events]);
  const [selected, setSelected] = useState<string | null>(null);
  const [hovered, setHovered] = useState<string | null>(null);
  const [failed, setFailed] = useState(false);
  const container = useRef<HTMLDivElement>(null);
  const listTop = useRef<HTMLDivElement>(null);
  const markers = useRef(new Map<string, HTMLButtonElement>());

  useEffect(() => {
    if (!container.current) return;
    let map: MapLibreMap | undefined;
    const added: Marker[] = [];
    let cancelled = false;

    (async () => {
      try {
        const maplibre = await import("maplibre-gl");
        if (cancelled || !container.current) return;
        maplibre.setWorkerUrl("/maplibre-gl-worker.mjs"); // copied there by scripts/copy-maplibre-worker.mjs
        const m = new maplibre.Map({
          container: container.current,
          style: STYLE_URL,
          center: SEATTLE,
          zoom: 11,
          attributionControl: { compact: true }, // credits stay one tap away without covering pins
        });
        map = m;
        m.addControl(new maplibre.NavigationControl({ showCompass: false }), "top-right");
        m.on("error", (e) => console.warn("map error", e.error));

        for (const p of places) {
          const el = document.createElement("button");
          el.type = "button";
          el.className = pinClass;
          el.textContent = String(p.count);
          el.setAttribute("aria-label", `${p.name}: ${p.count} ${p.count === 1 ? "event" : "events"}`);
          el.addEventListener("click", () => setSelected((s) => (s === p.key ? null : p.key)));
          markers.current.set(p.key, el);
          added.push(new maplibre.Marker({ element: el }).setLngLat([p.lng, p.lat]).addTo(m));
        }

        if (places.length === 1) {
          m.jumpTo({ center: [places[0].lng, places[0].lat], zoom: 14 });
        } else if (places.length > 1) {
          const bounds = new maplibre.LngLatBounds();
          for (const p of places) bounds.extend([p.lng, p.lat]);
          m.fitBounds(bounds, { padding: { top: 56, right: 56, bottom: 72, left: 56 }, maxZoom: 14, duration: 0 });
        }
      } catch (err) {
        console.error("map failed to load", err);
        setFailed(true);
      }
    })();

    const markerEls = markers.current;
    return () => {
      cancelled = true;
      added.forEach((mk) => mk.remove());
      markerEls.clear();
      map?.remove();
    };
  }, [places]);

  useEffect(() => paintPins(markers.current, selected, hovered), [selected, hovered, places]);

  const place = places.find((p) => p.key === selected) ?? null;
  const shown = place ? events.filter((e) => placeKey(e) === place.key) : events;
  const unmapped = events.filter((e) => placeKey(e) === null).length;

  return (
    <div className="grid gap-4 lg:h-[calc(100dvh-9rem)] lg:min-h-[480px] lg:grid-cols-[minmax(0,1fr)_420px]">
      {/* Map: left on wide screens, top on phones */}
      <div className="relative h-[45vh] min-h-[300px] overflow-hidden rounded-card bg-sunken lg:h-full">
        {failed ? (
          <p className="alt-notice alt-notice--problem m-4">The map couldn&apos;t load. Every event is still listed.</p>
        ) : (
          // h-full, not absolute positioning: maplibre-gl.css sets position: relative on the map element.
          <div ref={container} role="region" aria-label="Map of upcoming events" className="h-full w-full" />
        )}
      </div>

      {/* List: right on wide screens, below the map on phones */}
      <section aria-label="Events" className="flex min-h-0 flex-col">
        <div ref={listTop} className="flex items-baseline justify-between gap-3 pb-3">
          {place ? (
            <>
              <div className="min-w-0">
                <p className="font-semibold">{place.name}</p>
                <p className="alt-secondary truncate">
                  {place.location} · {shown.length} {shown.length === 1 ? "event" : "events"}
                </p>
              </div>
              <button type="button" className="alt-link shrink-0" onClick={() => setSelected(null)}>
                Show all events
              </button>
            </>
          ) : (
            <p className="alt-secondary">
              {events.length} upcoming {events.length === 1 ? "event" : "events"}
              {places.length > 0 && " · tap a pin to see one restaurant"}
            </p>
          )}
        </div>

        <ul className="flex flex-col gap-3 lg:min-h-0 lg:flex-1 lg:overflow-y-auto lg:pr-1">
          {shown.map((e) => {
            const key = placeKey(e);
            return (
              <li
                key={e.id}
                onMouseEnter={() => key && setHovered(key)}
                onMouseLeave={() => setHovered(null)}
                onFocus={() => key && setHovered(key)}
                onBlur={() => setHovered(null)}
              >
                <EventCard event={e} />
              </li>
            );
          })}
        </ul>

        {!place && unmapped > 0 && (
          <p className="alt-help pt-3">
            {unmapped} {unmapped === 1 ? "event isn't" : "events aren't"} on the map yet but{" "}
            {unmapped === 1 ? "is" : "are"} listed above.
          </p>
        )}
      </section>
    </div>
  );
}

/** Pins are DOM elements owned by MapLibre markers, so they're updated directly. */
function paintPins(pins: Map<string, HTMLButtonElement>, selected: string | null, hovered: string | null) {
  for (const [key, el] of pins) {
    el.dataset.selected = String(key === selected);
    el.dataset.hovered = String(key === hovered);
    el.setAttribute("aria-pressed", String(key === selected));
  }
}

function groupByPlace(events: Event[]): Place[] {
  const byKey = new Map<string, Place>();
  for (const e of events) {
    const key = placeKey(e);
    if (!key) continue;
    const place = byKey.get(key);
    if (place) place.count++;
    else byKey.set(key, { key, name: e.restaurantName, location: e.location, lat: e.lat!, lng: e.lng!, count: 1 });
  }
  return [...byKey.values()];
}
