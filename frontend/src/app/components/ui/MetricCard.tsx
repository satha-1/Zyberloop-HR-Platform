"use client";

import * as React from "react";
import { Card, CardContent } from "./card";
import { cn } from "./utils";

interface MetricCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  trend?: {
    value: number;
    label: string;
    positive?: boolean;
  };
  icon?: React.ReactNode;
  className?: string;
}

export function MetricCard({
  title,
  value,
  subtitle,
  trend,
  icon,
  className,
}: MetricCardProps) {
  return (
    <Card
      className={cn(
        "bg-white rounded-xl shadow-sm border border-gray-100",
        className
      )}
    >
      <CardContent className="p-4 sm:p-5 lg:p-6">
        <div className="flex items-start justify-between">
          <div className="flex-1 min-w-0">
            <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">
              {title}
            </p>
            <p className="text-2xl sm:text-3xl font-semibold text-gray-900 mt-1">
              {value}
            </p>
            {subtitle && (
              <p className="text-xs text-gray-500 mt-1">{subtitle}</p>
            )}
            {trend && (
              <div className="flex items-center gap-1 mt-2">
                <span
                  className={cn(
                    "text-xs font-medium",
                    trend.positive
                      ? "text-emerald-600"
                      : "text-red-600"
                  )}
                >
                  {trend.positive ? "↑" : "↓"} {Math.abs(trend.value)}%
                </span>
                <span className="text-xs text-gray-500">{trend.label}</span>
              </div>
            )}
          </div>
          {icon && (
            <div className="ml-4 flex-shrink-0 text-gray-400">{icon}</div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
