"use client";

import { useState, useEffect } from "react";
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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "../../../components/ui/dialog";
import { api } from "../../../lib/api";
import { Search, RefreshCw, Eye, ChevronLeft, ChevronRight, Activity } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";

interface ZKTecoLog {
  _id: string;
  deviceId: string;
  deviceSn?: string;
  logType: string;
  rawData: string;
  parsedData?: {
    userId?: string;
    timestamp?: string;
    status?: number;
    verifyMode?: number;
    workCode?: number;
    reserved?: string;
  };
  employeeId?: {
    _id: string;
    firstName: string;
    lastName: string;
    employeeCode: string;
    employeeNumber: string;
  } | null;
  processed: boolean;
  processedAt?: string;
  error?: string;
  ipAddress?: string;
  userAgent?: string;
  createdAt: string;
  updatedAt: string;
}

interface Pagination {
  page: number;
  limit: number;
  total: number;
  pages: number;
}

export default function ZKTecoLogsPage() {
  const [logs, setLogs] = useState<ZKTecoLog[]>([]);
  const [pagination, setPagination] = useState<Pagination>({
    page: 1,
    limit: 20,
    total: 0,
    pages: 0,
  });
  const [loading, setLoading] = useState(true);
  const [selectedLog, setSelectedLog] = useState<ZKTecoLog | null>(null);
  const [isDetailDialogOpen, setIsDetailDialogOpen] = useState(false);

  // Filters
  const [deviceIdFilter, setDeviceIdFilter] = useState("");
  const [logTypeFilter, setLogTypeFilter] = useState("all");
  const [processedFilter, setProcessedFilter] = useState("all");

  const fetchLogs = async () => {
    try {
      setLoading(true);
      const params: any = {
        page: pagination.page,
        limit: pagination.limit,
      };

      if (deviceIdFilter.trim()) {
        params.deviceId = deviceIdFilter.trim();
      }
      if (logTypeFilter !== "all") {
        params.logType = logTypeFilter;
      }
      if (processedFilter !== "all") {
        params.processed = processedFilter === "true";
      }

      const response = await api.getZKTecoLogs(params);
      
      if (response.success) {
        setLogs(response.data || []);
        setPagination(response.pagination || pagination);
      } else {
        toast.error("Failed to fetch logs");
      }
    } catch (error: any) {
      console.error("Error fetching ZKTeco logs:", error);
      toast.error(error.message || "Failed to fetch logs");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pagination.page, deviceIdFilter, logTypeFilter, processedFilter]);

  const handlePageChange = (newPage: number) => {
    if (newPage >= 1 && newPage <= pagination.pages) {
      setPagination({ ...pagination, page: newPage });
    }
  };

  const handleViewDetails = (log: ZKTecoLog) => {
    setSelectedLog(log);
    setIsDetailDialogOpen(true);
  };

  const getLogTypeColor = (logType: string) => {
    switch (logType) {
      case "ATTLOG":
        return "bg-blue-100 text-blue-800";
      case "OPERLOG":
        return "bg-purple-100 text-purple-800";
      case "USERINFO":
        return "bg-green-100 text-green-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const truncateText = (text: string, maxLength: number = 100) => {
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + "...";
  };

  return (
    <div className="p-4 sm:p-6 space-y-4 sm:space-y-6 w-full max-w-full overflow-x-hidden">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">ZKTeco Device Logs</h2>
          <p className="text-gray-600 mt-1">
            View raw device logs for debugging and monitoring
          </p>
        </div>
        <Button onClick={fetchLogs} disabled={loading} variant="outline">
          <RefreshCw className={`h-4 w-4 mr-2 ${loading ? "animate-spin" : ""}`} />
          Refresh
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-blue-50 rounded-lg">
                <Activity className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Total Logs</p>
                <p className="text-2xl font-bold text-gray-900">{pagination.total}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-green-50 rounded-lg">
                <Activity className="h-6 w-6 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Processed</p>
                <p className="text-2xl font-bold text-gray-900">
                  {logs.filter((l) => l.processed).length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-yellow-50 rounded-lg">
                <Activity className="h-6 w-6 text-yellow-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Pending</p>
                <p className="text-2xl font-bold text-gray-900">
                  {logs.filter((l) => !l.processed).length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-purple-50 rounded-lg">
                <Activity className="h-6 w-6 text-purple-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Devices</p>
                <p className="text-2xl font-bold text-gray-900">
                  {new Set(logs.map((l) => l.deviceId)).size}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Filters</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Device ID..."
                value={deviceIdFilter}
                onChange={(e) => {
                  setDeviceIdFilter(e.target.value);
                  setPagination({ ...pagination, page: 1 });
                }}
                className="pl-10"
              />
            </div>
            <Select
              value={logTypeFilter}
              onValueChange={(value) => {
                setLogTypeFilter(value);
                setPagination({ ...pagination, page: 1 });
              }}
            >
              <SelectTrigger>
                <SelectValue placeholder="Log Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Log Types</SelectItem>
                <SelectItem value="ATTLOG">ATTLOG</SelectItem>
                <SelectItem value="OPERLOG">OPERLOG</SelectItem>
                <SelectItem value="USERINFO">USERINFO</SelectItem>
                <SelectItem value="FINGERPRINT">FINGERPRINT</SelectItem>
                <SelectItem value="FACE">FACE</SelectItem>
                <SelectItem value="OTHER">OTHER</SelectItem>
              </SelectContent>
            </Select>
            <Select
              value={processedFilter}
              onValueChange={(value) => {
                setProcessedFilter(value);
                setPagination({ ...pagination, page: 1 });
              }}
            >
              <SelectTrigger>
                <SelectValue placeholder="Processed Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All</SelectItem>
                <SelectItem value="true">Processed</SelectItem>
                <SelectItem value="false">Pending</SelectItem>
              </SelectContent>
            </Select>
            <div className="flex items-center text-sm text-gray-600">
              Showing {logs.length} of {pagination.total} logs
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Logs Table */}
      <Card>
        <CardHeader>
          <CardTitle>Device Logs</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8 text-gray-500">Loading logs...</div>
          ) : logs.length === 0 ? (
            <div className="text-center py-8 text-gray-500">No logs found</div>
          ) : (
            <div className="rounded-lg border overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Created At</TableHead>
                    <TableHead>Device ID</TableHead>
                    <TableHead>Device SN</TableHead>
                    <TableHead>Log Type</TableHead>
                    <TableHead>Raw Data</TableHead>
                    <TableHead>User ID</TableHead>
                    <TableHead>Timestamp</TableHead>
                    <TableHead>Employee</TableHead>
                    <TableHead>Processed</TableHead>
                    <TableHead>Error</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {logs.map((log) => (
                    <TableRow key={log._id}>
                      <TableCell className="font-mono text-xs">
                        {format(new Date(log.createdAt), "yyyy-MM-dd HH:mm:ss")}
                      </TableCell>
                      <TableCell className="font-mono text-xs">{log.deviceId}</TableCell>
                      <TableCell className="font-mono text-xs">
                        {log.deviceSn || "N/A"}
                      </TableCell>
                      <TableCell>
                        <Badge className={getLogTypeColor(log.logType)}>
                          {log.logType}
                        </Badge>
                      </TableCell>
                      <TableCell className="max-w-xs">
                        <div className="font-mono text-xs break-words">
                          {truncateText(log.rawData, 80)}
                        </div>
                      </TableCell>
                      <TableCell className="font-mono text-xs">
                        {log.parsedData?.userId || "N/A"}
                      </TableCell>
                      <TableCell className="font-mono text-xs">
                        {log.parsedData?.timestamp
                          ? format(new Date(log.parsedData.timestamp), "yyyy-MM-dd HH:mm:ss")
                          : "N/A"}
                      </TableCell>
                      <TableCell>
                        {log.employeeId ? (
                          <div className="text-sm">
                            <div className="font-medium">
                              {log.employeeId.firstName} {log.employeeId.lastName}
                            </div>
                            <div className="text-xs text-gray-500">
                              {log.employeeId.employeeCode}
                            </div>
                          </div>
                        ) : (
                          <span className="text-gray-400">Not matched</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <Badge
                          className={
                            log.processed
                              ? "bg-green-100 text-green-800"
                              : "bg-yellow-100 text-yellow-800"
                          }
                        >
                          {log.processed ? "Yes" : "No"}
                        </Badge>
                      </TableCell>
                      <TableCell className="max-w-xs">
                        {log.error ? (
                          <div className="text-xs text-red-600 break-words">
                            {truncateText(log.error, 50)}
                          </div>
                        ) : (
                          <span className="text-gray-400">-</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleViewDetails(log)}
                        >
                          <Eye className="h-4 w-4 mr-1" />
                          View
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}

          {/* Pagination */}
          {pagination.pages > 1 && (
            <div className="flex items-center justify-between mt-4">
              <div className="text-sm text-gray-600">
                Page {pagination.page} of {pagination.pages}
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handlePageChange(pagination.page - 1)}
                  disabled={pagination.page === 1 || loading}
                >
                  <ChevronLeft className="h-4 w-4" />
                  Previous
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handlePageChange(pagination.page + 1)}
                  disabled={pagination.page >= pagination.pages || loading}
                >
                  Next
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Detail Dialog */}
      <Dialog open={isDetailDialogOpen} onOpenChange={setIsDetailDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Log Details</DialogTitle>
          </DialogHeader>
          {selectedLog && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-700">Device ID</label>
                  <p className="text-sm font-mono">{selectedLog.deviceId}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700">Device SN</label>
                  <p className="text-sm font-mono">{selectedLog.deviceSn || "N/A"}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700">Log Type</label>
                  <Badge className={getLogTypeColor(selectedLog.logType)}>
                    {selectedLog.logType}
                  </Badge>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700">Processed</label>
                  <Badge
                    className={
                      selectedLog.processed
                        ? "bg-green-100 text-green-800"
                        : "bg-yellow-100 text-yellow-800"
                    }
                  >
                    {selectedLog.processed ? "Yes" : "No"}
                  </Badge>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700">Created At</label>
                  <p className="text-sm">
                    {format(new Date(selectedLog.createdAt), "yyyy-MM-dd HH:mm:ss")}
                  </p>
                </div>
                {selectedLog.processedAt && (
                  <div>
                    <label className="text-sm font-medium text-gray-700">Processed At</label>
                    <p className="text-sm">
                      {format(new Date(selectedLog.processedAt), "yyyy-MM-dd HH:mm:ss")}
                    </p>
                  </div>
                )}
              </div>

              <div>
                <label className="text-sm font-medium text-gray-700">Raw Data</label>
                <pre className="mt-1 p-3 bg-gray-50 rounded border text-xs font-mono overflow-x-auto">
                  {selectedLog.rawData}
                </pre>
              </div>

              {selectedLog.parsedData && (
                <div>
                  <label className="text-sm font-medium text-gray-700">Parsed Data</label>
                  <pre className="mt-1 p-3 bg-gray-50 rounded border text-xs font-mono overflow-x-auto">
                    {JSON.stringify(selectedLog.parsedData, null, 2)}
                  </pre>
                </div>
              )}

              {selectedLog.employeeId && (
                <div>
                  <label className="text-sm font-medium text-gray-700">Matched Employee</label>
                  <div className="mt-1 p-3 bg-blue-50 rounded border">
                    <p className="text-sm font-medium">
                      {selectedLog.employeeId.firstName} {selectedLog.employeeId.lastName}
                    </p>
                    <p className="text-xs text-gray-600">
                      Code: {selectedLog.employeeId.employeeCode} | Number:{" "}
                      {selectedLog.employeeId.employeeNumber}
                    </p>
                  </div>
                </div>
              )}

              {selectedLog.error && (
                <div>
                  <label className="text-sm font-medium text-red-700">Error</label>
                  <pre className="mt-1 p-3 bg-red-50 rounded border text-xs font-mono text-red-800 overflow-x-auto">
                    {selectedLog.error}
                  </pre>
                </div>
              )}

              <div>
                <label className="text-sm font-medium text-gray-700">Full JSON</label>
                <pre className="mt-1 p-3 bg-gray-50 rounded border text-xs font-mono overflow-x-auto max-h-96">
                  {JSON.stringify(selectedLog, null, 2)}
                </pre>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
