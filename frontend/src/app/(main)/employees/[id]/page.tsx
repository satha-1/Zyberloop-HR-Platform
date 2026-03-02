"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useSearchParams, useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "../../../components/ui/card";
import { Button } from "../../../components/ui/button";
import { Badge } from "../../../components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../../../components/ui/tabs";
import { Input } from "../../../components/ui/input";
import { Label } from "../../../components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../../../components/ui/select";
import { EmployeeAvatar } from "../../../components/ui/EmployeeAvatar";
import { useEmployee, usePerformanceGoals, usePerformanceCycles } from "../../../lib/hooks";
import { api } from "../../../lib/api";
import { DocumentGenerator } from "../../../components/DocumentGenerator";
import { EditEmployeeDialog } from "../../../components/EditEmployeeDialog";
import { LeaveHistoryDialog } from "../../../components/LeaveHistoryDialog";
import { AssignManagerDialog } from "../../../components/AssignManagerDialog";
import { ArrowLeft, Mail, Phone, Briefcase, Edit, UserPlus, Save, Upload, ExternalLink } from "lucide-react";
import { toast } from "sonner";

const BANK_ACCOUNT_TYPES = ["SAVINGS", "CURRENT", "SALARY", "FIXED_DEPOSIT", "OTHER"] as const;

export default function EmployeeProfile() {
  const params = useParams();
  const searchParams = useSearchParams();
  const router = useRouter();
  const id = params.id as string;
  const { data: employee, loading, refetch } = useEmployee(id);
  const { data: performanceCycles = [] } = usePerformanceCycles();
  const activeCycle = performanceCycles.find((cycle: any) => cycle.status === "ACTIVE");
  const { data: performanceGoals = [], loading: goalsLoading } = usePerformanceGoals(id, activeCycle?._id);

  // Get active tab from URL or default to "overview"
  const activeTab = searchParams.get("tab") || "overview";

  const [documentGeneratorOpen, setDocumentGeneratorOpen] = useState(false);
  const [editEmployeeOpen, setEditEmployeeOpen] = useState(false);
  const [leaveHistoryOpen, setLeaveHistoryOpen] = useState(false);
  const [assignManagerOpen, setAssignManagerOpen] = useState(false);

  const [savingComp, setSavingComp] = useState(false);
  const [savingBank, setSavingBank] = useState(false);
  const [uploadingDoc, setUploadingDoc] = useState(false);
  const [bankEditMode, setBankEditMode] = useState(false);
  const [bankSaved, setBankSaved] = useState(false);
  const [compEditMode, setCompEditMode] = useState(false);
  const [compSaved, setCompSaved] = useState(false);

  const [documents, setDocuments] = useState<any[]>([]);
  const [selectedDocumentType, setSelectedDocumentType] = useState("NIC");
  const [selectedDocumentFile, setSelectedDocumentFile] = useState<File | null>(null);

  const [compensationForm, setCompensationForm] = useState({
    salary: "",
    jobTitle: "",
    employmentType: "permanent",
    workLocation: "",
  });

  const [originalCompensationForm, setOriginalCompensationForm] = useState({
    salary: "",
    jobTitle: "",
    employmentType: "permanent",
    workLocation: "",
  });

  const [bankForm, setBankForm] = useState({
    bankName: "",
    branchName: "",
    branchCode: "",
    accountHolderName: "",
    accountNumber: "",
    accountType: "",
    accountTypeOther: "",
    paymentMethod: "BANK_TRANSFER",
  });

  const [originalBankForm, setOriginalBankForm] = useState({
    bankName: "",
    branchName: "",
    branchCode: "",
    accountHolderName: "",
    accountNumber: "",
    accountType: "",
    accountTypeOther: "",
    paymentMethod: "BANK_TRANSFER",
  });

  useEffect(() => {
    if (!employee) return;

    const compData = {
      salary: employee.salary?.toString() || "",
      jobTitle: employee.jobTitle || employee.grade || "",
      employmentType: employee.employmentType || "permanent",
      workLocation: employee.workLocation || "",
    };
    setCompensationForm(compData);
    setOriginalCompensationForm(compData);

    const bankData = {
      bankName: employee.bankDetails?.bankName || "",
      branchName: employee.bankDetails?.branchName || "",
      branchCode: employee.bankDetails?.branchCode || "",
      accountHolderName: employee.bankDetails?.accountHolderName || "",
      accountNumber: employee.bankDetails?.accountNumber || "",
      accountType: BANK_ACCOUNT_TYPES.includes(employee.bankDetails?.accountType)
        ? employee.bankDetails?.accountType
        : employee.bankDetails?.accountType
        ? "OTHER"
        : "",
      accountTypeOther:
        employee.bankDetails?.accountType &&
        !BANK_ACCOUNT_TYPES.includes(employee.bankDetails?.accountType)
          ? employee.bankDetails?.accountType
          : "",
      paymentMethod: employee.bankDetails?.paymentMethod || "BANK_TRANSFER",
    };
    setBankForm(bankData);
    setOriginalBankForm(bankData);

    const hasBankDetails = Boolean(
      employee.bankDetails?.bankName ||
        employee.bankDetails?.accountNumber ||
        employee.bankDetails?.accountHolderName
    );
    const hasCompDetails = Boolean(
      employee.salary || employee.jobTitle || employee.employmentType || employee.workLocation
    );
    setBankSaved(hasBankDetails);
    setBankEditMode(!hasBankDetails);
    setCompSaved(hasCompDetails);
    setCompEditMode(!hasCompDetails);
  }, [employee]);

  useEffect(() => {
    if (id) {
      loadDocuments();
    }
  }, [id]);

  const loadDocuments = async () => {
    try {
      const docs = await api.getEmployeeDocuments(id);
      setDocuments(Array.isArray(docs) ? docs : []);
    } catch (error) {
      console.error("Failed to load documents", error);
      setDocuments([]);
    }
  };

  const hasCompensationChanges = () => {
    return (
      compensationForm.salary !== originalCompensationForm.salary ||
      compensationForm.jobTitle !== originalCompensationForm.jobTitle ||
      compensationForm.employmentType !== originalCompensationForm.employmentType ||
      compensationForm.workLocation !== originalCompensationForm.workLocation
    );
  };

  const hasBankChanges = () => {
    const currentAccountType =
      bankForm.accountType === "OTHER" ? bankForm.accountTypeOther : bankForm.accountType;
    const originalAccountType =
      originalBankForm.accountType === "OTHER"
        ? originalBankForm.accountTypeOther
        : originalBankForm.accountType;
    return (
      bankForm.bankName !== originalBankForm.bankName ||
      bankForm.branchName !== originalBankForm.branchName ||
      bankForm.branchCode !== originalBankForm.branchCode ||
      bankForm.accountHolderName !== originalBankForm.accountHolderName ||
      bankForm.accountNumber !== originalBankForm.accountNumber ||
      currentAccountType !== originalAccountType ||
      bankForm.paymentMethod !== originalBankForm.paymentMethod
    );
  };

  const handleTabChange = (value: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (value === "overview") {
      params.delete("tab");
    } else {
      params.set("tab", value);
    }
    router.push(`/employees/${id}?${params.toString()}`, { scroll: false });
  };

  const saveCompensation = async () => {
    try {
      setSavingComp(true);
      await api.updateEmployee(id, {
        salary: compensationForm.salary ? Number(compensationForm.salary) : 0,
        jobTitle: compensationForm.jobTitle,
        grade: compensationForm.jobTitle,
        employmentType: compensationForm.employmentType,
        workLocation: compensationForm.workLocation,
      });
      toast.success("Compensation details updated");
      setOriginalCompensationForm({ ...compensationForm });
      setCompSaved(true);
      setCompEditMode(false);
      refetch();
    } catch (error: any) {
      toast.error(error.message || "Failed to update compensation details");
    } finally {
      setSavingComp(false);
    }
  };

  const saveBankDetails = async () => {
    try {
      setSavingBank(true);
      await api.updateEmployee(id, {
        bankDetails: {
          bankName: bankForm.bankName,
          branchName: bankForm.branchName,
          branchCode: bankForm.branchCode,
          accountHolderName: bankForm.accountHolderName,
          accountNumber: bankForm.accountNumber,
          accountType:
            bankForm.accountType === "OTHER"
              ? bankForm.accountTypeOther || "OTHER"
              : bankForm.accountType,
          paymentMethod: bankForm.paymentMethod,
        },
      });
      toast.success("Bank details updated");
      setOriginalBankForm({ ...bankForm });
      setBankSaved(true);
      setBankEditMode(false);
      refetch();
    } catch (error: any) {
      toast.error(error.message || "Failed to update bank details");
    } finally {
      setSavingBank(false);
    }
  };

  const uploadDocument = async () => {
    if (!selectedDocumentFile) {
      toast.error("Please select a file");
      return;
    }

    try {
      setUploadingDoc(true);
      await api.uploadEmployeeDocument(id, selectedDocumentFile, selectedDocumentType);
      toast.success("Document uploaded");
      setSelectedDocumentFile(null);
      await loadDocuments();
    } catch (error: any) {
      toast.error(error.message || "Failed to upload document");
    } finally {
      setUploadingDoc(false);
    }
  };

  if (loading) {
    return (
      <div className="p-6">
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-gray-500">Loading...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!employee) {
    return (
      <div className="p-4 sm:p-6">
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-gray-600">Employee not found</p>
            <Link href="/employees">
              <Button className="mt-4">Back to Employees</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  const displayName = employee.fullName || `${employee.firstName || ""} ${employee.lastName || ""}`.trim();
  const email = employee.email || "";
  const phone = employee.phone || "";
  const title = employee.jobTitle || employee.grade || "";
  const department = employee.departmentId?.name || employee.department || "N/A";
  const status = employee.status || "active";

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:gap-4">
        <Link href="/employees">
          <Button variant="outline" size="sm">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
        </Link>
        <div className="flex-1 min-w-0">
          <h2 className="text-xl sm:text-2xl font-bold text-gray-900 truncate">Employee Master</h2>
          <p className="text-sm text-gray-500 mt-1">View all details and add/edit employee information</p>
        </div>
        <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
          <Link href={`/employees/${id}/profile`}>
            <Button variant="outline" size="sm" className="w-full sm:w-auto">
              <ExternalLink className="h-4 w-4 mr-2" />
              360 Profile
            </Button>
          </Link>
          <Button variant="outline" size="sm" className="w-full sm:w-auto" onClick={() => setEditEmployeeOpen(true)}>
            <Edit className="h-4 w-4 mr-2" />
            Edit Details / Photo
          </Button>
          <Button variant="outline" size="sm" className="w-full sm:w-auto" onClick={() => setAssignManagerOpen(true)}>
            <UserPlus className="h-4 w-4 mr-2" />
            Assign Manager
          </Button>
          <Button onClick={() => setDocumentGeneratorOpen(true)} size="sm" className="w-full sm:w-auto">
            Generate Documents
          </Button>
        </div>
      </div>

      <Card>
        <CardContent className="p-6">
          <div className="flex flex-col sm:flex-row items-start gap-4 sm:gap-6">
            <div className="relative">
              <EmployeeAvatar
                profilePicture={employee.profilePicture}
                firstName={employee.firstName}
                lastName={employee.lastName}
                size="lg"
                className="w-20 h-20 sm:w-24 sm:h-24 border-2 border-gray-200"
              />
              <Button
                size="sm"
                variant="outline"
                className="absolute bottom-0 right-0 rounded-full w-8 h-8 p-0 border-2 border-white shadow-sm"
                onClick={() => setEditEmployeeOpen(true)}
                title="Upload/Change profile photo"
              >
                <Edit className="h-3 w-3" />
              </Button>
            </div>
            <div className="flex-1 min-w-0 w-full sm:w-auto">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4">
                <div className="min-w-0">
                  <h3 className="text-xl sm:text-2xl font-bold text-gray-900 truncate">{displayName}</h3>
                  <p className="text-sm sm:text-base text-gray-600 mt-1">{title || "No job title"}</p>
                </div>
                <Badge className={status === "active" || status === "ACTIVE" ? "bg-green-100 text-green-800" : "bg-orange-100 text-orange-800"}>
                  {status.replace("_", " ")}
                </Badge>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mt-4 sm:mt-6">
                <div className="flex items-center gap-3">
                  <Mail className="h-5 w-5 text-gray-400" />
                  <div>
                    <p className="text-xs text-gray-500">Email</p>
                    <p className="text-sm font-medium text-gray-900">{email || "N/A"}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Phone className="h-5 w-5 text-gray-400" />
                  <div>
                    <p className="text-xs text-gray-500">Phone</p>
                    <p className="text-sm font-medium text-gray-900">{phone || "N/A"}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Briefcase className="h-5 w-5 text-gray-400" />
                  <div>
                    <p className="text-xs text-gray-500">Department</p>
                    <p className="text-sm font-medium text-gray-900">{department}</p>
                  </div>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Employee Number / Code</p>
                  <p className="text-sm font-medium text-gray-900">
                    {(employee.employeeNumber || "N/A") + " / " + (employee.employeeCode || "N/A")}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Tabs value={activeTab} onValueChange={handleTabChange} className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="compensation">Compensation</TabsTrigger>
          <TabsTrigger value="bank">Bank Details</TabsTrigger>
          <TabsTrigger value="documents">Documents</TabsTrigger>
          <TabsTrigger value="performance">Performance</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Core Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 text-sm">
                <div><span className="text-gray-500">Employee Number:</span> <span className="font-medium">{employee.employeeNumber || "N/A"}</span></div>
                <div><span className="text-gray-500">Employee Code:</span> <span className="font-medium">{employee.employeeCode || "N/A"}</span></div>
                <div><span className="text-gray-500">Employment Type:</span> <span className="font-medium">{employee.employmentType || "N/A"}</span></div>
                <div><span className="text-gray-500">Hire Date:</span> <span className="font-medium">{employee.hireDate ? new Date(employee.hireDate).toLocaleDateString() : "N/A"}</span></div>
                <div><span className="text-gray-500">Manager:</span> <span className="font-medium">{employee.managerId ? `${employee.managerId.firstName || ""} ${employee.managerId.lastName || ""}`.trim() : "N/A"}</span></div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Contact & Address</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 text-sm">
                <div><span className="text-gray-500">Current Address:</span> <p className="font-medium">{employee.currentAddress || employee.address || "N/A"}</p></div>
                <div><span className="text-gray-500">Permanent Address:</span> <p className="font-medium">{employee.permanentAddress || "N/A"}</p></div>
                <div><span className="text-gray-500">Emergency Contact:</span> <p className="font-medium">{employee.emergencyContact?.name || "N/A"}</p></div>
                <div><span className="text-gray-500">Emergency Phone:</span> <p className="font-medium">{employee.emergencyContact?.phone || "N/A"}</p></div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="compensation" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Compensation & Employment Terms</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="salary">Basic Salary</Label>
                  <Input
                    id="salary"
                    type="number"
                    disabled={!compEditMode}
                    value={compensationForm.salary}
                    onChange={(e) => setCompensationForm((p) => ({ ...p, salary: e.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="jobTitle">Job Title</Label>
                  <Input
                    id="jobTitle"
                    disabled={!compEditMode}
                    value={compensationForm.jobTitle}
                    onChange={(e) => setCompensationForm((p) => ({ ...p, jobTitle: e.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Employment Type</Label>
                  <Select
                    value={compensationForm.employmentType}
                    disabled={!compEditMode}
                    onValueChange={(value) => setCompensationForm((p) => ({ ...p, employmentType: value }))}
                  >
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="permanent">Permanent</SelectItem>
                      <SelectItem value="contract">Contract</SelectItem>
                      <SelectItem value="intern">Intern</SelectItem>
                      <SelectItem value="casual">Casual</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="workLocation">Work Location</Label>
                  <Input
                    id="workLocation"
                    disabled={!compEditMode}
                    value={compensationForm.workLocation}
                    onChange={(e) => setCompensationForm((p) => ({ ...p, workLocation: e.target.value }))}
                  />
                </div>
              </div>
              <div className="flex items-center gap-2">
                {compEditMode ? (
                  <Button
                    onClick={saveCompensation}
                    disabled={savingComp || !hasCompensationChanges()}
                    className={!hasCompensationChanges() ? "opacity-60 cursor-not-allowed" : ""}
                  >
                    <Save className="h-4 w-4 mr-2" />
                    {savingComp ? "Saving..." : "Save Compensation Details"}
                  </Button>
                ) : (
                  <>
                    <Button disabled className="opacity-60 cursor-not-allowed">
                      {compSaved ? "Compensation Details Saved" : "Save Compensation Details"}
                    </Button>
                    <Button variant="outline" onClick={() => setCompEditMode(true)}>
                      <Edit className="h-4 w-4 mr-2" />
                      Edit
                    </Button>
                  </>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="bank" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Bank Account Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2"><Label>Bank Name</Label><Input disabled={!bankEditMode} value={bankForm.bankName} onChange={(e) => setBankForm((p) => ({ ...p, bankName: e.target.value }))} /></div>
                <div className="space-y-2"><Label>Branch Name</Label><Input disabled={!bankEditMode} value={bankForm.branchName} onChange={(e) => setBankForm((p) => ({ ...p, branchName: e.target.value }))} /></div>
                <div className="space-y-2"><Label>Branch Code</Label><Input disabled={!bankEditMode} value={bankForm.branchCode} onChange={(e) => setBankForm((p) => ({ ...p, branchCode: e.target.value }))} /></div>
                <div className="space-y-2"><Label>Account Holder Name</Label><Input disabled={!bankEditMode} value={bankForm.accountHolderName} onChange={(e) => setBankForm((p) => ({ ...p, accountHolderName: e.target.value }))} /></div>
                <div className="space-y-2"><Label>Account Number</Label><Input disabled={!bankEditMode} value={bankForm.accountNumber} onChange={(e) => setBankForm((p) => ({ ...p, accountNumber: e.target.value }))} /></div>
                <div className="space-y-2">
                  <Label>Account Type</Label>
                  <Select
                    value={bankForm.accountType || undefined}
                    onValueChange={(value) => setBankForm((p) => ({ ...p, accountType: value }))}
                    disabled={!bankEditMode}
                  >
                    <SelectTrigger><SelectValue placeholder="Select account type" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="SAVINGS">Savings</SelectItem>
                      <SelectItem value="CURRENT">Current</SelectItem>
                      <SelectItem value="SALARY">Salary</SelectItem>
                      <SelectItem value="FIXED_DEPOSIT">Fixed Deposit</SelectItem>
                      <SelectItem value="OTHER">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                {bankForm.accountType === "OTHER" && (
                  <div className="space-y-2 md:col-span-2">
                    <Label>Other Account Type</Label>
                    <Input
                      disabled={!bankEditMode}
                      value={bankForm.accountTypeOther}
                      onChange={(e) => setBankForm((p) => ({ ...p, accountTypeOther: e.target.value }))}
                      placeholder="Type account type"
                    />
                  </div>
                )}
              </div>
              <div className="flex items-center gap-2">
                {bankEditMode ? (
                  <Button
                    onClick={saveBankDetails}
                    disabled={savingBank || !hasBankChanges()}
                    className={!hasBankChanges() ? "opacity-60 cursor-not-allowed" : ""}
                  >
                    <Save className="h-4 w-4 mr-2" />
                    {savingBank ? "Saving..." : "Save Bank Details"}
                  </Button>
                ) : (
                  <>
                    <Button disabled className="opacity-60 cursor-not-allowed">
                      {bankSaved ? "Bank Details Saved" : "Save Bank Details"}
                    </Button>
                    <Button variant="outline" onClick={() => setBankEditMode(true)}>
                      <Edit className="h-4 w-4 mr-2" />
                      Edit
                    </Button>
                  </>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="documents" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Documents</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div className="space-y-2">
                  <Label>Document Type</Label>
                  <Select value={selectedDocumentType} onValueChange={setSelectedDocumentType}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="NIC">NIC Copy</SelectItem>
                      <SelectItem value="CONTRACT">Employment Contract</SelectItem>
                      <SelectItem value="APPOINTMENT_LETTER">Appointment Letter</SelectItem>
                      <SelectItem value="CV">CV / Resume</SelectItem>
                      <SelectItem value="CERTIFICATE">Certificates</SelectItem>
                      <SelectItem value="OTHER">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="md:col-span-2 space-y-2">
                  <Label>Upload File</Label>
                  <Input type="file" onChange={(e) => setSelectedDocumentFile(e.target.files?.[0] || null)} />
                </div>
              </div>
              <Button onClick={uploadDocument} disabled={uploadingDoc || !selectedDocumentFile}>
                <Upload className="h-4 w-4 mr-2" />
                {uploadingDoc ? "Uploading..." : "Upload Document"}
              </Button>

              <div className="pt-4 border-t">
                <h4 className="font-medium mb-3">Uploaded Documents</h4>
                {documents.length === 0 ? (
                  <p className="text-sm text-gray-500">No documents uploaded yet.</p>
                ) : (
                  <div className="space-y-2">
                    {documents.map((doc: any) => (
                      <div key={doc._id || doc.id} className="flex items-center justify-between border rounded-md p-3">
                        <div>
                          <p className="font-medium text-sm">{doc.fileName || "Document"}</p>
                          <p className="text-xs text-gray-500">{doc.documentType || "OTHER"} • {doc.uploadedAt ? new Date(doc.uploadedAt).toLocaleString() : ""}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="performance" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>{activeCycle ? `Current Goals - ${activeCycle.name}` : "Performance Goals"}</CardTitle>
            </CardHeader>
            <CardContent>
              {goalsLoading ? (
                <div className="text-center py-8 text-gray-500">Loading goals...</div>
              ) : performanceGoals.length === 0 ? (
                <div className="text-center py-8 text-gray-500">{activeCycle ? "No goals assigned for this cycle" : "No active performance cycle"}</div>
              ) : (
                <div className="space-y-6">
                  {performanceGoals.map((goal: any) => (
                    <div key={goal._id || goal.id}>
                      <div className="flex items-center justify-between mb-2">
                        <div>
                          <p className="font-medium">{goal.description || goal.name}</p>
                          <p className="text-sm text-gray-500">Weight: {goal.weight || 0}%</p>
                        </div>
                        <Badge variant={(goal.progress || 0) >= 100 ? "default" : "secondary"}>{(goal.progress || 0) >= 100 ? "Completed" : "In Progress"}</Badge>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div className="h-2 rounded-full bg-blue-500" style={{ width: `${goal.progress || 0}%` }} />
                      </div>
                      <p className="text-sm text-gray-500 mt-1">{goal.progress || 0}% Complete</p>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <EditEmployeeDialog
        open={editEmployeeOpen}
        onOpenChange={setEditEmployeeOpen}
        employee={employee}
        onSuccess={() => {
          refetch();
          setEditEmployeeOpen(false);
        }}
      />

      <LeaveHistoryDialog
        open={leaveHistoryOpen}
        onOpenChange={setLeaveHistoryOpen}
        employeeId={id}
        employeeName={displayName}
      />

      <AssignManagerDialog
        open={assignManagerOpen}
        onOpenChange={setAssignManagerOpen}
        employee={employee}
        onSuccess={() => {
          refetch();
          setAssignManagerOpen(false);
        }}
      />

      <DocumentGenerator
        employeeId={id}
        employeeName={displayName}
        open={documentGeneratorOpen}
        onOpenChange={setDocumentGeneratorOpen}
      />
    </div>
  );
}
