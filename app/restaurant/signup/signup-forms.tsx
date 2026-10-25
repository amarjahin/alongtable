"use client";

import { useActionState } from "react";
import { Form } from "@base-ui/react/form";
import { Button } from "@/components/ui/button";
import { TextField } from "@/components/ui/field";
import type { FormState } from "../actions";
import { signIn, signUp } from "./actions";

export function SignUpForm() {
  const [state, action, pending] = useActionState<FormState, FormData>(signUp, {});
  const v = state.values ?? {};
  return (
    <Form action={action} errors={state.errors} className="flex flex-col gap-5">
      <TextField name="name" label="Restaurant name" defaultValue={v.name} placeholder="Il Nido" />
      <TextField name="location" label="Location" defaultValue={v.location} placeholder="Capitol Hill, Seattle" />
      <TextField name="email" type="email" label="Contact email" defaultValue={v.email} placeholder="hello@ilnido.com" hint="You'll use this to sign back in." />
      <Button type="submit" disabled={pending}>
        {pending ? "Registering…" : "Register restaurant"}
      </Button>
    </Form>
  );
}

export function SignInForm() {
  const [state, action, pending] = useActionState<FormState, FormData>(signIn, {});
  return (
    <Form action={action} errors={state.errors} className="flex flex-col gap-4">
      <TextField name="email" type="email" label="Registered email" defaultValue={state.values?.email} placeholder="hello@ilnido.com" />
      <Button type="submit" variant="secondary" disabled={pending}>
        {pending ? "Signing in…" : "Sign in"}
      </Button>
    </Form>
  );
}
