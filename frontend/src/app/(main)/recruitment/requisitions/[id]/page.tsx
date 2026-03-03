"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/app/components/ui/card";
import { Button } from "@/app/components/ui/button";
import { Badge } from "@/app/components/ui/badge";
import { WorkdayTable, WorkdayTableColumn } from "@/app/components/ui/WorkdayTable";
import { api } from "@/app/lib/api";
import { ArrowLeft, Eye, Pencil, ExternalLink, Users, MapPin, FileText } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/app/components/ui/select";
import { toast } from "sonner";
import { cn } from "@/app/components/ui/utils";

const PIPELINE_STAGES = [
  { key: 'review', label: 'Review' },
  { key: 'screen', label: 'Screen' },
  { key: 'assessment', label: 'Assessment' },
  { key: 'hiringManagerInterview', label: 'Hiring Manager Interview' },
  { key: 'preEmploymentCheck', label: 'Pre-Employment' },
  { key: 'employmentAgreement', label: 'Employment Agreement' },
  { key: 'offer', label: 'Offer' },
  { key: 'backgroundCheck', label: 'Background Check' },
  { key: 'readyForHire', label: 'Ready for Hire' },
];

export default function RequisitionDetailPage() {
  const params = useParams();
  const router = useRouter();
  const requisitionId = params.id as string;

  const [requisition, setRequisition] = useState<any>(null);
  const [candidates, setCandidates] = useState<any[]>([]);
  const [allRequisitions, setAllRequisitions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [candidatesLoading, setCandidatesLoading] = useState(true);
  const [selectedCandidate, setSelectedCandidate] = useState<any>(null);

  useEffect(() => {
    loadRequisition();
    loadAllRequisitions();
  }, [requisitionId]);

  useEffect(() => {
    if (requisitionId) {
      loadCandidates();
    }
  }, [requisitionId]);

  const loadRequisition = async () => {
    try {
      setLoading(true);
      const data = await api.getRequisitionById(requisitionId);
      setRequisition(data);
    } catch (error) {
      console.error('Error loading requisition:', error);
      toast.error('Failed to load requisition');
    } finally {
      setLoading(false);
    }
  };

  const loadCandidates = async () => {
    try {
      setCandidatesLoading(true);
      const data = await api.getRequisitionCandidates(requisitionId, { page: 1, pageSize: 100 }) as any;
      setCandidates(Array.isArray(data) ? data : (data?.data || []));
    } catch (error) {
      console.error('Error loading candidates:', error);
    } finally {
      setCandidatesLoading(false);
    }
  };

  const loadAllRequisitions = async () => {
    try {
      const data = await api.getRequisitions({ status: 'open', page: 1, pageSize: 50 }) as any;
      setAllRequisitions(Array.isArray(data) ? data : (data?.data || []));
    } catch (error) {
      console.error('Error loading requisitions:', error);
    }
  };

  const handleStatusUpdate = async (applicationId: string, newStatus: string) => {
    try {
      await api.updateCandidateApplicationStatus(applicationId, newStatus);
      toast.success("Candidate status updated successfully!");
      loadCandidates();
    } catch (error: any) {
      toast.error(error.message || "Failed to update status");
    }
  };

  const handleViewCandidate = async (applicationId: string) => {
    try {
      const detail = await api.getCandidateById(applicationId);
      setSelectedCandidate(detail);
    } catch (error: any) {
      toast.error(error.message || "Failed to load candidate details");
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

  const getStatusColor = (status: string) => {
    const statusLower = status?.toLowerCase();
    if (statusLower === "open" || statusLower === "published") return "bg-green-100 text-green-800";
    if (statusLower === "closed") return "bg-gray-100 text-gray-800";
    if (statusLower === "draft") return "bg-yellow-100 text-yellow-800";
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
      REVIEW: "bg-blue-100 text-blue-800",
      ASSESSMENT: "bg-indigo-100 text-indigo-800",
      HIRING_MANAGER_INTERVIEW: "bg-purple-100 text-purple-800",
      PRE_EMPLOYMENT_CHECK: "bg-amber-100 text-amber-800",
      EMPLOYMENT_AGREEMENT: "bg-teal-100 text-teal-800",
      OFFER: "bg-green-100 text-green-800",
      BACKGROUND_CHECK: "bg-orange-100 text-orange-800",
      READY_FOR_HIRE: "bg-emerald-100 text-emerald-800",
    };
    return statusMap[status] || "bg-gray-100 text-gray-800";
  };

  if (loading) {
    return (
      <div className="p-6">
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-gray-500">Loading requisition...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!requisition) {
    return (
      <div className="p-6">
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-gray-600 mb-4">Requisition not found</p>
            <Link href="/recruitment">
              <Button>Back to Recruitment</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Calculate pipeline counts from candidates
  const pipelineCounts: Record<string, number> = {
    review: 0,
    screen: 0,
    assessment: 0,
    hiringManagerInterview: 0,
    preEmploymentCheck: 0,
    employmentAgreement: 0,
    offer: 0,
    backgroundCheck: 0,
    readyForHire: 0,
  };

  candidates.forEach((candidate) => {
    const status = candidate.status;
    if (status === 'APPLIED' || status === 'REVIEW') pipelineCounts.review++;
    else if (status === 'SCREENING') pipelineCounts.screen++;
    else if (status === 'ASSESSMENT') pipelineCounts.assessment++;
    else if (status === 'INTERVIEW' || status === 'HIRING_MANAGER_INTERVIEW') pipelineCounts.hiringManagerInterview++;
    else if (status === 'PRE_EMPLOYMENT_CHECK') pipelineCounts.preEmploymentCheck++;
    else if (status === 'EMPLOYMENT_AGREEMENT') pipelineCounts.employmentAgreement++;
    else if (status === 'OFFERED' || status === 'OFFER') pipelineCounts.offer++;
    else if (status === 'BACKGROUND_CHECK') pipelineCounts.backgroundCheck++;
    else if (status === 'READY_FOR_HIRE' || status === 'HIRED') pipelineCounts.readyForHire++;
  });

  const candidateColumns: WorkdayTableColumn<any>[] = [
    {
      key: "name",
      header: "Candidate Name",
      align: "left",
      render: (row) => <span className="font-medium">{row.name || 'N/A'}</span>,
    },
    {
      key: "email",
      header: "Email",
      align: "left",
    },
    {
      key: "status",
      header: "Current Step",
      align: "left",
      render: (row) => (
        <Badge className={getCandidateStatusColor(row.status)}>
          {row.status}
        </Badge>
      ),
    },
    {
      key: "skillMatch",
      header: "Skill Match",
      align: "center",
      render: (row) => {
        const match = row.skill_match || row.skillMatch || 0;
        return (
          <div className="flex items-center gap-2 justify-center">
            <div className="w-16 bg-gray-200 rounded-full h-2">
              <div className="bg-blue-500 h-2 rounded-full" style={{ width: `${match}%` }} />
            </div>
            <span className="text-sm">{match}%</span>
          </div>
        );
      },
    },
    {
      key: "experienceMatch",
      header: "Experience Match",
      align: "center",
      render: (row) => {
        const match = row.experience_match || row.experienceMatch || 0;
        return (
          <div className="flex items-center gap-2 justify-center">
            <div className="w-16 bg-gray-200 rounded-full h-2">
              <div className="bg-green-500 h-2 rounded-full" style={{ width: `${match}%` }} />
            </div>
            <span className="text-sm">{match}%</span>
          </div>
        );
      },
    },
    {
      key: "appliedDate",
      header: "Date Applied",
      align: "left",
      render: (row) => new Date(row.applied_date || row.appliedDate || row.createdAt).toLocaleDateString(),
    },
    {
      key: "actions",
      header: "Actions",
      align: "right",
      render: (row) => {
        const applicationId = row.id || row._id;
        return (
          <div className="flex items-center justify-end gap-2">
            <Button variant="outline" size="sm" className="h-8" onClick={() => handleViewCandidate(applicationId)}>
              <Eye className="h-4 w-4 mr-1" />
              View
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="h-8"
              onClick={() => handleViewCv(applicationId)}
              disabled={!row.hasResume}
            >
              <FileText className="h-4 w-4 mr-1" />
              CV
            </Button>
            <Select value={row.status} onValueChange={(newStatus) => handleStatusUpdate(applicationId, newStatus)}>
              <SelectTrigger className="w-32 h-8">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="APPLIED">Applied</SelectItem>
                <SelectItem value="REVIEW">Review</SelectItem>
                <SelectItem value="SCREENING">Screening</SelectItem>
                <SelectItem value="ASSESSMENT">Assessment</SelectItem>
                <SelectItem value="INTERVIEW">Interview</SelectItem>
                <SelectItem value="HIRING_MANAGER_INTERVIEW">Hiring Manager Interview</SelectItem>
                <SelectItem value="PRE_EMPLOYMENT_CHECK">Pre-Employment</SelectItem>
                <SelectItem value="EMPLOYMENT_AGREEMENT">Employment Agreement</SelectItem>
                <SelectItem value="OFFERED">Offered</SelectItem>
                <SelectItem value="OFFER">Offer</SelectItem>
                <SelectItem value="BACKGROUND_CHECK">Background Check</SelectItem>
                <SelectItem value="READY_FOR_HIRE">Ready for Hire</SelectItem>
                <SelectItem value="HIRED">Hired</SelectItem>
                <SelectItem value="REJECTED">Rejected</SelectItem>
              </SelectContent>
            </Select>
          </div>
        );
      },
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/recruitment">
            <Button variant="outline" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{requisition.title}</h1>
            <p className="text-gray-600 mt-1">Requisition Details & Candidates</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm">
            <Pencil className="h-4 w-4 mr-2" />
            Edit
          </Button>
          <Button variant="outline" size="sm" onClick={() => {
            const link = `${window.location.origin}/portal/jobs/${requisitionId}`;
            navigator.clipboard.writeText(link);
            toast.success("Public job link copied to clipboard!");
          }}>
            <ExternalLink className="h-4 w-4 mr-2" />
            Copy Link
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Left Panel - Requisitions List */}
        <div className="lg:col-span-1">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Other Requisitions</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="divide-y divide-gray-100 max-h-[600px] overflow-y-auto">
                {allRequisitions
                  .filter((r: any) => (r._id || r.id) !== requisitionId)
                  .slice(0, 10)
                  .map((req: any) => (
                    <Link
                      key={req._id || req.id}
                      href={`/recruitment/requisitions/${req._id || req.id}`}
                      className={cn(
                        "block px-4 py-3 hover:bg-gray-50 transition-colors",
                        (req._id || req.id) === requisitionId && "bg-blue-50"
                      )}
                    >
                      <p className="font-medium text-sm text-blue-600 truncate">{req.title}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <Badge className={getStatusColor(req.status)}>
                          {req.status}
                        </Badge>
                        <span className="text-xs text-gray-500">{req.location}</span>
                      </div>
                    </Link>
                  ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Panel - Main Content */}
        <div className="lg:col-span-3 space-y-6">
          {/* Requisition Info */}
          <Card>
            <CardHeader>
              <CardTitle>Requisition Information</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-gray-500 mb-1">Hiring Manager</p>
                  <p className="font-medium">{requisition.hiringManagerName || 'N/A'}</p>
                  {requisition.hiringManagerTitle && (
                    <p className="text-sm text-gray-600">{requisition.hiringManagerTitle}</p>
                  )}
                </div>
                <div>
                  <p className="text-xs text-gray-500 mb-1">Department</p>
                  <p className="font-medium">{requisition.departmentId?.name || requisition.department || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 mb-1">Location</p>
                  <p className="font-medium flex items-center gap-1">
                    <MapPin className="h-4 w-4 text-gray-400" />
                    {requisition.location}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 mb-1">Type</p>
                  <Badge variant="outline">{requisition.type?.replace('_', ' ') || requisition.type}</Badge>
                </div>
                <div>
                  <p className="text-xs text-gray-500 mb-1">Status</p>
                  <Badge className={getStatusColor(requisition.status)}>
                    {requisition.status}
                  </Badge>
                </div>
                <div>
                  <p className="text-xs text-gray-500 mb-1">Total Candidates</p>
                  <p className="font-medium flex items-center gap-1">
                    <Users className="h-4 w-4 text-gray-400" />
                    {candidates.length}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Pipeline Summary */}
          <Card>
            <CardHeader>
              <CardTitle>Pipeline Summary</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-3 md:grid-cols-5 lg:grid-cols-9 gap-4">
                {PIPELINE_STAGES.map((stage) => {
                  const count = requisition.pipelineCounts?.[stage.key] || pipelineCounts[stage.key] || 0;
                  return (
                    <div key={stage.key} className="text-center">
                      <p className="text-xs text-gray-500 mb-1">{stage.label}</p>
                      <p className="text-2xl font-bold text-gray-900">{count}</p>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          {/* Candidates Table */}
          <Card>
            <CardHeader>
              <CardTitle>Candidates</CardTitle>
            </CardHeader>
            <CardContent>
              <WorkdayTable
                columns={candidateColumns}
                data={candidates}
                getRowKey={(row) => row._id || row.id}
                isLoading={candidatesLoading}
                emptyMessage="No candidates found for this requisition"
              />
              {selectedCandidate && (
                <div className="mt-4 rounded-md border p-4 bg-gray-50">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-semibold">{selectedCandidate.candidate?.fullName || "N/A"}</p>
                      <p className="text-sm text-gray-600">{selectedCandidate.candidate?.email || "N/A"}</p>
                    </div>
                    <Button
                      size="sm"
                      onClick={() => handleViewCv(selectedCandidate.id || selectedCandidate._id)}
                      disabled={!selectedCandidate?.candidate?.hasResume}
                    >
                      <FileText className="h-4 w-4 mr-2" />
                      Open CV
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
