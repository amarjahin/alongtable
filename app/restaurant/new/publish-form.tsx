"use client";

import { useActionState } from "react";
import { Form } from "@base-ui/react/form";
import { Button, ButtonLink } from "@/components/ui/button";
import { FieldRow, TextField } from "@/components/ui/field";
import { publishSpace, type FormState } from "../actions";

export function PublishForm() {
  const [state, action, pending] = useActionState<FormState, FormData>(publishSpace, {});
  const e = state.errors ?? {};
  const v = state.values ?? {};

  return (
    <Form action={action} errors={e} className="flex flex-col gap-5">
      <TextField name="restaurantName" label="Restaurant name" defaultValue={v.restaurantName} placeholder="Il Nido" />
      <TextField name="location" label="Location" defaultValue={v.location} placeholder="Capitol Hill, Seattle" />
      <TextField name="label" label="Space label" defaultValue={v.label} placeholder="Table A" />
      <FieldRow>
        <TextField name="date" type="date" label="Date" defaultValue={v.date} />
        <TextField name="startTime" type="time" label="Starts" defaultValue={v.startTime} />
        <TextField name="endTime" type="time" label="Ends" defaultValue={v.endTime} />
      </FieldRow>
      <TextField name="capacity" type="number" min={1} step={1} inputMode="numeric" label="Capacity (seats)" defaultValue={v.capacity} placeholder="10" />
      <TextField name="description" multiline label="Description (optional)" defaultValue={v.description} placeholder="Long communal table by the window." />
      <TextField name="priceInfo" label="Pricing info (optional)" defaultValue={v.priceInfo} placeholder="$25 minimum spend per person" hint="Shown to people booking the space. No payments are collected in V0." />
      <p className="text-xs text-neutral-500">Times are in Seattle time (Pacific).</p>
      {state.formError && (
        <p role="alert" className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">
          {state.formError}
        </p>
      )}
      <div className="flex gap-3">
        <Button type="submit" disabled={pending}>
          {pending ? "Publishing…" : "Publish space"}
        </Button>
        <ButtonLink href="/restaurant" variant="secondary">Cancel</ButtonLink>
      </div>
    </Form>
  );
}
