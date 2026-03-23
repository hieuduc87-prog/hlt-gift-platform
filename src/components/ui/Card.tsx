import { cn } from "@/lib/utils";
import { HTMLAttributes, forwardRef } from "react";

const cardVariants = {
  default: "",
  hover: "hover:shadow-md transition-shadow",
};

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  variant?: keyof typeof cardVariants;
  padding?: "sm" | "md" | "lg";
}

const paddingSizes = {
  sm: "p-3",
  md: "p-4",
  lg: "p-6",
};

const Card = forwardRef<HTMLDivElement, CardProps>(
  ({ className, variant = "default", padding = "md", ...props }, ref) => (
    <div
      ref={ref}
      className={cn(
        "rounded-xl border border-border bg-surface",
        paddingSizes[padding],
        cardVariants[variant],
        className
      )}
      {...props}
    />
  )
);
Card.displayName = "Card";

export { Card };
export type { CardProps };
