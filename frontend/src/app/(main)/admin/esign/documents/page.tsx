"use client";

import { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { Card, CardContent } from "../../../../components/ui/card";
import { Button } from "../../../../components/ui/button";
import { Input } from "../../../../components/ui/input";
import { Badge } from "../../../../components/ui/badge";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "../../../../components/ui/table";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "../../../../components/ui/select";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "../../../../components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../../../../components/ui/tabs";
import { api } from "../../../../lib/api";
import { toast } from "sonner";
import {
  Plus, Send, FileText, Eye, Download, Pencil, XCircle,
  Mail, Clock, CheckCircle2, AlertCircle,
} from "lucide-react";
import { useEsignEnvelopes, useEsignTemplates } from "../../../../lib/hooks";
import Link from "next/link";

export default function EsignDocumentsPage() {
  const searchParams = useSearchParams();
  const [statusFilter, setStatusFilter] = useState("all");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");

  // Create envelope dialog
  const [createOpen, setCreateOpen] = useState(false);
  const [selectedTemplateId, setSelectedTemplateId] = useState("");
  const [selectedVersionId, setSelectedVersionId] = useState("");
  const [envelopeName, setEnvelopeName] = useState("");
  const [recipientName, setRecipientName] = useState("");
  const [recipientEmail, setRecipientEmail] = useState("");
  const [expiryDays, setExpiryDays] = useState("30");
  const [creating, setCreating] = useState(false);

  // Rename dialog
  const [renameOpen, setRenameOpen] = useState(false);
  const [renameId, setRenameId] = useState("");
  const [renameName, setRenameName] = useState("");

  const templateIdFromUrl = searchParams.get("templateId");

  const { data: envelopes = [], loading, refetch } = useEsignEnvelopes({
    status: statusFilter !== "all" ? statusFilter : undefined,
    templateId: templateIdFromUrl || undefined,
    dateFrom: dateFrom || undefined,
    dateTo: dateTo || undefined,
  });

  const { data: templates = [] } = useEsignTemplates({ status: "published" });

  useEffect(() => {
    if (templateIdFromUrl) {
      setSelectedTemplateId(templateIdFromUrl);
      setCreateOpen(true);
    }
  }, [templateIdFromUrl]);

  // When template is selected, find its latest published version
  useEffect(() => {
    if (selectedTemplateId) {
      api.getEsignTemplateById(selectedTemplateId).then((data: any) => {
        const pubVersion = data.versions?.find((v: any) => v.status === "published");
        if (pubVersion) {
          setSelectedVersionId(pubVersion._id);
        }
      }).catch(() => {});
    }
  }, [selectedTemplateId]);

  const handleCreate = async () => {
    if (!selectedTemplateId || !selectedVersionId || !recipientName || !recipientEmail) {
      toast.error("Please fill in all required fields");
      return;
    }
    try {
      setCreating(true);
      const expiryAt = new Date();
      expiryAt.setDate(expiryAt.getDate() + parseInt(expiryDays));

      const envelope: any = await api.createEnvelope({
        templateId: selectedTemplateId,
        templateVersionId: selectedVersionId,
        displayName: envelopeName || "Untitled Document",
        recipients: [{ name: recipientName, email: recipientEmail }],
        expiryAt: expiryAt.toISOString(),
      });

      // Immediately send
      await api.sendEsignEnvelope(envelope._id);

      toast.success("Document sent for signature!");
      setCreateOpen(false);
      setEnvelopeName("");
      setRecipientName("");
      setRecipientEmail("");
      refetch();
    } catch (error: any) {
      toast.error(error.message || "Failed to send");
    } finally {
      setCreating(false);
    }
  };

  const handleCreateDraft = async () => {
    if (!selectedTemplateId || !selectedVersionId) {
      toast.error("Please select a template");
      return;
    }
    try {
      setCreating(true);
      await api.createEnvelope({
        templateId: selectedTemplateId,
        templateVersionId: selectedVersionId,
        displayName: envelopeName || "Untitled Document",
        recipients: recipientEmail ? [{ name: recipientName, email: recipientEmail }] : [],
      });
      toast.success("Draft created");
      setCreateOpen(false);
      refetch();
    } catch (error: any) {
      toast.error(error.message || "Failed to create draft");
    } finally {
      setCreating(false);
    }
  };

  const handleRename = async () => {
    try {
      await api.updateEnvelopeApi(renameId, { displayName: renameName });
      toast.success("Renamed successfully");
      setRenameOpen(false);
      refetch();
    } catch (error: any) {
      toast.error(error.message || "Failed to rename");
    }
  };

  const handleVoid = async (id: string) => {
    if (!confirm("Are you sure you want to void this document?")) return;
    try {
      await api.voidEnvelope(id);
      toast.success("Document voided");
      refetch();
    } catch (error: any) {
      toast.error(error.message || "Failed to void");
    }
  };

  const handleDownload = async (id: string) => {
    try {
      const result: any = await api.downloadSignedPdf(id);
      if (result.url) {
        window.open(result.url, "_blank");
      }
    } catch (error: any) {
      toast.error(error.message || "Failed to download");
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "draft": return <FileText className="h-4 w-4 text-gray-400" />;
      case "sent": return <Mail className="h-4 w-4 text-blue-500" />;
      case "viewed": return <Eye className="h-4 w-4 text-amber-500" />;
      case "in_progress": return <Clock className="h-4 w-4 text-orange-500" />;
      case "finalised": return <CheckCircle2 className="h-4 w-4 text-green-500" />;
      case "declined": return <XCircle className="h-4 w-4 text-red-500" />;
      case "expired": return <AlertCircle className="h-4 w-4 text-gray-400" />;
      case "voided": return <XCircle className="h-4 w-4 text-gray-400" />;
      default: return <FileText className="h-4 w-4 text-gray-400" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "draft": return "bg-gray-100 text-gray-700";
      case "sent": return "bg-blue-100 text-blue-700";
      case "viewed": return "bg-amber-100 text-amber-700";
      case "in_progress": return "bg-orange-100 text-orange-700";
      case "completed": return "bg-emerald-100 text-emerald-700";
      case "finalised": return "bg-green-100 text-green-700";
      case "declined": return "bg-red-100 text-red-700";
      case "expired": return "bg-gray-100 text-gray-500";
      case "voided": return "bg-gray-100 text-gray-500";
      default: return "bg-gray-100 text-gray-700";
    }
  };

  return (
    <div className="p-4 sm:p-6 space-y-4 sm:space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Document Hub</h2>
          <p className="text-gray-600 mt-1">Send, track, and manage documents for signature</p>
        </div>
        <Button onClick={() => setCreateOpen(true)}>
          <Plus className="h-4 w-4 mr-2" /> Send for Signature
        </Button>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="draft">Draft</SelectItem>
                <SelectItem value="sent">Sent</SelectItem>
                <SelectItem value="viewed">Viewed</SelectItem>
                <SelectItem value="in_progress">In Progress</SelectItem>
                <SelectItem value="finalised">Finalised</SelectItem>
                <SelectItem value="declined">Declined</SelectItem>
                <SelectItem value="expired">Expired</SelectItem>
                <SelectItem value="voided">Voided</SelectItem>
              </SelectContent>
            </Select>
            <Input
              type="date"
              placeholder="From date"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
            />
            <Input
              type="date"
              placeholder="To date"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
            />
          </div>
        </CardContent>
      </Card>

      {/* Documents Table */}
      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="p-8 text-center text-gray-500">Loading documents...</div>
          ) : envelopes.length === 0 ? (
            <div className="p-12 text-center">
              <Send className="h-12 w-12 mx-auto text-gray-300 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-1">No documents yet</h3>
              <p className="text-gray-500 mb-4">Send your first document for signature</p>
              <Button onClick={() => setCreateOpen(true)}>
                <Plus className="h-4 w-4 mr-2" /> Send for Signature
              </Button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Document</TableHead>
                    <TableHead>Recipients</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Sent</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {envelopes.map((env: any) => (
                    <TableRow key={env._id}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {getStatusIcon(env.status)}
                          <div>
                            <p className="font-medium">{env.displayName}</p>
                            <p className="text-xs text-gray-500">
                              Created {new Date(env.createdAt).toLocaleDateString()}
                            </p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        {env.recipients?.map((r: any, i: number) => (
                          <div key={i} className="text-sm">
                            {r.name} <span className="text-gray-400">({r.email})</span>
                          </div>
                        ))}
                      </TableCell>
                      <TableCell>
                        <Badge className={getStatusColor(env.status)}>
                          {env.status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {env.sentAt ? new Date(env.sentAt).toLocaleDateString() : "—"}
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-1">
                          <Link href={`/admin/esign/envelopes/${env._id}`}>
                            <Button variant="ghost" size="sm" title="View details">
                              <Eye className="h-4 w-4" />
                            </Button>
                          </Link>
                          {env.status === "finalised" && (
                            <Button variant="ghost" size="sm" title="Download" onClick={() => handleDownload(env._id)}>
                              <Download className="h-4 w-4" />
                            </Button>
                          )}
                          <Button
                            variant="ghost"
                            size="sm"
                            title="Rename"
                            onClick={() => {
                              setRenameId(env._id);
                              setRenameName(env.displayName);
                              setRenameOpen(true);
                            }}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          {!["finalised", "voided", "expired"].includes(env.status) && (
                            <Button variant="ghost" size="sm" title="Void" className="text-red-500" onClick={() => handleVoid(env._id)}>
                              <XCircle className="h-4 w-4" />
                            </Button>
                          )}
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

      {/* Create / Send Envelope Dialog */}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Send Document for Signature</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <label className="block text-sm font-medium mb-1">Template *</label>
              <Select value={selectedTemplateId} onValueChange={setSelectedTemplateId}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a published template" />
                </SelectTrigger>
                <SelectContent>
                  {templates.map((tpl: any) => (
                    <SelectItem key={tpl._id} value={tpl._id}>{tpl.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Document Name</label>
              <Input
                placeholder="e.g. Employment Agreement - John"
                value={envelopeName}
                onChange={(e) => setEnvelopeName(e.target.value)}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">Recipient Name *</label>
                <Input
                  placeholder="John Doe"
                  value={recipientName}
                  onChange={(e) => setRecipientName(e.target.value)}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Recipient Email *</label>
                <Input
                  type="email"
                  placeholder="john@example.com"
                  value={recipientEmail}
                  onChange={(e) => setRecipientEmail(e.target.value)}
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Expiry (days)</label>
              <Input
                type="number"
                min="1"
                value={expiryDays}
                onChange={(e) => setExpiryDays(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={handleCreateDraft} disabled={creating}>
              Save as Draft
            </Button>
            <Button onClick={handleCreate} disabled={creating}>
              {creating ? "Sending..." : "Send Now"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Rename Dialog */}
      <Dialog open={renameOpen} onOpenChange={setRenameOpen}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Rename Document</DialogTitle>
          </DialogHeader>
          <Input
            value={renameName}
            onChange={(e) => setRenameName(e.target.value)}
            placeholder="Document name"
          />
          <DialogFooter>
            <Button variant="outline" onClick={() => setRenameOpen(false)}>Cancel</Button>
            <Button onClick={handleRename}>Rename</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
