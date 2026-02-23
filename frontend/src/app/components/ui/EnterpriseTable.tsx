"use client";

import * as React from "react";
import { cn } from "./utils";
import { Inbox } from "lucide-react";

export type EnterpriseTableColumn<T = any> = {
  key: string;
  header: string;
  widthClassName?: string; // e.g. "w-12", "w-32", "min-w-[200px]"
  align?: "left" | "center" | "right";
  render?: (row: T, index: number) => React.ReactNode;
  sortable?: boolean;
  headerClassName?: string;
  cellClassName?: string;
};

export type EnterpriseTableProps<T = any> = {
  title?: string;
  subtitle?: string;
  itemCountLabel?: string; // e.g. "23 items"
  columns: EnterpriseTableColumn<T>[];
  data: T[];
  getRowKey: (row: T, index: number) => string | number;
  emptyStateText?: string;
  emptyStateIcon?: React.ReactNode;
  headerActions?: React.ReactNode;
  onRowClick?: (row: T, index: number) => void;
  className?: string;
  tableClassName?: string;
  rowClassName?: (row: T, index: number) => string;
};

export function EnterpriseTable<T = any>({
  title,
  subtitle,
  itemCountLabel,
  columns,
  data,
  getRowKey,
  emptyStateText = "No records found.",
  emptyStateIcon,
  headerActions,
  onRowClick,
  className,
  tableClassName,
  rowClassName,
}: EnterpriseTableProps<T>) {
  const hasHeader = !!(title || subtitle || itemCountLabel || headerActions);

  return (
    <div
      className={cn(
        "w-full bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden",
        className
      )}
    >
      {/* Optional Header */}
      {hasHeader && (
        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200 bg-white">
          <div className="flex-1 min-w-0">
            {title && (
              <h3 className="text-base font-semibold text-gray-900 mb-0.5">
                {title}
              </h3>
            )}
            {subtitle && (
              <p className="text-xs text-gray-500">{subtitle}</p>
            )}
          </div>
          <div className="flex items-center gap-3 ml-4">
            {itemCountLabel && (
              <span className="text-xs text-gray-500 whitespace-nowrap">
                {itemCountLabel}
              </span>
            )}
            {headerActions && <div className="flex items-center gap-2">{headerActions}</div>}
          </div>
        </div>
      )}

      {/* Table */}
      <div className="overflow-x-auto">
        <table
          className={cn(
            "w-full text-sm border-collapse",
            tableClassName
          )}
        >
          <thead>
            <tr className="bg-gray-50 border-b border-gray-200">
              {columns.map((column) => (
                <th
                  key={column.key}
                  className={cn(
                    "px-4 py-2.5 text-xs font-semibold text-gray-600 uppercase tracking-wide text-left align-middle border-r border-gray-200 last:border-r-0",
                    column.widthClassName,
                    column.align === "right" && "text-right",
                    column.align === "center" && "text-center",
                    column.headerClassName
                  )}
                >
                  <div className="flex items-center gap-1.5">
                    <span>{column.header}</span>
                    {column.sortable && (
                      <span className="text-gray-400 text-[10px]">▲▼</span>
                    )}
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {data.length === 0 ? (
              <tr>
                <td
                  colSpan={columns.length}
                  className="px-4 py-12 text-center border-b border-gray-200"
                >
                  <div className="flex flex-col items-center justify-center">
                    {emptyStateIcon || <Inbox className="h-8 w-8 text-gray-400 mb-2" />}
                    <p className="text-sm text-gray-500">{emptyStateText}</p>
                  </div>
                </td>
              </tr>
            ) : (
              data.map((row, index) => (
                <tr
                  key={getRowKey(row, index)}
                  className={cn(
                    "border-b border-gray-200 last:border-b-0 hover:bg-gray-50 transition-colors",
                    onRowClick && "cursor-pointer",
                    rowClassName?.(row, index)
                  )}
                  onClick={() => onRowClick?.(row, index)}
                >
                  {columns.map((column) => (
                    <td
                      key={column.key}
                      className={cn(
                        "px-4 py-2.5 text-sm text-gray-800 align-top border-r border-gray-200 last:border-r-0",
                        column.widthClassName,
                        column.align === "right" && "text-right",
                        column.align === "center" && "text-center",
                        column.cellClassName
                      )}
                    >
                      {column.render
                        ? column.render(row, index)
                        : (row as any)[column.key] ?? ""}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// Helper component for links in table cells
export function TableLink({
  href,
  children,
  onClick,
  className,
}: {
  href?: string;
  children: React.ReactNode;
  onClick?: () => void;
  className?: string;
}) {
  const baseClasses = "text-blue-600 hover:underline font-medium transition-colors";
  
  if (href) {
    return (
      <a href={href} className={cn(baseClasses, className)}>
        {children}
      </a>
    );
  }
  
  if (onClick) {
    return (
      <button
        onClick={(e) => {
          e.stopPropagation();
          onClick();
        }}
        className={cn(baseClasses, "cursor-pointer", className)}
      >
        {children}
      </button>
    );
  }
  
  return <span className={cn(baseClasses, className)}>{children}</span>;
}
