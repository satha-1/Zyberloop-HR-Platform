"use client";

import * as React from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "./table";
import { cn } from "./utils";
import { Inbox } from "lucide-react";

interface DataTableProps {
  headers: string[];
  children: React.ReactNode;
  emptyMessage?: string;
  emptyIcon?: React.ReactNode;
  className?: string;
}

export function DataTable({
  headers,
  children,
  emptyMessage = "No records found.",
  emptyIcon,
  className,
}: DataTableProps) {
  const hasContent = React.Children.count(children) > 0;

  return (
    <div className={cn("w-full overflow-x-auto -mx-1", className)}>
      <div className="min-w-full inline-block align-middle">
        <Table>
          <TableHeader>
            <TableRow className="bg-gray-50 hover:bg-gray-50 border-b border-gray-200">
              {headers.map((header, idx) => (
                <TableHead
                  key={idx}
                  className={cn(
                    "px-4 py-2.5 text-left text-xs font-semibold text-gray-600 uppercase tracking-wide",
                    idx === 0 && "w-12 px-2" // First column (avatar) gets fixed width
                  )}
                >
                  {header}
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {hasContent ? (
              children
            ) : (
              <TableRow>
                <TableCell
                  colSpan={headers.length}
                  className="px-4 py-12 text-center"
                >
                  <div className="flex flex-col items-center justify-center">
                    {emptyIcon || <Inbox className="h-8 w-8 text-gray-400 mb-2" />}
                    <p className="text-sm text-gray-500">{emptyMessage}</p>
                  </div>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}

export function DataTableRow({
  children,
  className,
  onClick,
}: {
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
}) {
  return (
    <TableRow
      className={cn(
        "border-b border-gray-100 hover:bg-gray-50 transition-colors cursor-pointer",
        className
      )}
      onClick={onClick}
    >
      {children}
    </TableRow>
  );
}

export function DataTableCell({
  children,
  className,
  align = "left",
}: {
  children: React.ReactNode;
  className?: string;
  align?: "left" | "right" | "center";
}) {
  return (
    <TableCell
      className={cn(
        "px-4 py-2.5 align-middle text-sm text-gray-800",
        align === "right" && "text-right",
        align === "center" && "text-center",
        className
      )}
    >
      {children}
    </TableCell>
  );
}
