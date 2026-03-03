"use client";

import * as React from "react";
import { cn } from "./utils";
import { Inbox, ArrowUp, ArrowDown, ArrowUpDown, ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "./button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./select";

export type SortDirection = "asc" | "desc" | null;

export type EnterpriseTableColumn<T = any> = {
  key: string;
  header: string;
  widthClassName?: string; // e.g. "w-12", "w-32", "min-w-[200px]"
  minWidth?: number; // Minimum width in pixels
  maxWidth?: number; // Maximum width in pixels
  align?: "left" | "center" | "right";
  render?: (row: T, index: number) => React.ReactNode;
  sortable?: boolean;
  sortValue?: (row: T) => string | number | Date | null | undefined; // Custom sort value extractor
  headerClassName?: string;
  cellClassName?: string;
  resizable?: boolean; // Allow column resizing
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
  pagination?: {
    enabled: boolean;
    pageSize?: number; // Default: 10
    showPageSizeSelector?: boolean; // Default: true
  };
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
  pagination,
}: EnterpriseTableProps<T>) {
  const [sortColumn, setSortColumn] = React.useState<string | null>(null);
  const [sortDirection, setSortDirection] = React.useState<SortDirection>(null);
  const [currentPage, setCurrentPage] = React.useState(1);
  const [pageSize, setPageSize] = React.useState(pagination?.pageSize || 10);
  const [columnWidths, setColumnWidths] = React.useState<Record<string, number>>({});
  const [resizingColumn, setResizingColumn] = React.useState<string | null>(null);
  const hasHeader = !!(title || subtitle || itemCountLabel || headerActions);
  const isPaginationEnabled = pagination?.enabled ?? false;

  const handleSort = (columnKey: string) => {
    if (sortColumn === columnKey) {
      // Cycle through: asc -> desc -> null
      if (sortDirection === "asc") {
        setSortDirection("desc");
      } else if (sortDirection === "desc") {
        setSortColumn(null);
        setSortDirection(null);
      }
    } else {
      setSortColumn(columnKey);
      setSortDirection("asc");
    }
  };

  const sortedData = React.useMemo(() => {
    if (!sortColumn || !sortDirection) return data;

    const column = columns.find((col) => col.key === sortColumn);
    if (!column || !column.sortable) return data;

    return [...data].sort((a, b) => {
      let aValue: any;
      let bValue: any;

      if (column.sortValue) {
        aValue = column.sortValue(a);
        bValue = column.sortValue(b);
      } else {
        aValue = (a as any)[sortColumn];
        bValue = (b as any)[sortColumn];
      }

      // Handle null/undefined values
      if (aValue == null && bValue == null) return 0;
      if (aValue == null) return 1;
      if (bValue == null) return -1;

      // Handle dates
      if (aValue instanceof Date && bValue instanceof Date) {
        return sortDirection === "asc"
          ? aValue.getTime() - bValue.getTime()
          : bValue.getTime() - aValue.getTime();
      }

      // Handle numbers
      if (typeof aValue === "number" && typeof bValue === "number") {
        return sortDirection === "asc" ? aValue - bValue : bValue - aValue;
      }

      // Handle strings
      const aStr = String(aValue).toLowerCase();
      const bStr = String(bValue).toLowerCase();
      if (sortDirection === "asc") {
        return aStr.localeCompare(bStr);
      } else {
        return bStr.localeCompare(aStr);
      }
    });
  }, [data, sortColumn, sortDirection, columns]);

  // Pagination logic
  const paginatedData = React.useMemo(() => {
    if (!isPaginationEnabled) return sortedData;
    
    const startIndex = (currentPage - 1) * pageSize;
    const endIndex = startIndex + pageSize;
    return sortedData.slice(startIndex, endIndex);
  }, [sortedData, currentPage, pageSize, isPaginationEnabled]);

  const totalPages = React.useMemo(() => {
    if (!isPaginationEnabled) return 1;
    return Math.ceil(sortedData.length / pageSize);
  }, [sortedData.length, pageSize, isPaginationEnabled]);

  // Reset to page 1 when page size changes
  React.useEffect(() => {
    if (isPaginationEnabled && currentPage > totalPages && totalPages > 0) {
      setCurrentPage(1);
    }
  }, [totalPages, currentPage, isPaginationEnabled]);

  return (
    <div
      className={cn(
        "w-full bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden flex flex-col",
        className
      )}
      style={isPaginationEnabled ? { 
        height: 'calc(100vh - 280px)', 
        maxHeight: 'calc(100vh - 280px)',
        minHeight: '500px'
      } : undefined}
    >
      {/* Optional Header */}
      {hasHeader && (
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-3 px-3 sm:px-4 py-2 sm:py-2.5 border-b border-gray-200 bg-white flex-shrink-0">
          <div className="flex-1 min-w-0">
            {title && (
              <h3 className="text-sm sm:text-base font-semibold text-gray-900">
                {title}
              </h3>
            )}
            {subtitle && (
              <p className="text-xs text-gray-500 mt-0.5 hidden sm:block">{subtitle}</p>
            )}
          </div>
          <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
            {itemCountLabel && (
              <span className="text-xs text-gray-500 whitespace-nowrap">
                {itemCountLabel}
              </span>
            )}
            {headerActions && <div className="flex items-center gap-2 flex-wrap">{headerActions}</div>}
          </div>
        </div>
      )}

      {/* Table */}
      <div className="flex flex-col flex-1 min-h-0 overflow-hidden">
        <div 
          className={cn(
            "overflow-x-auto overflow-y-auto flex-1",
            isPaginationEnabled && "min-h-0"
          )}
          style={{ 
            scrollbarWidth: 'thin', 
            scrollbarColor: '#cbd5e1 #f1f5f9',
            WebkitOverflowScrolling: 'touch'
          }}
        >
          <table
            className={cn(
              "text-sm border-collapse",
              tableClassName || "w-full"
            )}
            style={{ 
              width: '100%', 
              tableLayout: 'auto',
              borderSpacing: 0
            }}
          >
            <thead className="sticky top-0 z-10 bg-gray-50 shadow-sm">
              <tr className="bg-gray-50 border-b border-gray-200">
                {columns.map((column, colIndex) => {
                  const columnWidth = columnWidths[column.key];
                  const minWidth = column.minWidth || 100;
                  const maxWidth = column.maxWidth;
                  const isResizable = column.resizable !== false;
                  
                  return (
                  <th
                    key={column.key}
                    className={cn(
                      "px-4 py-2.5 text-xs font-semibold text-gray-600 uppercase tracking-wide text-left align-middle border-r border-gray-200 last:border-r-0 relative",
                      column.widthClassName,
                      column.align === "right" && "text-right",
                      column.align === "center" && "text-center",
                      column.headerClassName,
                      column.sortable && "cursor-pointer hover:bg-gray-100 select-none"
                    )}
                    style={{
                      minWidth: columnWidth || column.minWidth || (column.widthClassName ? undefined : 'auto'),
                      maxWidth: columnWidth || column.maxWidth || 'none',
                      width: columnWidth ? `${columnWidth}px` : (column.widthClassName ? undefined : 'auto'),
                      whiteSpace: 'nowrap',
                    }}
                    onClick={() => column.sortable && handleSort(column.key)}
                  >
                    <div className="flex items-center gap-1.5">
                      <span className={column.widthClassName ? "truncate" : ""}>{column.header}</span>
                      {column.sortable && (
                        <span className="text-gray-400 flex items-center flex-shrink-0">
                          {sortColumn === column.key ? (
                            sortDirection === "asc" ? (
                              <ArrowUp className="h-3 w-3" />
                            ) : (
                              <ArrowDown className="h-3 w-3" />
                            )
                          ) : (
                            <ArrowUpDown className="h-3 w-3 opacity-50" />
                          )}
                        </span>
                      )}
                    </div>
                    {isResizable && colIndex < columns.length - 1 && (
                      <div
                        className="absolute top-0 right-0 w-1 h-full cursor-col-resize hover:bg-blue-500 bg-transparent z-20"
                        onMouseDown={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          setResizingColumn(column.key);
                          const startX = e.clientX;
                          const startWidth = columnWidth || (column.minWidth || 120);
                          
                          const handleMouseMove = (moveEvent: MouseEvent) => {
                            const diff = moveEvent.clientX - startX;
                            const newWidth = Math.max(minWidth, Math.min(maxWidth || Infinity, startWidth + diff));
                            setColumnWidths(prev => ({ ...prev, [column.key]: newWidth }));
                          };
                          
                          const handleMouseUp = () => {
                            setResizingColumn(null);
                            document.removeEventListener('mousemove', handleMouseMove);
                            document.removeEventListener('mouseup', handleMouseUp);
                          };
                          
                          document.addEventListener('mousemove', handleMouseMove);
                          document.addEventListener('mouseup', handleMouseUp);
                        }}
                      />
                    )}
                  </th>
                  );
                })}
              </tr>
            </thead>
            <tbody>
              {paginatedData.length === 0 ? (
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
                paginatedData.map((row, index) => {
                  const originalIndex = isPaginationEnabled 
                    ? (currentPage - 1) * pageSize + index 
                    : index;
                  return (
                    <tr
                      key={getRowKey(row, originalIndex)}
                      className={cn(
                        "border-b border-gray-200 last:border-b-0 hover:bg-gray-50 transition-colors",
                        onRowClick && "cursor-pointer",
                        rowClassName?.(row, originalIndex)
                      )}
                      onClick={() => onRowClick?.(row, originalIndex)}
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
                          style={{
                            minWidth: columnWidths[column.key] || column.minWidth || (column.widthClassName ? undefined : 'auto'),
                            maxWidth: columnWidths[column.key] || column.maxWidth || 'none',
                            width: columnWidths[column.key] ? `${columnWidths[column.key]}px` : (column.widthClassName ? undefined : 'auto'),
                            wordBreak: column.widthClassName ? 'break-word' : 'normal',
                            overflowWrap: column.widthClassName ? 'break-word' : 'normal',
                            whiteSpace: column.widthClassName ? 'normal' : 'nowrap',
                          }}
                        >
                          {column.render
                            ? column.render(row, originalIndex)
                            : (row as any)[column.key] ?? ""}
                        </td>
                      ))}
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Controls */}
        {isPaginationEnabled && sortedData.length > 0 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-gray-200 bg-white flex-shrink-0">
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-600">Rows per page:</span>
              {pagination?.showPageSizeSelector !== false && (
                <Select
                  value={String(pageSize)}
                  onValueChange={(value) => {
                    setPageSize(Number(value));
                    setCurrentPage(1);
                  }}
                >
                  <SelectTrigger className="w-20 h-8">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="10">10</SelectItem>
                    <SelectItem value="25">25</SelectItem>
                    <SelectItem value="50">50</SelectItem>
                    <SelectItem value="100">100</SelectItem>
                  </SelectContent>
                </Select>
              )}
              <span className="text-sm text-gray-600">
                {((currentPage - 1) * pageSize) + 1}-{Math.min(currentPage * pageSize, sortedData.length)} of {sortedData.length}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
                disabled={currentPage === 1}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <span className="text-sm text-gray-600 min-w-[80px] text-center">
                Page {currentPage} of {totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
                disabled={currentPage === totalPages}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}
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
