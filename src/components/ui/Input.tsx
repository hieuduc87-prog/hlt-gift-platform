"use client";

import { cn } from "@/lib/utils";
import { InputHTMLAttributes, forwardRef } from "react";

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, label, error, id, disabled, ...props }, ref) => {
    const inputId = id || label?.toLowerCase().replace(/\s+/g, "-");

    return (
      <div className="flex flex-col gap-1.5">
        {label && (
          <label
            htmlFor={inputId}
            className="text-sm font-medium text-text-secondary"
          >
            {label}
          </label>
        )}
        <input
          ref={ref}
          id={inputId}
          className={cn(
            "h-10 w-full rounded-lg border bg-surface px-3 text-sm text-foreground placeholder:text-text-muted transition-colors",
            "focus:outline-none focus:ring-2 focus:ring-gold/50 focus:border-gold",
            error
              ? "border-error focus:ring-error/50 focus:border-error"
              : "border-border",
            disabled && "opacity-50 cursor-not-allowed bg-surface-hover",
            className
          )}
          disabled={disabled}
          {...props}
        />
        {error && (
          <p className="text-xs text-error">{error}</p>
        )}
      </div>
    );
  }
);
Input.displayName = "Input";

export { Input };
export type { InputProps };
