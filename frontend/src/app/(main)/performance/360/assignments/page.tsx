"use client";
import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "../../../../components/ui/card";
import { Button } from "../../../../components/ui/button";
import { Input } from "../../../../components/ui/input";
import { Badge } from "../../../../components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../../../../components/ui/table";
import {
  Plus, Search, Eye, Send, BarChart3, Loader2, ArrowLeft,
} from "lucide-react";
import { toast } from "sonner";
import { api } from "../../../../lib/api";

interface Assignment {
  _id: string;
  targetEmployeeId: { _id: string; firstName: string; lastName: string; employeeCode?: string };
  templateId: { _id: string; name: string };
  status: string;
  collectedResponsesCount: number;
  requiredResponsesCount: number;
  deadlineAt?: string;
  createdAt: string;
}

const statusColors: Record<string, string> = {
  NOT_STARTED: "bg-gray-100 text-gray-700",
  SENT: "bg-blue-100 text-blue-800",
  IN_PROGRESS: "bg-yellow-100 text-yellow-800",
  COMPLETED: "bg-green-100 text-green-800",
  LOCKED: "bg-red-100 text-red-800",
};

export default function AssignmentsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const cycleId = searchParams.get("cycleId");

  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");

  useEffect(() => {
    if (cycleId) loadAssignments();
  }, [cycleId]);

  const loadAssignments = async () => {
    if (!cycleId) return;
    setLoading(true);
    try {
      const data = await api.get360Assignments(cycleId) as any[];
      setAssignments(data || []);
    } catch (e: any) {
      toast.error("Failed to load assignments: " + (e.message || "Unknown error"));
    } finally {
      setLoading(false);
    }
  };

  const filtered = assignments.filter((a) => {
    const empName = `${a.targetEmployeeId?.firstName || ""} ${a.targetEmployeeId?.lastName || ""}`.toLowerCase();
    const matchesSearch = empName.includes(search.toLowerCase()) ||
      a.targetEmployeeId?.employeeCode?.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter === "all" || a.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  if (!cycleId) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" onClick={() => router.back()}>
            <ArrowLeft className="h-4 w-4 mr-2" /> Back
          </Button>
          <h1 className="text-2xl font-bold">360 Feedback Assignments</h1>
        </div>
        <Card>
          <CardContent className="pt-6">
            <p className="text-gray-500">Please select a performance cycle first.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" onClick={() => router.back()}>
            <ArrowLeft className="h-4 w-4 mr-2" /> Back
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">360 Feedback Assignments</h1>
            <p className="text-gray-500 mt-0.5 text-sm">Manage feedback collection for employees</p>
          </div>
        </div>
        <Button onClick={() => router.push(`/performance/360/assignments/generate?cycleId=${cycleId}`)}>
          <Plus className="h-4 w-4 mr-2" /> Generate Assignments
        </Button>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center gap-4 flex-wrap">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search by employee name or code..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10"
              />
            </div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-2 border rounded-md text-sm"
            >
              <option value="all">All Statuses</option>
              <option value="NOT_STARTED">Not Started</option>
              <option value="SENT">Sent</option>
              <option value="IN_PROGRESS">In Progress</option>
              <option value="COMPLETED">Completed</option>
              <option value="LOCKED">Locked</option>
            </select>
          </div>
        </CardContent>
      </Card>

      {/* Table */}
      <Card>
        <CardHeader>
          <CardTitle>Assignments ({filtered.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center h-64">
              <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
            </div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <p>No assignments found.</p>
              <Button
                variant="outline"
                className="mt-4"
                onClick={() => router.push(`/performance/360/assignments/generate?cycleId=${cycleId}`)}
              >
                <Plus className="h-4 w-4 mr-2" /> Generate Assignments
              </Button>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Employee</TableHead>
                  <TableHead>Template</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Responses</TableHead>
                  <TableHead>Deadline</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((a) => {
                  const progress = a.requiredResponsesCount > 0
                    ? (a.collectedResponsesCount / a.requiredResponsesCount) * 100
                    : 0;
                  return (
                    <TableRow key={a._id}>
                      <TableCell className="font-medium">
                        {a.targetEmployeeId?.firstName} {a.targetEmployeeId?.lastName}
                        {a.targetEmployeeId?.employeeCode && (
                          <span className="text-xs text-gray-500 ml-2">
                            ({a.targetEmployeeId.employeeCode})
                          </span>
                        )}
                      </TableCell>
                      <TableCell>
                        {(a.templateId as any)?.name || "N/A"}
                      </TableCell>
                      <TableCell>
                        <Badge className={statusColors[a.status] || "bg-gray-100 text-gray-700"}>
                          {a.status.replace(/_/g, " ")}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <div className="text-sm">
                            {a.collectedResponsesCount} / {a.requiredResponsesCount}
                          </div>
                          <div className="w-16 h-2 bg-gray-100 rounded-full overflow-hidden">
                            <div
                              className={`h-full ${
                                progress >= 100 ? "bg-green-500" : progress >= 50 ? "bg-yellow-500" : "bg-red-500"
                              }`}
                              style={{ width: `${Math.min(progress, 100)}%` }}
                            />
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="text-sm text-gray-500">
                        {a.deadlineAt ? new Date(a.deadlineAt).toLocaleDateString() : "No deadline"}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => router.push(`/performance/360/assignments/${a._id}`)}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
