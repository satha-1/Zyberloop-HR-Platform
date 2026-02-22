"use client";
import { useState } from "react";
import { PageCard } from "../../components/ui/PageCard";
import { DataTable, DataTableRow, DataTableCell } from "../../components/ui/DataTable";
import { EmployeeAvatar } from "../../components/ui/EmployeeAvatar";
import { Input } from "../../components/ui/input";
import { Button } from "../../components/ui/button";
import { Badge } from "../../components/ui/badge";
import { useEmployees, useDepartments } from "../../lib/hooks";
import { AddEmployeeDialog } from "../../components/AddEmployeeDialog";
import { Search, Plus, Download, Filter } from "lucide-react";
import Link from "next/link";
import { api } from "../../lib/api";
import { toast } from "sonner";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../../components/ui/select";

export default function Employees() {
  const [searchTerm, setSearchTerm] = useState("");
  const [departmentFilter, setDepartmentFilter] = useState("all");
  const [addEmployeeOpen, setAddEmployeeOpen] = useState(false);
  const { data: departments = [] } = useDepartments();
  const { data: employees = [], loading, refetch } = useEmployees({
    search: searchTerm || undefined,
    department: departmentFilter !== "all" ? departmentFilter : undefined,
  });

  const filteredEmployees = employees.filter((emp: any) => {
    if (!searchTerm) return true;
    const searchLower = searchTerm.toLowerCase();
    return (
      emp.firstName?.toLowerCase().includes(searchLower) ||
      emp.lastName?.toLowerCase().includes(searchLower) ||
      emp.employeeCode?.toLowerCase().includes(searchLower) ||
      emp.email?.toLowerCase().includes(searchLower)
    );
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active":
        return "bg-green-100 text-green-800";
      case "on_leave":
        return "bg-orange-100 text-orange-800";
      case "inactive":
        return "bg-gray-100 text-gray-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const handleExportCSV = async () => {
    try {
      const csvData = filteredEmployees.map((emp: any) => ({
        "Employee Code": emp.employeeCode || "",
        "First Name": emp.firstName || "",
        "Last Name": emp.lastName || "",
        "Email": emp.email || "",
        "Phone": emp.phone || "",
        "Department": emp.departmentId?.name || emp.department || "N/A",
        "Grade": emp.grade || "",
        "Manager": emp.managerId 
          ? `${emp.managerId.firstName || ''} ${emp.managerId.lastName || ''}`.trim()
          : "N/A",
        "Status": emp.status || "",
        "Hire Date": emp.hireDate ? new Date(emp.hireDate).toLocaleDateString() : "",
        "Salary": emp.salary || 0,
      }));

      // Convert to CSV
      const headers = Object.keys(csvData[0] || {});
      const csvRows = [
        headers.join(","),
        ...csvData.map((row: any) =>
          headers.map((header) => {
            const value = row[header];
            // Escape commas and quotes in CSV
            if (typeof value === "string" && (value.includes(",") || value.includes('"'))) {
              return `"${value.replace(/"/g, '""')}"`;
            }
            return value;
          }).join(",")
        ),
      ];

      const csvContent = csvRows.join("\n");
      const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
      const link = document.createElement("a");
      const url = URL.createObjectURL(blob);
      link.setAttribute("href", url);
      link.setAttribute("download", `employees_${new Date().toISOString().split("T")[0]}.csv`);
      link.style.visibility = "hidden";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      toast.success("Employees exported to CSV successfully!");
    } catch (error: any) {
      toast.error(error.message || "Failed to export CSV");
    }
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-semibold text-gray-900">Employees</h1>
          <p className="text-sm text-gray-600 mt-1.5">Manage your organization's workforce</p>
        </div>
        <div className="flex gap-3">
          <Button variant="outline" size="sm" onClick={handleExportCSV}>
            <Download className="h-4 w-4 mr-2" />
            Export CSV
          </Button>
          <Button size="sm" onClick={() => setAddEmployeeOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Add Employee
          </Button>
        </div>
      </div>

      <PageCard
        title="Employees"
        description="View and manage all employees in your organization"
        action={
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1 min-w-0 sm:min-w-[200px]">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search employees..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 w-full text-sm"
              />
            </div>
            <Select value={departmentFilter} onValueChange={setDepartmentFilter}>
              <SelectTrigger className="w-full sm:w-48">
                <Filter className="h-4 w-4 mr-2" />
                <SelectValue placeholder="All Departments" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Departments</SelectItem>
                {departments.map((dept: any) => {
                  const deptId = dept._id || dept.id;
                  if (!deptId) return null;
                  return (
                    <SelectItem key={String(deptId)} value={String(deptId)}>
                      {dept.name}
                    </SelectItem>
                  );
                })}
              </SelectContent>
            </Select>
          </div>
        }
      >
        {loading ? (
          <div className="text-center py-12 text-gray-500">Loading employees...</div>
        ) : (
          <>
            <DataTable
              headers={["", "Employee Code", "Name", "Email", "Department", "Grade", "Manager", "Status", "Actions"]}
              emptyMessage="No employees found. Try adjusting your search or filters."
            >
              {filteredEmployees.map((employee: any) => (
                <DataTableRow key={employee._id || employee.id}>
                  <DataTableCell className="w-12 px-2">
                    <div className="flex items-center justify-center">
                      <EmployeeAvatar
                        profilePicture={employee.profilePicture}
                        firstName={employee.firstName}
                        lastName={employee.lastName}
                        size="md"
                      />
                    </div>
                  </DataTableCell>
                  <DataTableCell>
                    <span className="font-medium text-gray-900">{employee.employeeCode}</span>
                  </DataTableCell>
                  <DataTableCell>
                    {employee.firstName} {employee.lastName}
                  </DataTableCell>
                  <DataTableCell>{employee.email}</DataTableCell>
                  <DataTableCell>{employee.departmentId?.name || employee.department || "N/A"}</DataTableCell>
                  <DataTableCell>{employee.grade}</DataTableCell>
                  <DataTableCell>
                    {employee.managerId 
                      ? `${employee.managerId.firstName || ''} ${employee.managerId.lastName || ''}`.trim() || "N/A"
                      : "N/A"}
                  </DataTableCell>
                  <DataTableCell>
                    <Badge className={getStatusColor(employee.status)}>
                      {employee.status?.replace("_", " ") || employee.status}
                    </Badge>
                  </DataTableCell>
                  <DataTableCell align="right">
                    <Link href={`/employees/${employee._id || employee.id}/profile`}>
                      <Button variant="ghost" size="sm">
                        View
                      </Button>
                    </Link>
                  </DataTableCell>
                </DataTableRow>
              ))}
            </DataTable>
            <div className="mt-4 flex items-center justify-between pt-4 border-t border-gray-100">
              <p className="text-xs text-gray-500">
                Showing {filteredEmployees.length} of {employees.length} employees
              </p>
            </div>
          </>
        )}
      </PageCard>

      <AddEmployeeDialog
        open={addEmployeeOpen}
        onOpenChange={setAddEmployeeOpen}
        onSuccess={() => refetch()}
      />
    </div>
  );
}
