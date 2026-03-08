"use client";
import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "../../../../../components/ui/card";
import { Button } from "../../../../../components/ui/button";
import { Badge } from "../../../../../components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../../../../../components/ui/table";
import {
  ArrowLeft, Send, BarChart3, RefreshCw, Loader2, CheckCircle2, Clock, Mail,
} from "lucide-react";
import { toast } from "sonner";
import { api } from "../../../../../lib/api";

const statusColors: Record<string, string> = {
  SENT: "bg-blue-100 text-blue-800",
  OPENED: "bg-yellow-100 text-yellow-800",
  SUBMITTED: "bg-green-100 text-green-800",
};

export default function AssignmentDetailPage() {
  const router = useRouter();
  const params = useParams();
  const assignmentId = params.id as string;
  
  const [assignment, setAssignment] = useState<any>(null);
  const [aggregate, setAggregate] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [loadingAggregate, setLoadingAggregate] = useState(false);

  useEffect(() => {
    if (assignmentId) {
      loadAssignment();
    }
  }, [assignmentId]);

  const loadAssignment = async () => {
    if (!assignmentId) return;
    setLoading(true);
    try {
      const data = await api.get360Assignment(assignmentId);
      setAssignment(data);
    } catch (e: any) {
      toast.error("Failed to load assignment: " + (e.message || "Unknown error"));
      router.back();
    } finally {
      setLoading(false);
    }
  };

  const handleSendInvites = async () => {
    if (!assignmentId) return;
    setSending(true);
    try {
      const res: any = await api.send360Invites(assignmentId);
      toast.success(res.message || "Invitations sent");
      loadAssignment();
    } catch (e: any) {
      toast.error(e.message || "Failed to send invitations");
    } finally {
      setSending(false);
    }
  };

  const handleViewAggregate = async () => {
    if (!assignmentId) return;
    setLoadingAggregate(true);
    try {
      const response: any = await api.get360Aggregate(assignmentId);
      // API returns { success: true, data: {...} } or just the data
      const data = response?.data || response;
      setAggregate(data);
    } catch (e: any) {
      toast.error(e.message || "Failed to load aggregate");
      setAggregate(null);
    } finally {
      setLoadingAggregate(false);
    }
  };

  const handleSyncToAppraisals = async () => {
    if (!assignment?.cycleId) return;
    try {
      const res: any = await api.sync360ToAppraisals(assignment.cycleId);
      toast.success(res.message || "Synced to appraisals");
    } catch (e: any) {
      toast.error(e.message || "Failed to sync");
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    );
  }

  if (!assignment) {
    return (
      <div className="space-y-6">
        <Button variant="ghost" size="sm" onClick={() => router.back()}>
          <ArrowLeft className="h-4 w-4 mr-2" /> Back
        </Button>
        <Card>
          <CardContent className="pt-6">
            <p className="text-gray-500">Assignment not found.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const progress = assignment.requiredResponsesCount > 0
    ? (assignment.collectedResponsesCount / assignment.requiredResponsesCount) * 100
    : 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" onClick={() => router.back()}>
            <ArrowLeft className="h-4 w-4 mr-2" /> Back
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              {assignment.targetEmployeeId?.firstName} {assignment.targetEmployeeId?.lastName}
            </h1>
            <p className="text-gray-500 mt-0.5 text-sm">360 Feedback Assignment</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            onClick={handleSendInvites}
            disabled={sending || assignment.status === "LOCKED" || assignment.status === "COMPLETED"}
          >
            {sending ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Send className="h-4 w-4 mr-2" />
            )}
            Send Invites
          </Button>
          <Button variant="outline" onClick={handleViewAggregate} disabled={loadingAggregate}>
            {loadingAggregate ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <BarChart3 className="h-4 w-4 mr-2" />
            )}
            View Aggregate
          </Button>
          <Button variant="outline" onClick={handleSyncToAppraisals}>
            <RefreshCw className="h-4 w-4 mr-2" /> Sync to Appraisals
          </Button>
        </div>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="text-sm text-gray-500">Template</div>
            <div className="text-sm font-medium mt-1">
              {(assignment.templateId as any)?.name || "N/A"}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-sm text-gray-500">Status</div>
            <Badge className={statusColors[assignment.status] || "bg-gray-100 text-gray-700"}>{assignment.status.replace(/_/g, " ")}</Badge>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-sm text-gray-500">Responses</div>
            <div className="text-2xl font-bold">
              {assignment.collectedResponsesCount} / {assignment.requiredResponsesCount}
            </div>
            <div className="w-full h-2 bg-gray-100 rounded-full mt-2 overflow-hidden">
              <div
                className={`h-full ${
                  progress >= 100 ? "bg-green-500" : progress >= 50 ? "bg-yellow-500" : "bg-red-500"
                }`}
                style={{ width: `${Math.min(progress, 100)}%` }}
              />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-sm text-gray-500">Total Raters</div>
            <div className="text-2xl font-bold">{assignment.raters?.length || 0}</div>
          </CardContent>
        </Card>
      </div>

      {/* Additional Info */}
      <Card>
        <CardContent className="pt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <div className="text-sm text-gray-500">Deadline</div>
              <div className="text-sm font-medium mt-1">
                {assignment.deadlineAt
                  ? new Date(assignment.deadlineAt).toLocaleDateString()
                  : "No deadline"}
              </div>
            </div>
            <div>
              <div className="text-sm text-gray-500">Created</div>
              <div className="text-sm font-medium mt-1">
                {assignment.createdAt
                  ? new Date(assignment.createdAt).toLocaleDateString()
                  : "N/A"}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Raters Table */}
      <Card>
        <CardHeader>
          <CardTitle>Raters</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Opened</TableHead>
                <TableHead>Submitted</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {(!assignment.raters || assignment.raters.length === 0) ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-gray-500">
                    No raters assigned
                  </TableCell>
                </TableRow>
              ) : (
                assignment.raters.map((rater: any) => (
                  <TableRow key={rater.id || rater._id}>
                    <TableCell className="font-medium">{rater.name}</TableCell>
                    <TableCell>{rater.email}</TableCell>
                    <TableCell>
                      <Badge variant="outline">{rater.roleType.replace(/_/g, " ")}</Badge>
                    </TableCell>
                    <TableCell>
                      <Badge className={statusColors[rater.status] || "bg-gray-100 text-gray-700"}>
                        {rater.status === "SENT" && <Mail className="h-3 w-3 mr-1 inline" />}
                        {rater.status === "OPENED" && <Clock className="h-3 w-3 mr-1 inline" />}
                        {rater.status === "SUBMITTED" && <CheckCircle2 className="h-3 w-3 mr-1 inline" />}
                        {rater.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm text-gray-500">
                      {rater.openedAt ? new Date(rater.openedAt).toLocaleString() : "-"}
                    </TableCell>
                    <TableCell className="text-sm text-gray-500">
                      {rater.submittedAt ? new Date(rater.submittedAt).toLocaleString() : "-"}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Aggregate Results */}
      {aggregate && (
        <Card>
          <CardHeader>
            <CardTitle>Aggregate Results</CardTitle>
          </CardHeader>
          <CardContent>
            {aggregate.tooFewResponses ? (
              <div className="text-center py-8 text-gray-500">
                <p>Not enough responses yet.</p>
                <p className="text-sm mt-2">
                  {aggregate.collected || 0} collected, {aggregate.required || 3} required
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {aggregate.overallPeerScore !== undefined && (
                  <div>
                    <div className="text-sm text-gray-500">Overall Peer Score</div>
                    <div className="text-2xl font-bold">
                      {typeof aggregate.overallPeerScore === 'number' 
                        ? aggregate.overallPeerScore.toFixed(2) 
                        : "N/A"}
                    </div>
                  </div>
                )}
                {aggregate.sectionAggregates && aggregate.sectionAggregates.length > 0 ? (
                  aggregate.sectionAggregates.map((section: any, idx: number) => (
                    <div key={section.sectionId || idx} className="border rounded-lg p-4">
                      <div className="font-medium mb-3">{section.title}</div>
                      {section.questions && section.questions.length > 0 ? (
                        section.questions.map((q: any, qIdx: number) => (
                          <div key={q.questionId || qIdx} className="mb-4 last:mb-0">
                            <div className="text-sm font-medium mb-1">{q.prompt}</div>
                            {q.type === "LIKERT" && (
                              <div className="text-sm text-gray-600">
                                Average: {q.average?.toFixed(2) || "N/A"} 
                                {q.min !== undefined && q.max !== undefined && (
                                  <> (Min: {q.min}, Max: {q.max})</>
                                )}
                                {q.count !== undefined && <> • {q.count} response{q.count !== 1 ? 's' : ''}</>}
                              </div>
                            )}
                            {q.type === "TEXT" && q.comments && q.comments.length > 0 && (
                              <div className="space-y-2 mt-2">
                                {q.comments.map((c: any, cIdx: number) => (
                                  <div key={cIdx} className="text-sm border-l-2 border-blue-200 pl-3 py-1">
                                    {c.text || c}
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        ))
                      ) : (
                        <p className="text-sm text-gray-500">No questions in this section</p>
                      )}
                    </div>
                  ))
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    <p>No aggregate data available</p>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
