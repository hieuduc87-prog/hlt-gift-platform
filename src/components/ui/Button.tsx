"use client";

import { cn } from "@/lib/utils";
import { ButtonHTMLAttributes, forwardRef } from "react";

const variants = {
  primary: "bg-gold text-white hover:bg-gold-dark active:bg-gold-dark/90",
  secondary: "border border-gold text-gold hover:bg-gold hover:text-white",
  ghost: "text-text-secondary hover:bg-surface-hover",
  danger: "bg-error text-white hover:bg-error/90",
};

const sizes = {
  sm: "h-8 px-3 text-sm",
  md: "h-10 px-4 text-sm",
  lg: "h-12 px-6 text-base",
};

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: keyof typeof variants;
  size?: keyof typeof sizes;
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "primary", size = "md", disabled, ...props }, ref) => (
    <button
      ref={ref}
      className={cn(
        "inline-flex items-center justify-center gap-2 rounded-lg font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold/50",
        variants[variant],
        sizes[size],
        disabled && "opacity-50 cursor-not-allowed pointer-events-none",
        className
      )}
      disabled={disabled}
      {...props}
    />
  )
);
Button.displayName = "Button";

export { Button };
export type { ButtonProps };
