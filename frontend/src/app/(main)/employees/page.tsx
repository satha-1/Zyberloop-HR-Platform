"use client";
import { useState, useMemo } from "react";
import { EnterpriseTable, EnterpriseTableColumn, TableLink } from "../../components/ui/EnterpriseTable";
import { EmployeeAvatar } from "../../components/ui/EmployeeAvatar";
import { Input } from "../../components/ui/input";
import { Button } from "../../components/ui/button";
import { Badge } from "../../components/ui/badge";
import { cn } from "../../components/ui/utils";
import { useEmployees, useDepartments } from "../../lib/hooks";
import { AddEmployeeDialog } from "../../components/AddEmployeeDialog";
import { Search, Plus, Download, Filter, Columns } from "lucide-react";
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
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "../../components/ui/popover";
import { Checkbox } from "../../components/ui/checkbox";
import { Label } from "../../components/ui/label";

export default function Employees() {
  const [searchTerm, setSearchTerm] = useState("");
  const [departmentFilter, setDepartmentFilter] = useState("all");
  const [newlyAddedFilter, setNewlyAddedFilter] = useState(false);
  const [addEmployeeOpen, setAddEmployeeOpen] = useState(false);
  const [columnVisibility, setColumnVisibility] = useState<Record<string, boolean>>({
    avatar: true,
    employeeNumber: true,
    employeeCode: true,
    name: true,
    initials: false,
    preferredName: false,
    email: true,
    phone: false,
    dob: false,
    department: true,
    jobTitle: true,
    employmentType: false,
    workLocation: false,
    manager: true,
    status: true,
    hireDate: true,
    addedDate: true,
    salary: false,
    emergencyContact: false,
    currentAddress: false,
    permanentAddress: false,
    actions: true,
  });
  const { data: departments = [] } = useDepartments();
  const { data: employees = [], loading, refetch } = useEmployees({
    search: searchTerm || undefined,
    department: departmentFilter !== "all" ? departmentFilter : undefined,
  });

  const filteredEmployees = employees.filter((emp: any) => {
    // Search filter
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      const matchesSearch =
        emp.employeeNumber?.toLowerCase().includes(searchLower) ||
        emp.firstName?.toLowerCase().includes(searchLower) ||
        emp.lastName?.toLowerCase().includes(searchLower) ||
        emp.fullName?.toLowerCase().includes(searchLower) ||
        emp.employeeCode?.toLowerCase().includes(searchLower) ||
        emp.jobTitle?.toLowerCase().includes(searchLower) ||
        emp.email?.toLowerCase().includes(searchLower);
      if (!matchesSearch) return false;
    }

    // Newly added filter (last 7 days)
    if (newlyAddedFilter) {
      const createdAt = emp.createdAt ? new Date(emp.createdAt) : null;
      if (!createdAt) return false;
      const daysSinceCreation = (Date.now() - createdAt.getTime()) / (1000 * 60 * 60 * 24);
      if (daysSinceCreation > 7) return false;
    }

    return true;
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
        "Employee Number": emp.employeeNumber || "",
        "Employee Code": emp.employeeCode || "",
        "Full Name": emp.fullName || `${emp.firstName || ""} ${emp.lastName || ""}`.trim(),
        "Email": emp.email || "",
        "Phone": emp.phone || "",
        "Department": emp.departmentId?.name || emp.department || "N/A",
        "Job Title": emp.jobTitle || "",
        "Manager": emp.managerId 
          ? `${emp.managerId.firstName || ''} ${emp.managerId.lastName || ''}`.trim()
          : "N/A",
        "Status": emp.status || "",
        "Hire Date": emp.hireDate ? new Date(emp.hireDate).toLocaleDateString() : "",
        "Added Date": emp.createdAt ? new Date(emp.createdAt).toLocaleDateString() : "",
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
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4 flex-shrink-0">
        <div>
          <h1 className="text-xl sm:text-2xl lg:text-3xl font-semibold text-gray-900">Employees</h1>
          <p className="text-xs sm:text-sm text-gray-600 mt-0.5 sm:mt-1.5">Manage your organization's workforce</p>
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

      <EnterpriseTable
        title="Employees"
        itemCountLabel={loading ? "Loading..." : `${filteredEmployees.length} of ${employees.length} employees`}
        headerActions={
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
            <Select value={newlyAddedFilter ? "new" : "all"} onValueChange={(value) => setNewlyAddedFilter(value === "new")}>
              <SelectTrigger className="w-full sm:w-48">
                <Filter className="h-4 w-4 mr-2" />
                <SelectValue placeholder="All Employees" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Employees</SelectItem>
                <SelectItem value="new">Newly Added (Last 7 Days)</SelectItem>
              </SelectContent>
            </Select>
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" size="sm" className="w-full sm:w-auto">
                  <Columns className="h-4 w-4 mr-2" />
                  Columns
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-56 p-3" align="end">
                <div className="space-y-3">
                  <Label className="text-sm font-semibold">Show/Hide Columns</Label>
                  <div className="space-y-2 max-h-[400px] overflow-y-auto">
                    {[
                      { key: "avatar", label: "Avatar" },
                      { key: "employeeNumber", label: "Employee Number" },
                      { key: "employeeCode", label: "Employee Code" },
                      { key: "name", label: "Full Name" },
                      { key: "initials", label: "Initials" },
                      { key: "preferredName", label: "Preferred Name" },
                      { key: "email", label: "Email" },
                      { key: "phone", label: "Phone" },
                      { key: "dob", label: "Date of Birth" },
                      { key: "department", label: "Department" },
                      { key: "jobTitle", label: "Job Title" },
                      { key: "employmentType", label: "Employment Type" },
                      { key: "workLocation", label: "Work Location" },
                      { key: "manager", label: "Manager" },
                      { key: "status", label: "Status" },
                      { key: "hireDate", label: "Hire Date" },
                      { key: "addedDate", label: "Added Date" },
                      { key: "salary", label: "Salary" },
                      { key: "emergencyContact", label: "Emergency Contact" },
                      { key: "currentAddress", label: "Current Address" },
                      { key: "permanentAddress", label: "Permanent Address" },
                      { key: "actions", label: "Actions" },
                    ].map((col) => (
                      <div key={col.key} className="flex items-center space-x-2">
                        <Checkbox
                          id={col.key}
                          checked={columnVisibility[col.key] ?? true}
                          onCheckedChange={(checked) => {
                            setColumnVisibility((prev) => ({
                              ...prev,
                              [col.key]: checked === true,
                            }));
                          }}
                        />
                        <Label
                          htmlFor={col.key}
                          className="text-sm font-normal cursor-pointer flex-1"
                        >
                          {col.label}
                        </Label>
                      </div>
                    ))}
                  </div>
                </div>
              </PopoverContent>
            </Popover>
          </div>
        }
        columns={useMemo(() => {
          const allColumns: EnterpriseTableColumn[] = [
          {
            key: "avatar",
            header: "Photo",
            minWidth: 80,
            maxWidth: 120,
            align: "center",
            sortable: false,
            resizable: true,
            render: (employee: any) => (
              <div className="flex items-center justify-center">
                <EmployeeAvatar
                  profilePicture={employee.profilePicture}
                  firstName={employee.firstName}
                  lastName={employee.lastName}
                  size="md"
                />
              </div>
            ),
          },
          {
            key: "employeeNumber",
            header: "Employee Number",
            sortable: true,
            sortValue: (employee: any) => employee.employeeNumber || "",
            render: (employee: any) => employee.employeeNumber || "N/A",
          },
          {
            key: "employeeCode",
            header: "Employee Code",
            sortable: true,
            sortValue: (employee: any) => employee.employeeCode || "",
            render: (employee: any) => (
              <span className="font-medium text-gray-900">
                {employee.employeeCode}
              </span>
            ),
          },
          {
            key: "name",
            header: "Name",
            sortable: true,
            sortValue: (employee: any) =>
              employee.fullName || `${employee.firstName || ""} ${employee.lastName || ""}`.trim() || "",
            render: (employee: any) => (
              <span>
                {employee.fullName || `${employee.firstName || ""} ${employee.lastName || ""}`.trim()}
              </span>
            ),
          },
          {
            key: "initials",
            header: "Initials",
            sortable: true,
            sortValue: (employee: any) => employee.initials || "",
            render: (employee: any) => employee.initials || "N/A",
          },
          {
            key: "preferredName",
            header: "Preferred Name",
            sortable: true,
            sortValue: (employee: any) => employee.preferredName || "",
            render: (employee: any) => employee.preferredName || "N/A",
          },
          {
            key: "email",
            header: "Email",
            sortable: true,
            sortValue: (employee: any) => employee.email || "",
            render: (employee: any) => (
              <TableLink href={`mailto:${employee.email}`}>
                {employee.email}
              </TableLink>
            ),
          },
          {
            key: "phone",
            header: "Phone",
            sortable: true,
            sortValue: (employee: any) => employee.phone || "",
            render: (employee: any) => (
              <TableLink href={`tel:${employee.phone}`}>
                {employee.phone || "N/A"}
              </TableLink>
            ),
          },
          {
            key: "dob",
            header: "Date of Birth",
            sortable: true,
            sortValue: (employee: any) => employee.dob ? new Date(employee.dob) : null,
            render: (employee: any) =>
              employee.dob ? new Date(employee.dob).toLocaleDateString() : "N/A",
          },
          {
            key: "department",
            header: "Department",
            sortable: true,
            sortValue: (employee: any) =>
              employee.departmentId?.name || employee.department || "ZZZ",
            render: (employee: any) =>
              employee.departmentId?.name || employee.department || "N/A",
          },
          {
            key: "jobTitle",
            header: "Job Title",
            sortable: true,
            sortValue: (employee: any) => employee.jobTitle || "ZZZ",
            render: (employee: any) => employee.jobTitle || "N/A",
          },
          {
            key: "employmentType",
            header: "Employment Type",
            sortable: true,
            sortValue: (employee: any) => employee.employmentType || "ZZZ",
            render: (employee: any) => (
              <Badge className="bg-blue-100 text-blue-800">
                {employee.employmentType ? employee.employmentType.charAt(0).toUpperCase() + employee.employmentType.slice(1) : "N/A"}
              </Badge>
            ),
          },
          {
            key: "workLocation",
            header: "Work Location",
            sortable: true,
            sortValue: (employee: any) => employee.workLocation || "ZZZ",
            render: (employee: any) => employee.workLocation || "N/A",
          },
          {
            key: "manager",
            header: "Manager",
            sortable: true,
            sortValue: (employee: any) =>
              employee.managerId
                ? `${employee.managerId.firstName || ""} ${employee.managerId.lastName || ""}`.trim() || "ZZZ"
                : "ZZZ",
            render: (employee: any) =>
              employee.managerId
                ? `${employee.managerId.firstName || ""} ${employee.managerId.lastName || ""}`.trim() || "N/A"
                : "N/A",
          },
          {
            key: "status",
            header: "Status",
            minWidth: 100,
            maxWidth: 120,
            sortable: true,
            sortValue: (employee: any) => employee.status || "ZZZ",
            render: (employee: any) => (
              <Badge className={cn(getStatusColor(employee.status), "whitespace-nowrap")}>
                {employee.status?.replace("_", " ") || employee.status}
              </Badge>
            ),
          },
          {
            key: "hireDate",
            header: "Hire Date",
            sortable: true,
            sortValue: (employee: any) => employee.hireDate ? new Date(employee.hireDate) : null,
            render: (employee: any) =>
              employee.hireDate ? new Date(employee.hireDate).toLocaleDateString() : "N/A",
          },
          {
            key: "addedDate",
            header: "Added Date",
            sortable: true,
            sortValue: (employee: any) => employee.createdAt ? new Date(employee.createdAt) : null,
            render: (employee: any) =>
              employee.createdAt ? new Date(employee.createdAt).toLocaleDateString() : "N/A",
          },
          {
            key: "salary",
            header: "Salary",
            sortable: true,
            align: "right",
            sortValue: (employee: any) => employee.salary || 0,
            render: (employee: any) =>
              employee.salary ? `LKR ${employee.salary.toLocaleString()}` : "N/A",
          },
          {
            key: "emergencyContact",
            header: "Emergency Contact",
            sortable: false,
            render: (employee: any) => {
              const ec = employee.emergencyContact;
              if (!ec || !ec.name) return "N/A";
              return (
                <div className="text-xs">
                  <div className="font-medium">{ec.name}</div>
                  {ec.relationship && (
                    <div className="text-gray-500">{ec.relationship}</div>
                  )}
                  {ec.phone && (
                    <div className="text-gray-500">{ec.phone}</div>
                  )}
                </div>
              );
            },
          },
          {
            key: "currentAddress",
            header: "Current Address",
            sortable: false,
            widthClassName: "min-w-[200px]",
            render: (employee: any) => employee.currentAddress || "N/A",
          },
          {
            key: "permanentAddress",
            header: "Permanent Address",
            sortable: false,
            widthClassName: "min-w-[200px]",
            render: (employee: any) => employee.permanentAddress || "N/A",
          },
          {
            key: "actions",
            header: "Actions",
            align: "right",
            minWidth: 80,
            maxWidth: 100,
            sortable: false,
            resizable: false,
            render: (employee: any) => (
              <TableLink
                href={`/employees/${employee._id || employee.id}`}
              >
                Manage
              </TableLink>
            ),
          },
          ];
          
          // Filter columns based on visibility settings
          return allColumns.filter((col) => columnVisibility[col.key] !== false);
        }, [columnVisibility])}
        data={loading ? [] : filteredEmployees}
        getRowKey={(employee: any) => employee._id || employee.id}
        emptyStateText={loading ? "Loading employees..." : "No employees found. Try adjusting your search or filters."}
        onRowClick={(employee: any) => {
          window.location.href = `/employees/${employee._id || employee.id}`;
        }}
        pagination={{
          enabled: true,
          pageSize: 10,
          showPageSizeSelector: true,
        }}
        className="flex flex-col flex-1 min-h-0"
        tableClassName="table-auto"
      />

      <AddEmployeeDialog
        open={addEmployeeOpen}
        onOpenChange={setAddEmployeeOpen}
        onSuccess={() => refetch()}
      />
    </div>
  );
}
