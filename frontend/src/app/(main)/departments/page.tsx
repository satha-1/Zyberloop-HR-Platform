"use client";

import { useState } from "react";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { EnterpriseTable, TableLink } from "../../components/ui/EnterpriseTable";
import { useDepartments } from "../../lib/hooks";
import { api } from "../../lib/api";
import { toast } from "sonner";
import { Plus, Pencil, Trash2, Search, Building2, CheckCircle2, XCircle } from "lucide-react";
import { DepartmentDialog } from "../../components/DepartmentDialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "../../components/ui/alert-dialog";

export default function Departments() {
  const { data: departments = [], loading, refetch } = useDepartments();
  const [searchTerm, setSearchTerm] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingDepartment, setEditingDepartment] = useState<any>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const filteredDepartments = departments.filter((dept: any) => {
    if (!searchTerm) return true;
    const search = searchTerm.toLowerCase();
    return (
      dept.name?.toLowerCase().includes(search) ||
      dept.code?.toLowerCase().includes(search) ||
      dept.description?.toLowerCase().includes(search) ||
      dept.location?.toLowerCase().includes(search) ||
      dept.costCenter?.toLowerCase().includes(search) ||
      dept.email?.toLowerCase().includes(search) ||
      dept.status?.toLowerCase().includes(search)
    );
  });

  const handleCreate = () => {
    setEditingDepartment(null);
    setDialogOpen(true);
  };

  const handleEdit = (department: any) => {
    setEditingDepartment(department);
    setDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    try {
      await api.deleteDepartment(id);
      toast.success("Department deleted successfully!");
      refetch();
      setDeleteDialogOpen(false);
      setDeletingId(null);
    } catch (error: any) {
      toast.error(error.message || "Failed to delete department");
    }
  };

  const handleDeleteClick = (id: string) => {
    setDeletingId(id);
    setDeleteDialogOpen(true);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-gray-500">Loading departments...</p>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 space-y-4 sm:space-y-6 w-full max-w-full overflow-x-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Departments</h1>
          <p className="text-gray-600 mt-1">Manage organizational departments</p>
        </div>
        <Button onClick={handleCreate}>
          <Plus className="h-4 w-4 mr-2" />
          Add Department
        </Button>
      </div>

      <EnterpriseTable
        title="Departments"
        subtitle="Manage organizational departments"
        itemCountLabel={`${filteredDepartments.length} department${filteredDepartments.length !== 1 ? 's' : ''}`}
        headerActions={
          <div className="relative flex-1 min-w-0 sm:min-w-[200px]">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Search departments..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 w-full text-sm"
            />
          </div>
        }
        columns={[
          {
            key: "code",
            header: "Code",
            widthClassName: "w-28",
            render: (dept: any) => (
              <span className="font-mono font-medium text-gray-900">
                {dept.code}
              </span>
            ),
          },
          {
            key: "name",
            header: "Name",
            widthClassName: "min-w-[180px]",
            render: (dept: any) => (
              <span className="font-medium text-gray-900">{dept.name}</span>
            ),
          },
          {
            key: "description",
            header: "Description",
            widthClassName: "min-w-[200px]",
            render: (dept: any) => (
              <span className="text-sm text-gray-600 line-clamp-2">
                {dept.description || "-"}
              </span>
            ),
          },
          {
            key: "status",
            header: "Status",
            minWidth: 120,
            maxWidth: 150,
            render: (dept: any) => {
              const isActive = dept.status === "ACTIVE";
              return (
                <span
                  className={`inline-flex items-center gap-1.5 px-2 py-1 rounded-full text-xs font-medium whitespace-nowrap ${
                    isActive
                      ? "bg-green-100 text-green-800"
                      : "bg-gray-100 text-gray-800"
                  }`}
                >
                  {isActive ? (
                    <CheckCircle2 className="h-3 w-3" />
                  ) : (
                    <XCircle className="h-3 w-3" />
                  )}
                  {dept.status || "ACTIVE"}
                </span>
              );
            },
          },
          {
            key: "parent",
            header: "Parent Department",
            widthClassName: "min-w-[150px]",
            render: (dept: any) =>
              dept.parentDepartmentId?.name || dept.parentDepartment?.name || "-",
          },
          {
            key: "head",
            header: "Head",
            widthClassName: "min-w-[150px]",
            render: (dept: any) =>
              dept.headId
                ? `${dept.headId.firstName || ""} ${dept.headId.lastName || ""}`.trim() || dept.headId.employeeCode || "-"
                : "-",
          },
          {
            key: "location",
            header: "Location",
            widthClassName: "min-w-[120px]",
            render: (dept: any) => (
              <span className="text-sm text-gray-600">{dept.location || "-"}</span>
            ),
          },
          {
            key: "costCenter",
            header: "Cost Center",
            widthClassName: "w-32",
            render: (dept: any) => (
              <span className="text-sm font-mono text-gray-600">
                {dept.costCenter || "-"}
              </span>
            ),
          },
          {
            key: "email",
            header: "Email",
            widthClassName: "min-w-[180px]",
            render: (dept: any) => (
              <span className="text-sm text-gray-600">{dept.email || "-"}</span>
            ),
          },
          {
            key: "phoneExt",
            header: "Phone Ext",
            widthClassName: "w-24",
            render: (dept: any) => (
              <span className="text-sm text-gray-600">{dept.phoneExt || "-"}</span>
            ),
          },
          {
            key: "effectiveFrom",
            header: "Effective From",
            widthClassName: "w-32",
            render: (dept: any) => {
              if (!dept.effectiveFrom) return "-";
              const date = new Date(dept.effectiveFrom);
              return (
                <span className="text-sm text-gray-600">
                  {date.toLocaleDateString()}
                </span>
              );
            },
          },
          {
            key: "actions",
            header: "Actions",
            align: "right",
            widthClassName: "w-24",
            render: (dept: any) => (
              <div className="flex items-center gap-2 justify-end">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleEdit(dept);
                  }}
                  className="h-8 w-8 p-0"
                >
                  <Pencil className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDeleteClick(dept._id || dept.id);
                  }}
                  className="h-8 w-8 p-0 text-red-600 hover:text-red-700 hover:bg-red-50"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            ),
          },
        ]}
        data={filteredDepartments}
        getRowKey={(dept: any) => dept._id || dept.id}
        emptyStateText={
          searchTerm
            ? "No departments found matching your search"
            : "No departments found. Create one to get started."
        }
      />

      <DepartmentDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        department={editingDepartment}
        onSuccess={() => {
          refetch();
          setDialogOpen(false);
          setEditingDepartment(null);
        }}
      />

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the department.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setDeletingId(null)}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deletingId && handleDelete(deletingId)}
              className="bg-red-500 hover:bg-red-600"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
