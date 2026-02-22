import { ReactNode } from "react";
import { cn } from "../../../../../components/ui/utils";

interface ProfileSectionHeaderProps {
  title: string;
  subtitle?: string;
  itemCount?: number;
  actions?: ReactNode;
  className?: string;
}

export function ProfileSectionHeader({
  title,
  subtitle,
  itemCount,
  actions,
  className,
}: ProfileSectionHeaderProps) {
  return (
    <div
      className={cn(
        "flex flex-col sm:flex-row sm:items-center sm:justify-between",
        "gap-3 sm:gap-4 mb-6",
        className
      )}
    >
      <div className="flex-1 min-w-0">
        <h2 className="text-lg font-semibold text-gray-900 mb-1">{title}</h2>
        {subtitle && (
          <p className="text-sm text-gray-500">{subtitle}</p>
        )}
      </div>
      <div className="flex items-center gap-3">
        {itemCount !== undefined && (
          <span className="text-sm text-gray-500 whitespace-nowrap">
            {itemCount} {itemCount === 1 ? "item" : "items"}
          </span>
        )}
        {actions && <div className="flex items-center gap-2">{actions}</div>}
      </div>
    </div>
  );
}
