"use client";

import { useState, useEffect, Suspense } from "react";
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
import { api } from "../../../../lib/api";
import { toast } from "sonner";
import {
  Plus, Send, FileText, Eye, Download, Pencil, XCircle,
  Mail, Clock, CheckCircle2, AlertCircle, Trash2, UserPlus,
  GripVertical,
} from "lucide-react";
import { useEsignEnvelopes, useEsignTemplates } from "../../../../lib/hooks";
import Link from "next/link";

// ─── Recipient color palette ─────────────────────────────────────────────────
const RECIPIENT_COLORS = [
  "#3b82f6", // blue
  "#8b5cf6", // purple
  "#10b981", // emerald
  "#f59e0b", // amber
  "#ef4444", // red
  "#ec4899", // pink
  "#06b6d4", // cyan
  "#84cc16", // lime
];

const RECIPIENT_ROLES = [
  { value: "employee", label: "Employee" },
  { value: "hr", label: "HR Staff" },
  { value: "hr_admin", label: "HR Admin" },
  { value: "manager", label: "Manager" },
  { value: "witness", label: "Witness" },
  { value: "candidate", label: "Candidate" },
];

interface Recipient {
  id: string;
  name: string;
  email: string;
  role: string;
  color: string;
  signingOrder: number;
  employeeId?: string;
}

function generateRecipientId() {
  return "r_" + Math.random().toString(36).substring(2, 9);
}

export default function EsignDocumentsPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-gray-500">Loading...</div>}>
      <EsignDocumentsPageInner />
    </Suspense>
  );
}

function EsignDocumentsPageInner() {
  const searchParams = useSearchParams();

  // ── Filters ───────────────────────────────────────────────────────────────
  const [statusFilter, setStatusFilter] = useState("all");
  const [employeeFilter, setEmployeeFilter] = useState("all");
  const [templateFilter, setTemplateFilter] = useState("all");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [employees, setEmployees] = useState<any[]>([]);

  // ── Create/send dialog state ───────────────────────────────────────────────
  const [createOpen, setCreateOpen] = useState(false);
  const [selectedTemplateId, setSelectedTemplateId] = useState("");
  const [selectedVersionId, setSelectedVersionId] = useState("");
  const [envelopeName, setEnvelopeName] = useState("");
  const [recipients, setRecipients] = useState<Recipient[]>([
    { id: generateRecipientId(), name: "", email: "", role: "employee", color: RECIPIENT_COLORS[0], signingOrder: 1 },
  ]);
  const [expiryDays, setExpiryDays] = useState("30");
  const [reminderEnabled, setReminderEnabled] = useState(false);
  const [reminderDays, setReminderDays] = useState("3");
  const [emailSubject, setEmailSubject] = useState("");
  const [emailBody, setEmailBody] = useState("");
  const [creating, setCreating] = useState(false);

  // ── Rename dialog ─────────────────────────────────────────────────────────
  const [renameOpen, setRenameOpen] = useState(false);
  const [renameId, setRenameId] = useState("");
  const [renameName, setRenameName] = useState("");

  const templateIdFromUrl = searchParams.get("templateId");

  const { data: envelopes = [], loading, refetch } = useEsignEnvelopes({
    status: statusFilter !== "all" ? statusFilter : undefined,
    employeeId: employeeFilter !== "all" ? employeeFilter : undefined,
    templateId: templateFilter !== "all" ? templateFilter : (templateIdFromUrl || undefined),
    dateFrom: dateFrom || undefined,
    dateTo: dateTo || undefined,
  });

  const { data: templates = [] } = useEsignTemplates({ status: "published" });

  useEffect(() => {
    if (templateIdFromUrl) {
      setSelectedTemplateId(templateIdFromUrl);
      setTemplateFilter(templateIdFromUrl);
      setCreateOpen(true);
    }
  }, [templateIdFromUrl]);

  useEffect(() => {
    api.getEmployees({})
      .then((result: any) => setEmployees(Array.isArray(result) ? result : []))
      .catch(() => setEmployees([]));
  }, []);

  // Auto-find published version when template changes
  useEffect(() => {
    if (selectedTemplateId) {
      api.getEsignTemplateById(selectedTemplateId).then((data: any) => {
        const pubVersion = data.versions?.find((v: any) => v.status === "published");
        if (pubVersion) setSelectedVersionId(pubVersion._id);
        else setSelectedVersionId("");
        // Auto-populate doc name from template
        if (!envelopeName) setEnvelopeName(data.name || "");
      }).catch(() => {});
    }
  }, [selectedTemplateId]);

  // ── Recipient helpers ─────────────────────────────────────────────────────
  const addRecipient = () => {
    const order = recipients.length + 1;
    setRecipients((prev) => [
      ...prev,
      {
        id: generateRecipientId(),
        name: "",
        email: "",
        role: "employee",
        color: RECIPIENT_COLORS[(prev.length) % RECIPIENT_COLORS.length],
        signingOrder: order,
      },
    ]);
  };

  const updateRecipient = (id: string, updates: Partial<Recipient>) => {
    setRecipients((prev) => prev.map((r) => (r.id === id ? { ...r, ...updates } : r)));
  };

  const removeRecipient = (id: string) => {
    setRecipients((prev) => prev.filter((r) => r.id !== id).map((r, i) => ({ ...r, signingOrder: i + 1 })));
  };

  // ── Create envelope ───────────────────────────────────────────────────────
  const validateRecipients = () => {
    for (const r of recipients) {
      if (!r.name.trim()) { toast.error("All recipients must have a name"); return false; }
      if (!r.email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(r.email)) {
        toast.error(`Invalid email for recipient: ${r.name || "(unnamed)"}`); return false;
      }
    }
    return true;
  };

  const buildEnvelopePayload = () => {
    const expiryAt = new Date();
    expiryAt.setDate(expiryAt.getDate() + parseInt(expiryDays || "30"));
    return {
      templateId: selectedTemplateId,
      templateVersionId: selectedVersionId,
      displayName: envelopeName || templates.find((t: any) => t._id === selectedTemplateId)?.name || "Untitled Document",
      recipients: recipients.map((r) => ({
        name: r.name.trim(),
        email: r.email.trim().toLowerCase(),
        role: r.role,
        signingOrder: r.signingOrder,
        employeeId: r.employeeId || undefined,
        color: r.color,
      })),
      expiryAt: expiryAt.toISOString(),
      reminderConfig: { enabled: reminderEnabled, intervalDays: parseInt(reminderDays || "3") },
      emailSubject: emailSubject.trim() || undefined,
      emailBody: emailBody.trim() || undefined,
    };
  };

  const handleSendNow = async () => {
    if (!selectedTemplateId || !selectedVersionId) {
      toast.error("Please select a published template");
      return;
    }
    if (!validateRecipients()) return;

    try {
      setCreating(true);
      const envelope: any = await api.createEnvelope(buildEnvelopePayload());
      await api.sendEsignEnvelope(envelope._id);
      toast.success(`Document sent to ${recipients.length} recipient${recipients.length > 1 ? "s" : ""}!`);
      resetCreateForm();
      refetch();
    } catch (error: any) {
      toast.error(error.message || "Failed to send");
    } finally {
      setCreating(false);
    }
  };

  const handleSaveDraft = async () => {
    if (!selectedTemplateId || !selectedVersionId) {
      toast.error("Please select a published template");
      return;
    }
    try {
      setCreating(true);
      await api.createEnvelope(buildEnvelopePayload());
      toast.success("Draft saved");
      resetCreateForm();
      refetch();
    } catch (error: any) {
      toast.error(error.message || "Failed to save draft");
    } finally {
      setCreating(false);
    }
  };

  const resetCreateForm = () => {
    setCreateOpen(false);
    setSelectedTemplateId("");
    setSelectedVersionId("");
    setEnvelopeName("");
    setRecipients([
      { id: generateRecipientId(), name: "", email: "", role: "employee", color: RECIPIENT_COLORS[0], signingOrder: 1 },
    ]);
    setExpiryDays("30");
    setReminderEnabled(false);
    setReminderDays("3");
    setEmailSubject("");
    setEmailBody("");
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
      if (result.url) window.open(result.url, "_blank");
    } catch (error: any) {
      toast.error(error.message || "Failed to download");
    }
  };

  // ── UI helpers ─────────────────────────────────────────────────────────────
  const getStatusIcon = (status: string) => {
    const cls = "h-4 w-4";
    switch (status) {
      case "draft": return <FileText className={`${cls} text-gray-400`} />;
      case "sent": return <Mail className={`${cls} text-blue-500`} />;
      case "viewed": return <Eye className={`${cls} text-amber-500`} />;
      case "in_progress": return <Clock className={`${cls} text-orange-500`} />;
      case "completed": return <CheckCircle2 className={`${cls} text-emerald-500`} />;
      case "finalised": return <CheckCircle2 className={`${cls} text-green-600`} />;
      case "declined": return <XCircle className={`${cls} text-red-500`} />;
      default: return <AlertCircle className={`${cls} text-gray-400`} />;
    }
  };

  const getStatusColor = (status: string) => {
    const map: Record<string, string> = {
      draft: "bg-gray-100 text-gray-700",
      sent: "bg-blue-100 text-blue-700",
      viewed: "bg-amber-100 text-amber-700",
      in_progress: "bg-orange-100 text-orange-700",
      completed: "bg-emerald-100 text-emerald-700",
      finalised: "bg-green-100 text-green-700",
      declined: "bg-red-100 text-red-700",
      expired: "bg-gray-100 text-gray-500",
      voided: "bg-gray-100 text-gray-500",
    };
    return map[status] || "bg-gray-100 text-gray-700";
  };

  return (
    <div className="p-4 sm:p-6 space-y-5">
      {/* ── Header ──────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Document Hub</h2>
          <p className="text-gray-500 mt-0.5 text-sm">Send, track, and manage signing requests</p>
        </div>
        <Button onClick={() => setCreateOpen(true)}>
          <Plus className="h-4 w-4 mr-1.5" /> Send for Signature
        </Button>
      </div>

      {/* ── Filters ─────────────────────────────────────────────── */}
      <Card>
        <CardContent className="p-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger><SelectValue placeholder="All Statuses" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                {["draft","sent","viewed","in_progress","completed","finalised","declined","expired","voided"].map((s) => (
                  <SelectItem key={s} value={s}>{s.replace("_", " ").replace(/\b\w/g, c => c.toUpperCase())}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={employeeFilter} onValueChange={setEmployeeFilter}>
              <SelectTrigger><SelectValue placeholder="All Employees" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Employees</SelectItem>
                {employees.map((emp: any) => (
                  <SelectItem key={emp._id} value={emp._id}>
                    {emp.firstName} {emp.lastName}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={templateFilter} onValueChange={setTemplateFilter}>
              <SelectTrigger><SelectValue placeholder="All Templates" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Templates</SelectItem>
                {templates.map((tpl: any) => (
                  <SelectItem key={tpl._id} value={tpl._id}>{tpl.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Input type="date" placeholder="From" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} />
            <Input type="date" placeholder="To" value={dateTo} onChange={(e) => setDateTo(e.target.value)} />
          </div>
        </CardContent>
      </Card>

      {/* ── Table ───────────────────────────────────────────────── */}
      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="p-10 text-center text-gray-400">Loading documents...</div>
          ) : envelopes.length === 0 ? (
            <div className="p-14 text-center">
              <Send className="h-12 w-12 mx-auto text-gray-200 mb-4" />
              <h3 className="text-lg font-semibold text-gray-800 mb-1">No documents yet</h3>
              <p className="text-gray-400 text-sm mb-4">Send your first document for signature</p>
              <Button onClick={() => setCreateOpen(true)}>
                <Plus className="h-4 w-4 mr-1.5" /> Send for Signature
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
                    <TableHead>Expires</TableHead>
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
                            <p className="font-medium text-sm">{env.displayName}</p>
                            <p className="text-xs text-gray-400">
                              {new Date(env.createdAt).toLocaleDateString()}
                            </p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="space-y-0.5">
                          {env.recipients?.map((r: any, i: number) => (
                            <div key={i} className="flex items-center gap-1.5 text-xs">
                              <div
                                className="w-2 h-2 rounded-full flex-shrink-0"
                                style={{ backgroundColor: r.color || "#94a3b8" }}
                              />
                              <span className="text-gray-700 truncate max-w-32">{r.name}</span>
                              <Badge className={
                                r.status === "signed" ? "bg-green-100 text-green-700 text-[9px] px-1 py-0" :
                                r.status === "viewed" ? "bg-amber-100 text-amber-700 text-[9px] px-1 py-0" :
                                "bg-gray-100 text-gray-500 text-[9px] px-1 py-0"
                              }>
                                {r.status}
                              </Badge>
                            </div>
                          ))}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge className={getStatusColor(env.status)}>
                          {env.status.replace("_", " ")}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm text-gray-500">
                        {env.sentAt ? new Date(env.sentAt).toLocaleDateString() : "—"}
                      </TableCell>
                      <TableCell className="text-sm text-gray-500">
                        {env.expiryAt ? new Date(env.expiryAt).toLocaleDateString() : "—"}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-0.5">
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
                            variant="ghost" size="sm" title="Rename"
                            onClick={() => { setRenameId(env._id); setRenameName(env.displayName); setRenameOpen(true); }}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          {!["finalised", "voided", "expired"].includes(env.status) && (
                            <Button
                              variant="ghost" size="sm" title="Void"
                              className="text-red-400 hover:text-red-600"
                              onClick={() => handleVoid(env._id)}
                            >
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

      {/* ── Create / Send Dialog ─────────────────────────────────── */}
      <Dialog open={createOpen} onOpenChange={(open) => { if (!open) resetCreateForm(); else setCreateOpen(true); }}>
        <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Send className="h-5 w-5 text-blue-600" />
              Send Document for Signature
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-6 py-2">
            {/* Template selection */}
            <div className="space-y-3">
              <h4 className="text-sm font-semibold text-gray-700">1. Select Template</h4>
              <Select value={selectedTemplateId} onValueChange={setSelectedTemplateId}>
                <SelectTrigger>
                  <SelectValue placeholder="Choose a published template..." />
                </SelectTrigger>
                <SelectContent>
                  {templates.length === 0 ? (
                    <div className="p-2 text-sm text-gray-400">No published templates available</div>
                  ) : (
                    templates.map((tpl: any) => (
                      <SelectItem key={tpl._id} value={tpl._id}>{tpl.name}</SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
              {selectedTemplateId && !selectedVersionId && (
                <p className="text-xs text-amber-600 bg-amber-50 px-3 py-2 rounded-lg">
                  This template has no published version. Please publish a version before sending.
                </p>
              )}
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">Document Name</label>
                <Input
                  placeholder="e.g. Employment Agreement — John Doe"
                  value={envelopeName}
                  onChange={(e) => setEnvelopeName(e.target.value)}
                />
              </div>
            </div>

            <hr />

            {/* Recipients */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-semibold text-gray-700">2. Add Recipients</h4>
                <button
                  className="flex items-center gap-1.5 text-xs text-blue-600 hover:text-blue-700 font-medium"
                  onClick={addRecipient}
                >
                  <UserPlus className="h-3.5 w-3.5" /> Add Recipient
                </button>
              </div>

              <div className="space-y-3">
                {recipients.map((r, i) => (
                  <div
                    key={r.id}
                    className="flex items-start gap-2 p-3 bg-gray-50 rounded-xl border border-gray-100"
                  >
                    {/* Color indicator + order */}
                    <div className="flex flex-col items-center gap-1 flex-shrink-0 pt-0.5">
                      <div
                        className="w-7 h-7 rounded-full flex items-center justify-center text-white text-xs font-bold shadow-sm"
                        style={{ backgroundColor: r.color }}
                      >
                        {i + 1}
                      </div>
                      {/* Color picker */}
                      <div className="flex flex-wrap gap-0.5 w-7">
                        {RECIPIENT_COLORS.map((c) => (
                          <button
                            key={c}
                            className={`w-2.5 h-2.5 rounded-full transition-transform ${r.color === c ? "ring-1 ring-offset-1 ring-gray-400 scale-110" : ""}`}
                            style={{ backgroundColor: c }}
                            onClick={() => updateRecipient(r.id, { color: c })}
                          />
                        ))}
                      </div>
                    </div>

                    <div className="flex-1 grid grid-cols-2 gap-2">
                      <div>
                        <label className="block text-[10px] text-gray-400 mb-0.5">Name *</label>
                        <Input
                          placeholder="Full name"
                          value={r.name}
                          onChange={(e) => updateRecipient(r.id, { name: e.target.value })}
                          className="h-8 text-sm"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] text-gray-400 mb-0.5">Email *</label>
                        <Input
                          type="email"
                          placeholder="email@example.com"
                          value={r.email}
                          onChange={(e) => updateRecipient(r.id, { email: e.target.value })}
                          className="h-8 text-sm"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] text-gray-400 mb-0.5">Role</label>
                        <Select value={r.role} onValueChange={(v) => updateRecipient(r.id, { role: v })}>
                          <SelectTrigger className="h-8 text-sm"><SelectValue /></SelectTrigger>
                          <SelectContent>
                            {RECIPIENT_ROLES.map((role) => (
                              <SelectItem key={role.value} value={role.value}>{role.label}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <label className="block text-[10px] text-gray-400 mb-0.5">Signing Order</label>
                        <Input
                          type="number"
                          min={1}
                          max={recipients.length}
                          value={r.signingOrder}
                          onChange={(e) => updateRecipient(r.id, { signingOrder: parseInt(e.target.value) || 1 })}
                          className="h-8 text-sm"
                        />
                      </div>
                      <div className="col-span-2">
                        <label className="block text-[10px] text-gray-400 mb-0.5">Link to Employee (optional)</label>
                        <Select
                          value={r.employeeId || "none"}
                          onValueChange={(v) => updateRecipient(r.id, { employeeId: v === "none" ? undefined : v })}
                        >
                          <SelectTrigger className="h-8 text-sm"><SelectValue placeholder="No employee link" /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="none">No link</SelectItem>
                            {employees.map((emp: any) => (
                              <SelectItem key={emp._id} value={emp._id}>
                                {emp.firstName} {emp.lastName} ({emp.email || emp.employeeId})
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    {recipients.length > 1 && (
                      <button
                        className="p-1 hover:bg-red-50 text-red-400 hover:text-red-600 rounded-lg flex-shrink-0 mt-0.5"
                        onClick={() => removeRecipient(r.id)}
                        title="Remove recipient"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                ))}
              </div>

              {recipients.length > 1 && (
                <p className="text-xs text-blue-600 bg-blue-50 rounded-lg px-3 py-2">
                  Recipients will sign in order of their signing order number. Recipients with the same order sign simultaneously.
                </p>
              )}
            </div>

            <hr />

            {/* Settings */}
            <div className="space-y-3">
              <h4 className="text-sm font-semibold text-gray-700">3. Settings</h4>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">Expires in (days)</label>
                  <Input
                    type="number"
                    min={1}
                    value={expiryDays}
                    onChange={(e) => setExpiryDays(e.target.value)}
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">Reminder interval (days)</label>
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      id="reminder-toggle"
                      checked={reminderEnabled}
                      onChange={(e) => setReminderEnabled(e.target.checked)}
                      className="rounded"
                    />
                    <label htmlFor="reminder-toggle" className="text-xs text-gray-600 flex-1">
                      Enable reminders
                    </label>
                    <Input
                      type="number"
                      min={1}
                      value={reminderDays}
                      onChange={(e) => setReminderDays(e.target.value)}
                      disabled={!reminderEnabled}
                      className="w-16 h-8 text-xs"
                    />
                  </div>
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">Custom Email Subject (optional)</label>
                <Input
                  placeholder="Signature required: {document name}"
                  value={emailSubject}
                  onChange={(e) => setEmailSubject(e.target.value)}
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">Custom Email Message (optional)</label>
                <textarea
                  className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 resize-none"
                  rows={3}
                  placeholder="Please review and sign the attached document..."
                  value={emailBody}
                  onChange={(e) => setEmailBody(e.target.value)}
                />
              </div>
            </div>
          </div>

          <DialogFooter className="gap-2 pt-2">
            <Button variant="outline" onClick={resetCreateForm}>Cancel</Button>
            <Button variant="outline" onClick={handleSaveDraft} disabled={creating}>
              Save as Draft
            </Button>
            <Button
              onClick={handleSendNow}
              disabled={creating || !selectedVersionId}
            >
              {creating ? "Sending..." : `Send to ${recipients.length} Recipient${recipients.length !== 1 ? "s" : ""}`}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Rename Dialog ────────────────────────────────────────── */}
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
