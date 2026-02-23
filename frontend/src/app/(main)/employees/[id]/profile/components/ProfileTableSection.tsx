"use client";

import * as React from "react";
import { cn } from "../../../../../components/ui/utils";
import { Inbox } from "lucide-react";

export interface ProfileTableColumn {
  key: string;
  header: string;
  width?: string;
  align?: "left" | "center" | "right";
}

export interface ProfileTableSectionProps {
  title: string;
  subtitle?: string; // e.g. "4 items" or "0 items"
  columns: ProfileTableColumn[];
  rows: any[];
  isLoading?: boolean;
  emptyMessage?: string;
  footerSlot?: React.ReactNode;
  className?: string;
  error?: string | null;
  renderCell?: (columnKey: string, row: any, index: number) => React.ReactNode;
}

export function ProfileTableSection({
  title,
  subtitle,
  columns,
  rows,
  isLoading = false,
  emptyMessage = "No items available.",
  footerSlot,
  className,
  error,
  renderCell,
}: ProfileTableSectionProps) {
  const itemCount = rows.length;
  const displaySubtitle = subtitle || `${itemCount} item${itemCount !== 1 ? "s" : ""}`;

  return (
    <div
      className={cn(
        "bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden",
        className
      )}
    >
      {/* Header */}
      <div className="px-6 py-4 border-b border-gray-200 bg-white">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <h3 className="text-base font-semibold text-gray-900">{title}</h3>
            {displaySubtitle && (
              <span className="text-xs text-gray-500 font-normal">
                {displaySubtitle}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Error State */}
      {error && (
        <div className="px-6 py-4 bg-red-50 border-b border-red-100">
          <p className="text-sm text-red-600">{error}</p>
        </div>
      )}

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full border-collapse">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-200">
              {columns.map((column) => (
                <th
                  key={column.key}
                  className={cn(
                    "px-4 py-3 text-xs font-semibold text-gray-700 uppercase tracking-wider text-left align-middle",
                    column.width && `w-[${column.width}]`,
                    column.align === "right" && "text-right",
                    column.align === "center" && "text-center"
                  )}
                  style={column.width ? { width: column.width } : undefined}
                >
                  {column.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              // Skeleton rows
              Array.from({ length: 3 }).map((_, idx) => (
                <tr key={`skeleton-${idx}`} className="border-b border-gray-100">
                  {columns.map((column) => (
                    <td
                      key={column.key}
                      className={cn(
                        "px-4 py-3",
                        column.align === "right" && "text-right",
                        column.align === "center" && "text-center"
                      )}
                    >
                      <div className="h-4 bg-gray-200 rounded animate-pulse" />
                    </td>
                  ))}
                </tr>
              ))
            ) : rows.length === 0 ? (
              // Empty state
              <tr>
                <td
                  colSpan={columns.length}
                  className="px-6 py-12 text-center"
                >
                  <div className="flex flex-col items-center justify-center">
                    <Inbox className="h-8 w-8 text-gray-400 mb-3" />
                    <p className="text-sm text-gray-500 font-normal">
                      {emptyMessage}
                    </p>
                  </div>
                </td>
              </tr>
            ) : (
              // Data rows
              rows.map((row, rowIndex) => (
                <tr
                  key={rowIndex}
                  className={cn(
                    "border-b border-gray-100 hover:bg-gray-50 transition-colors",
                    rowIndex % 2 === 1 && "bg-gray-50/30"
                  )}
                >
                  {columns.map((column) => {
                    const cellValue = row[column.key];
                    const content = renderCell
                      ? renderCell(column.key, row, rowIndex)
                      : cellValue ?? "";

                    return (
                      <td
                        key={column.key}
                        className={cn(
                          "px-4 py-3 text-sm text-gray-800 align-top",
                          column.align === "right" && "text-right",
                          column.align === "center" && "text-center"
                        )}
                        title={
                          typeof content === "string" && content.length > 50
                            ? content
                            : undefined
                        }
                      >
                        <div
                          className={cn(
                            column.align === "right" && "text-right",
                            column.align === "center" && "text-center"
                          )}
                        >
                          {content}
                        </div>
                      </td>
                    );
                  })}
                </tr>
              ))
            )}
          </tbody>
          {footerSlot && rows.length > 0 && (
            <tfoot>
              <tr className="border-t-2 border-gray-300 bg-gray-50">
                {footerSlot}
              </tr>
            </tfoot>
          )}
        </table>
      </div>
    </div>
  );
}
