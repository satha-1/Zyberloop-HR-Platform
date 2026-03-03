"use client";

import * as React from "react";
import { cn } from "./utils";
import { Inbox, Grid3x3, BarChart3, Filter, Download, Maximize2 } from "lucide-react";
import { Button } from "./button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "./dialog";
import { Input } from "./input";
import { Label } from "./label";

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
  title?: string; // Table title for export
  exportFileName?: string; // Custom filename for CSV export
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
  title,
  exportFileName,
}: WorkdayTableProps<T>) {
  const [filters, setFilters] = React.useState<Record<string, string>>({});
  const [filterOpen, setFilterOpen] = React.useState(false);
  const [expanded, setExpanded] = React.useState(false);

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
    const rows = filteredData.map(row => 
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
  }, [columns, filteredData, exportFileName, title, extractTextContent]);

  const itemCount = filteredData.length;
  const displayLabel = itemCountLabel || `${itemCount} item${itemCount !== 1 ? "s" : ""}`;

  return (
    <div className={cn("w-full", className)}>
      {/* Meta row with item count and toolbar */}
      {showToolbar && (
        <div className="flex items-center justify-between mb-3 px-1">
          <span className="text-xs text-gray-600 font-medium">{displayLabel}</span>
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
              onClick={handleDownloadCSV}
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
            {headerActions && (
              <div className="flex items-center gap-1">
                {headerActions}
              </div>
            )}
          </div>
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
              filteredData.map((row, rowIndex) => (
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
                  }}
                />
              </div>
            ))}
            <div className="flex justify-end gap-2 pt-4">
              <Button
                variant="outline"
                onClick={() => {
                  setFilters({});
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
            <table className="w-full border-collapse min-w-full">
              <thead className="sticky top-0 z-10 bg-gray-50 shadow-sm">
                <tr className="bg-gray-50 border-b border-gray-200">
                  {columns.map((column) => (
                    <th
                      key={column.key}
                      className={cn(
                        "px-4 py-3 text-xs font-semibold text-gray-700 uppercase tracking-wider text-left align-middle",
                        column.align === "right" && "text-right",
                        column.align === "center" && "text-center"
                      )}
                    >
                      {column.header}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filteredData.length === 0 ? (
                  <tr>
                    <td colSpan={columns.length} className="px-6 py-12 text-center">
                      <div className="flex flex-col items-center justify-center">
                        <Inbox className="h-8 w-8 text-gray-400 mb-3" />
                        <p className="text-sm text-gray-500">{emptyMessage}</p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  filteredData.map((row, rowIndex) => (
                    <tr
                      key={getRowKey(row, rowIndex)}
                      className={cn(
                        "border-b border-gray-100 hover:bg-gray-50",
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
                          >
                            {content}
                          </td>
                        );
                      })}
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

// Toolbar action buttons for tables
export function TableToolbarActions({
  onFilter,
  onDownload,
  onExpand,
}: {
  onFilter?: () => void;
  onDownload?: () => void;
  onExpand?: () => void;
} = {}) {
  return (
    <>
      <Button variant="ghost" size="sm" className="h-7 w-7 p-0" title="Grid View">
        <Grid3x3 className="h-4 w-4" />
      </Button>
      <Button variant="ghost" size="sm" className="h-7 w-7 p-0" title="Chart View">
        <BarChart3 className="h-4 w-4" />
      </Button>
      <Button 
        variant="ghost" 
        size="sm" 
        className="h-7 w-7 p-0" 
        title="Filter"
        onClick={onFilter}
      >
        <Filter className="h-4 w-4" />
      </Button>
      <Button 
        variant="ghost" 
        size="sm" 
        className="h-7 w-7 p-0" 
        title="Export"
        onClick={onDownload}
      >
        <Download className="h-4 w-4" />
      </Button>
      <Button 
        variant="ghost" 
        size="sm" 
        className="h-7 w-7 p-0" 
        title="Full Screen"
        onClick={onExpand}
      >
        <Maximize2 className="h-4 w-4" />
      </Button>
    </>
  );
}
