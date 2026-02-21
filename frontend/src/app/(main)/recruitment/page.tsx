"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/card";
import { Button } from "../../components/ui/button";
import { Badge } from "../../components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../../components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../../components/ui/table";
import { useRequisitions, useDepartments } from "../../lib/hooks";
import { api } from "../../lib/api";
import { CreateRequisitionDialog } from "../../components/CreateRequisitionDialog";
import { Plus, ExternalLink, Users, Briefcase, ChevronRight, ChevronLeft, Filter } from "lucide-react";
import { toast } from "sonner";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../../components/ui/select";
import { Input } from "../../components/ui/input";

export default function Recruitment() {
  const [departmentFilter, setDepartmentFilter] = useState("all");
  const { data: departments = [] } = useDepartments();
  const { data: requisitions = [], loading: requisitionsLoading, refetch } = useRequisitions({ 
    status: "open",
    department: departmentFilter !== "all" ? departmentFilter : undefined,
  });
  const [candidates, setCandidates] = useState<any[]>([]);
  const [selectedReq, setSelectedReq] = useState<string>("");
  const [createRequisitionOpen, setCreateRequisitionOpen] = useState(false);

  useEffect(() => {
    if (requisitions.length > 0 && !selectedReq) {
      setSelectedReq(requisitions[0]._id || requisitions[0].id);
    }
  }, [requisitions, selectedReq]);

  useEffect(() => {
    if (selectedReq) {
      api.getCandidates({ requisitionId: selectedReq }).then(setCandidates).catch(() => setCandidates([]));
    } else {
      // Load all candidates if no requisition selected
      api.getCandidates().then(setCandidates).catch(() => setCandidates([]));
    }
  }, [selectedReq]);

  const getCandidatesForReq = (reqId: string) =>
    candidates.filter((c: any) => (c.requisition_id || c.requisitionId) === reqId);

  const handleCopyPortalLink = (reqId: string) => {
    const link = `${window.location.origin}/portal/jobs/${reqId}`;
    navigator.clipboard.writeText(link);
    toast.success("Public job link copied to clipboard!");
  };

  const getStatusColor = (status: string) => {
    const statusLower = status?.toLowerCase();
    if (statusLower === "open" || statusLower === "published") return "bg-green-100 text-green-800";
    if (statusLower === "closed") return "bg-gray-100 text-gray-800";
    return "bg-orange-100 text-orange-800";
  };

  const getCandidateStatusColor = (status: string) => {
    const statusMap: Record<string, string> = {
      APPLIED: "bg-blue-100 text-blue-800",
      SCREENING: "bg-yellow-100 text-yellow-800",
      INTERVIEW: "bg-purple-100 text-purple-800",
      OFFERED: "bg-green-100 text-green-800",
      HIRED: "bg-emerald-100 text-emerald-800",
      REJECTED: "bg-red-100 text-red-800",
    };
    return statusMap[status] || "bg-gray-100 text-gray-800";
  };

  const handleStatusUpdate = async (applicationId: string, newStatus: string) => {
    try {
      await api.updateCandidateApplicationStatus(applicationId, newStatus);
      toast.success("Candidate status updated successfully!");
      // Refresh candidates
      if (selectedReq) {
        api.getCandidates({ requisitionId: selectedReq }).then(setCandidates).catch(() => setCandidates([]));
      } else {
        api.getCandidates().then(setCandidates).catch(() => setCandidates([]));
      }
    } catch (error: any) {
      toast.error(error.message || "Failed to update status");
    }
  };

  // Calculate pipeline counts from real data
  const pipelineCounts = {
    APPLIED: candidates.filter((c: any) => c.status === "APPLIED").length,
    SCREENING: candidates.filter((c: any) => c.status === "SCREENING").length,
    INTERVIEW: candidates.filter((c: any) => c.status === "INTERVIEW").length,
    OFFERED: candidates.filter((c: any) => c.status === "OFFERED").length,
    HIRED: candidates.filter((c: any) => c.status === "HIRED").length,
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Recruitment</h2>
          <p className="text-gray-600 mt-1">Manage requisitions and candidates</p>
        </div>
        <Button onClick={() => setCreateRequisitionOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Create Requisition
        </Button>
      </div>

      <Tabs defaultValue="requisitions" className="space-y-4">
        <TabsList>
          <TabsTrigger value="requisitions">Requisitions</TabsTrigger>
          <TabsTrigger value="candidates">Candidates</TabsTrigger>
          <TabsTrigger value="pipeline">Pipeline</TabsTrigger>
        </TabsList>

        <TabsContent value="requisitions" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex flex-col md:flex-row gap-4">
                <CardTitle className="flex-1">Open Requisitions</CardTitle>
                <Select value={departmentFilter} onValueChange={setDepartmentFilter}>
                  <SelectTrigger className="w-full md:w-48">
                    <Filter className="h-4 w-4 mr-2" />
                    <SelectValue placeholder="Filter by department" />
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
            </CardHeader>
            <CardContent>
              <div className="rounded-lg border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Position</TableHead>
                      <TableHead>Department</TableHead>
                      <TableHead>Location</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Candidates</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {requisitionsLoading ? (
                      <TableRow>
                        <TableCell colSpan={7} className="text-center py-8 text-gray-500">
                          Loading...
                        </TableCell>
                      </TableRow>
                    ) : requisitions.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={7} className="text-center py-8 text-gray-500">
                          No requisitions found
                        </TableCell>
                      </TableRow>
                    ) : (
                      requisitions.map((req: any) => (
                        <TableRow key={req._id || req.id}>
                          <TableCell className="font-medium">{req.title}</TableCell>
                          <TableCell>{req.departmentId?.name || req.department || "N/A"}</TableCell>
                          <TableCell>{req.location}</TableCell>
                          <TableCell>
                            <Badge variant="outline">
                              {req.type?.replace("_", " ") || req.type}
                            </Badge>
                          </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Users className="h-4 w-4 text-gray-400" />
                            {getCandidatesForReq(req._id || req.id).length}
                          </div>
                        </TableCell>
                          <TableCell>
                            <Badge className={getStatusColor(req.status)}>
                              {req.status}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <div className="flex gap-2">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleCopyPortalLink(req._id || req.id)}
                              >
                                <ExternalLink className="h-4 w-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="candidates" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>All Candidates</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="rounded-lg border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Position</TableHead>
                      <TableHead>Skill Match</TableHead>
                      <TableHead>Experience Match</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Applied</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {candidates.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={8} className="text-center py-8 text-gray-500">
                          No candidates found
                        </TableCell>
                      </TableRow>
                    ) : (
                      candidates.map((candidate: any) => {
                        const req = requisitions.find(
                          (r: any) => (r._id || r.id) === (candidate.requisition_id || candidate.requisitionId)
                        );
                        const applicationId = candidate.id || candidate._id;
                        return (
                          <TableRow key={candidate._id || candidate.id}>
                            <TableCell className="font-medium">{candidate.name}</TableCell>
                            <TableCell>{candidate.email}</TableCell>
                            <TableCell>{req?.title || "N/A"}</TableCell>
                            <TableCell>
                              <div className="flex items-center gap-2">
                                <div className="w-16 bg-gray-200 rounded-full h-2">
                                  <div
                                    className="bg-blue-500 h-2 rounded-full"
                                    style={{ width: `${candidate.skill_match || candidate.skillMatch || 0}%` }}
                                  />
                                </div>
                                <span className="text-sm">{candidate.skill_match || candidate.skillMatch || 0}%</span>
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center gap-2">
                                <div className="w-16 bg-gray-200 rounded-full h-2">
                                  <div
                                    className="bg-green-500 h-2 rounded-full"
                                    style={{ width: `${candidate.experience_match || candidate.experienceMatch || 0}%` }}
                                  />
                                </div>
                                <span className="text-sm">{candidate.experience_match || candidate.experienceMatch || 0}%</span>
                              </div>
                            </TableCell>
                            <TableCell>
                              <Badge className={getCandidateStatusColor(candidate.status)}>
                                {candidate.status}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              {new Date(candidate.applied_date || candidate.appliedDate || candidate.createdAt).toLocaleDateString()}
                            </TableCell>
                            <TableCell>
                              <Select
                                value={candidate.status}
                                onValueChange={(newStatus) => handleStatusUpdate(applicationId, newStatus)}
                              >
                                <SelectTrigger className="w-32 h-8">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="APPLIED">Applied</SelectItem>
                                  <SelectItem value="SCREENING">Screening</SelectItem>
                                  <SelectItem value="INTERVIEW">Interview</SelectItem>
                                  <SelectItem value="OFFERED">Offered</SelectItem>
                                  <SelectItem value="HIRED">Hired</SelectItem>
                                  <SelectItem value="REJECTED">Rejected</SelectItem>
                                </SelectContent>
                              </Select>
                            </TableCell>
                          </TableRow>
                        );
                      })
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="pipeline" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Recruitment Pipeline</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                {[
                  { label: "Applied", status: "APPLIED", count: pipelineCounts.APPLIED },
                  { label: "Screening", status: "SCREENING", count: pipelineCounts.SCREENING },
                  { label: "Interview", status: "INTERVIEW", count: pipelineCounts.INTERVIEW },
                  { label: "Offered", status: "OFFERED", count: pipelineCounts.OFFERED },
                  { label: "Hired", status: "HIRED", count: pipelineCounts.HIRED },
                ].map((stage) => (
                  <Card key={stage.status} className="border-2">
                    <CardContent className="p-6">
                      <div className="text-center">
                        <p className="text-sm text-gray-600">{stage.label}</p>
                        <p className="text-3xl font-bold text-gray-900 mt-2">{stage.count}</p>
                        <p className="text-xs text-gray-500 mt-1">candidates</p>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <CreateRequisitionDialog
        open={createRequisitionOpen}
        onOpenChange={setCreateRequisitionOpen}
        onSuccess={() => refetch()}
      />
    </div>
  );
}
