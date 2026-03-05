"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "../../../../../components/ui/card";
import { Button } from "../../../../../components/ui/button";
import { Badge } from "../../../../../components/ui/badge";
import { api } from "../../../../../lib/api";
import { useEsignEnvelopes } from "../../../../../lib/hooks";
import { toast } from "sonner";
import { ArrowLeft, Edit, Send, Copy, FileText, Clock, CheckCircle } from "lucide-react";
import Link from "next/link";

export default function TemplateDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [template, setTemplate] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [executedStatusFilter, setExecutedStatusFilter] = useState("all");

  const { data: executedCopies = [], refetch: refetchExecuted } = useEsignEnvelopes({
    templateId: (params.id as string) || undefined,
    status: executedStatusFilter !== "all" ? executedStatusFilter : undefined,
  });

  useEffect(() => {
    if (params.id) {
      api.getEsignTemplateById(params.id as string)
        .then((data: any) => setTemplate(data))
        .catch((err: any) => toast.error(err.message))
        .finally(() => setLoading(false));
    }
  }, [params.id]);

  const handlePublish = async (versionId: string) => {
    try {
      await api.publishEsignTemplateVersion(params.id as string, versionId);
      toast.success("Template version published");
      const data = await api.getEsignTemplateById(params.id as string);
      setTemplate(data);
      refetchExecuted();
    } catch (error: any) {
      toast.error(error.message || "Failed to publish");
    }
  };

  const handleNewVersion = async () => {
    try {
      const result: any = await api.createEsignTemplateVersion(params.id as string);
      toast.success("New version created");
      refetchExecuted();
      router.push(`/admin/esign/templates/${params.id}/editor?version=${result._id}`);
    } catch (error: any) {
      toast.error(error.message || "Failed to create version");
    }
  };

  const handleDuplicate = async () => {
    try {
      await api.duplicateEsignTemplate(params.id as string);
      toast.success("Template duplicated");
      refetchExecuted();
      router.push("/admin/esign/templates");
    } catch (error: any) {
      toast.error(error.message || "Failed to duplicate");
    }
  };

  if (loading) {
    return <div className="p-6 text-center text-gray-500">Loading...</div>;
  }

  if (!template) {
    return <div className="p-6 text-center text-gray-500">Template not found</div>;
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "published": return "bg-green-100 text-green-800";
      case "draft": return "bg-amber-100 text-amber-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  return (
    <div className="p-4 sm:p-6 space-y-4 sm:space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/admin/esign/templates">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="h-4 w-4 mr-1" /> Back
          </Button>
        </Link>
        <div className="flex-1">
          <h2 className="text-2xl font-bold text-gray-900">{template.name}</h2>
          {template.description && (
            <p className="text-gray-600 mt-1">{template.description}</p>
          )}
        </div>
        <Badge className={getStatusColor(template.status)}>{template.status}</Badge>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: PDF Preview */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" /> Source PDF
              </CardTitle>
            </CardHeader>
            <CardContent>
              {template.sourcePdfUrl ? (
                <iframe
                  src={template.sourcePdfUrl}
                  className="w-full h-[600px] border rounded"
                  title="PDF Preview"
                />
              ) : (
                <div className="h-[400px] flex items-center justify-center bg-gray-50 rounded border">
                  <p className="text-gray-500">PDF preview not available</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Right: Info & Actions */}
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {template.versions?.length > 0 && (
                <Link
                  href={`/admin/esign/templates/${template._id}/editor?version=${template.versions[0]._id}`}
                  className="block"
                >
                  <Button className="w-full" variant="outline">
                    <Edit className="h-4 w-4 mr-2" /> Edit Fields
                  </Button>
                </Link>
              )}
              <Button className="w-full" variant="outline" onClick={handleNewVersion}>
                <Clock className="h-4 w-4 mr-2" /> New Version
              </Button>
              <Button className="w-full" variant="outline" onClick={handleDuplicate}>
                <Copy className="h-4 w-4 mr-2" /> Duplicate Template
              </Button>
              {template.status === "published" && (
                <Link href={`/admin/esign/documents?templateId=${template._id}`} className="block">
                  <Button className="w-full">
                    <Send className="h-4 w-4 mr-2" /> Send for Signature
                  </Button>
                </Link>
              )}
            </CardContent>
          </Card>

          {/* Versions */}
          <Card>
            <CardHeader>
              <CardTitle>Versions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {template.versions?.map((v: any) => (
                <div key={v._id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div>
                    <p className="font-medium text-sm">v{v.versionNumber}</p>
                    <p className="text-xs text-gray-500">
                      {v.pageCount} page{v.pageCount !== 1 ? "s" : ""} · {v.overlayDefinition?.length || 0} fields
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge className={getStatusColor(v.status)}>{v.status}</Badge>
                    {v.status === "draft" && (
                      <Button size="sm" variant="ghost" onClick={() => handlePublish(v._id)}>
                        <CheckCircle className="h-3 w-3 mr-1" /> Publish
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Executed Copies</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <select
                className="w-full border rounded-md px-3 py-2 text-sm"
                value={executedStatusFilter}
                onChange={(e) => setExecutedStatusFilter(e.target.value)}
              >
                <option value="all">All Statuses</option>
                <option value="draft">Draft</option>
                <option value="sent">Sent</option>
                <option value="viewed">Viewed</option>
                <option value="in_progress">In Progress</option>
                <option value="completed">Completed</option>
                <option value="finalised">Finalised</option>
                <option value="declined">Declined</option>
                <option value="expired">Expired</option>
                <option value="voided">Voided</option>
              </select>

              {executedCopies.length === 0 ? (
                <p className="text-sm text-gray-500">No executed copies found.</p>
              ) : (
                executedCopies.map((env: any) => (
                  <Link key={env._id} href={`/admin/esign/envelopes/${env._id}`} className="block">
                    <div className="p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                      <p className="text-sm font-medium">{env.displayName}</p>
                      <p className="text-xs text-gray-500">
                        {env.status} · {new Date(env.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                  </Link>
                ))
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
