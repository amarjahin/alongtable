# ALongTable

Turn empty tables into thriving communities.

ALongTable is a marketplace that connects restaurants with unused seating to people who want to organize or attend social events. Restaurants publish spaces, any user can book a space and create an event, and other users join by reserving a seat.

Source of truth: [V0 PRD (Google Doc)](https://docs.google.com/document/d/1KZRtQpz9H2RFnxD1zin12C5vj1YJKTTi/edit)

Database contract: [`data-model/README.md`](data-model/README.md)

Live app: **https://alongtable.vercel.app** (every push to `main` deploys automatically)

---

## Getting started

```bash
npm install
cp .env.example .env.local   # then fill in SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY (ask the team)
npm run dev
```

Database scripts (run in the Supabase SQL Editor):

- `supabase/seed.sql`: add three restaurants plus sample spaces, events and reservations (Il Nido is left empty for the live demo). Safe to re-run.
- `supabase/reset.sql`: wipe spaces, events and reservations before a demo run. Keeps restaurants. Run `seed.sql` afterwards to restore the sample data.
- `supabase/drop.sql`, then `schema.sql`, then `seed.sql`: rebuild from scratch after a schema change. Deletes all data.

---

## Initial checklist: V0 build plan

V0 is **one web app with two interfaces** that demonstrates the complete booking journey. No payments and no auth: users identify themselves by name and email.

| UI | Who | Screens |
|---|---|---|
| Restaurant Owner (`/restaurant`) | Restaurant owners | Publish space, View spaces + booking status |
| Landing (`/`) | Everyone | Landing page |
| Regular User (`/events`, `/spaces`) | Anyone | Discover events, Event details, Join event, Booking confirmation, Browse spaces, Space details, Create event, Event created confirmation |

### Stack

- **Next.js** (App Router, TypeScript) + **Tailwind CSS**, mobile-first
- **Supabase (Postgres)** for persistence. Booking logic lives in Postgres functions so it is atomic and survives refresh.
- **Vercel** for hosting (one shared URL for the demo)

Why a real database instead of mock JSON: the PRD requires that bookings persist after a refresh, that a booked space disappears for everyone, and that a full event stops taking reservations. These checks need shared, transactional state.

---

### Done

- **Phase 0, setup:** Next.js app, Supabase project, shared header, placeholder at `/`, Vercel deploy with Supabase env vars.
- **Phase 1, database:** `supabase/schema.sql` implements the data model and is live in Supabase.
- **Phase 2, Restaurant Owner UI:** `/restaurant` and `/restaurant/new` read and write Supabase.
- **Data functions** for Phases 3–5 are built and tested (see [Data functions](#data-functions-lib)).

### Still open from Phase 2

- [x] **R1 prefill:** done via restaurant sign-up (`/restaurant/signup`). A restaurant registers once by name and location (or signs back in by entering the same details). The id is kept in a cookie, `/restaurant/new` no longer asks for name and location, and `/restaurant` lists only that restaurant's spaces. No schema change.
- [x] **Restaurant dashboard:** stat tiles, a guests-booked line chart (next 14 days) and a month calendar of events and guests per day, on `/restaurant`.
- Dev only: `/restaurant` shows "Demo: simulate booking" and "Demo: a guest joins" buttons under `npm run dev`. They call the real `create_event_for_space` and `reserve_seat` and write real rows; run `supabase/reset.sql` to clear them.

### Phase 3: Regular User UI, creating events (≈3h)

- [ ] **U1 Browse spaces** (`/spaces`): `listAvailableSpaces()`, each with restaurant, location, date, time and capacity.
- [ ] **Space details** (`/spaces/[id]`): full details and a **"Book this space & create event"** button.
- [ ] **U2 Create event** (`/spaces/[id]/create-event`): a form with title, description, number of spots (1 up to the space's capacity), and organizer name and email. It calls `createEventForSpace()`.
- [ ] **Event created** (`/events/[id]/created`): a success screen with a link to the public event page.
- [ ] Errors: show the returned `message` (e.g. when someone else just booked the space) and link back to `/spaces`.

✅ Done when: after an event is created, its space no longer appears in `/spaces`, the second space still does, and `/restaurant` shows the space as Booked.

### Phase 4: Regular User UI, joining events (≈3h)

- [ ] **U3 Discover events** (`/events`): `listUpcomingEvents()`, each with title, description excerpt, date, time, location and **"X spots left"** (or a **Sold out** badge).
- [ ] **Event details** (`/events/[id]`): full details, spots left, and a **Join** button that is disabled when the event is sold out.
- [ ] **U4 Join event** (`/events/[id]/join`): a name and email form that calls `reserveSeat()`. Disable the button while submitting.
- [ ] **Booking confirmation** (`/reservations/[code]`): confirmation code, event details, and "No payment collected."
- [ ] Error states: show the returned `message` for `EVENT_FULL` and `ALREADY_RESERVED`.

✅ Done when: joining moves the event from 10 to 9 spots left on the list, detail and restaurant pages, and the count is unchanged after a refresh.

### Phase 5: Landing page (≈2h)

The landing page (`/`) is the first thing judges see. It should explain the product in five seconds and send each type of visitor to the right flow.

- [x] **Hero**: "Turn empty tables into thriving communities." A one-line subhead (restaurants fill slow nights, people meet over a shared table) and three CTAs:
  - **Find an event** → `/events` (primary)
  - **Host an event** → `/spaces`
  - **List your space** → `/restaurant`
- [x] **How it works**: three steps with icons. A restaurant lists a table, a user turns it into an event, and others join for a seat.
- [x] **Upcoming events**: the next 3 events from `listUpcomingEvents({ limit: 3 })`, shown as cards with spots left. Each card links to `/events/[id]`. If there are no events yet, show "Be the first to host" linking to `/spaces`. This proves the page reads live data.
- [x] **For restaurants**: a short pitch (fill off-peak seats, no setup cost, no payments in V0) with a **List your space** CTA.
- [x] **Footer**: one line about the project and hackathon, with a link to the repo.
- [x] Looks good at phone width, loads fast (server component), and has a page title and meta description set.

✅ Done when: from `/`, a first-time visitor reaches each of the three flows in one click, and a newly created event appears in "Upcoming events" after a refresh.

### Phase 6: Polish (≈2h)

- [ ] Mobile-first layout checked at phone width (375px)
- [ ] Loading, empty ("No events yet"), error and success states on every form
- [ ] Consistent date and time formatting in the Seattle timezone
- [ ] Make the reset script easy to run before the demo (an npm script or a hidden `/admin/reset` page)

### Phase 7: Demo verification (must all pass, from PRD §8)

- [ ] 1. Restaurant owner publishes **two spaces with 10 seats each**.
- [ ] 2. User browses available spaces.
- [ ] 3. User books one space and creates **"Debating Pythagoras"** for 10 people.
- [ ] 4. The booked space disappears from available listings, and the second one remains.
- [ ] 5. Another user discovers the new event.
- [ ] 6. That user reserves one seat.
- [ ] 7. The event now shows **9 available seats**.
- [ ] 8. Restaurant owner sees that one space has been booked.
- [ ] 9. All data persists after a page refresh.
- [ ] Extra safety checks: a duplicate email is rejected, a full event blocks joining, and two people booking the same space at once leaves only one event.

### Phase 8: AI workflow (hackathon requirement, after V0 passes)

AI is not in the V0 PRD scope (§7), but the hackathon requires it. Add it only after Phase 7 passes, and build it on top of the same booking functions:

- [ ] **AI event planner** (`/plan`): the user describes the event in plain language ("philosophy meetup for 8, Wednesday evening, under $30"). Claude, using tool calling:
  1. Turns the description into filters.
  2. Searches the available spaces.
  3. Ranks the matches and explains each choice.
  4. Pre-fills the Create Event form.

  The user still confirms, and the booking goes through `create_event_for_space`. The AI never books anything directly.
- [ ] Show each step in the UI as it runs (searching → found N spaces → drafting event).
- [ ] A demo mode that returns a saved response in case the network or API fails on stage.

---

## Data functions (`lib/`)

Pages call these from Server Components or server actions. They are server-only. Read functions belong inside `<Suspense>`.

| Page | Function |
|---|---|
| `/restaurant` | `listSpaces()` (`lib/spaces.ts`) |
| `/restaurant/new` | `createSpace(input)` (`lib/spaces.ts`) |
| `/spaces` | `listAvailableSpaces()` (`lib/spaces.ts`) |
| `/spaces/[id]` | `getSpace(id)` (`lib/spaces.ts`). Returns `null` if not found. Check `status === "available"` before showing the book button |
| `/spaces/[id]/create-event` | `createEventForSpace(input)` (`lib/events.ts`) |
| `/events`, landing | `listUpcomingEvents()` and `listUpcomingEvents({ limit: 3 })` (`lib/events.ts`). Sold-out events are included with `seatsLeft: 0` |
| `/events/[id]`, `/events/[id]/created` | `getEvent(id)` (`lib/events.ts`). Returns `null` if not found |
| `/events/[id]/join` | `reserveSeat({ eventId, name, email })` (`lib/events.ts`) |
| `/reservations/[code]` | `getReservation(code)` (`lib/events.ts`). Returns `{ reservation, event }` or `null` |

`createEventForSpace` and `reserveSeat` return `{ ok: true, data }` or `{ ok: false, code, message }`. Show `message` to the user. `code` is one of `SPACE_NOT_FOUND`, `SPACE_NOT_AVAILABLE`, `CAPACITY_INVALID`, `EVENT_NOT_FOUND`, `EVENT_FULL` or `ALREADY_RESERVED`. Unexpected database errors throw. Validate form fields (non-empty, email format) in the server action before calling.

## Suggested team split

| Workstream | Phases |
|---|---|
| Backend / data | Server actions for 3–4, then Phase 8 (AI) |
| Frontend: Restaurant UI | R1 prefill, then 6 |
| Frontend: User UI | 3, 4, then 5 (landing) |
| PM / QA | Demo script, landing page copy, Phase 7 checklist, Phase 8 |

Phases 3–5 can start now: the data functions are ready.

## Out of scope for V0

Payments, revenue sharing, reviews, chat, waitlists, recurring availability, analytics, cancellations, and auth (PRD §7).
