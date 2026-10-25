"use client";

import { Checkbox } from "@base-ui/react/checkbox";
import { CheckboxGroup } from "@base-ui/react/checkbox-group";
import { Field } from "@base-ui/react/field";
import { Radio } from "@base-ui/react/radio";
import { RadioGroup } from "@base-ui/react/radio-group";
import type { ReactNode } from "react";

export type Tile = { value: string; label: ReactNode; hint?: ReactNode };

const tile =
  "flex cursor-pointer flex-col items-center justify-center rounded-xl border border-neutral-300 bg-white px-3 py-3 text-center text-sm outline-none transition-colors hover:border-neutral-500 focus-visible:ring-2 focus-visible:ring-neutral-900 focus-visible:ring-offset-2 data-[checked]:border-neutral-900 data-[checked]:bg-neutral-900 data-[checked]:text-white";

function Frame({ name, label, hint, children }: { name: string; label: string; hint?: string; children: ReactNode }) {
  return (
    <Field.Root name={name} className="flex flex-col gap-2">
      <Field.Label nativeLabel={false} render={<div />} className="text-sm font-medium text-neutral-900">
        {label}
      </Field.Label>
      {children}
      {hint && <Field.Description className="text-xs text-neutral-500">{hint}</Field.Description>}
      <Field.Error className="text-xs text-red-600" />
    </Field.Root>
  );
}

/** Pick exactly one tile. Submits `name=value` with the form. */
export function TileSelect({
  name,
  label,
  hint,
  tiles,
  defaultValue,
  columns = "grid-cols-2 sm:grid-cols-3",
}: {
  name: string;
  label: string;
  hint?: string;
  tiles: Tile[];
  defaultValue?: string;
  columns?: string;
}) {
  return (
    <Frame name={name} label={label} hint={hint}>
      <RadioGroup name={name} defaultValue={defaultValue} className={`grid gap-2 ${columns}`}>
        {tiles.map((t) => (
          <Radio.Root key={t.value} value={t.value} className={tile}>
            <span className="font-medium">{t.label}</span>
            {t.hint && <span className="text-xs opacity-70">{t.hint}</span>}
          </Radio.Root>
        ))}
      </RadioGroup>
    </Frame>
  );
}

/** Pick any number of tiles. Submits one `name=value` entry per selected tile. */
export function TileMultiSelect({
  name,
  label,
  hint,
  tiles,
  defaultValue,
  columns = "grid-cols-2 sm:grid-cols-3",
}: {
  name: string;
  label: string;
  hint?: string;
  tiles: Tile[];
  defaultValue?: string[];
  columns?: string;
}) {
  return (
    <Frame name={name} label={label} hint={hint}>
      <CheckboxGroup defaultValue={defaultValue} className={`grid gap-2 ${columns}`}>
        {tiles.map((t) => (
          <Checkbox.Root key={t.value} name={name} value={t.value} className={tile}>
            <span className="font-medium">{t.label}</span>
          </Checkbox.Root>
        ))}
      </CheckboxGroup>
    </Frame>
  );
}
