"use client";

import { useActionState } from "react";
import { Form } from "@base-ui/react/form";
import { Button } from "@/components/ui/button";
import { TextField } from "@/components/ui/field";
import type { FormState } from "../actions";
import { signUp } from "./actions";

export function SignUpForm() {
  const [state, action, pending] = useActionState<FormState, FormData>(signUp, {});
  const v = state.values ?? {};
  return (
    <Form action={action} errors={state.errors} className="flex flex-col gap-5">
      <TextField name="name" label="Restaurant name" defaultValue={v.name} placeholder="Il Nido" />
      <TextField name="location" label="Location" defaultValue={v.location} placeholder="West Seattle, Seattle, WA" />
      {state.errors?.form && (
        <p role="alert" className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">
          {state.errors.form}
        </p>
      )}
      <Button type="submit" disabled={pending}>
        {pending ? "Continuing…" : "Continue"}
      </Button>
    </Form>
  );
}
