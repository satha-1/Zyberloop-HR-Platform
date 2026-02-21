"use client";
import { Card, CardContent, CardHeader, CardTitle } from "../../../components/ui/card";
import { Button } from "../../../components/ui/button";
import { Badge } from "../../../components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../../../components/ui/table";
import { Shield, AlertCircle, CheckCircle, Download, FileText } from "lucide-react";
import Link from "next/link";

export default function Compliance() {
  const epfFilings = [
    { month: "February 2026", dueDate: "2026-03-15", status: "Pending", amount: "$91,000" },
    { month: "January 2026", dueDate: "2026-02-15", status: "Filed", amount: "$91,000", filedDate: "2026-02-10" },
    { month: "December 2025", dueDate: "2026-01-15", status: "Filed", amount: "$91,000", filedDate: "2026-01-12" },
  ];

  const visaExpiry = [
    { employee: "Priya Patel", visaType: "Work Permit", expiryDate: "2026-04-15", daysLeft: 53, status: "Upcoming" },
    { employee: "Alex Thompson", visaType: "H1-B", expiryDate: "2026-03-01", daysLeft: 8, status: "Critical" },
  ];

  const auditReports = [
    { name: "EPF Compliance Audit 2025", date: "2026-01-15", type: "Statutory", status: "Completed" },
    { name: "Payroll Records Inspection", date: "2025-12-20", type: "Internal", status: "Completed" },
    { name: "Data Privacy Assessment", date: "2025-11-30", type: "GDPR", status: "Completed" },
  ];

  return (
    <div className="p-4 sm:p-6 space-y-4 sm:space-y-6 w-full max-w-full overflow-x-hidden">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Compliance & Administration</h2>
          <p className="text-gray-600 mt-1">Statutory filings and compliance tracking</p>
        </div>
        <Button>
          <Shield className="h-4 w-4 mr-2" />
          Generate Compliance Report
        </Button>
      </div>

      {/* Alerts */}
      <div className="space-y-3">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start gap-3">
          <AlertCircle className="h-5 w-5 text-red-600 mt-0.5" />
          <div className="flex-1">
            <p className="font-medium text-red-900">Critical: Visa Expiring Soon</p>
            <p className="text-sm text-red-700 mt-1">
              Alex Thompson's work visa expires in 8 days. Immediate action required.
            </p>
          </div>
          <Button size="sm" variant="destructive">
            Take Action
          </Button>
        </div>

        <div className="bg-orange-50 border border-orange-200 rounded-lg p-4 flex items-start gap-3">
          <AlertCircle className="h-5 w-5 text-orange-600 mt-0.5" />
          <div className="flex-1">
            <p className="font-medium text-orange-900">EPF Filing Due: March 15, 2026</p>
            <p className="text-sm text-orange-700 mt-1">
              February 2026 EPF/ETF filing deadline in 22 days
            </p>
          </div>
          <Button size="sm" variant="outline">
            View Details
          </Button>
        </div>
      </div>

      {/* Statutory Filings */}
      <Card>
        <CardHeader>
          <CardTitle>Statutory Filings (Sri Lanka)</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="rounded-lg border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Period</TableHead>
                  <TableHead>Due Date</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Filed Date</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {epfFilings.map((filing, idx) => (
                  <TableRow key={idx}>
                    <TableCell className="font-medium">{filing.month}</TableCell>
                    <TableCell>{new Date(filing.dueDate).toLocaleDateString()}</TableCell>
                    <TableCell>{filing.amount}</TableCell>
                    <TableCell>
                      <Badge
                        className={
                          filing.status === "Filed"
                            ? "bg-green-100 text-green-800"
                            : "bg-orange-100 text-orange-800"
                        }
                      >
                        {filing.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {filing.filedDate ? new Date(filing.filedDate).toLocaleDateString() : "-"}
                    </TableCell>
                    <TableCell>
                      {filing.status === "Pending" ? (
                        <Button variant="ghost" size="sm">
                          Generate Report
                        </Button>
                      ) : (
                        <Button variant="ghost" size="sm">
                          <Download className="h-4 w-4" />
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Visa Expiry Tracking */}
      <Card>
        <CardHeader>
          <CardTitle>Work Visa & Permits</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {visaExpiry.map((visa, idx) => (
              <div
                key={idx}
                className={`p-4 rounded-lg border-2 ${
                  visa.status === "Critical"
                    ? "border-red-500 bg-red-50"
                    : "border-orange-500 bg-orange-50"
                }`}
              >
                <div className="flex items-start justify-between">
                  <div>
                    <h4 className="font-semibold">{visa.employee}</h4>
                    <div className="flex gap-3 mt-1 text-sm text-gray-600">
                      <span>{visa.visaType}</span>
                      <span>•</span>
                      <span>Expires: {new Date(visa.expiryDate).toLocaleDateString()}</span>
                    </div>
                  </div>
                  <div className="text-right">
                    <p
                      className={`text-2xl font-bold ${
                        visa.status === "Critical" ? "text-red-700" : "text-orange-700"
                      }`}
                    >
                      {visa.daysLeft}
                    </p>
                    <p className="text-sm text-gray-600">days left</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Audit Reports */}
      <Card>
        <CardHeader>
          <CardTitle>Audit-Ready Reports</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {auditReports.map((report, idx) => (
              <div key={idx} className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex items-center gap-3">
                  <FileText className="h-5 w-5 text-gray-600" />
                  <div>
                    <p className="font-medium">{report.name}</p>
                    <div className="flex gap-3 mt-1 text-sm text-gray-600">
                      <span>{report.type}</span>
                      <span>•</span>
                      <span>{new Date(report.date).toLocaleDateString()}</span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Badge className="bg-green-100 text-green-800">{report.status}</Badge>
                  <Button variant="ghost" size="sm">
                    <Download className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Immutable Records */}
      <Card>
        <CardHeader>
          <CardTitle>Immutable Filing Records</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="p-4 bg-blue-50 rounded-lg flex items-start gap-3">
              <CheckCircle className="h-5 w-5 text-blue-600 mt-0.5" />
              <div>
                <p className="font-medium text-blue-900">Blockchain-Ready Verification</p>
                <p className="text-sm text-blue-700 mt-1">
                  All statutory filings and acknowledgment receipts maintained in immutable storage
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-4 border rounded-lg text-center">
                <p className="text-sm text-gray-600">Total Filings</p>
                <p className="text-3xl font-bold text-gray-900 mt-2">36</p>
                <p className="text-xs text-gray-500 mt-1">Last 12 months</p>
              </div>
              <div className="p-4 border rounded-lg text-center">
                <p className="text-sm text-gray-600">On-Time Rate</p>
                <p className="text-3xl font-bold text-green-600 mt-2">100%</p>
                <p className="text-xs text-gray-500 mt-1">Perfect compliance</p>
              </div>
              <div className="p-4 border rounded-lg text-center">
                <p className="text-sm text-gray-600">Receipts Stored</p>
                <p className="text-3xl font-bold text-gray-900 mt-2">36</p>
                <p className="text-xs text-gray-500 mt-1">Immutable copies</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* RPA Automation */}
      <Card>
        <CardHeader>
          <CardTitle>Automation & RPA</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="p-4 border rounded-lg flex items-center justify-between">
              <div>
                <p className="font-medium">Auto-File EPF/ETF Forms</p>
                <p className="text-sm text-gray-600 mt-1">
                  Automated upload to government portals
                </p>
              </div>
              <Badge className="bg-green-100 text-green-800">Active</Badge>
            </div>
            <div className="p-4 border rounded-lg flex items-center justify-between">
              <div>
                <p className="font-medium">Bank Reconciliation Bot</p>
                <p className="text-sm text-gray-600 mt-1">
                  Cross-check payroll vs clearing reports
                </p>
              </div>
              <Badge className="bg-green-100 text-green-800">Active</Badge>
            </div>
            <div className="p-4 border rounded-lg flex items-center justify-between">
              <div>
                <p className="font-medium">HR Chatbot</p>
                <p className="text-sm text-gray-600 mt-1">
                  Auto-respond to FAQs and create tickets
                </p>
              </div>
              <Badge className="bg-green-100 text-green-800">Active</Badge>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
