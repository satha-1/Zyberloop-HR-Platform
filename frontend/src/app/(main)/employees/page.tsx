"use client";
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/card";
import { Input } from "../../components/ui/input";
import { Button } from "../../components/ui/button";
import { Badge } from "../../components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../../components/ui/table";
import { useEmployees } from "../../lib/hooks";
import { Search, Plus, Download, Filter } from "lucide-react";
import Link from "next/link";
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
  const { data: employees = [], loading } = useEmployees({
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

  const departments = Array.from(new Set(employees.map((e: any) => e.departmentId?.name || e.department).filter(Boolean)));

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

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Employees</h2>
          <p className="text-gray-600 mt-1">Manage your organization's workforce</p>
        </div>
        <div className="flex gap-3">
          <Button variant="outline">
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            Add Employee
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-col md:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search employees by name, code, or email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={departmentFilter} onValueChange={setDepartmentFilter}>
              <SelectTrigger className="w-full md:w-48">
                <Filter className="h-4 w-4 mr-2" />
                <SelectValue placeholder="Filter by department" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Departments</SelectItem>
                {departments.map((dept) => (
                  <SelectItem key={dept} value={dept}>
                    {dept}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent>
          <div className="rounded-lg border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Employee Code</TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Department</TableHead>
                  <TableHead>Grade</TableHead>
                  <TableHead>Manager</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                        {loading ? (
                          <TableRow>
                            <TableCell colSpan={8} className="text-center py-8 text-gray-500">
                              Loading...
                            </TableCell>
                          </TableRow>
                        ) : filteredEmployees.length === 0 ? (
                          <TableRow>
                            <TableCell colSpan={8} className="text-center py-8 text-gray-500">
                              No employees found
                            </TableCell>
                          </TableRow>
                        ) : (
                          filteredEmployees.map((employee: any) => (
                            <TableRow key={employee._id || employee.id}>
                              <TableCell className="font-medium">{employee.employeeCode}</TableCell>
                              <TableCell>
                                {employee.firstName} {employee.lastName}
                              </TableCell>
                              <TableCell>{employee.email}</TableCell>
                              <TableCell>{employee.departmentId?.name || employee.department || "N/A"}</TableCell>
                              <TableCell>{employee.grade}</TableCell>
                              <TableCell>{employee.managerId?.firstName || employee.manager || "N/A"}</TableCell>
                              <TableCell>
                                <Badge className={getStatusColor(employee.status)}>
                                  {employee.status?.replace("_", " ") || employee.status}
                                </Badge>
                              </TableCell>
                              <TableCell>
                                <Link href={`/employees/${employee._id || employee.id}`}>
                                  <Button variant="ghost" size="sm">
                                    View
                                  </Button>
                                </Link>
                              </TableCell>
                            </TableRow>
                          ))
                        )}
              </TableBody>
            </Table>
          </div>
                  <div className="mt-4 flex items-center justify-between">
                    <p className="text-sm text-gray-600">
                      Showing {filteredEmployees.length} of {employees.length} employees
                    </p>
                  </div>
        </CardContent>
      </Card>
    </div>
  );
}
