"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "../../../components/ui/card";
import { Button } from "../../../components/ui/button";
import { Input } from "../../../components/ui/input";
import { Badge } from "../../../components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../../../components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../../../components/ui/select";
import { api } from "../../../lib/api";
import { toast } from "sonner";
import { Download, FileText, Eye, Search } from "lucide-react";
import { useDocuments } from "../../../lib/hooks";
import Link from "next/link";

export default function Documents() {
  const [searchTerm, setSearchTerm] = useState("");
  const [docTypeFilter, setDocTypeFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [subjectTypeFilter, setSubjectTypeFilter] = useState("all");

  const { data: documents = [], loading, refetch } = useDocuments({
    docType: docTypeFilter !== "all" ? docTypeFilter : undefined,
    status: statusFilter !== "all" ? statusFilter : undefined,
    subjectType: subjectTypeFilter !== "all" ? subjectTypeFilter : undefined,
  });

  const handleDownload = async (documentId: string) => {
    try {
      const result = await api.downloadDocument(documentId) as { url?: string };
      if (result.url) {
        window.open(result.url, '_blank');
        toast.success("Download started");
      }
    } catch (error: any) {
      toast.error(error.message || "Failed to download document");
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "SIGNED":
      case "GENERATED":
        return "bg-green-100 text-green-800";
      case "SIGNING_PENDING":
        return "bg-orange-100 text-orange-800";
      case "VOIDED":
      case "REVOKED":
      case "EXPIRED":
        return "bg-red-100 text-red-800";
      case "ARCHIVED":
        return "bg-gray-100 text-gray-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const filteredDocuments = documents.filter((doc: any) => {
    const matchesSearch = searchTerm === "" || 
      doc.docType?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      doc.subjectId?.toString().includes(searchTerm);
    return matchesSearch;
  });

  return (
    <div className="p-4 sm:p-6 space-y-4 sm:space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Documents</h2>
          <p className="text-gray-600 mt-1">View and manage generated documents</p>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="space-y-2">
              <Input
                placeholder="Search documents..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full"
              />
            </div>
            <Select value={docTypeFilter} onValueChange={setDocTypeFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Document Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="OFFER_LETTER">Offer Letter</SelectItem>
                <SelectItem value="APPOINTMENT_LETTER">Appointment Letter</SelectItem>
                <SelectItem value="PAYSLIP">Payslip</SelectItem>
                <SelectItem value="FINAL_SETTLEMENT">Final Settlement</SelectItem>
                <SelectItem value="EXPERIENCE_CERT">Experience Certificate</SelectItem>
              </SelectContent>
            </Select>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="GENERATED">Generated</SelectItem>
                <SelectItem value="SIGNING_PENDING">Signing Pending</SelectItem>
                <SelectItem value="SIGNED">Signed</SelectItem>
                <SelectItem value="VOIDED">Voided</SelectItem>
                <SelectItem value="ARCHIVED">Archived</SelectItem>
              </SelectContent>
            </Select>
            <Select value={subjectTypeFilter} onValueChange={setSubjectTypeFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Subject Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Subjects</SelectItem>
                <SelectItem value="EMPLOYEE">Employee</SelectItem>
                <SelectItem value="CANDIDATE">Candidate</SelectItem>
                <SelectItem value="PAYROLL_RUN">Payroll Run</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Documents Table */}
      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="p-8 text-center text-gray-500">Loading documents...</div>
          ) : filteredDocuments.length === 0 ? (
            <div className="p-8 text-center text-gray-500">No documents found</div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Document Type</TableHead>
                    <TableHead>Subject Type</TableHead>
                    <TableHead>Subject ID</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredDocuments.map((doc: any) => (
                    <TableRow key={doc._id || doc.id}>
                      <TableCell className="font-medium">
                        {doc.docType?.replace(/_/g, " ") || doc.documentType}
                      </TableCell>
                      <TableCell>{doc.subjectType?.replace(/_/g, " ")}</TableCell>
                      <TableCell>{doc.subjectId?.toString() || "N/A"}</TableCell>
                      <TableCell>
                        <Badge className={getStatusColor(doc.status)}>
                          {doc.status?.replace(/_/g, " ")}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {doc.createdAt
                          ? new Date(doc.createdAt).toLocaleDateString()
                          : "N/A"}
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDownload(doc._id || doc.id)}
                          >
                            <Download className="h-4 w-4 mr-1" />
                            Download
                          </Button>
                          <Link href={`/admin/documents/${doc._id || doc.id}`}>
                            <Button variant="ghost" size="sm">
                              <Eye className="h-4 w-4" />
                            </Button>
                          </Link>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
