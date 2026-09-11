"use client";

import * as DropdownMenuPrimitive from "@radix-ui/react-dropdown-menu";
import { cn } from "@/lib/utils";
import s from "./popover.module.scss";

export const DropdownMenu = DropdownMenuPrimitive.Root;
export const DropdownMenuTrigger = DropdownMenuPrimitive.Trigger;

export function DropdownMenuContent({ className, sideOffset = 4, ...props }: React.ComponentProps<typeof DropdownMenuPrimitive.Content>) {
  return (
    <DropdownMenuPrimitive.Portal>
      <DropdownMenuPrimitive.Content sideOffset={sideOffset} className={cn(s.menu, className)} {...props} />
    </DropdownMenuPrimitive.Portal>
  );
}

export function DropdownMenuItem({ className, variant = "default", ...props }: React.ComponentProps<typeof DropdownMenuPrimitive.Item> & { variant?: "default" | "destructive" }) {
  return <DropdownMenuPrimitive.Item data-variant={variant} className={cn(s.item, className)} {...props} />;
}

export function DropdownMenuLabel({ className, ...props }: React.ComponentProps<typeof DropdownMenuPrimitive.Label>) {
  return <DropdownMenuPrimitive.Label className={cn(s.label, className)} {...props} />;
}

export function DropdownMenuSeparator({ className, ...props }: React.ComponentProps<typeof DropdownMenuPrimitive.Separator>) {
  return <DropdownMenuPrimitive.Separator className={cn(s.separator, className)} {...props} />;
}
