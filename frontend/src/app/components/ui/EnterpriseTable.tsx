"use client";

import * as React from "react";
import { cn } from "./utils";
import { Inbox, ArrowUp, ArrowDown, ArrowUpDown, ChevronLeft, ChevronRight, Filter, Download, Maximize2 } from "lucide-react";
import { Button } from "./button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "./dialog";
import { Input } from "./input";
import { Label } from "./label";

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
  showToolbar?: boolean; // Show filter, download, expand icons (default: true)
  exportFileName?: string; // Custom filename for CSV export
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
  showToolbar = true,
  exportFileName,
}: EnterpriseTableProps<T>) {
  const [sortColumn, setSortColumn] = React.useState<string | null>(null);
  const [sortDirection, setSortDirection] = React.useState<SortDirection>(null);
  const [currentPage, setCurrentPage] = React.useState(1);
  const [pageSize, setPageSize] = React.useState(pagination?.pageSize || 10);
  const [columnWidths, setColumnWidths] = React.useState<Record<string, number>>({});
  const [resizingColumn, setResizingColumn] = React.useState<string | null>(null);
  const [filterOpen, setFilterOpen] = React.useState(false);
  const [filters, setFilters] = React.useState<Record<string, string>>({});
  const [expanded, setExpanded] = React.useState(false);
  const hasHeader = !!(title || subtitle || itemCountLabel || headerActions || showToolbar);
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

  // Apply filters
  const filteredData = React.useMemo(() => {
    if (Object.keys(filters).length === 0) return data;
    
    return data.filter((row) => {
      return Object.entries(filters).every(([key, value]) => {
        if (!value || value.trim() === '') return true;
        const column = columns.find((col) => col.key === key);
        if (!column) return true;
        
        const cellValue = column.render 
          ? String(column.render(row, 0) || '')
          : String((row as any)[key] || '');
        
        return cellValue.toLowerCase().includes(value.toLowerCase());
      });
    });
  }, [data, filters, columns]);

  const sortedData = React.useMemo(() => {
    if (!sortColumn || !sortDirection) return filteredData;

    const column = columns.find((col) => col.key === sortColumn);
    if (!column || !column.sortable) return filteredData;

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
  }, [filteredData, sortColumn, sortDirection, columns]);

  // Helper function to extract text content from React elements or values
  const extractTextContent = React.useCallback((value: any): string => {
    if (value == null || value === undefined) return '';
    
    // If it's a string or number, return it
    if (typeof value === 'string' || typeof value === 'number') {
      return String(value);
    }
    
    // If it's a boolean, return it
    if (typeof value === 'boolean') {
      return String(value);
    }
    
    // If it's a React element, try to extract text from props
    if (typeof value === 'object' && value !== null) {
      // Check if it's a React element with props.children
      if (value.props) {
        const children = value.props.children;
        if (children !== undefined && children !== null) {
          if (typeof children === 'string' || typeof children === 'number') {
            return String(children);
          }
          if (typeof children === 'boolean') {
            return String(children);
          }
          if (Array.isArray(children)) {
            return children
              .map((child: any) => extractTextContent(child))
              .filter((text: string) => text.trim() !== '')
              .join(' ')
              .trim();
          }
          if (typeof children === 'object') {
            return extractTextContent(children);
          }
        }
        
        // Check for common props that contain text
        if (value.props.title) return String(value.props.title);
        if (value.props.label) return String(value.props.label);
        if (value.props.value) return String(value.props.value);
        if (value.props.text) return String(value.props.text);
      }
      
      // Check for common object patterns (non-React objects)
      if (value.name) return String(value.name);
      if (value.title) return String(value.title);
      if (value.label) return String(value.label);
      if (value.text) return String(value.text);
      if (value.value) return String(value.value);
      
      // For date objects
      if (value instanceof Date) {
        return value.toLocaleDateString();
      }
      
      // For arrays, join elements
      if (Array.isArray(value)) {
        return value.map((item: any) => extractTextContent(item)).filter((t: string) => t).join(', ');
      }
      
      // For nested objects, try to get a meaningful string representation
      try {
        const keys = Object.keys(value);
        if (keys.length > 0 && keys.length <= 5) {
          // For simple objects, return key-value pairs
          return keys
            .map(key => {
              const val = extractTextContent(value[key]);
              return val ? `${key}: ${val}` : null;
            })
            .filter(Boolean)
            .join(', ');
        }
      } catch (e) {
        // Ignore errors
      }
    }
    
    // Fallback to string conversion
    const str = String(value);
    // If it contains [object Object], return empty string
    if (str.includes('[object Object]') || str.includes('[object')) {
      return '';
    }
    
    return str.trim();
  }, []);

  // CSV Download handler
  const handleDownloadCSV = React.useCallback(() => {
    // Get module name from title or use default
    const moduleName = (title || 'table').toLowerCase().replace(/\s+/g, '_');
    
    // Get user ID from localStorage (if available)
    let userId = 'unknown';
    try {
      const userStr = localStorage.getItem('user');
      if (userStr) {
        const user = JSON.parse(userStr);
        userId = user.id || user._id || user.email?.split('@')[0] || 'unknown';
      }
    } catch (e) {
      // If no user in localStorage, try to get from token
      try {
        const token = localStorage.getItem('auth_token');
        if (token) {
          // Extract user info from token if possible (basic approach)
          const payload = JSON.parse(atob(token.split('.')[1] || '{}'));
          userId = payload.userId || payload.id || payload.email?.split('@')[0] || 'unknown';
        }
      } catch (e2) {
        // Keep default 'unknown'
      }
    }
    
    // Generate timestamp
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5);
    
    const headers = columns.map(col => col.header);
    const rows = sortedData.map(row => 
      columns.map(col => {
        let value: string = '';
        
        // First, try to get raw value from row object (preferred - actual data)
        const rawValue = (row as any)[col.key];
        if (rawValue !== undefined && rawValue !== null) {
          value = extractTextContent(rawValue);
        }
        
        // If raw value is empty or not meaningful, try to extract from rendered component
        if (!value || value.trim() === '' || value === '[object Object]') {
          if (col.render) {
            try {
              const rendered = col.render(row, 0);
              const renderedText = extractTextContent(rendered);
              if (renderedText && renderedText.trim() !== '' && !renderedText.includes('[object')) {
                value = renderedText;
              }
            } catch (e) {
              // If rendering fails, keep the raw value
            }
          }
        }
        
        // If still no value, use empty string
        if (!value || value.trim() === '') {
          value = '';
        }
        
        // Clean and escape the value
        value = value.replace(/"/g, '""').replace(/\n/g, ' ').replace(/\r/g, '').trim();
        return `"${value}"`;
      })
    );

    const csvContent = [
      headers.map(h => `"${h.replace(/"/g, '""')}"`).join(','),
      ...rows.map(row => row.join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    
    // Generate filename: module_userId_timestamp.csv
    const filename = exportFileName || `${moduleName}_${userId}_${timestamp}.csv`;
    
    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }, [columns, sortedData, exportFileName, title, extractTextContent]);

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
            {showToolbar && (
              <div className="flex items-center gap-1">
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 w-7 p-0"
                  onClick={() => setFilterOpen(true)}
                  title="Filter"
                >
                  <Filter className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 w-7 p-0"
                  onClick={() => handleDownloadCSV()}
                  title="Download CSV"
                >
                  <Download className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 w-7 p-0"
                  onClick={() => setExpanded(true)}
                  title="Expand Table"
                >
                  <Maximize2 className="h-4 w-4" />
                </Button>
              </div>
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

      {/* Filter Dialog */}
      <Dialog open={filterOpen} onOpenChange={setFilterOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Filter Table</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            {columns.map((column) => (
              <div key={column.key} className="space-y-2">
                <Label htmlFor={`filter-${column.key}`}>{column.header}</Label>
                <Input
                  id={`filter-${column.key}`}
                  placeholder={`Filter by ${column.header.toLowerCase()}...`}
                  value={filters[column.key] || ''}
                  onChange={(e) => {
                    const newFilters = { ...filters };
                    if (e.target.value.trim() === '') {
                      delete newFilters[column.key];
                    } else {
                      newFilters[column.key] = e.target.value;
                    }
                    setFilters(newFilters);
                    setCurrentPage(1);
                  }}
                />
              </div>
            ))}
            <div className="flex justify-end gap-2 pt-4">
              <Button
                variant="outline"
                onClick={() => {
                  setFilters({});
                  setCurrentPage(1);
                }}
              >
                Clear All
              </Button>
              <Button onClick={() => setFilterOpen(false)}>Apply Filters</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Expanded Table Modal */}
      <Dialog open={expanded} onOpenChange={setExpanded}>
        <DialogContent className="!max-w-[99vw] !w-[99vw] !max-h-[99vh] !h-[99vh] p-0 flex flex-col">
          <DialogHeader className="px-6 pt-6 pb-4 border-b flex-shrink-0">
            <DialogTitle>{title || 'Table View'}</DialogTitle>
          </DialogHeader>
          <div className="overflow-auto flex-1 p-6 min-h-0">
            <table className={cn("text-sm border-collapse w-full min-w-full", tableClassName)}>
              <thead className="sticky top-0 z-10 bg-gray-50 shadow-sm">
                <tr className="bg-gray-50 border-b border-gray-200">
                  {columns.map((column) => (
                    <th
                      key={column.key}
                      className={cn(
                        "px-4 py-2.5 text-xs font-semibold text-gray-600 uppercase tracking-wide text-left align-middle border-r border-gray-200 last:border-r-0",
                        column.align === "right" && "text-right",
                        column.align === "center" && "text-center",
                        column.sortable && "cursor-pointer hover:bg-gray-100"
                      )}
                      onClick={() => column.sortable && handleSort(column.key)}
                    >
                      <div className="flex items-center gap-1.5">
                        <span>{column.header}</span>
                        {column.sortable && (
                          <span className="text-gray-400">
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
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {sortedData.length === 0 ? (
                  <tr>
                    <td colSpan={columns.length} className="px-4 py-12 text-center">
                      <div className="flex flex-col items-center justify-center">
                        {emptyStateIcon || <Inbox className="h-8 w-8 text-gray-400 mb-2" />}
                        <p className="text-sm text-gray-500">{emptyStateText}</p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  sortedData.map((row, index) => (
                    <tr
                      key={getRowKey(row, index)}
                      className={cn(
                        "border-b border-gray-200 last:border-b-0 hover:bg-gray-50",
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
                            column.align === "right" && "text-right",
                            column.align === "center" && "text-center"
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
        </DialogContent>
      </Dialog>
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
