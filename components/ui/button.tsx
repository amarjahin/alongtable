import { Button as BaseButton } from "@base-ui/react/button";
import Link from "next/link";
import type { ComponentProps } from "react";

const styles = {
  base: "inline-flex items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-sm font-medium transition-colors outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-neutral-900 disabled:cursor-not-allowed disabled:opacity-50",
  primary: "bg-neutral-900 text-white hover:bg-neutral-700",
  secondary: "border border-neutral-300 bg-white text-neutral-900 hover:bg-neutral-50",
};

type Variant = "primary" | "secondary";

export function Button({
  variant = "primary",
  className = "",
  ...props
}: ComponentProps<typeof BaseButton> & { variant?: Variant }) {
  return <BaseButton className={`${styles.base} ${styles[variant]} ${className}`} {...props} />;
}

export function ButtonLink({
  variant = "primary",
  className = "",
  ...props
}: ComponentProps<typeof Link> & { variant?: Variant }) {
  return <Link className={`${styles.base} ${styles[variant]} ${className}`} {...props} />;
}
