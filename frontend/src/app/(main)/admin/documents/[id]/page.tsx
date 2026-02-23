"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "../../../../components/ui/card";
import { Button } from "../../../../components/ui/button";
import { Badge } from "../../../../components/ui/badge";
import { api } from "../../../../lib/api";
import { toast } from "sonner";
import { ArrowLeft, Download, FileText, Calendar, User } from "lucide-react";
import Link from "next/link";

export default function DocumentDetail() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;
  const [document, setDocument] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchDocument() {
      try {
        setLoading(true);
        const result = await api.getDocumentById(id);
        setDocument(result);
      } catch (error: any) {
        toast.error(error.message || "Failed to load document");
        router.push("/admin/documents");
      } finally {
        setLoading(false);
      }
    }
    if (id) {
      fetchDocument();
    }
  }, [id, router]);

  const handleDownload = async (artefactKind?: string) => {
    try {
      const result = await api.downloadDocument(id, artefactKind) as { url?: string };
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

  if (loading) {
    return (
      <div className="p-6">
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-gray-500">Loading document...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!document) {
    return null;
  }

  return (
    <div className="p-4 sm:p-6 space-y-4 sm:space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/admin/documents">
          <Button variant="outline" size="sm">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
        </Link>
        <div className="flex-1">
          <h2 className="text-2xl font-bold text-gray-900">Document Details</h2>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Document Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="text-sm text-gray-500">Document Type</p>
                <p className="font-medium">{document.docType?.replace(/_/g, " ") || document.documentType}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Status</p>
                <Badge className={getStatusColor(document.status)}>
                  {document.status?.replace(/_/g, " ")}
                </Badge>
              </div>
              <div>
                <p className="text-sm text-gray-500">Subject Type</p>
                <p className="font-medium">{document.subjectType?.replace(/_/g, " ")}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Subject ID</p>
                <p className="font-medium">{document.subjectId?.toString() || "N/A"}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Created</p>
                <p className="font-medium">
                  {document.createdAt
                    ? new Date(document.createdAt).toLocaleString()
                    : "N/A"}
                </p>
              </div>
              {document.expiresAt && (
                <div>
                  <p className="text-sm text-gray-500">Expires</p>
                  <p className="font-medium">
                    {new Date(document.expiresAt).toLocaleString()}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {document.artefacts && document.artefacts.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Document Artefacts</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {document.artefacts.map((artefact: any, idx: number) => (
                    <div
                      key={idx}
                      className="flex items-center justify-between p-3 border rounded-lg"
                    >
                      <div className="flex items-center gap-3">
                        <FileText className="h-5 w-5 text-gray-400" />
                        <div>
                          <p className="font-medium">{artefact.kind?.replace(/_/g, " ")}</p>
                          <p className="text-sm text-gray-500">
                            {(artefact.sizeBytes / 1024).toFixed(2)} KB
                          </p>
                        </div>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDownload(artefact.kind)}
                      >
                        <Download className="h-4 w-4 mr-1" />
                        Download
                      </Button>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button
                className="w-full"
                onClick={() => handleDownload()}
              >
                <Download className="h-4 w-4 mr-2" />
                Download Document
              </Button>
              {document.status === "GENERATED" && (
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() => {
                    toast.info("E-signature feature coming soon");
                  }}
                >
                  Request Signature
                </Button>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
