"use client";

import * as React from "react";
import { cn } from "./utils";
import { Inbox, Grid3x3, BarChart3, Filter, Download, Maximize2 } from "lucide-react";
import { Button } from "./button";

export interface WorkdayTableColumn<T = any> {
  key: string;
  header: string;
  width?: string;
  align?: "left" | "center" | "right";
  render?: (row: T, index: number) => React.ReactNode;
  sortable?: boolean;
}

export interface WorkdayTableProps<T = any> {
  columns: WorkdayTableColumn<T>[];
  data: T[];
  getRowKey: (row: T, index: number) => string | number;
  itemCountLabel?: string; // e.g. "23 items"
  emptyMessage?: string;
  isLoading?: boolean;
  headerActions?: React.ReactNode; // Toolbar icons (grid, chart, filter, export, etc.)
  onRowClick?: (row: T, index: number) => void;
  className?: string;
  showToolbar?: boolean; // Show the meta row with item count and toolbar
}

export function WorkdayTable<T = any>({
  columns,
  data,
  getRowKey,
  itemCountLabel,
  emptyMessage = "No items available.",
  isLoading = false,
  headerActions,
  onRowClick,
  className,
  showToolbar = true,
}: WorkdayTableProps<T>) {
  const itemCount = data.length;
  const displayLabel = itemCountLabel || `${itemCount} item${itemCount !== 1 ? "s" : ""}`;

  return (
    <div className={cn("w-full", className)}>
      {/* Meta row with item count and toolbar */}
      {showToolbar && (
        <div className="flex items-center justify-between mb-3 px-1">
          <span className="text-xs text-gray-600 font-medium">{displayLabel}</span>
          {headerActions && (
            <div className="flex items-center gap-1">
              {headerActions}
            </div>
          )}
        </div>
      )}

      {/* Table Container with horizontal scroll */}
      <div className="overflow-x-auto rounded-lg border border-gray-200 bg-white">
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
            ) : data.length === 0 ? (
              // Empty state - always show table structure
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
              data.map((row, rowIndex) => (
                <tr
                  key={getRowKey(row, rowIndex)}
                  className={cn(
                    "border-b border-gray-100 hover:bg-gray-50 transition-colors",
                    onRowClick && "cursor-pointer"
                  )}
                  onClick={() => onRowClick?.(row, rowIndex)}
                >
                  {columns.map((column) => {
                    const cellValue = (row as any)[column.key];
                    const content = column.render
                      ? column.render(row, rowIndex)
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
                            "truncate max-w-xs",
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
        </table>
      </div>
    </div>
  );
}

// Toolbar action buttons for tables
export function TableToolbarActions() {
  return (
    <>
      <Button variant="ghost" size="sm" className="h-7 w-7 p-0" title="Grid View">
        <Grid3x3 className="h-4 w-4" />
      </Button>
      <Button variant="ghost" size="sm" className="h-7 w-7 p-0" title="Chart View">
        <BarChart3 className="h-4 w-4" />
      </Button>
      <Button variant="ghost" size="sm" className="h-7 w-7 p-0" title="Filter">
        <Filter className="h-4 w-4" />
      </Button>
      <Button variant="ghost" size="sm" className="h-7 w-7 p-0" title="Export">
        <Download className="h-4 w-4" />
      </Button>
      <Button variant="ghost" size="sm" className="h-7 w-7 p-0" title="Full Screen">
        <Maximize2 className="h-4 w-4" />
      </Button>
    </>
  );
}
