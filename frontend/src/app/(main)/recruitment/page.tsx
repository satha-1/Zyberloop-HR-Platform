"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/app/components/ui/card";
import { Button } from "@/app/components/ui/button";
import { Badge } from "@/app/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/app/components/ui/tabs";
import { WorkdayTable, WorkdayTableColumn } from "@/app/components/ui/WorkdayTable";
import { useDepartments } from "@/app/lib/hooks";
import { api } from "@/app/lib/api";
import { CreateRequisitionDialog } from "@/app/components/CreateRequisitionDialog";
import { ViewRequisitionDialog } from "@/app/components/ViewRequisitionDialog";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/app/components/ui/dialog";
import { RequisitionsTab } from "./components/RequisitionsTab";
import { RequisitionApprovalsTab } from "./components/RequisitionApprovalsTab";
import { Plus, ExternalLink, Users, Eye, FileText, Download } from "lucide-react";
import { toast } from "sonner";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/app/components/ui/select";
import { useSearchParams, useRouter } from "next/navigation";
import { Suspense } from "react";

// Force dynamic rendering to prevent static generation errors
export const dynamic = 'force-dynamic';

function RecruitmentContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const activeTab = searchParams.get("tab") || "requisitions";

  const handleTabChange = (value: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (value === "requisitions") {
      params.delete("tab");
    } else {
      params.set("tab", value);
    }
    router.push(`/recruitment?${params.toString()}`, { scroll: false });
  };

  const handleRequisitionCreated = () => {
    // After creating a requisition, it should appear in approvals tab
    // The approvals tab will auto-refresh when opened
  };
  const [candidates, setCandidates] = useState<any[]>([]);
  const [selectedReq, setSelectedReq] = useState<string>("");
  const [createRequisitionOpen, setCreateRequisitionOpen] = useState(false);
  const [editRequisition, setEditRequisition] = useState<any>(null);
  const [viewRequisitionOpen, setViewRequisitionOpen] = useState(false);
  const [viewRequisitionId, setViewRequisitionId] = useState<string | null>(null);
  const [candidateDialogOpen, setCandidateDialogOpen] = useState(false);
  const [candidateDetail, setCandidateDetail] = useState<any>(null);
  const [candidateDetailLoading, setCandidateDetailLoading] = useState(false);


  // Load all candidates for accurate counts (always load all, not filtered)
  const loadAllCandidates = () => {
      api.getCandidates().then((data: any) => setCandidates(Array.isArray(data) ? data : (data?.data || []))).catch(() => setCandidates([]));
  };

  // Load all candidates on mount
  useEffect(() => {
    loadAllCandidates();
  }, []); // Load once on mount

  // Refresh candidates periodically and when page gains focus
  useEffect(() => {
    const interval = setInterval(() => {
      loadAllCandidates();
    }, 10000); // Refresh every 10 seconds

    const handleFocus = () => {
      loadAllCandidates();
    };
    window.addEventListener('focus', handleFocus);

    return () => {
      clearInterval(interval);
      window.removeEventListener('focus', handleFocus);
    };
  }, []);


  const handleCopyPortalLink = (reqId: string) => {
    const link = `${window.location.origin}/portal/jobs/${reqId}`;
    navigator.clipboard.writeText(link);
    toast.success("Public job link copied to clipboard!");
  };

  const handleViewRequisition = (reqId: string) => {
    setViewRequisitionId(reqId);
    setViewRequisitionOpen(true);
  };

  const handleEditRequisition = (req: any) => {
    setEditRequisition(req);
    setCreateRequisitionOpen(true);
  };

  const handleViewCandidate = async (applicationId: string) => {
    try {
      setCandidateDetailLoading(true);
      const detail = await api.getCandidateById(applicationId);
      setCandidateDetail(detail);
      setCandidateDialogOpen(true);
    } catch (error: any) {
      toast.error(error.message || "Failed to load candidate");
    } finally {
      setCandidateDetailLoading(false);
    }
  };

  const handleViewCv = async (applicationId: string) => {
    try {
      const result = await api.getCandidateCvUrl(applicationId);
      if (!result?.url) {
        toast.error("CV not available");
        return;
      }
      window.open(result.url, "_blank", "noopener,noreferrer");
    } catch (error: any) {
      toast.error(error.message || "Failed to open CV");
    }
  };

  const handleDownloadCv = async (applicationId: string, candidateName?: string) => {
    try {
      const result = await api.getCandidateCvUrl(applicationId);
      if (!result?.url) {
        toast.error("CV not available");
        return;
      }
      
      // Fetch the file from the pre-signed URL
      const response = await fetch(result.url);
      if (!response.ok) {
        throw new Error("Failed to download CV");
      }
      
      const blob = await response.blob();
      const downloadUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = downloadUrl;
      
      // Use the filename from the API response, or generate one
      const fileName = result.fileName || 
        (candidateName ? `${candidateName.replace(/\s+/g, '_')}_CV.pdf` : `candidate_cv_${applicationId}.pdf`) ||
        `candidate_cv_${Date.now()}.pdf`;
      
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(downloadUrl);
      
      toast.success("CV downloaded successfully!");
    } catch (error: any) {
      toast.error(error.message || "Failed to download CV");
    }
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
      // Refresh all candidates
      loadAllCandidates();
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
    <div className="p-4 sm:p-6 space-y-4 sm:space-y-6 w-full max-w-full overflow-x-hidden">
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

      <Tabs value={activeTab} onValueChange={handleTabChange} className="space-y-4">
        <TabsList>
          <TabsTrigger value="requisitions">Requisitions</TabsTrigger>
          <TabsTrigger value="approvals">Job Requisition Approvals</TabsTrigger>
          <TabsTrigger value="candidates">Candidates</TabsTrigger>
          <TabsTrigger value="pipeline">Pipeline</TabsTrigger>
        </TabsList>

        <TabsContent value="requisitions" className="space-y-4">
          <RequisitionsTab
            onCreateRequisition={() => setCreateRequisitionOpen(true)}
            onViewRequisition={handleViewRequisition}
            onEditRequisition={handleEditRequisition}
            onCopyPortalLink={handleCopyPortalLink}
          />
        </TabsContent>

        <TabsContent value="approvals" className="space-y-4">
          <RequisitionApprovalsTab
            onViewRequisition={handleViewRequisition}
            onCopyPortalLink={handleCopyPortalLink}
            active={activeTab === "approvals"}
          />
        </TabsContent>

        <TabsContent value="candidates" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>All Candidates</CardTitle>
                <div className="flex items-center gap-2">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={async () => {
                      try {
                        await api.exportCandidates({ format: 'csv' });
                        toast.success("Candidate export downloaded successfully!");
                      } catch (error: any) {
                        toast.error(error.message || "Failed to export candidates");
                      }
                    }}
                  >
                    <Download className="h-4 w-4 mr-2" />
                    Export CSV
                  </Button>
                  <Button variant="outline" size="sm" onClick={loadAllCandidates}>
                    Refresh
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <WorkdayTable
                title="All Candidates"
                columns={[
                  { key: "name", header: "Name", align: "left", render: (row) => <span className="font-medium">{row.name || 'N/A'}</span> },
                  { key: "email", header: "Email", align: "left" },
                  { key: "position", header: "Applied Position", align: "left", render: (row) => row.position || "N/A" },
                  { key: "skillMatch", header: "Skill Match", align: "center", render: (row) => {
                    const match = row.skill_match || row.skillMatch || 0;
                    return (
                      <div className="flex items-center gap-2 justify-center">
                        <div className="w-16 bg-gray-200 rounded-full h-2">
                          <div className="bg-blue-500 h-2 rounded-full" style={{ width: `${match}%` }} />
                        </div>
                        <span className="text-sm">{match}%</span>
                      </div>
                    );
                  }},
                  { key: "experienceMatch", header: "Experience Match", align: "center", render: (row) => {
                    const match = row.experience_match || row.experienceMatch || 0;
                    return (
                      <div className="flex items-center gap-2 justify-center">
                        <div className="w-16 bg-gray-200 rounded-full h-2">
                          <div className="bg-green-500 h-2 rounded-full" style={{ width: `${match}%` }} />
                        </div>
                        <span className="text-sm">{match}%</span>
                      </div>
                    );
                  }},
                  { key: "status", header: "Status", align: "left", render: (row) => <Badge className={getCandidateStatusColor(row.status)}>{row.status}</Badge> },
                  { key: "applied", header: "Applied", align: "left", render: (row) => new Date(row.applied_date || row.appliedDate || row.createdAt).toLocaleDateString() },
                  { key: "actions", header: "Actions", align: "right", render: (row) => {
                    const applicationId = row.id || row._id;
                    return (
                      <div className="flex items-center justify-end gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          className="h-8"
                          onClick={() => handleViewCandidate(applicationId)}
                          title="View candidate"
                        >
                          <Eye className="h-4 w-4 mr-1" />
                          View
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          className="h-8"
                          onClick={() => handleViewCv(applicationId)}
                          title="View CV"
                          disabled={!row.hasResume}
                        >
                          <Eye className="h-4 w-4 mr-1" />
                          CV
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          className="h-8"
                          onClick={() => handleDownloadCv(applicationId, row.name)}
                          title="Download CV"
                          disabled={!row.hasResume}
                        >
                          <Download className="h-4 w-4" />
                        </Button>
                        <Select value={row.status} onValueChange={(newStatus) => handleStatusUpdate(applicationId, newStatus)}>
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
                      </div>
                    );
                  }},
                ]}
                data={candidates}
                getRowKey={(row) => row._id || row.id}
                emptyMessage="No candidates found"
              />
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
        onOpenChange={(open) => {
          setCreateRequisitionOpen(open);
          if (!open) {
            setEditRequisition(null);
          }
        }}
        requisition={editRequisition}
        onSuccess={() => {
          setEditRequisition(null);
          handleRequisitionCreated();
          // Reload will be handled by RequisitionsTab component
        }}
      />

      <ViewRequisitionDialog
        open={viewRequisitionOpen}
        onOpenChange={setViewRequisitionOpen}
        requisitionId={viewRequisitionId}
      />

      <Dialog open={candidateDialogOpen} onOpenChange={setCandidateDialogOpen}>
        <DialogContent className="max-w-xl">
          <DialogHeader>
            <DialogTitle>Candidate Details</DialogTitle>
            <DialogDescription>View candidate profile and resume details.</DialogDescription>
          </DialogHeader>
          {candidateDetailLoading ? (
            <p className="text-sm text-gray-500">Loading candidate...</p>
          ) : candidateDetail ? (
            <div className="space-y-4 text-sm">
              <div>
                <p className="text-gray-500">Name</p>
                <p className="font-medium">{candidateDetail.candidate?.fullName || "N/A"}</p>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-gray-500">Email</p>
                  <p className="font-medium">{candidateDetail.candidate?.email || "N/A"}</p>
                </div>
                <div>
                  <p className="text-gray-500">Phone</p>
                  <p className="font-medium">{candidateDetail.candidate?.phone || "N/A"}</p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-gray-500">Applied Position</p>
                  <p className="font-medium">{candidateDetail.requisition?.title || "N/A"}</p>
                </div>
                <div>
                  <p className="text-gray-500">Status</p>
                  <Badge className={getCandidateStatusColor(candidateDetail.status)}>{candidateDetail.status}</Badge>
                </div>
              </div>
              <div className="flex gap-2 pt-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => handleViewCv(candidateDetail.id || candidateDetail._id)}
                  disabled={!candidateDetail?.candidate?.hasResume}
                >
                  <Eye className="h-4 w-4 mr-2" />
                  View CV
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => handleDownloadCv(
                    candidateDetail.id || candidateDetail._id,
                    candidateDetail?.candidate?.fullName || candidateDetail?.name
                  )}
                  disabled={!candidateDetail?.candidate?.hasResume}
                >
                  <Download className="h-4 w-4 mr-2" />
                  Download CV
                </Button>
              </div>
            </div>
          ) : (
            <p className="text-sm text-gray-500">Candidate data not available.</p>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default function Recruitment() {
  return (
    <Suspense fallback={
      <div className="p-4 sm:p-6 space-y-4 sm:space-y-6 w-full max-w-full overflow-x-hidden">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Recruitment</h2>
            <p className="text-gray-600 mt-1">Loading...</p>
          </div>
        </div>
      </div>
    }>
      <RecruitmentContent />
    </Suspense>
  );
}
