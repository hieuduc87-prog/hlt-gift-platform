import { cn } from "@/lib/utils";
import { ReactNode } from "react";

interface EmptyStateProps {
  icon?: ReactNode;
  title: string;
  description?: string;
  action?: ReactNode;
  className?: string;
}

function EmptyState({
  icon,
  title,
  description,
  action,
  className,
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center py-12 px-4 text-center",
        className
      )}
    >
      {icon && (
        <div className="mb-4 text-text-muted [&>svg]:h-12 [&>svg]:w-12 [&>svg]:stroke-[1.5]">
          {icon}
        </div>
      )}
      <h3 className="text-base font-medium text-foreground">{title}</h3>
      {description && (
        <p className="mt-1.5 max-w-sm text-sm text-text-muted">{description}</p>
      )}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}

export { EmptyState };
export type { EmptyStateProps };
