"use client";

import { useActionState } from "react";
import { Form } from "@base-ui/react/form";
import { Button, ButtonLink } from "@/components/ui/button";
import { TileMultiSelect, TileSelect } from "@/components/ui/tiles";
import { AREAS, CAPACITIES, FEATURES, PRICES, SLOTS } from "@/lib/space-options";
import type { DayOption } from "@/lib/time";
import { publishSpace, type FormState } from "../actions";

export function PublishForm({ days }: { days: DayOption[] }) {
  const [state, action, pending] = useActionState<FormState, FormData>(publishSpace, {});

  return (
    <Form action={action} errors={state.errors} className="flex flex-col gap-6">
      <TileSelect
        name="area"
        label="Where in the restaurant?"
        defaultValue="Main dining"
        tiles={AREAS.map((a) => ({ value: a, label: a }))}
      />
      <TileSelect
        name="date"
        label="Which day?"
        columns="grid-cols-3 sm:grid-cols-5 md:grid-cols-7"
        tiles={days.map((d) => ({ value: d.value, label: d.label, hint: d.weekday }))}
      />
      <TileSelect
        name="slot"
        label="What time?"
        hint="Seattle time (Pacific)."
        defaultValue="dinner"
        columns="grid-cols-2"
        tiles={SLOTS.map((s) => ({ value: s.value, label: s.label, hint: s.hint }))}
      />
      <TileSelect
        name="capacity"
        label="How many seats?"
        defaultValue="6"
        columns="grid-cols-3 sm:grid-cols-6"
        tiles={CAPACITIES.map((c) => ({ value: String(c), label: c }))}
      />
      <TileMultiSelect
        name="features"
        label="What's it like? (optional)"
        tiles={FEATURES.map((f) => ({ value: f, label: f }))}
      />
      <TileSelect
        name="price"
        label="Minimum spend per person"
        hint="Shown to people booking the space. No payments are collected in V0."
        defaultValue="none"
        columns="grid-cols-2 sm:grid-cols-4"
        tiles={PRICES.map((p) => ({ value: p.value, label: p.label }))}
      />
      {state.errors?.form && (
        <p role="alert" className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">
          {state.errors.form}
        </p>
      )}
      <div className="flex gap-3">
        <Button type="submit" disabled={pending}>
          {pending ? "Publishing…" : "Publish space"}
        </Button>
        <ButtonLink href="/restaurant" variant="secondary">
          Cancel
        </ButtonLink>
      </div>
    </Form>
  );
}
