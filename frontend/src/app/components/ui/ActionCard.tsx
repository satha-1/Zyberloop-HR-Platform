"use client";

import * as React from "react";
import { cn } from "./utils";
import { LucideIcon } from "lucide-react";

export interface ActionCardProps {
  icon: LucideIcon;
  title: string;
  description?: string;
  onClick?: () => void;
  href?: string;
  className?: string;
}

export function ActionCard({
  icon: Icon,
  title,
  description,
  onClick,
  href,
  className,
}: ActionCardProps) {
  const content = (
    <div
      className={cn(
        "flex items-start gap-4 p-4 bg-white rounded-lg border border-gray-200 shadow-sm hover:shadow-md transition-all cursor-pointer group",
        className
      )}
      onClick={onClick}
    >
      <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center group-hover:bg-blue-100 transition-colors">
        <Icon className="h-5 w-5 text-blue-600" />
      </div>
      <div className="flex-1 min-w-0">
        <h3 className="text-sm font-semibold text-gray-900 mb-1">{title}</h3>
        {description && (
          <p className="text-xs text-gray-600 line-clamp-2">{description}</p>
        )}
      </div>
    </div>
  );

  if (href) {
    return (
      <a href={href} className="block">
        {content}
      </a>
    );
  }

  return content;
}
