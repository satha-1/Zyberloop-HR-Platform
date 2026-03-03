"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/app/components/ui/card";
import { Button } from "@/app/components/ui/button";
import { Badge } from "@/app/components/ui/badge";
import { EnterpriseTable, EnterpriseTableColumn } from "@/app/components/ui/EnterpriseTable";
import { api } from "@/app/lib/api";
import { CheckCircle, XCircle, Eye, Globe, ExternalLink } from "lucide-react";
import { toast } from "sonner";

interface RequisitionApprovalsTabProps {
  onViewRequisition: (reqId: string) => void;
  onCopyPortalLink: (reqId: string) => void;
  active?: boolean; // Whether this tab is currently active
}

export function RequisitionApprovalsTab({
  onViewRequisition,
  onCopyPortalLink,
  active = true,
}: RequisitionApprovalsTabProps) {
  const [loading, setLoading] = useState(false);
  const [approvals, setApprovals] = useState<any[]>([]);
  const [processingId, setProcessingId] = useState<string | null>(null);

  useEffect(() => {
    if (active) {
      loadApprovals();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [active]);

  const loadApprovals = async () => {
    setLoading(true);
    try {
      const result: any = await api.getPendingApprovals();
      const data = result?.data || result || [];
      setApprovals(Array.isArray(data) ? data : []);
    } catch (error: any) {
      console.error("Failed to load pending approvals:", error);
      toast.error("Failed to load pending approvals");
      setApprovals([]);
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (requisitionId: string) => {
    if (!confirm("Are you sure you want to approve this requisition?")) {
      return;
    }

    setProcessingId(requisitionId);
    try {
      await api.approveRequisition(requisitionId);
      toast.success("Requisition approved successfully!");
      await loadApprovals();
    } catch (error: any) {
      toast.error(error.message || "Failed to approve requisition");
    } finally {
      setProcessingId(null);
    }
  };

  const handlePublish = async (requisitionId: string) => {
    if (!confirm("Are you sure you want to publish this requisition? It will be visible on the job portal.")) {
      return;
    }

    setProcessingId(requisitionId);
    try {
      await api.publishRequisition(requisitionId);
      toast.success("Requisition published successfully!");
      await loadApprovals();
    } catch (error: any) {
      toast.error(error.message || "Failed to publish requisition");
    } finally {
      setProcessingId(null);
    }
  };

  const getStatusBadge = (status: string) => {
    const statusMap: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
      DRAFT: { label: "Draft", variant: "secondary" },
      MANAGER_APPROVED: { label: "Manager Approved", variant: "default" },
      PUBLISHED: { label: "Published", variant: "default" },
    };
    const statusInfo = statusMap[status] || { label: status, variant: "outline" as const };
    return <Badge variant={statusInfo.variant}>{statusInfo.label}</Badge>;
  };

  const columns: EnterpriseTableColumn[] = [
    {
      key: "title",
      header: "Job Title",
      align: "left",
      minWidth: 200,
      render: (row) => <span className="font-medium text-gray-900">{row.title}</span>,
    },
    {
      key: "department",
      header: "Department",
      align: "left",
      minWidth: 150,
      render: (row) => row.department?.name || "N/A",
    },
    {
      key: "location",
      header: "Location",
      align: "left",
      minWidth: 120,
    },
    {
      key: "budgetCode",
      header: "Budget Code",
      align: "left",
      minWidth: 120,
      render: (row) => <span className="font-mono text-sm">{row.budgetCode || "N/A"}</span>,
    },
    {
      key: "status",
      header: "Status",
      align: "center",
      minWidth: 140,
      maxWidth: 160,
      render: (row) => getStatusBadge(row.status),
    },
    {
      key: "createdBy",
      header: "Created By",
      align: "left",
      minWidth: 150,
      render: (row) => row.createdBy?.name || "N/A",
    },
    {
      key: "createdAt",
      header: "Created Date",
      align: "left",
      minWidth: 120,
      render: (row) => row.createdAt ? new Date(row.createdAt).toLocaleDateString() : "N/A",
    },
    {
      key: "actions",
      header: "Actions",
      align: "right",
      minWidth: 200,
      maxWidth: 250,
      render: (row) => {
        const isProcessing = processingId === (row.id || row._id);
        const canApprove = row.status === "DRAFT";
        const canPublish = row.status === "MANAGER_APPROVED";

        return (
          <div className="flex items-center gap-2 justify-end">
            <Button
              variant="outline"
              size="sm"
              onClick={() => onViewRequisition(row.id || row._id)}
            >
              <Eye className="h-4 w-4 mr-1" />
              View
            </Button>
            {canApprove && (
              <Button
                variant="default"
                size="sm"
                onClick={() => handleApprove(row.id || row._id)}
                disabled={isProcessing}
              >
                <CheckCircle className="h-4 w-4 mr-1" />
                {isProcessing ? "Approving..." : "Approve"}
              </Button>
            )}
            {canPublish && (
              <Button
                variant="default"
                size="sm"
                onClick={() => handlePublish(row.id || row._id)}
                disabled={isProcessing}
                className="bg-green-600 hover:bg-green-700"
              >
                <Globe className="h-4 w-4 mr-1" />
                {isProcessing ? "Publishing..." : "Publish"}
              </Button>
            )}
            {row.status === "PUBLISHED" && (
              <>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    const link = `${window.location.origin}/portal/jobs/${row.id || row._id}`;
                    window.open(link, '_blank');
                  }}
                >
                  <ExternalLink className="h-4 w-4 mr-1" />
                  View Portal
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onCopyPortalLink(row.id || row._id)}
                >
                  <Globe className="h-4 w-4 mr-1" />
                  Copy Link
                </Button>
              </>
            )}
          </div>
        );
      },
    },
  ];

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Job Requisition Approvals</CardTitle>
            <p className="text-sm text-gray-500 mt-1">
              Review and approve pending job requisitions
            </p>
          </div>
          <Button variant="outline" size="sm" onClick={loadApprovals} disabled={loading}>
            {loading ? "Loading..." : "Refresh"}
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="text-center py-8 text-gray-500">Loading approvals...</div>
        ) : approvals.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <p>No pending approvals found.</p>
            <p className="text-sm mt-2">All requisitions have been processed.</p>
          </div>
        ) : (
          <EnterpriseTable
            columns={columns}
            data={approvals}
            getRowKey={(row) => row.id || row._id}
            emptyStateText="No pending approvals available"
          />
        )}
      </CardContent>
    </Card>
  );
}
