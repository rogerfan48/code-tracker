import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import s from "./button.module.scss";

const buttonVariants = cva(s.base, {
  variants: {
    variant: {
      primary: s.primary,
      secondary: s.secondary,
      ghost: s.ghost,
      danger: s.danger,
    },
    size: {
      md: s.sizeMd,
      sm: s.sizeSm,
      icon: s.sizeIcon,
      iconSm: s.sizeIconSm,
    },
  },
  defaultVariants: { variant: "secondary", size: "md" },
});

export interface ButtonProps extends React.ComponentProps<"button">, VariantProps<typeof buttonVariants> {
  asChild?: boolean;
  loading?: boolean;
}

export function Button({ className, variant, size, asChild, loading, disabled, children, ...props }: ButtonProps) {
  const classes = cn(buttonVariants({ variant, size }), className);
  if (asChild) {
    return (
      <Slot className={classes} {...props}>
        {children}
      </Slot>
    );
  }
  return (
    <button className={classes} disabled={disabled || loading} {...props}>
      {loading ? <Loader2 className={s.spinner} size={16} aria-hidden /> : null}
      {children}
    </button>
  );
}
