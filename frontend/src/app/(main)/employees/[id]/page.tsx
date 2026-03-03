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
  const [savingPersonal, setSavingPersonal] = useState(false);
  const [savingJobHistory, setSavingJobHistory] = useState(false);
  const [uploadingDoc, setUploadingDoc] = useState(false);
  const [bankEditMode, setBankEditMode] = useState(false);
  const [bankSaved, setBankSaved] = useState(false);
  const [compEditMode, setCompEditMode] = useState(false);
  const [compSaved, setCompSaved] = useState(false);
  const [basicSalaryAssignmentId, setBasicSalaryAssignmentId] = useState<string | null>(null);
  const [activeBankAccountId, setActiveBankAccountId] = useState<string | null>(null);
  const [jobHistory, setJobHistory] = useState<any[]>([]);

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

  const [personalEditMode, setPersonalEditMode] = useState(false);
  const [personalSaved, setPersonalSaved] = useState(false);
  const [personalForm, setPersonalForm] = useState({
    gender: "",
    maritalStatus: "",
    nic: "",
    nationality: "",
    personalEmail: "",
    personalPhone: "",
    address: "",
  });
  const [originalPersonalForm, setOriginalPersonalForm] = useState({
    gender: "",
    maritalStatus: "",
    nic: "",
    nationality: "",
    personalEmail: "",
    personalPhone: "",
    address: "",
  });
  const [newJobHistory, setNewJobHistory] = useState({
    jobTitle: "",
    company: "",
    startDate: "",
    endDate: "",
    achievements: "",
  });
  const [editingJobHistoryId, setEditingJobHistoryId] = useState<string | null>(null);

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

    const loadEffectiveDatedModules = async () => {
      try {
        const [compAssignments, bankAccounts, personalData, careerData] = await Promise.all([
          api.getEmployeeCompensationComponents(id),
          api.getEmployeeBankAccounts(id),
          api.getEmployeeProfilePersonal(id),
          api.getEmployeeProfileCareer(id),
        ]);
        const basicAssignment = (Array.isArray(compAssignments) ? compAssignments : []).find(
          (row: any) => row.salaryComponentId?.code === "BASIC"
        );
        setBasicSalaryAssignmentId(basicAssignment?._id || null);

        const activeBank = (Array.isArray(bankAccounts) ? bankAccounts : []).find((row: any) => row.isPrimary) ||
          (Array.isArray(bankAccounts) ? bankAccounts[0] : null);
        setActiveBankAccountId(activeBank?._id || null);

        const personal = {
          gender: personalData?.gender || "",
          maritalStatus: personalData?.maritalStatus || "",
          nic: personalData?.nic || "",
          nationality: personalData?.nationality || "",
          personalEmail: personalData?.personalEmail || "",
          personalPhone: personalData?.personalPhone || "",
          address: personalData?.address || "",
        };
        setPersonalForm(personal);
        setOriginalPersonalForm(personal);
        setPersonalSaved(Boolean(
          personal.gender ||
            personal.maritalStatus ||
            personal.nic ||
            personal.nationality ||
            personal.personalEmail ||
            personal.personalPhone ||
            personal.address
        ));
        setPersonalEditMode(
          !(
            personal.gender ||
            personal.maritalStatus ||
            personal.nic ||
            personal.nationality ||
            personal.personalEmail ||
            personal.personalPhone ||
            personal.address
          )
        );
        setJobHistory(Array.isArray(careerData?.jobHistory) ? careerData.jobHistory : []);
      } catch (error) {
        console.error("Failed to load effective-dated compensation/bank modules", error);
      }
    };
    loadEffectiveDatedModules();
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

  const hasPersonalChanges = () => {
    return (
      personalForm.gender !== originalPersonalForm.gender ||
      personalForm.maritalStatus !== originalPersonalForm.maritalStatus ||
      personalForm.nic !== originalPersonalForm.nic ||
      personalForm.nationality !== originalPersonalForm.nationality ||
      personalForm.personalEmail !== originalPersonalForm.personalEmail ||
      personalForm.personalPhone !== originalPersonalForm.personalPhone ||
      personalForm.address !== originalPersonalForm.address
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

      const salaryPayload = {
        salaryComponentId: undefined as any,
        effectiveFrom: new Date().toISOString(),
        amount: compensationForm.salary ? Number(compensationForm.salary) : 0,
      };
      const allComponents = await api.getPayrollComponents();
      const basicSalaryComponent = (Array.isArray(allComponents) ? allComponents : []).find(
        (c: any) => c.code === "BASIC"
      );
      if (basicSalaryComponent?._id) {
        if (basicSalaryAssignmentId) {
          await api.updateEmployeeCompensationComponent(basicSalaryAssignmentId, {
            amount: salaryPayload.amount,
            effectiveFrom: salaryPayload.effectiveFrom,
            isActive: true,
          });
        } else {
          const assignment = await api.assignEmployeeCompensationComponent(id, {
            salaryComponentId: basicSalaryComponent._id,
            effectiveFrom: salaryPayload.effectiveFrom,
            amount: salaryPayload.amount,
          });
          setBasicSalaryAssignmentId(assignment?._id || null);
        }
      }

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
      const payload = {
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
        isPrimary: true,
        effectiveFrom: new Date().toISOString(),
      };

      if (activeBankAccountId) {
        await api.updateEmployeeBankAccount(activeBankAccountId, payload);
      } else {
        const account = await api.createEmployeeBankAccount(id, payload);
        setActiveBankAccountId(account?._id || null);
      }
      // Keep backward compatibility with old embedded field.
      await api.updateEmployee(id, { bankDetails: payload });
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

  const savePersonalDetails = async () => {
    try {
      setSavingPersonal(true);
      await api.updateEmployeeProfilePersonal(id, personalForm);
      setOriginalPersonalForm({ ...personalForm });
      setPersonalSaved(true);
      setPersonalEditMode(false);
      toast.success("Personal details updated");
    } catch (error: any) {
      toast.error(error.message || "Failed to update personal details");
    } finally {
      setSavingPersonal(false);
    }
  };

  const addJobHistory = async () => {
    if (!newJobHistory.jobTitle || !newJobHistory.startDate) {
      toast.error("Job Title and Start Date are required");
      return;
    }
    try {
      setSavingJobHistory(true);
      if (editingJobHistoryId) {
        await api.updateEmployeeProfileJobHistory(id, editingJobHistoryId, newJobHistory);
      } else {
        await api.createEmployeeProfileJobHistory(id, newJobHistory);
      }
      const careerData = await api.getEmployeeProfileCareer(id);
      setJobHistory(Array.isArray(careerData?.jobHistory) ? careerData.jobHistory : []);
      setNewJobHistory({
        jobTitle: "",
        company: "",
        startDate: "",
        endDate: "",
        achievements: "",
      });
      setEditingJobHistoryId(null);
      toast.success(editingJobHistoryId ? "Job history updated" : "Job history added");
    } catch (error: any) {
      toast.error(error.message || "Failed to add job history");
    } finally {
      setSavingJobHistory(false);
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
          <TabsTrigger value="personal">Personal</TabsTrigger>
          <TabsTrigger value="career">Career</TabsTrigger>
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

        <TabsContent value="personal" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Personal Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Gender</Label>
                  <Select
                    value={personalForm.gender || undefined}
                    disabled={!personalEditMode}
                    onValueChange={(value) => setPersonalForm((p) => ({ ...p, gender: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select gender" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Male">Male</SelectItem>
                      <SelectItem value="Female">Female</SelectItem>
                      <SelectItem value="Non-binary">Non-binary</SelectItem>
                      <SelectItem value="Other">Other</SelectItem>
                      <SelectItem value="Prefer not to say">Prefer not to say</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Marital Status</Label>
                  <Select
                    value={personalForm.maritalStatus || undefined}
                    disabled={!personalEditMode}
                    onValueChange={(value) => setPersonalForm((p) => ({ ...p, maritalStatus: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select marital status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Single">Single</SelectItem>
                      <SelectItem value="Married">Married</SelectItem>
                      <SelectItem value="Divorced">Divorced</SelectItem>
                      <SelectItem value="Widowed">Widowed</SelectItem>
                      <SelectItem value="Separated">Separated</SelectItem>
                      <SelectItem value="Registered Partnership">Registered Partnership</SelectItem>
                      <SelectItem value="Prefer not to say">Prefer not to say</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>NIC / ID</Label>
                  <Input
                    disabled={!personalEditMode}
                    value={personalForm.nic}
                    onChange={(e) => setPersonalForm((p) => ({ ...p, nic: e.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Nationality</Label>
                  <Input
                    disabled={!personalEditMode}
                    value={personalForm.nationality}
                    onChange={(e) => setPersonalForm((p) => ({ ...p, nationality: e.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Personal Email</Label>
                  <Input
                    disabled={!personalEditMode}
                    type="email"
                    value={personalForm.personalEmail}
                    onChange={(e) => setPersonalForm((p) => ({ ...p, personalEmail: e.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Personal Phone</Label>
                  <Input
                    disabled={!personalEditMode}
                    value={personalForm.personalPhone}
                    onChange={(e) => setPersonalForm((p) => ({ ...p, personalPhone: e.target.value }))}
                  />
                </div>
                <div className="space-y-2 md:col-span-2">
                  <Label>Address</Label>
                  <Input
                    disabled={!personalEditMode}
                    value={personalForm.address}
                    onChange={(e) => setPersonalForm((p) => ({ ...p, address: e.target.value }))}
                  />
                </div>
              </div>
              <div className="flex items-center gap-2">
                {personalEditMode ? (
                  <Button
                    onClick={savePersonalDetails}
                    disabled={savingPersonal || !hasPersonalChanges()}
                    className={!hasPersonalChanges() ? "opacity-60 cursor-not-allowed" : ""}
                  >
                    <Save className="h-4 w-4 mr-2" />
                    {savingPersonal ? "Saving..." : "Save Personal Details"}
                  </Button>
                ) : (
                  <>
                    <Button disabled className="opacity-60 cursor-not-allowed">
                      {personalSaved ? "Personal Details Saved" : "Save Personal Details"}
                    </Button>
                    <Button variant="outline" onClick={() => setPersonalEditMode(true)}>
                      <Edit className="h-4 w-4 mr-2" />
                      Edit
                    </Button>
                  </>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="career" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Job History Timeline</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Job Title *</Label>
                  <Input
                    value={newJobHistory.jobTitle}
                    onChange={(e) => setNewJobHistory((p) => ({ ...p, jobTitle: e.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Company</Label>
                  <Input
                    value={newJobHistory.company}
                    onChange={(e) => setNewJobHistory((p) => ({ ...p, company: e.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Start Date *</Label>
                  <Input
                    type="date"
                    value={newJobHistory.startDate}
                    onChange={(e) => setNewJobHistory((p) => ({ ...p, startDate: e.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label>End Date</Label>
                  <Input
                    type="date"
                    value={newJobHistory.endDate}
                    onChange={(e) => setNewJobHistory((p) => ({ ...p, endDate: e.target.value }))}
                  />
                </div>
                <div className="space-y-2 md:col-span-2">
                  <Label>Achievements</Label>
                  <Input
                    value={newJobHistory.achievements}
                    onChange={(e) => setNewJobHistory((p) => ({ ...p, achievements: e.target.value }))}
                  />
                </div>
              </div>
              <Button onClick={addJobHistory} disabled={savingJobHistory}>
                {savingJobHistory ? "Adding..." : "Add to Timeline"}
              </Button>

              <div className="pt-4 border-t">
                {jobHistory.length === 0 ? (
                  <p className="text-sm text-gray-500">No job history available.</p>
                ) : (
                  <div className="space-y-3">
                    {jobHistory.map((row: any, idx: number) => (
                      <div key={`${row._id || idx}`} className="border rounded-md p-3 flex flex-col md:flex-row md:items-center md:justify-between gap-3">
                        <div>
                          <p className="font-medium">{row.jobTitle || "N/A"}</p>
                          <p className="text-sm text-gray-600">{row.company || "N/A"}</p>
                          <p className="text-xs text-gray-500">
                            {(row.startDate ? new Date(row.startDate).toLocaleDateString() : "N/A")} -{" "}
                            {(row.endDate ? new Date(row.endDate).toLocaleDateString() : "Current")}
                          </p>
                          {row.achievements && (
                            <p className="text-sm mt-1">{row.achievements}</p>
                          )}
                        </div>
                        <div className="flex items-center gap-2 self-start md:self-auto">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setEditingJobHistoryId(row._id || null);
                              setNewJobHistory({
                                jobTitle: row.jobTitle || "",
                                company: row.company || "",
                                startDate: row.startDate ? new Date(row.startDate).toISOString().split("T")[0] : "",
                                endDate: row.endDate ? new Date(row.endDate).toISOString().split("T")[0] : "",
                                achievements: row.achievements || "",
                              });
                            }}
                          >
                            <Edit className="h-4 w-4 mr-1" />
                            Edit
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            className="text-red-600 border-red-200 hover:bg-red-50"
                            onClick={async () => {
                              if (!row._id) return;
                              const confirmed = window.confirm("Are you sure you want to delete this job history entry?");
                              if (!confirmed) return;
                              try {
                                setSavingJobHistory(true);
                                await api.deleteEmployeeProfileJobHistory(id, row._id);
                                const careerData = await api.getEmployeeProfileCareer(id);
                                setJobHistory(Array.isArray(careerData?.jobHistory) ? careerData.jobHistory : []);
                                toast.success("Job history deleted");
                              } catch (error: any) {
                                toast.error(error.message || "Failed to delete job history");
                              } finally {
                                setSavingJobHistory(false);
                              }
                            }}
                          >
                            <Trash2 className="h-4 w-4 mr-1" />
                            Delete
                          </Button>
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
