"use client";

import { useState } from "react";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { EnterpriseTable, TableLink } from "../../components/ui/EnterpriseTable";
import { useDepartments } from "../../lib/hooks";
import { api } from "../../lib/api";
import { toast } from "sonner";
import { Plus, Pencil, Trash2, Search, Building2 } from "lucide-react";
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

  const filteredDepartments = departments.filter((dept: any) =>
    dept.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    dept.code?.toLowerCase().includes(searchTerm.toLowerCase())
  );

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
    <div className="p-4 sm:p-6 space-y-4 sm:space-y-6 w-full max-w-full overflow-x-hidden">
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
            widthClassName: "w-24",
            render: (dept: any) => (
              <span className="font-mono font-medium text-gray-900">
                {dept.code}
              </span>
            ),
          },
          {
            key: "name",
            header: "Name",
            render: (dept: any) => (
              <span className="font-medium text-gray-900">{dept.name}</span>
            ),
          },
          {
            key: "parent",
            header: "Parent Department",
            render: (dept: any) =>
              dept.parentDepartmentId?.name || dept.parentDepartment?.name || "-",
          },
          {
            key: "head",
            header: "Head",
            render: (dept: any) =>
              dept.headId
                ? `${dept.headId.firstName || ""} ${dept.headId.lastName || ""}`.trim() || dept.headId.employeeCode || "-"
                : "-",
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
