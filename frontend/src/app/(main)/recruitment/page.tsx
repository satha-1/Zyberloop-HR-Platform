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
import { useRequisitions } from "../../lib/hooks";
import { api } from "../../lib/api";
import { Plus, ExternalLink, Users, Briefcase } from "lucide-react";
import { toast } from "sonner";

export default function Recruitment() {
  const { data: requisitions = [], loading: requisitionsLoading } = useRequisitions({ status: "open" });
  const [candidates, setCandidates] = useState<any[]>([]);
  const [selectedReq, setSelectedReq] = useState<string>("");

  useEffect(() => {
    if (requisitions.length > 0 && !selectedReq) {
      setSelectedReq(requisitions[0]._id || requisitions[0].id);
    }
  }, [requisitions, selectedReq]);

  useEffect(() => {
    if (selectedReq) {
      api.getCandidates({ requisitionId: selectedReq }).then(setCandidates).catch(() => setCandidates([]));
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

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Recruitment</h2>
          <p className="text-gray-600 mt-1">Manage requisitions and candidates</p>
        </div>
        <Button>
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
              <CardTitle>Open Requisitions</CardTitle>
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
                              {req.candidates || 0}
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
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {candidates.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={7} className="text-center py-8 text-gray-500">
                          No candidates found
                        </TableCell>
                      </TableRow>
                    ) : (
                      candidates.map((candidate: any) => {
                        const req = requisitions.find(
                          (r: any) => (r._id || r.id) === (candidate.requisition_id || candidate.requisitionId)
                        );
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
                              <Badge variant="secondary">{candidate.status}</Badge>
                            </TableCell>
                            <TableCell>
                              {new Date(candidate.applied_date || candidate.appliedDate || candidate.createdAt).toLocaleDateString()}
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
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {["Applied", "Screening", "Interview", "Offer"].map((stage, idx) => {
              const count = idx === 0 ? 45 : idx === 1 ? 23 : idx === 2 ? 8 : 3;
              return (
                <Card key={stage}>
                  <CardContent className="p-6">
                    <div className="text-center">
                      <p className="text-sm text-gray-600">{stage}</p>
                      <p className="text-3xl font-bold text-gray-900 mt-2">{count}</p>
                      <p className="text-xs text-gray-500 mt-1">candidates</p>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
