"use client";

import * as DialogPrimitive from "@radix-ui/react-dialog";
import type { ComponentProps, ReactNode } from "react";
import { X } from "lucide-react";

export const Dialog = DialogPrimitive.Root;
export const DialogTrigger = DialogPrimitive.Trigger;
export const DialogClose = DialogPrimitive.Close;

export function DialogContent({ children, className = "", ...props }: ComponentProps<typeof DialogPrimitive.Content>) {
  return (
    <DialogPrimitive.Portal>
      <DialogPrimitive.Overlay className="fixed inset-0 z-50 bg-foreground/60 backdrop-blur-sm" />
      <DialogPrimitive.Content {...props} className={`fixed left-1/2 top-1/2 z-50 max-h-[95vh] w-[calc(100%-2rem)] -translate-x-1/2 -translate-y-1/2 overflow-y-auto rounded-2xl border bg-card p-6 text-card-foreground shadow-2xl ${className}`}>
        {children}
        <DialogPrimitive.Close aria-label="Close" className="absolute right-4 top-4 rounded-lg p-2 hover:bg-accent"><X size={18} /></DialogPrimitive.Close>
      </DialogPrimitive.Content>
    </DialogPrimitive.Portal>
  );
}

export function DialogHeader({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <div className={`mb-5 space-y-1 ${className}`}>{children}</div>;
}

export function DialogTitle({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <DialogPrimitive.Title className={`text-xl font-bold ${className}`}>{children}</DialogPrimitive.Title>;
}

export function DialogDescription({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <DialogPrimitive.Description className={`text-sm text-muted-foreground ${className}`}>{children}</DialogPrimitive.Description>;
}
