import { ReactNode } from "react";
import { cn } from "../../../../../components/ui/utils";

interface ProfileSectionCardProps {
  children: ReactNode;
  className?: string;
}

export function ProfileSectionCard({ children, className }: ProfileSectionCardProps) {
  return (
    <div
      className={cn(
        "bg-white rounded-xl shadow-sm border border-gray-100",
        "p-4 sm:p-6 lg:p-8",
        className
      )}
    >
      {children}
    </div>
  );
}
