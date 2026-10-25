import { Field } from "@base-ui/react/field";
import { Input } from "@base-ui/react/input";
import type { ComponentProps, ReactNode } from "react";

const inputStyles =
  "w-full rounded-lg border border-neutral-300 bg-white px-3 py-2.5 text-base text-neutral-900 placeholder:text-neutral-400 outline-none focus:border-neutral-900 focus:ring-1 focus:ring-neutral-900 data-[invalid]:border-red-600";

export function TextField({
  label,
  hint,
  multiline,
  ...inputProps
}: {
  label: string;
  hint?: string;
  multiline?: boolean;
} & Omit<ComponentProps<typeof Input>, "className">) {
  return (
    <Field.Root name={inputProps.name} className="flex flex-col gap-1.5">
      <Field.Label className="text-sm font-medium text-neutral-900">{label}</Field.Label>
      {multiline ? (
        <Field.Control
          render={<textarea rows={3} className={inputStyles} />}
          {...(inputProps as object)}
        />
      ) : (
        <Field.Control className={inputStyles} {...inputProps} />
      )}
      {hint && <Field.Description className="text-xs text-neutral-500">{hint}</Field.Description>}
      <Field.Error className="text-xs text-red-600" />
    </Field.Root>
  );
}

export function FieldRow({ children }: { children: ReactNode }) {
  return <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">{children}</div>;
}
