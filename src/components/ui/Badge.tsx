import { cn } from "@/lib/utils";
import { HTMLAttributes } from "react";

const presetVariants = {
  default: "bg-gold-bg text-gold",
  success: "bg-success-bg text-success",
  error: "bg-error-bg text-error",
  warning: "bg-warning-bg text-warning",
  info: "bg-info-bg text-info",
  neutral: "bg-surface-hover text-text-secondary",
};

const badgeSizes = {
  sm: "text-[10px] px-1.5 py-0.5",
  md: "text-xs px-2 py-0.5",
  lg: "text-sm px-2.5 py-1",
};

interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  variant?: keyof typeof presetVariants;
  size?: keyof typeof badgeSizes;
  color?: string;
  bgColor?: string;
}

function Badge({
  className,
  variant = "default",
  size = "md",
  color,
  bgColor,
  style,
  ...props
}: BadgeProps) {
  const hasCustomColors = color || bgColor;

  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full font-medium whitespace-nowrap",
        badgeSizes[size],
        !hasCustomColors && presetVariants[variant],
        className
      )}
      style={
        hasCustomColors
          ? { color, backgroundColor: bgColor, ...style }
          : style
      }
      {...props}
    />
  );
}

export { Badge };
export type { BadgeProps };
