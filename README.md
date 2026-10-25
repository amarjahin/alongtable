# ALongTable

Turn empty tables into thriving communities.

ALongTable is a marketplace that connects restaurants with unused seating to people who want to organize or attend social events. Restaurants publish spaces, any user can book a space and create an event, and other users join by reserving a seat.

Source of truth: [V0 PRD (Google Doc)](https://docs.google.com/document/d/1KZRtQpz9H2RFnxD1zin12C5vj1YJKTTi/edit)

Database contract: [`data-model/README.md`](data-model/README.md)

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

### Phase 0: Setup (≈1h)

- [ ] Create the Next.js app in this repo: `npx create-next-app@latest . --ts --tailwind --app --eslint`
- [ ] Create a Supabase project. Add `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY` and `SUPABASE_SERVICE_ROLE_KEY` to `.env.local` (git-ignored) and to Vercel.
- [ ] `npm i @supabase/supabase-js`. Add `lib/supabase.ts` (server client using the service role key, used only in server actions and route handlers).
- [ ] Link the repo to Vercel and confirm that a hello-world page deploys.
- [ ] Add a shared header: logo → `/`, plus links to **Find events** (`/events`), **Host an event** (`/spaces`) and **For restaurants** (`/restaurant`). Put a placeholder at `/` until Phase 5.

### Phase 1: Database (≈2h)

The database contract is [`data-model/README.md`](data-model/README.md). Implement that document. Do not add tables or columns it leaves out.

- [ ] Create `supabase/schema.sql` from the data model and run it in the Supabase SQL editor. That file has the four tables, `create_event_for_space`, `reserve_seat`, and the views `available_spaces`, `events_with_availability`, and `spaces_with_booking`.
- [ ] Create `supabase/seed.sql`: Il Nido and no spaces, plus a reset that truncates spaces, events, and reservations and leaves restaurants.

### Phase 2: Restaurant Owner UI (≈2–3h)

- [ ] **R1 Publish space** (`/restaurant/new`): a form with restaurant name and location (prefilled from the seed restaurant), space label, date, start/end time, capacity, and optional description and pricing info. A server action validates that capacity ≥ 1, end is after start, and the date is in the future, find-or-creates the restaurant, and inserts the space. Several spaces can share the same date and time.
- [ ] **R2 My spaces** (`/restaurant`): `spaces_with_booking`, a list of all published spaces with an **Available** or **Booked** badge. Booked spaces show the event title, organizer and seats taken.

✅ Done when: two 10-seat spaces for Wednesday 6–9 PM can be published and appear in the list as Available.

### Phase 3: Regular User UI, creating events (≈3h)

- [ ] **U1 Browse spaces** (`/spaces`): `available_spaces`, each with restaurant, location, date, time and capacity.
- [ ] **Space details** (`/spaces/[id]`): full details and a **"Book this space & create event"** button.
- [ ] **U2 Create event** (`/spaces/[id]/create-event`): a form with title, description, number of spots (1 up to the space's capacity), and organizer name and email. It calls the `create_event_for_space` function.
- [ ] **Event created** (`/events/[id]/created`): a success screen with a link to the public event page.
- [ ] Errors: if someone else already booked the space, show "This space was just booked" and link back to `/spaces`.

✅ Done when: after an event is created, its space no longer appears in `/spaces`, the second space still does, and `/restaurant` shows the space as Booked.

### Phase 4: Regular User UI, joining events (≈3h)

- [ ] **U3 Discover events** (`/events`): upcoming events from `events_with_availability`, each with title, description excerpt, date, time, location and **"X spots left"** (or a **Sold out** badge).
- [ ] **Event details** (`/events/[id]`): full details, spots left, and a **Join** button that is disabled when the event is sold out.
- [ ] **U4 Join event** (`/events/[id]/join`): a name and email form that calls the `reserve_seat` function. Disable the button while submitting.
- [ ] **Booking confirmation** (`/reservations/[code]`): confirmation code, event details, and "No payment collected."
- [ ] Error states: "This event is full" and "You've already reserved a seat with this email."

✅ Done when: joining moves the event from 10 to 9 spots left on the list, detail and restaurant pages, and the count is unchanged after a refresh.

### Phase 5: Landing page (≈2h)

The landing page (`/`) is the first thing judges see. It should explain the product in five seconds and send each type of visitor to the right flow.

- [ ] **Hero**: "Turn empty tables into thriving communities." A one-line subhead (restaurants fill slow nights, people meet over a shared table) and three CTAs:
  - **Find an event** → `/events` (primary)
  - **Host an event** → `/spaces`
  - **List your space** → `/restaurant`
- [ ] **How it works**: three steps with icons. A restaurant lists a table, a user turns it into an event, and others join for a seat.
- [ ] **Upcoming events**: the next 3 events from `events_with_availability`, shown as cards with spots left. Each card links to `/events/[id]`. If there are no events yet, show "Be the first to host" linking to `/spaces`. This proves the page reads live data.
- [ ] **For restaurants**: a short pitch (fill off-peak seats, no setup cost, no payments in V0) with a **List your space** CTA.
- [ ] **Footer**: one line about the project and hackathon, with a link to the repo.
- [ ] Looks good at phone width, loads fast (server component), and has a page title and meta description set.

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

## Suggested team split

| Workstream | Phases |
|---|---|
| Backend / data | 0, 1, then helps with 3–4 server actions |
| Frontend: Restaurant UI | 2, then 6 |
| Frontend: User UI | 3, 4, then 5 (landing) |
| PM / QA | Demo script, landing page copy, Phase 7 checklist, Phase 8 |

Phases 2–4 can start in parallel once the Phase 1 schema is agreed. Use mocked data until the database is ready.

## Out of scope for V0

Payments, revenue sharing, reviews, chat, waitlists, recurring availability, analytics, cancellations, and auth (PRD §7).
