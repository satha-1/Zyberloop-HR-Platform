"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "../../../../components/ui/card";
import { Button } from "../../../../components/ui/button";
import { Badge } from "../../../../components/ui/badge";
import { ArrowLeft, Mail, Phone, User, Briefcase, Building2, Users, DollarSign, Calendar, Target, GraduationCap, FileText, Shield, MoreHorizontal, Inbox, Edit3 } from "lucide-react";
import { api } from "../../../../lib/api";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../../../../components/ui/table";
import { ProfileSectionCard } from "./components/ProfileSectionCard";
import { ProfileSectionHeader } from "./components/ProfileSectionHeader";
import { ProfileDataTable, ProfileTableRow, ProfileTableCell, ProfileEmptyState } from "./components/ProfileDataTable";
import { ProfileTableSection, ProfileTableColumn } from "./components/ProfileTableSection";
import { cn } from "../../../../components/ui/utils";

// Profile section types
type ProfileSection = 'summary' | 'job' | 'compensation' | 'performance' | 'career' | 'contact' | 'personal' | 'pay' | 'absence' | 'benefits';

// Top tab types
type ProfileTab = 'job-details' | 'service-dates' | 'assigned-roles' | 'support-roles' | 'external-interactions' | 'additional-data' | 'organizations' | 'management-chain';

export default function EmployeeProfile360() {
  const params = useParams();
  const employeeId = params.id as string;
  
  const [activeSection, setActiveSection] = useState<ProfileSection>('summary');
  const [activeTab, setActiveTab] = useState<ProfileTab>('job-details');
  const [loading, setLoading] = useState(true);
  const [employee, setEmployee] = useState<any>(null);
  const [profileData, setProfileData] = useState<Record<string, any>>({});

  useEffect(() => {
    loadEmployeeData();
  }, [employeeId]);

  useEffect(() => {
    if (employee) {
      loadProfileSection(activeSection);
    }
  }, [activeSection, employee]);

  const loadEmployeeData = async () => {
    try {
      setLoading(true);
      const emp = await api.getEmployeeById(employeeId);
      setEmployee(emp);
      // Load summary by default
      const summary = await api.getEmployeeProfileSummary(employeeId);
      setProfileData({ summary });
    } catch (error) {
      console.error('Error loading employee:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadProfileSection = async (section: ProfileSection) => {
    if (profileData[section]) return; // Already loaded
    
    try {
      let data;
      switch (section) {
        case 'summary':
          data = await api.getEmployeeProfileSummary(employeeId);
          break;
        case 'job':
          data = await api.getEmployeeProfileJob(employeeId);
          break;
        case 'compensation':
          data = await api.getEmployeeProfileCompensation(employeeId);
          break;
        case 'performance':
          data = await api.getEmployeeProfilePerformance(employeeId);
          break;
        case 'career':
          data = await api.getEmployeeProfileCareer(employeeId);
          break;
        case 'contact':
          data = await api.getEmployeeProfileContact(employeeId);
          break;
        case 'personal':
          data = await api.getEmployeeProfilePersonal(employeeId);
          break;
        case 'pay':
          data = await api.getEmployeeProfilePay(employeeId);
          break;
        case 'absence':
          data = await api.getEmployeeProfileAbsence(employeeId);
          break;
        case 'benefits':
          data = await api.getEmployeeProfileBenefits(employeeId);
          break;
      }
      setProfileData(prev => ({ ...prev, [section]: data }));
    } catch (error) {
      console.error(`Error loading ${section}:`, error);
    }
  };

  const loadTabData = async (tab: ProfileTab) => {
    try {
      let data: any;
      switch (tab) {
        case 'service-dates':
          data = await api.getEmployeeProfileServiceDates(employeeId);
          break;
        case 'assigned-roles':
          data = await api.getEmployeeProfileAssignedRoles(employeeId);
          break;
        case 'support-roles':
          data = await api.getEmployeeProfileSupportRoles(employeeId);
          break;
        case 'external-interactions':
          data = await api.getEmployeeProfileExternalInteractions(employeeId);
          break;
        case 'additional-data':
          data = await api.getEmployeeProfileAdditionalData(employeeId);
          break;
        case 'organizations':
          data = await api.getEmployeeProfileOrganizations(employeeId);
          break;
        case 'management-chain':
          data = await api.getEmployeeProfileManagementChain(employeeId);
          break;
      }
      setProfileData(prev => ({ ...prev, [tab]: data }));
    } catch (error) {
      console.error(`Error loading ${tab}:`, error);
    }
  };

  useEffect(() => {
    if (activeTab !== 'job-details') {
      loadTabData(activeTab);
    }
  }, [activeTab]);

  if (loading || !employee) {
    return (
      <div className="p-6">
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-gray-500">Loading employee profile...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const firstName = employee.firstName || "";
  const lastName = employee.lastName || "";
  const email = employee.email || "";
  const phone = employee.phone || "";
  const grade = employee.grade || "";
  const department = employee.departmentId?.name || "N/A";
  const status = employee.status || "active";

  const profileSections: { id: ProfileSection; label: string; icon: any }[] = [
    { id: 'summary', label: 'Summary', icon: User },
    { id: 'job', label: 'Job', icon: Briefcase },
    { id: 'compensation', label: 'Compensation', icon: DollarSign },
    { id: 'performance', label: 'Performance', icon: Target },
    { id: 'career', label: 'Career', icon: GraduationCap },
    { id: 'contact', label: 'Contact', icon: Phone },
    { id: 'personal', label: 'Personal', icon: User },
    { id: 'pay', label: 'Pay', icon: DollarSign },
    { id: 'absence', label: 'Absence', icon: Calendar },
    { id: 'benefits', label: 'Benefits', icon: Shield },
  ];

  const renderSectionContent = () => {
    const data = profileData[activeSection];
    if (!data) {
      return <div className="text-center py-8 text-gray-500">Loading...</div>;
    }

    switch (activeSection) {
      case 'summary':
        return <SummarySection data={data} employee={employee} />;
      case 'job':
        return <JobSection data={data} />;
      case 'compensation':
        return <CompensationSection data={data} />;
      case 'performance':
        return <PerformanceSection data={data} />;
      case 'career':
        return <CareerSection data={data} />;
      case 'contact':
        return <ContactSection data={data} />;
      case 'personal':
        return <PersonalSection data={data} />;
      case 'pay':
        return <PaySection data={data} />;
      case 'absence':
        return <AbsenceSection data={data} />;
      case 'benefits':
        return <BenefitsSection data={data} />;
      default:
        return <div>Section not implemented</div>;
    }
  };

  const renderTabContent = () => {
    // Left sidebar is always visible
    const leftSidebar = (
      <div className="w-64 flex-shrink-0">
        <Card className="sticky top-6">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-700">Profile Sections</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <nav className="space-y-0.5 p-2">
              {profileSections.map((section) => {
                const Icon = section.icon;
                return (
                  <button
                    key={section.id}
                    onClick={() => {
                      setActiveSection(section.id);
                      setActiveTab('job-details'); // Switch to job-details tab when selecting a section
                    }}
                    className={`w-full flex items-center gap-3 px-3 py-2.5 text-sm font-medium rounded-lg transition-colors ${
                      activeSection === section.id && activeTab === 'job-details'
                        ? 'bg-blue-50 text-blue-700'
                        : 'text-gray-700 hover:bg-gray-100'
                    }`}
                  >
                    <Icon className="h-4 w-4 flex-shrink-0" />
                    <span className="truncate">{section.label}</span>
                  </button>
                );
              })}
            </nav>
          </CardContent>
        </Card>
      </div>
    );

    // Main content area
    const mainContent = activeTab === 'job-details' ? (
      <div className="flex-1 min-w-0">
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
          {renderSectionContent()}
        </div>
      </div>
    ) : (
      <div className="flex-1 min-w-0">
        {(() => {
          const tabData = profileData[activeTab];
          if (!tabData) {
            return (
              <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
                <div className="text-center py-8 text-gray-500">Loading...</div>
              </div>
            );
          }

          switch (activeTab) {
            case 'service-dates':
              return <ServiceDatesTab data={tabData} />;
            case 'assigned-roles':
              return <AssignedRolesTab data={tabData} />;
            case 'support-roles':
              return <SupportRolesTab data={tabData} />;
            case 'external-interactions':
              return <ExternalInteractionsTab data={tabData} />;
            case 'additional-data':
              return <AdditionalDataTab data={tabData} />;
            case 'organizations':
              return <OrganizationsTab data={tabData} />;
            case 'management-chain':
              return <ManagementChainTab data={tabData} />;
            default:
              return <div>Tab content not implemented</div>;
          }
        })()}
      </div>
    );

    return (
      <div className="flex gap-6">
        {leftSidebar}
        {mainContent}
      </div>
    );
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-[1600px] mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-4">
          <Link href="/employees">
            <Button variant="outline" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{firstName} {lastName}</h1>
            <p className="text-sm text-gray-600">{grade} • {department}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Link href={`/employees/${employeeId}`}>
            <Button variant="outline" size="sm">
              <Edit3 className="h-4 w-4 mr-2" />
              Manage & Edit
            </Button>
          </Link>
          <Button variant="outline" size="sm">
            <Mail className="h-4 w-4 mr-2" />
            Email
          </Button>
          <Button variant="outline" size="sm">
            <Users className="h-4 w-4 mr-2" />
            Team
          </Button>
        </div>
      </div>

      {/* Top Tabs */}
      <div className="border-b border-gray-200">
        <nav className="flex space-x-1 overflow-x-auto -mb-px" aria-label="Tabs">
          {[
            { id: 'job-details', label: 'Job Details' },
            { id: 'service-dates', label: 'Service Dates' },
            { id: 'assigned-roles', label: 'My Assigned Roles' },
            { id: 'support-roles', label: 'Support Roles' },
            { id: 'external-interactions', label: 'External Interactions' },
            { id: 'additional-data', label: 'Additional Data' },
            { id: 'organizations', label: 'Organizations' },
            { id: 'management-chain', label: 'Management Chain' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as ProfileTab)}
              className={cn(
                "px-4 py-2 text-sm font-medium whitespace-nowrap border-b-2 transition-colors",
                activeTab === tab.id
                  ? "border-blue-600 text-blue-600 font-semibold"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              )}
            >
              {tab.label}
            </button>
          ))}
          <button
            disabled
            className="px-4 py-2 text-sm font-medium text-gray-400 cursor-not-allowed"
          >
            <MoreHorizontal className="h-4 w-4" />
          </button>
        </nav>
      </div>

      {/* Tab Content */}
      <div className="mt-6">
        {renderTabContent()}
      </div>
    </div>
  );
}

// Section Components
function SummarySection({ data, employee }: { data: any; employee: any }) {
  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold">Summary</h3>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <p className="text-sm text-gray-500">Employee Code</p>
          <p className="font-medium">{data.employeeCode}</p>
        </div>
        <div>
          <p className="text-sm text-gray-500">Status</p>
          <Badge className={data.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-orange-100 text-orange-800'}>
            {data.status}
          </Badge>
        </div>
        <div>
          <p className="text-sm text-gray-500">Organization</p>
          <p className="font-medium">{data.organization || 'N/A'}</p>
        </div>
        <div>
          <p className="text-sm text-gray-500">Length of Service</p>
          <p className="font-medium">{data.lengthOfService || 'N/A'}</p>
        </div>
        {data.primaryManager && (
          <div className="col-span-2">
            <p className="text-sm text-gray-500">Primary Manager</p>
            <p className="font-medium">{data.primaryManager.name} ({data.primaryManager.employeeCode})</p>
          </div>
        )}
      </div>
    </div>
  );
}

function JobSection({ data }: { data: any }) {
  return (
    <div className="space-y-6">
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
        <h3 className="text-base font-semibold text-gray-900 mb-4">Job Details</h3>
        <div className="space-y-3">
          <div className="flex justify-between items-center py-2 border-b border-gray-100">
            <span className="text-sm font-medium text-gray-700">Employee ID</span>
            <span className="text-sm text-gray-900">{data.employeeCode || 'N/A'}</span>
          </div>
          <div className="flex justify-between items-center py-2 border-b border-gray-100">
            <span className="text-sm font-medium text-gray-700">Position</span>
            <span className="text-sm text-gray-900">{data.position || data.jobTitle || 'N/A'}</span>
          </div>
          <div className="flex justify-between items-center py-2 border-b border-gray-100">
            <span className="text-sm font-medium text-gray-700">Job Profile</span>
            <span className="text-sm text-gray-900">{data.jobProfile || 'N/A'}</span>
          </div>
          <div className="flex justify-between items-center py-2 border-b border-gray-100">
            <span className="text-sm font-medium text-gray-700">Employee Type</span>
            <span className="text-sm text-gray-900">{data.employeeType || 'N/A'}</span>
          </div>
          <div className="flex justify-between items-center py-2 border-b border-gray-100">
            <span className="text-sm font-medium text-gray-700">Time Type</span>
            <span className="text-sm text-gray-900">{data.timeType || 'N/A'}</span>
          </div>
          <div className="flex justify-between items-center py-2 border-b border-gray-100">
            <span className="text-sm font-medium text-gray-700">FTE</span>
            <span className="text-sm text-gray-900">{data.fte || 'N/A'}</span>
          </div>
          <div className="flex justify-between items-center py-2 border-b border-gray-100">
            <span className="text-sm font-medium text-gray-700">Grade</span>
            <span className="text-sm text-gray-900">{data.grade || 'N/A'}</span>
          </div>
          <div className="flex justify-between items-center py-2 border-b border-gray-100">
            <span className="text-sm font-medium text-gray-700">Location</span>
            <span className="text-sm text-gray-900">{data.location || 'N/A'}</span>
          </div>
          <div className="flex justify-between items-center py-2 border-b border-gray-100">
            <span className="text-sm font-medium text-gray-700">Hire Date</span>
            <span className="text-sm text-gray-900">
              {data.hireDate ? new Date(data.hireDate).toLocaleDateString() : 'N/A'}
            </span>
          </div>
          <div className="flex justify-between items-center py-2">
            <span className="text-sm font-medium text-gray-700">Length of Service</span>
            <span className="text-sm font-semibold text-gray-900">{data.lengthOfService || 'N/A'}</span>
          </div>
        </div>
      </div>
    </div>
  );
}

function CompensationSection({ data }: { data: any }) {
  const planAssignments = data.planAssignments || [];
  
  const totalsColumns: ProfileTableColumn[] = [
    { key: "label", header: "Component", align: "left" },
    { key: "amount", header: "Annual Amount (LKR)", align: "right" },
  ];
  
  const totalsRows = [
    {
      label: "Total Salary",
      amount: data.totals?.salary || 0,
    },
    {
      label: "Total Allowances",
      amount: data.totals?.allowances || 0,
    },
    {
      label: "Total Annual",
      amount: data.totals?.total || 0,
      isTotal: true,
    },
  ];
  
  const planColumns: ProfileTableColumn[] = [
    { key: "effectiveDate", header: "Effective Date", align: "left" },
    { key: "planType", header: "Plan Type", align: "left" },
    { key: "compensationPlan", header: "Plan", align: "left" },
    { key: "assignmentDescription", header: "Description", align: "left" },
    { key: "annualAmountLKR", header: "Annual Amount (LKR)", align: "right" },
  ];
  
  return (
    <div className="space-y-6">
      <ProfileTableSection
        title="Totals"
        columns={totalsColumns}
        rows={totalsRows}
        emptyMessage="No compensation totals available."
        renderCell={(columnKey, row, index) => {
          if (columnKey === "amount") {
            return (
              <span className={row.isTotal ? "font-bold text-lg" : "font-semibold"}>
                LKR {row.amount.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </span>
            );
          }
          return <span className={row.isTotal ? "font-bold" : ""}>{row.label}</span>;
        }}
      />
      
      <ProfileTableSection
        title="Plan Assignments"
        columns={planColumns}
        rows={planAssignments}
        emptyMessage="No plan assignments available."
        renderCell={(columnKey, row, index) => {
          if (columnKey === "effectiveDate") {
            return new Date(row.effectiveDate).toLocaleDateString();
          }
          if (columnKey === "annualAmountLKR") {
            return `LKR ${row.annualAmountLKR.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
          }
          return row[columnKey] || "N/A";
        }}
      />
    </div>
  );
}

function PerformanceSection({ data }: { data: any }) {
  const goals = data.currentGoals || [];
  
  const columns: ProfileTableColumn[] = [
    { key: "description", header: "Goal Description", align: "left" },
    { key: "status", header: "Status", align: "left" },
    { key: "progress", header: "Progress", align: "right" },
    { key: "targetDate", header: "Target Date", align: "left" },
  ];
  
  return (
    <div className="space-y-6">
      <ProfileTableSection
        title="Current Goals"
        columns={columns}
        rows={goals}
        emptyMessage="No performance goals available."
        renderCell={(columnKey, row, index) => {
          if (columnKey === "progress") {
            return `${row.progress || 0}%`;
          }
          if (columnKey === "targetDate" && row.targetDate) {
            return new Date(row.targetDate).toLocaleDateString();
          }
          if (columnKey === "status") {
            return (
              <Badge className={
                row.status === "COMPLETED" ? "bg-green-100 text-green-800" :
                row.status === "IN_PROGRESS" ? "bg-blue-100 text-blue-800" :
                "bg-gray-100 text-gray-800"
              }>
                {row.status || "N/A"}
              </Badge>
            );
          }
          return row[columnKey] || "N/A";
        }}
      />
    </div>
  );
}

function CareerSection({ data }: { data: any }) {
  const jobHistory = data.jobHistory || [];
  
  const columns: ProfileTableColumn[] = [
    { key: "jobTitle", header: "Job Title", align: "left" },
    { key: "company", header: "Company", align: "left" },
    { key: "startDate", header: "Start Date", align: "left" },
    { key: "endDate", header: "End Date", align: "left" },
    { key: "achievements", header: "Achievements", align: "left" },
  ];
  
  return (
    <div className="space-y-6">
      <ProfileTableSection
        title="Job History"
        columns={columns}
        rows={jobHistory}
        emptyMessage="No job history available."
        renderCell={(columnKey, row, index) => {
          if (columnKey === "startDate") {
            return new Date(row.startDate).toLocaleDateString();
          }
          if (columnKey === "endDate") {
            return row.endDate ? new Date(row.endDate).toLocaleDateString() : "Current";
          }
          if (columnKey === "jobTitle") {
            return <span className="font-medium text-gray-900">{row.jobTitle}</span>;
          }
          return row[columnKey] || "N/A";
        }}
      />
    </div>
  );
}

function ContactSection({ data }: { data: any }) {
  return (
    <div className="space-y-6">
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
        <h3 className="text-base font-semibold text-gray-900 mb-4">Contact Information</h3>
        <div className="space-y-3">
          <div className="flex justify-between items-center py-2 border-b border-gray-100">
            <span className="text-sm font-medium text-gray-700">Work Email</span>
            <span className="text-sm text-gray-900">{data.workEmail || 'N/A'}</span>
          </div>
          <div className="flex justify-between items-center py-2 border-b border-gray-100">
            <span className="text-sm font-medium text-gray-700">Work Phone</span>
            <span className="text-sm text-gray-900">{data.workPhone || 'N/A'}</span>
          </div>
          <div className="flex justify-between items-center py-2">
            <span className="text-sm font-medium text-gray-700">Office Location</span>
            <span className="text-sm text-gray-900">{data.officeLocation || 'N/A'}</span>
          </div>
        </div>
      </div>
    </div>
  );
}

function PersonalSection({ data }: { data: any }) {
  const emergencyContacts = data.emergencyContacts || [];
  
  const emergencyColumns: ProfileTableColumn[] = [
    { key: "name", header: "Name", align: "left" },
    { key: "relationship", header: "Relationship", align: "left" },
    { key: "phone", header: "Phone", align: "left" },
    { key: "email", header: "Email", align: "left" },
  ];
  
  return (
    <div className="space-y-6">
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
        <h3 className="text-base font-semibold text-gray-900 mb-4">Personal Information</h3>
        <div className="space-y-3">
          <div className="flex justify-between items-center py-2 border-b border-gray-100">
            <span className="text-sm font-medium text-gray-700">Date of Birth</span>
            <span className="text-sm text-gray-900">
              {data.dateOfBirth ? new Date(data.dateOfBirth).toLocaleDateString() : 'N/A'}
            </span>
          </div>
          <div className="flex justify-between items-center py-2 border-b border-gray-100">
            <span className="text-sm font-medium text-gray-700">Gender</span>
            <span className="text-sm text-gray-900">{data.gender || 'N/A'}</span>
          </div>
          <div className="flex justify-between items-center py-2 border-b border-gray-100">
            <span className="text-sm font-medium text-gray-700">Marital Status</span>
            <span className="text-sm text-gray-900">{data.maritalStatus || 'N/A'}</span>
          </div>
          <div className="flex justify-between items-center py-2 border-b border-gray-100">
            <span className="text-sm font-medium text-gray-700">NIC/ID</span>
            <span className="text-sm text-gray-900">{data.nic || 'N/A'}</span>
          </div>
          <div className="flex justify-between items-center py-2 border-b border-gray-100">
            <span className="text-sm font-medium text-gray-700">Nationality</span>
            <span className="text-sm text-gray-900">{data.nationality || 'N/A'}</span>
          </div>
          <div className="flex justify-between items-center py-2 border-b border-gray-100">
            <span className="text-sm font-medium text-gray-700">Personal Email</span>
            <span className="text-sm text-gray-900">{data.personalEmail || 'N/A'}</span>
          </div>
          <div className="flex justify-between items-center py-2 border-b border-gray-100">
            <span className="text-sm font-medium text-gray-700">Personal Phone</span>
            <span className="text-sm text-gray-900">{data.personalPhone || 'N/A'}</span>
          </div>
          <div className="flex justify-between items-center py-2">
            <span className="text-sm font-medium text-gray-700">Address</span>
            <span className="text-sm text-gray-900 text-right max-w-md">{data.address || 'N/A'}</span>
          </div>
        </div>
      </div>
      
      <ProfileTableSection
        title="Emergency Contacts"
        columns={emergencyColumns}
        rows={emergencyContacts}
        emptyMessage="No emergency contacts configured."
        renderCell={(columnKey, row, index) => {
          if (columnKey === "name") {
            return <span className="font-medium text-gray-900">{row.name}</span>;
          }
          return row[columnKey] || "N/A";
        }}
      />
    </div>
  );
}

function PaySection({ data }: { data: any }) {
  const bankAccounts = data.bankAccounts || [];
  
  const columns: ProfileTableColumn[] = [
    { key: "bankName", header: "Bank Name", align: "left" },
    { key: "branch", header: "Branch", align: "left" },
    { key: "accountNumber", header: "Account Number", align: "left" },
    { key: "isPrimary", header: "Primary", align: "center" },
  ];
  
  return (
    <div className="space-y-6">
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
        <h3 className="text-base font-semibold text-gray-900 mb-4">Pay Information</h3>
        <div className="space-y-3">
          <div className="flex justify-between items-center py-2 border-b border-gray-100">
            <span className="text-sm font-medium text-gray-700">Pay Group</span>
            <span className="text-sm text-gray-900">{data.payGroup || 'N/A'}</span>
          </div>
          <div className="flex justify-between items-center py-2 border-b border-gray-100">
            <span className="text-sm font-medium text-gray-700">Pay Frequency</span>
            <span className="text-sm text-gray-900">{data.payFrequency || 'N/A'}</span>
          </div>
          <div className="flex justify-between items-center py-2">
            <span className="text-sm font-medium text-gray-700">Payroll Currency</span>
            <span className="text-sm text-gray-900">{data.payrollCurrency || 'LKR'}</span>
          </div>
        </div>
      </div>
      
      <ProfileTableSection
        title="Bank Accounts"
        columns={columns}
        rows={bankAccounts}
        emptyMessage="No bank accounts configured."
        renderCell={(columnKey, row, index) => {
          if (columnKey === "isPrimary") {
            return row.isPrimary ? (
              <Badge className="bg-green-100 text-green-800">Yes</Badge>
            ) : (
              <span className="text-gray-500">No</span>
            );
          }
          return row[columnKey] || "N/A";
        }}
      />
    </div>
  );
}

function AbsenceSection({ data }: { data: any }) {
  const balances = data.balances || [];
  
  const columns: ProfileTableColumn[] = [
    { key: "plan", header: "Plan", align: "left" },
    { key: "unit", header: "Unit", align: "left" },
    { key: "beginningBalance", header: "Beginning Balance", align: "right" },
    { key: "accruedYTD", header: "Accrued YTD", align: "right" },
    { key: "takenYTD", header: "Taken YTD", align: "right" },
    { key: "carryOver", header: "Carry Over", align: "right" },
    { key: "forfeited", header: "Forfeited", align: "right" },
    { key: "balanceAsOfDate", header: "Balance As Of", align: "left" },
  ];
  
  return (
    <div className="space-y-6">
      <ProfileTableSection
        title="Balances Tracked in Days"
        columns={columns}
        rows={balances}
        emptyMessage="No absence balances available."
        renderCell={(columnKey, row, index) => {
          if (columnKey === "plan") {
            return <span className="font-medium text-gray-900">{row.plan}</span>;
          }
          if (columnKey === "balanceAsOfDate" && row.balanceAsOfDate) {
            return new Date(row.balanceAsOfDate).toLocaleDateString();
          }
          if (["beginningBalance", "accruedYTD", "takenYTD", "carryOver", "forfeited"].includes(columnKey)) {
            return (row[columnKey] || 0).toLocaleString();
          }
          return row[columnKey] || "N/A";
        }}
      />
    </div>
  );
}

function BenefitsSection({ data }: { data: any }) {
  const benefits = data.benefits || [];
  
  const columns: ProfileTableColumn[] = [
    { key: "benefitType", header: "Benefit Type", align: "left" },
    { key: "planName", header: "Plan Name", align: "left" },
    { key: "provider", header: "Provider", align: "left" },
    { key: "effectiveDate", header: "Effective Date", align: "left" },
    { key: "status", header: "Status", align: "left" },
  ];
  
  return (
    <div className="space-y-6">
      <ProfileTableSection
        title="Benefits"
        columns={columns}
        rows={benefits}
        emptyMessage="No benefits enrolled."
        renderCell={(columnKey, row, index) => {
          if (columnKey === "effectiveDate") {
            return new Date(row.effectiveDate).toLocaleDateString();
          }
          if (columnKey === "status") {
            return (
              <Badge className={
                row.status === "ACTIVE" ? "bg-green-100 text-green-800" :
                row.status === "INACTIVE" ? "bg-gray-100 text-gray-800" :
                "bg-yellow-100 text-yellow-800"
              }>
                {row.status}
              </Badge>
            );
          }
          return row[columnKey] || "N/A";
        }}
      />
    </div>
  );
}

// Tab Components
function ServiceDatesTab({ data }: { data: any }) {
  const serviceDates = [
    { label: "Hire Date", value: new Date(data.hireDate).toLocaleDateString() },
    { label: "Original Hire Date", value: data.originalHireDate ? new Date(data.originalHireDate).toLocaleDateString() : 'N/A' },
    { label: "Continuous Service Date", value: data.continuousServiceDate ? new Date(data.continuousServiceDate).toLocaleDateString() : 'N/A' },
    { label: "Length of Service", value: data.lengthOfService, highlight: true },
    { label: "Benefit Service Date", value: data.benefitServiceDate ? new Date(data.benefitServiceDate).toLocaleDateString() : 'N/A' },
    { label: "Company Service Date", value: data.companyServiceDate ? new Date(data.companyServiceDate).toLocaleDateString() : 'N/A' },
    { label: "Seniority Date", value: data.seniorityDate ? new Date(data.seniorityDate).toLocaleDateString() : 'N/A' },
    { label: "Probation End Date", value: data.probationEndDate ? new Date(data.probationEndDate).toLocaleDateString() : 'N/A' },
  ];
  
  return (
    <ProfileSectionCard>
      <ProfileSectionHeader
        title="Service Dates"
        subtitle="Employment and service-related dates"
      />
      
      <ProfileDataTable headers={["Date Type", "Value"]}>
        {serviceDates.map((item, idx) => (
          <ProfileTableRow key={idx}>
            <ProfileTableCell>
              <span className="font-medium text-gray-700">{item.label}</span>
            </ProfileTableCell>
            <ProfileTableCell>
              <span className={item.highlight ? "font-semibold text-gray-900" : "text-gray-600"}>
                {item.value}
              </span>
            </ProfileTableCell>
          </ProfileTableRow>
        ))}
      </ProfileDataTable>
    </ProfileSectionCard>
  );
}

function AssignedRolesTab({ data }: { data: any }) {
  const roles = data.roles || [];
  
  const columns: ProfileTableColumn[] = [
    { key: "roleName", header: "Role Name", align: "left" },
    { key: "organizationName", header: "Organization Name", align: "left" },
    { key: "organizationType", header: "Organization Type", align: "left" },
    { key: "dateAssigned", header: "Date Assigned", align: "left" },
  ];
  
  return (
    <div className="space-y-6">
      <ProfileTableSection
        title="My Assigned Roles"
        subtitle="Roles assigned for this worker's position"
        columns={columns}
        rows={roles}
        emptyMessage="No roles are currently assigned to this employee."
        renderCell={(columnKey, row, index) => {
          if (columnKey === "dateAssigned") {
            return new Date(row.dateAssigned).toLocaleDateString();
          }
          if (columnKey === "roleName") {
            return <span className="font-medium text-gray-900">{row.roleName}</span>;
          }
          return row[columnKey] || "N/A";
        }}
      />
    </div>
  );
}

function SupportRolesTab({ data }: { data: any }) {
  const roles = data.roles || [];
  
  const columns: ProfileTableColumn[] = [
    { key: "assignableRole", header: "Assignable Role", align: "left" },
    { key: "workerName", header: "Worker Name", align: "left" },
    { key: "organization", header: "Organization", align: "left" },
    { key: "roleEnabledDescription", header: "Description", align: "left" },
    { key: "effectiveStartDate", header: "Effective Start", align: "left" },
    { key: "effectiveEndDate", header: "Effective End", align: "left" },
  ];
  
  return (
    <div className="space-y-6">
      <ProfileTableSection
        title="Support Roles"
        subtitle="Support roles assigned to this employee"
        columns={columns}
        rows={roles}
        emptyMessage="No support roles are currently assigned to this employee."
        renderCell={(columnKey, row, index) => {
          if (columnKey === "effectiveStartDate") {
            return row.effectiveStartDate ? new Date(row.effectiveStartDate).toLocaleDateString() : "N/A";
          }
          if (columnKey === "effectiveEndDate") {
            return row.effectiveEndDate ? new Date(row.effectiveEndDate).toLocaleDateString() : "N/A";
          }
          if (columnKey === "assignableRole") {
            return <span className="font-medium text-gray-900">{row.assignableRole}</span>;
          }
          return row[columnKey] || "N/A";
        }}
      />
    </div>
  );
}

function ExternalInteractionsTab({ data }: { data: any }) {
  const answers = data.answers || {};
  const answerCount = Object.keys(answers).length;
  
  return (
    <ProfileSectionCard>
      <ProfileSectionHeader
        title="External Interactions"
        subtitle="Compliance questionnaire data"
        itemCount={answerCount}
      />
      
      {answerCount > 0 ? (
        <div className="space-y-3">
          {Object.entries(answers).map(([key, value]: [string, any]) => (
            <div key={key} className="p-4 border border-gray-200 rounded-lg bg-gray-50">
              <p className="font-medium text-sm text-gray-900 mb-1">{key}</p>
              <p className="text-sm text-gray-600">{String(value)}</p>
            </div>
          ))}
        </div>
      ) : (
        <ProfileEmptyState
          message="No external interaction data available."
          icon={<Inbox className="h-8 w-8" />}
        />
      )}
    </ProfileSectionCard>
  );
}

function AdditionalDataTab({ data }: { data: any }) {
  const dataGroups = data.dataGroups || {};
  const groupCount = Object.keys(dataGroups).length;
  
  return (
    <ProfileSectionCard>
      <ProfileSectionHeader
        title="Additional Data"
        subtitle="Additional employee data groups"
        itemCount={groupCount}
      />
      
      {groupCount > 0 ? (
        <div className="space-y-4">
          {Object.entries(dataGroups).map(([groupName, groupData]: [string, any]) => (
            <div key={groupName} className="border border-gray-200 rounded-lg p-4 bg-gray-50">
              <h4 className="font-medium text-gray-900 mb-3">{groupName}</h4>
              <pre className="text-xs bg-white p-3 rounded border border-gray-200 overflow-auto">
                {JSON.stringify(groupData, null, 2)}
              </pre>
            </div>
          ))}
        </div>
      ) : (
        <ProfileEmptyState
          message="No additional data available."
          icon={<Inbox className="h-8 w-8" />}
        />
      )}
    </ProfileSectionCard>
  );
}

function OrganizationsTab({ data }: { data: any }) {
  const organizations = data.organizations || [];
  
  const columns: ProfileTableColumn[] = [
    { key: "organizationName", header: "Organization Name", align: "left" },
    { key: "organizationType", header: "Organization Type", align: "left" },
    { key: "organizationSubtype", header: "Subtype", align: "left" },
  ];
  
  return (
    <div className="space-y-6">
      <ProfileTableSection
        title="Organizations"
        subtitle="Organization memberships for this employee"
        columns={columns}
        rows={organizations}
        emptyMessage="No organization memberships available."
        renderCell={(columnKey, row, index) => {
          if (columnKey === "organizationName") {
            return <span className="font-medium text-gray-900">{row.organizationName}</span>;
          }
          return row[columnKey] || "N/A";
        }}
      />
    </div>
  );
}

function ManagementChainTab({ data }: { data: any }) {
  const chain = data.chain || [];
  
  const columns: ProfileTableColumn[] = [
    { key: "levelIndex", header: "Level", align: "left" },
    { key: "organizationName", header: "Organization", align: "left" },
    { key: "managerName", header: "Manager Name", align: "left" },
    { key: "managerTitle", header: "Manager Title", align: "left" },
    { key: "phoneNumber", header: "Phone Number", align: "left" },
  ];
  
  return (
    <div className="space-y-6">
      <ProfileTableSection
        title="Management Chain"
        subtitle="Reporting hierarchy for this employee"
        columns={columns}
        rows={chain}
        emptyMessage="No management chain data available."
        renderCell={(columnKey, row, index) => {
          if (columnKey === "levelIndex") {
            return <span className="font-medium text-gray-900">{row.levelIndex + 1}</span>;
          }
          if (columnKey === "managerName") {
            return <span className="font-medium text-gray-900">{row.managerName}</span>;
          }
          return row[columnKey] || "N/A";
        }}
      />
    </div>
  );
}
