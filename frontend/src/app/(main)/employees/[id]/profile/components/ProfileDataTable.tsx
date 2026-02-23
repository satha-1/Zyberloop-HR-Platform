import { ReactNode } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../../../../../components/ui/table";
import { cn } from "../../../../../components/ui/utils";

interface ProfileDataTableProps {
  headers: string[];
  children: ReactNode;
  emptyMessage?: string;
  emptyIcon?: ReactNode;
  className?: string;
}

export function ProfileDataTable({
  headers,
  children,
  emptyMessage = "No items available.",
  emptyIcon,
  className,
}: ProfileDataTableProps) {
  return (
    <div className={cn("w-full overflow-x-auto", className)}>
      <div className="min-w-full inline-block align-middle">
        <Table>
          <TableHeader>
            <TableRow className="bg-gray-50 hover:bg-gray-50">
              {headers.map((header, idx) => (
                <TableHead
                  key={idx}
                  className="px-4 py-2.5 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider"
                >
                  {header}
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {children}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}

export function ProfileTableRow({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <TableRow
      className={cn(
        "border-b border-gray-100 hover:bg-gray-50 transition-colors",
        className
      )}
    >
      {children}
    </TableRow>
  );
}

export function ProfileTableCell({
  children,
  className,
  align = "left",
}: {
  children: ReactNode;
  className?: string;
  align?: "left" | "right" | "center";
}) {
  return (
    <TableCell
      className={cn(
        "px-4 py-3 text-sm align-middle",
        align === "right" && "text-right",
        align === "center" && "text-center",
        className
      )}
    >
      {children}
    </TableCell>
  );
}

export function ProfileEmptyState({
  message,
  icon,
}: {
  message: string;
  icon?: ReactNode;
}) {
  return (
    <div className="flex flex-col items-center justify-center py-12 px-4">
      {icon && <div className="mb-3 text-gray-400">{icon}</div>}
      <p className="text-sm text-gray-500 text-center">{message}</p>
    </div>
  );
}
