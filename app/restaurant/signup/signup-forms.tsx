"use client";

import { useActionState } from "react";
import { Form } from "@base-ui/react/form";
import { WarningCircle } from "@phosphor-icons/react/ssr";
import { Button } from "@/components/ui/button";
import { TextField } from "@/components/ui/field";
import type { FormState } from "../actions";
import { signUp } from "./actions";

export function SignUpForm() {
  const [state, action, pending] = useActionState<FormState, FormData>(signUp, {});
  const v = state.values ?? {};
  return (
    <Form action={action} errors={state.errors} className="flex flex-col gap-6">
      <TextField name="name" label="Restaurant name" defaultValue={v.name} placeholder="Il Nido" />
      <TextField name="location" label="Location" defaultValue={v.location} placeholder="West Seattle, Seattle, WA" />
      {state.errors?.form && (
        <p role="alert" className="alt-notice alt-notice--problem">
          <WarningCircle size={24} aria-hidden="true" className="alt-icon" />
          {state.errors.form}
        </p>
      )}
      <Button type="submit" disabled={pending} className="alt-button--block">
        {pending ? "Continuing…" : "Continue"}
      </Button>
    </Form>
  );
}
