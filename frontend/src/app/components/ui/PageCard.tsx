"use client";

import * as React from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardAction } from "./card";
import { cn } from "./utils";

interface PageCardProps {
  title?: string;
  description?: string;
  action?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
  headerClassName?: string;
  contentClassName?: string;
}

export function PageCard({
  title,
  description,
  action,
  children,
  className,
  headerClassName,
  contentClassName,
}: PageCardProps) {
  return (
    <Card
      className={cn(
        "bg-white rounded-xl shadow-sm border border-gray-100",
        className
      )}
    >
      {(title || description || action) && (
        <CardHeader className={cn("border-b border-gray-100", headerClassName)}>
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1 min-w-0">
              {title && (
                <CardTitle className="text-base font-semibold text-gray-900 mb-1">
                  {title}
                </CardTitle>
              )}
              {description && (
                <CardDescription className="text-xs text-gray-500 mt-0.5">
                  {description}
                </CardDescription>
              )}
            </div>
            {action && <CardAction>{action}</CardAction>}
          </div>
        </CardHeader>
      )}
      <CardContent
        className={cn("p-4 sm:p-5 lg:p-6", contentClassName)}
      >
        {children}
      </CardContent>
    </Card>
  );
}
