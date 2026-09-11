"use client";

import * as DialogPrimitive from "@radix-ui/react-dialog";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";
import s from "./dialog.module.scss";

export const Dialog = DialogPrimitive.Root;
export const DialogTrigger = DialogPrimitive.Trigger;
export const DialogClose = DialogPrimitive.Close;

export function DialogContent({ className, children, size = "md", ...props }: React.ComponentProps<typeof DialogPrimitive.Content> & { size?: "sm" | "md" | "lg" }) {
  return (
    <DialogPrimitive.Portal>
      <DialogPrimitive.Overlay className={s.overlay} />
      <DialogPrimitive.Content className={cn(s.content, s[size], className)} {...props}>
        {children}
        <DialogPrimitive.Close className={s.close} aria-label="Close">
          <X size={16} />
        </DialogPrimitive.Close>
      </DialogPrimitive.Content>
    </DialogPrimitive.Portal>
  );
}

export function DialogHeader({ className, ...props }: React.ComponentProps<"div">) {
  return <div className={cn(s.header, className)} {...props} />;
}

export function DialogFooter({ className, ...props }: React.ComponentProps<"div">) {
  return <div className={cn(s.footer, className)} {...props} />;
}

export function DialogTitle({ className, ...props }: React.ComponentProps<typeof DialogPrimitive.Title>) {
  return <DialogPrimitive.Title className={cn(s.title, className)} {...props} />;
}

export function DialogDescription({ className, ...props }: React.ComponentProps<typeof DialogPrimitive.Description>) {
  return <DialogPrimitive.Description className={cn(s.description, className)} {...props} />;
}
