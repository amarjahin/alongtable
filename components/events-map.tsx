"use client";

import "maplibre-gl/dist/maplibre-gl.css";
import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import type { Map as MapLibreMap, Marker } from "maplibre-gl";
import { Badge } from "@/components/ui/badge";
import { formatDate, formatTimeRange } from "@/lib/time";

// Events on a map, one pin per restaurant. Tiles: OpenFreeMap (free, no key; OpenStreetMap data).

export type MapEvent = {
  id: string;
  title: string;
  startsAt: string;
  endsAt: string;
  seatsLeft: number;
  restaurantName: string;
  location: string;
  lat: number;
  lng: number;
};

type Place = { key: string; name: string; location: string; lat: number; lng: number; events: MapEvent[] };

const STYLE_URL = "https://tiles.openfreemap.org/styles/liberty";
const SEATTLE: [number, number] = [-122.335, 47.608];

// Set once; MapLibre adds its own positioning classes to the same element, so selection is
// shown with a data attribute rather than by replacing className.
const pinClass =
  "flex h-9 min-w-9 cursor-pointer items-center justify-center rounded-full border-2 border-white bg-basil px-2 text-sm font-semibold text-white shadow-md outline-none focus-visible:shadow-[var(--alt-focus)] data-[selected=true]:bg-ink";

export function EventsMap({ events, unmapped }: { events: MapEvent[]; unmapped: number }) {
  const places = useMemo(() => groupByPlace(events), [events]);
  const [selected, setSelected] = useState<string | null>(places.length === 1 ? places[0].key : null);
  const [failed, setFailed] = useState(false);
  const container = useRef<HTMLDivElement>(null);
  const markers = useRef(new Map<string, HTMLButtonElement>());

  useEffect(() => {
    if (!container.current || places.length === 0) return;
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
          el.textContent = String(p.events.length);
          el.setAttribute("aria-label", `${p.name}: ${p.events.length} ${p.events.length === 1 ? "event" : "events"}`);
          el.addEventListener("click", () => setSelected(p.key));
          markers.current.set(p.key, el);
          added.push(new maplibre.Marker({ element: el }).setLngLat([p.lng, p.lat]).addTo(m));
        }

        if (places.length === 1) {
          m.jumpTo({ center: [places[0].lng, places[0].lat], zoom: 14 });
        } else {
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
      added.forEach((m) => m.remove());
      markerEls.clear();
      map?.remove();
    };
  }, [places]);

  // Highlight the selected pin.
  useEffect(() => paintPins(markers.current, selected), [selected, places]);

  if (places.length === 0) {
    return (
      <div className="rounded-card bg-surface p-10 text-center">
        <p className="font-semibold">No events on the map yet</p>
        <p className="alt-secondary mt-1">
          {unmapped > 0 ? "Upcoming events are in the list view." : "Book a restaurant space and be the first to host."}
        </p>
      </div>
    );
  }

  const place = places.find((p) => p.key === selected);

  return (
    <div className="flex flex-col gap-4">
      {failed ? (
        <p className="alt-notice alt-notice--problem">The map couldn&apos;t load. The list view shows every event.</p>
      ) : (
        <div
          ref={container}
          role="region"
          aria-label="Map of upcoming events"
          className="h-[55vh] min-h-[320px] w-full overflow-hidden rounded-card bg-sunken"
        />
      )}

      {place ? (
        <section aria-label={`Events at ${place.name}`} className="rounded-card bg-surface p-4">
          <p className="font-semibold">{place.name}</p>
          <p className="alt-secondary">{place.location}</p>
          <ul className="alt-list mt-2">
            {place.events.map((e) => {
              const start = new Date(e.startsAt);
              return (
                <li key={e.id} className="alt-row">
                  <Link href={`/events/${e.id}`} className="alt-row__main hover:underline">
                    <span className="alt-row__title font-semibold">{e.title}</span>
                    <span className="alt-secondary">
                      {formatDate(start)} · {formatTimeRange(start, new Date(e.endsAt))}
                    </span>
                  </Link>
                  <Badge tone={e.seatsLeft === 0 ? "neutral" : "green"}>
                    {e.seatsLeft === 0 ? "Sold out" : `${e.seatsLeft} ${e.seatsLeft === 1 ? "spot" : "spots"} left`}
                  </Badge>
                </li>
              );
            })}
          </ul>
        </section>
      ) : (
        <p className="alt-secondary">Tap a pin to see that restaurant&apos;s events.</p>
      )}

      {unmapped > 0 && (
        <p className="alt-help">
          {unmapped} {unmapped === 1 ? "event isn't" : "events aren't"} on the map yet.{" "}
          <Link href="/events" className="alt-link">
            See all in the list
          </Link>
          .
        </p>
      )}
    </div>
  );
}

/** Pins are DOM elements owned by MapLibre markers, so they're updated directly. */
function paintPins(pins: Map<string, HTMLButtonElement>, selected: string | null) {
  for (const [key, el] of pins) {
    el.dataset.selected = String(key === selected);
    el.setAttribute("aria-pressed", String(key === selected));
  }
}

function groupByPlace(events: MapEvent[]): Place[] {
  const byKey = new Map<string, Place>();
  for (const e of events) {
    const key = `${e.restaurantName}|${e.lat.toFixed(5)}|${e.lng.toFixed(5)}`;
    const place = byKey.get(key) ?? { key, name: e.restaurantName, location: e.location, lat: e.lat, lng: e.lng, events: [] };
    place.events.push(e);
    byKey.set(key, place);
  }
  return [...byKey.values()];
}
