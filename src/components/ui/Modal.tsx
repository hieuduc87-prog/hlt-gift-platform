"use client";

import { cn } from "@/lib/utils";
import { ReactNode, useEffect, useCallback } from "react";
import { X } from "lucide-react";

const modalSizes = {
  sm: "max-w-sm",
  md: "max-w-lg",
  lg: "max-w-2xl",
};

interface ModalProps {
  open: boolean;
  onClose: () => void;
  title?: string;
  children: ReactNode;
  size?: keyof typeof modalSizes;
  className?: string;
}

function Modal({
  open,
  onClose,
  title,
  children,
  size = "md",
  className,
}: ModalProps) {
  const handleEscape = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    },
    [onClose]
  );

  useEffect(() => {
    if (open) {
      document.addEventListener("keydown", handleEscape);
      document.body.style.overflow = "hidden";
    }
    return () => {
      document.removeEventListener("keydown", handleEscape);
      document.body.style.overflow = "";
    };
  }, [open, handleEscape]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 animate-in fade-in duration-200"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Dialog */}
      <div
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className={cn(
          "relative w-full rounded-xl border border-border bg-surface shadow-lg",
          "animate-in fade-in zoom-in-95 duration-200",
          modalSizes[size],
          className
        )}
      >
        {/* Header */}
        {title && (
          <div className="flex items-center justify-between border-b border-border px-6 py-4">
            <h2 className="text-lg font-semibold text-foreground">{title}</h2>
            <button
              onClick={onClose}
              className="rounded-lg p-1.5 text-text-muted hover:bg-surface-hover hover:text-foreground transition-colors"
              aria-label="Close"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        )}

        {/* Close button without title */}
        {!title && (
          <button
            onClick={onClose}
            className="absolute right-4 top-4 rounded-lg p-1.5 text-text-muted hover:bg-surface-hover hover:text-foreground transition-colors"
            aria-label="Close"
          >
            <X className="h-4 w-4" />
          </button>
        )}

        {/* Content */}
        <div className={cn("px-6 py-4", !title && "pt-12")}>{children}</div>
      </div>
    </div>
  );
}

export { Modal };
export type { ModalProps };
