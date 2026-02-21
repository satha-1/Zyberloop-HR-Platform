"use client";

import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "./ui/dialog";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { api } from "../lib/api";
import { Eye, Calendar, MapPin, Building2, DollarSign, FileText, User, ExternalLink } from "lucide-react";
import { toast } from "sonner";

interface ViewRequisitionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  requisitionId: string | null;
}

export function ViewRequisitionDialog({ open, onOpenChange, requisitionId }: ViewRequisitionDialogProps) {
  const [loading, setLoading] = useState(false);
  const [requisition, setRequisition] = useState<any>(null);

  useEffect(() => {
    if (open && requisitionId) {
      fetchRequisitionDetails();
    }
  }, [open, requisitionId]);

  const fetchRequisitionDetails = async () => {
    if (!requisitionId) return;
    
    try {
      setLoading(true);
      const data = await api.getRequisitionById(requisitionId);
      setRequisition(data);
    } catch (error: any) {
      toast.error(error.message || "Failed to load requisition details");
      onOpenChange(false);
    } finally {
      setLoading(false);
    }
  };

  const handleCopyPortalLink = () => {
    if (!requisitionId) return;
    const link = `${window.location.origin}/portal/jobs/${requisitionId}`;
    navigator.clipboard.writeText(link);
    toast.success("Public job link copied to clipboard!");
  };

  const getStatusColor = (status: string) => {
    const statusLower = status?.toLowerCase();
    if (statusLower === "published" || statusLower === "hr_approved" || statusLower === "finance_approved") {
      return "bg-green-100 text-green-800";
    }
    if (statusLower === "closed" || statusLower === "rejected") {
      return "bg-gray-100 text-gray-800";
    }
    if (statusLower === "draft") {
      return "bg-yellow-100 text-yellow-800";
    }
    return "bg-orange-100 text-orange-800";
  };

  if (!requisition && !loading) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <span>Requisition Details</span>
            {requisition && (
              <Badge className={getStatusColor(requisition.status)}>
                {requisition.status}
              </Badge>
            )}
          </DialogTitle>
          <DialogDescription>View complete details of the job requisition</DialogDescription>
        </DialogHeader>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="text-gray-500">Loading requisition details...</div>
          </div>
        ) : requisition ? (
          <div className="space-y-6">
            {/* Basic Information */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                    <FileText className="h-5 w-5" />
                    Position Information
                  </h3>
                  <div className="bg-gray-50 p-4 rounded-lg space-y-3">
                    <div>
                      <label className="text-sm font-medium text-gray-500">Job Title</label>
                      <p className="text-base text-gray-900 mt-1">{requisition.title}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-500">Department</label>
                      <p className="text-base text-gray-900 mt-1 flex items-center gap-2">
                        <Building2 className="h-4 w-4 text-gray-400" />
                        {requisition.departmentId?.name || requisition.department || "N/A"}
                      </p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-500">Location</label>
                      <p className="text-base text-gray-900 mt-1 flex items-center gap-2">
                        <MapPin className="h-4 w-4 text-gray-400" />
                        {requisition.location}
                      </p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-500">Employment Type</label>
                      <p className="text-base text-gray-900 mt-1">
                        <Badge variant="outline">
                          {requisition.type?.replace("_", " ") || requisition.type}
                        </Badge>
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                    <DollarSign className="h-5 w-5" />
                    Compensation & Budget
                  </h3>
                  <div className="bg-gray-50 p-4 rounded-lg space-y-3">
                    <div>
                      <label className="text-sm font-medium text-gray-500">Salary Range</label>
                      <p className="text-base text-gray-900 mt-1">
                        LKR {requisition.estimatedSalaryBand?.min?.toLocaleString() || "0"} - LKR{" "}
                        {requisition.estimatedSalaryBand?.max?.toLocaleString() || "0"}
                      </p>
                    </div>
                    {requisition.budgetCode && (
                      <div>
                        <label className="text-sm font-medium text-gray-500">Budget Code</label>
                        <p className="text-base text-gray-900 mt-1">{requisition.budgetCode}</p>
                      </div>
                    )}
                    <div>
                      <label className="text-sm font-medium text-gray-500">Budget Hold</label>
                      <p className="text-base text-gray-900 mt-1">
                        <Badge variant={requisition.budgetHoldFlag ? "destructive" : "outline"}>
                          {requisition.budgetHoldFlag ? "On Hold" : "Available"}
                        </Badge>
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Justification */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Justification</h3>
              <div className="bg-gray-50 p-4 rounded-lg">
                <p className="text-base text-gray-900 whitespace-pre-wrap">
                  {requisition.justification || "No justification provided"}
                </p>
              </div>
            </div>

            {/* Additional Information */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <Calendar className="h-5 w-5" />
                  Timeline
                </h3>
                <div className="bg-gray-50 p-4 rounded-lg space-y-3">
                  <div>
                    <label className="text-sm font-medium text-gray-500">Created Date</label>
                    <p className="text-base text-gray-900 mt-1">
                      {new Date(requisition.createdAt).toLocaleDateString("en-US", {
                        year: "numeric",
                        month: "long",
                        day: "numeric",
                      })}
                    </p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">Last Updated</label>
                    <p className="text-base text-gray-900 mt-1">
                      {new Date(requisition.updatedAt).toLocaleDateString("en-US", {
                        year: "numeric",
                        month: "long",
                        day: "numeric",
                      })}
                    </p>
                  </div>
                </div>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <User className="h-5 w-5" />
                  Created By
                </h3>
                <div className="bg-gray-50 p-4 rounded-lg space-y-3">
                  <div>
                    <label className="text-sm font-medium text-gray-500">Name</label>
                    <p className="text-base text-gray-900 mt-1">
                      {requisition.createdBy?.name || "N/A"}
                    </p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">Email</label>
                    <p className="text-base text-gray-900 mt-1">
                      {requisition.createdBy?.email || "N/A"}
                    </p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">Candidates</label>
                    <p className="text-base text-gray-900 mt-1">
                      {requisition.candidates || 0} candidate(s) applied
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex justify-end gap-3 pt-4 border-t">
              <Button variant="outline" onClick={handleCopyPortalLink}>
                <ExternalLink className="h-4 w-4 mr-2" />
                Copy Portal Link
              </Button>
              <Button onClick={() => onOpenChange(false)}>Close</Button>
            </div>
          </div>
        ) : null}
      </DialogContent>
    </Dialog>
  );
}
