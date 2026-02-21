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
import { useAuditLogs } from "../../../lib/hooks";
import { api } from "../../../lib/api";
import { Search, Download, Filter, FileText, Share2 } from "lucide-react";
import { toast } from "sonner";

export default function AdminLogs() {
  const [searchTerm, setSearchTerm] = useState("");
  const [moduleFilter, setModuleFilter] = useState("all");
  const [actionFilter, setActionFilter] = useState("all");
  const { data: auditLogs = [], loading } = useAuditLogs();

  const filteredLogs = auditLogs.filter((log: any) => {
    const actorName = log.actorName || log.actor_name || "";
    const action = log.action || "";
    const resourceType = log.resourceType || log.module || "";
    const resourceId = log.resourceId || log.resource_id || "";
    
    const matchesSearch =
      actorName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      action.toLowerCase().includes(searchTerm.toLowerCase()) ||
      resourceType.toLowerCase().includes(searchTerm.toLowerCase()) ||
      resourceId.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesModule = moduleFilter === "all" || resourceType === moduleFilter;
    const matchesAction = actionFilter === "all" || action === actionFilter;

    return matchesSearch && matchesModule && matchesAction;
  });

  const modules = Array.from(new Set(auditLogs.map((l: any) => l.resourceType || l.module || "").filter(Boolean)));
  const actions = Array.from(new Set(auditLogs.map((l: any) => l.action || "").filter(Boolean)));

  const handleExport = () => {
    toast.success("Exporting logs... Download will start shortly");
  };

  const handleShare = () => {
    const link = `${window.location.origin}/admin/logs/export/abc123`;
    navigator.clipboard.writeText(link);
    toast.success("Time-limited export link copied to clipboard (expires in 24 hours)");
  };

  const getActionColor = (action: string) => {
    switch (action) {
      case "CREATE":
        return "bg-green-100 text-green-800";
      case "UPDATE":
        return "bg-blue-100 text-blue-800";
      case "DELETE":
        return "bg-red-100 text-red-800";
      case "EXPORT":
        return "bg-purple-100 text-purple-800";
      case "APPROVE":
        return "bg-emerald-100 text-emerald-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  return (
    <div className="p-4 sm:p-6 space-y-4 sm:space-y-6 w-full max-w-full overflow-x-hidden">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Admin Logs & Audit Trail</h2>
          <p className="text-gray-600 mt-1">
            Comprehensive audit logs across all modules and users
          </p>
        </div>
        <div className="flex gap-3">
          <Button variant="outline" onClick={handleShare}>
            <Share2 className="h-4 w-4 mr-2" />
            Share Export Link
          </Button>
          <Button onClick={handleExport}>
            <Download className="h-4 w-4 mr-2" />
            Export Logs
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-blue-50 rounded-lg">
                <FileText className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Total Events</p>
                <p className="text-2xl font-bold text-gray-900">{auditLogs.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-green-50 rounded-lg">
                <FileText className="h-6 w-6 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Today's Events</p>
                <p className="text-2xl font-bold text-gray-900">5</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-purple-50 rounded-lg">
                <FileText className="h-6 w-6 text-purple-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Active Users</p>
                <p className="text-2xl font-bold text-gray-900">3</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-orange-50 rounded-lg">
                <FileText className="h-6 w-6 text-orange-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Modules Tracked</p>
                <p className="text-2xl font-bold text-gray-900">{modules.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Audit Log Search & Filters</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="relative col-span-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search logs..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={moduleFilter} onValueChange={setModuleFilter}>
              <SelectTrigger>
                <Filter className="h-4 w-4 mr-2" />
                <SelectValue placeholder="Filter by module" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Modules</SelectItem>
                {modules.map((module) => (
                  <SelectItem key={module} value={module}>
                    {module}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={actionFilter} onValueChange={setActionFilter}>
              <SelectTrigger>
                <Filter className="h-4 w-4 mr-2" />
                <SelectValue placeholder="Filter by action" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Actions</SelectItem>
                {actions.map((action) => (
                  <SelectItem key={action} value={action}>
                    {action}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Logs Table */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Audit Events</CardTitle>
            <p className="text-sm text-gray-600">
              Showing {filteredLogs.length} of {auditLogs.length} events
            </p>
          </div>
        </CardHeader>
        <CardContent>
          <div className="rounded-lg border overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Timestamp</TableHead>
                  <TableHead>Actor</TableHead>
                  <TableHead>Roles</TableHead>
                  <TableHead>Action</TableHead>
                  <TableHead>Module</TableHead>
                  <TableHead>Resource</TableHead>
                  <TableHead>IP Address</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredLogs.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-8 text-gray-500">
                      No logs found
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredLogs.map((log: any) => (
                    <TableRow key={log._id || log.id}>
                      <TableCell className="font-mono text-xs">
                        {new Date(log.createdAt || log.timestamp).toLocaleString()}
                      </TableCell>
                      <TableCell className="font-medium">{log.actorName || log.actor_name || "N/A"}</TableCell>
                      <TableCell>
                        <div className="flex gap-1 flex-wrap">
                          {(log.actorRoles || log.actor_roles || []).map((role: string, idx: number) => (
                            <Badge key={idx} variant="outline" className="text-xs">
                              {role}
                            </Badge>
                          ))}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge className={getActionColor(log.action)}>{log.action}</Badge>
                      </TableCell>
                      <TableCell>{log.resourceType || log.module || "N/A"}</TableCell>
                      <TableCell className="font-mono text-xs">
                        <div>
                          <p className="text-gray-600">{log.resourceType || log.resource_type || "N/A"}</p>
                          <p>{log.resourceId || log.resource_id || "N/A"}</p>
                        </div>
                      </TableCell>
                      <TableCell className="font-mono text-xs">{log.ipAddress || log.ip_address || "N/A"}</TableCell>
                      <TableCell>
                        <Button variant="ghost" size="sm">
                          View Details
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Log Annotations & Review */}
      <Card>
        <CardHeader>
          <CardTitle>Event Annotations & Review</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="p-4 border rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <div>
                  <p className="font-medium">Payroll Run Update - pr_001</p>
                  <p className="text-sm text-gray-600">By Admin User • 2026-02-21 10:30:45</p>
                </div>
                <div className="flex gap-2">
                  <Badge className="bg-blue-100 text-blue-800">Reviewed</Badge>
                  <Button variant="ghost" size="sm">
                    Add Note
                  </Button>
                </div>
              </div>
              <div className="p-3 bg-gray-50 rounded text-sm text-gray-700">
                <p className="font-medium mb-1">Investigation Note:</p>
                <p>
                  Routine payroll update. Verified with Finance team. No issues found.
                </p>
              </div>
            </div>

            <div className="p-4 border rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <div>
                  <p className="font-medium">Employee Creation - emp_006</p>
                  <p className="text-sm text-gray-600">By Emily Rodriguez • 2026-02-21 09:15:22</p>
                </div>
                <div className="flex gap-2">
                  <Badge variant="outline">Pending Review</Badge>
                  <Button variant="ghost" size="sm">
                    Mark Reviewed
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Retention & Security */}
      <Card>
        <CardHeader>
          <CardTitle>Retention & Security Settings</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 bg-blue-50 rounded-lg">
              <p className="text-sm text-blue-900 font-medium mb-2">Retention Period</p>
              <p className="text-2xl font-bold text-blue-700">10 years</p>
              <p className="text-xs text-blue-600 mt-1">Configurable per compliance needs</p>
            </div>
            <div className="p-4 bg-green-50 rounded-lg">
              <p className="text-sm text-green-900 font-medium mb-2">Field-Level Encryption</p>
              <p className="text-2xl font-bold text-green-700">Active</p>
              <p className="text-xs text-green-600 mt-1">Sensitive PII encrypted</p>
            </div>
            <div className="p-4 bg-purple-50 rounded-lg">
              <p className="text-sm text-purple-900 font-medium mb-2">Legal Holds</p>
              <p className="text-2xl font-bold text-purple-700">2</p>
              <p className="text-xs text-purple-600 mt-1">Read-only for auditors</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
