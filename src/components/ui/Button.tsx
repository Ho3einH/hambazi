import type { ButtonHTMLAttributes, ReactNode } from "react";

type Variant = "primary" | "outline" | "quiet" | "success" | "danger";

export function Button({
  children,
  variant = "primary",
  className = "",
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { children: ReactNode; variant?: Variant }) {
  return (
    <button className={`button button-${variant} ${className}`.trim()} {...props}>
      {children}
    </button>
  );
}
