"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "../../../../components/ui/card";
import { Button } from "../../../../components/ui/button";
import { Badge } from "../../../../components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../../../../components/ui/tabs";
import { ArrowLeft, Mail, Phone, User, Briefcase, Building2, Users, DollarSign, Calendar, Target, GraduationCap, FileText, Shield, MoreHorizontal } from "lucide-react";
import { api } from "../../../../lib/api";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../../../../components/ui/table";

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
      let data;
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
    if (activeTab === 'job-details') {
      return (
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          <div className="lg:col-span-1">
            <Card>
              <CardHeader>
                <CardTitle className="text-sm font-medium">Profile Sections</CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <nav className="space-y-1">
                  {profileSections.map((section) => {
                    const Icon = section.icon;
                    return (
                      <button
                        key={section.id}
                        onClick={() => setActiveSection(section.id)}
                        className={`w-full flex items-center gap-3 px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
                          activeSection === section.id
                            ? 'bg-blue-50 text-blue-700'
                            : 'text-gray-700 hover:bg-gray-100'
                        }`}
                      >
                        <Icon className="h-4 w-4" />
                        {section.label}
                      </button>
                    );
                  })}
                </nav>
              </CardContent>
            </Card>
          </div>
          <div className="lg:col-span-3">
            <Card>
              <CardContent className="p-6">
                {renderSectionContent()}
              </CardContent>
            </Card>
          </div>
        </div>
      );
    }

    // Other tabs
    const tabData = profileData[activeTab];
    if (!tabData) {
      return <div className="text-center py-8 text-gray-500">Loading...</div>;
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
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
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
      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as ProfileTab)}>
        <TabsList className="w-full justify-start overflow-x-auto">
          <TabsTrigger value="job-details">Job Details</TabsTrigger>
          <TabsTrigger value="service-dates">Service Dates</TabsTrigger>
          <TabsTrigger value="assigned-roles">My Assigned Roles</TabsTrigger>
          <TabsTrigger value="support-roles">Support Roles</TabsTrigger>
          <TabsTrigger value="external-interactions">External Interactions</TabsTrigger>
          <TabsTrigger value="additional-data">Additional Data</TabsTrigger>
          <TabsTrigger value="organizations">Organizations</TabsTrigger>
          <TabsTrigger value="management-chain">Management Chain</TabsTrigger>
          <TabsTrigger value="more" disabled>
            <MoreHorizontal className="h-4 w-4" />
          </TabsTrigger>
        </TabsList>

        <TabsContent value={activeTab} className="mt-6">
          {renderTabContent()}
        </TabsContent>
      </Tabs>
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
    <div className="space-y-4">
      <h3 className="text-lg font-semibold">Job Details</h3>
      <Table>
        <TableBody>
          <TableRow>
            <TableCell className="font-medium w-1/3">Employee ID</TableCell>
            <TableCell>{data.employeeCode}</TableCell>
          </TableRow>
          <TableRow>
            <TableCell className="font-medium">Position</TableCell>
            <TableCell>{data.position}</TableCell>
          </TableRow>
          <TableRow>
            <TableCell className="font-medium">Job Profile</TableCell>
            <TableCell>{data.jobProfile || 'N/A'}</TableCell>
          </TableRow>
          <TableRow>
            <TableCell className="font-medium">Employee Type</TableCell>
            <TableCell>{data.employeeType}</TableCell>
          </TableRow>
          <TableRow>
            <TableCell className="font-medium">Time Type</TableCell>
            <TableCell>{data.timeType}</TableCell>
          </TableRow>
          <TableRow>
            <TableCell className="font-medium">FTE</TableCell>
            <TableCell>{data.fte}</TableCell>
          </TableRow>
          <TableRow>
            <TableCell className="font-medium">Grade</TableCell>
            <TableCell>{data.grade}</TableCell>
          </TableRow>
          <TableRow>
            <TableCell className="font-medium">Location</TableCell>
            <TableCell>{data.location}</TableCell>
          </TableRow>
          <TableRow>
            <TableCell className="font-medium">Hire Date</TableCell>
            <TableCell>{new Date(data.hireDate).toLocaleDateString()}</TableCell>
          </TableRow>
          <TableRow>
            <TableCell className="font-medium">Length of Service</TableCell>
            <TableCell>{data.lengthOfService}</TableCell>
          </TableRow>
        </TableBody>
      </Table>
    </div>
  );
}

function CompensationSection({ data }: { data: any }) {
  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold">Compensation</h3>
      <div className="space-y-2">
        <div className="flex justify-between">
          <span className="text-sm text-gray-600">Total Salary</span>
          <span className="font-semibold">LKR {data.totals?.salary?.toLocaleString() || '0'}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-sm text-gray-600">Total Allowances</span>
          <span className="font-semibold">LKR {data.totals?.allowances?.toLocaleString() || '0'}</span>
        </div>
        <div className="flex justify-between pt-2 border-t">
          <span className="font-medium">Total Annual</span>
          <span className="font-bold text-lg">LKR {data.totals?.total?.toLocaleString() || '0'}</span>
        </div>
      </div>
      {data.planAssignments && data.planAssignments.length > 0 && (
        <div className="mt-6">
          <h4 className="text-sm font-medium mb-3">Plan Assignments</h4>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Effective Date</TableHead>
                <TableHead>Plan Type</TableHead>
                <TableHead>Plan</TableHead>
                <TableHead className="text-right">Annual Amount (LKR)</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.planAssignments.map((plan: any, idx: number) => (
                <TableRow key={idx}>
                  <TableCell>{new Date(plan.effectiveDate).toLocaleDateString()}</TableCell>
                  <TableCell>{plan.planType}</TableCell>
                  <TableCell>{plan.compensationPlan}</TableCell>
                  <TableCell className="text-right">{plan.annualAmountLKR.toLocaleString()}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}

function PerformanceSection({ data }: { data: any }) {
  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold">Performance</h3>
      <p className="text-sm text-gray-600">Performance data will be integrated with the Performance module.</p>
      {data.currentGoals && data.currentGoals.length > 0 ? (
        <div className="space-y-2">
          {data.currentGoals.map((goal: any, idx: number) => (
            <div key={idx} className="p-3 border rounded">
              <p className="font-medium">{goal.description}</p>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-sm text-gray-500">No performance data available.</p>
      )}
    </div>
  );
}

function CareerSection({ data }: { data: any }) {
  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold">Career History</h3>
      {data.jobHistory && data.jobHistory.length > 0 ? (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Job Title</TableHead>
              <TableHead>Company</TableHead>
              <TableHead>Start Date</TableHead>
              <TableHead>End Date</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.jobHistory.map((job: any, idx: number) => (
              <TableRow key={idx}>
                <TableCell className="font-medium">{job.jobTitle}</TableCell>
                <TableCell>{job.company || 'N/A'}</TableCell>
                <TableCell>{new Date(job.startDate).toLocaleDateString()}</TableCell>
                <TableCell>{job.endDate ? new Date(job.endDate).toLocaleDateString() : 'Current'}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      ) : (
        <p className="text-sm text-gray-500">No job history available.</p>
      )}
    </div>
  );
}

function ContactSection({ data }: { data: any }) {
  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold">Contact Information</h3>
      <Table>
        <TableBody>
          <TableRow>
            <TableCell className="font-medium w-1/3">Work Email</TableCell>
            <TableCell>{data.workEmail || 'N/A'}</TableCell>
          </TableRow>
          <TableRow>
            <TableCell className="font-medium">Work Phone</TableCell>
            <TableCell>{data.workPhone || 'N/A'}</TableCell>
          </TableRow>
          <TableRow>
            <TableCell className="font-medium">Office Location</TableCell>
            <TableCell>{data.officeLocation || 'N/A'}</TableCell>
          </TableRow>
        </TableBody>
      </Table>
    </div>
  );
}

function PersonalSection({ data }: { data: any }) {
  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold">Personal Information</h3>
      <Table>
        <TableBody>
          <TableRow>
            <TableCell className="font-medium w-1/3">Date of Birth</TableCell>
            <TableCell>{data.dateOfBirth ? new Date(data.dateOfBirth).toLocaleDateString() : 'N/A'}</TableCell>
          </TableRow>
          <TableRow>
            <TableCell className="font-medium">Gender</TableCell>
            <TableCell>{data.gender || 'N/A'}</TableCell>
          </TableRow>
          <TableRow>
            <TableCell className="font-medium">Marital Status</TableCell>
            <TableCell>{data.maritalStatus || 'N/A'}</TableCell>
          </TableRow>
          <TableRow>
            <TableCell className="font-medium">NIC/ID</TableCell>
            <TableCell>{data.nic || 'N/A'}</TableCell>
          </TableRow>
          <TableRow>
            <TableCell className="font-medium">Nationality</TableCell>
            <TableCell>{data.nationality || 'N/A'}</TableCell>
          </TableRow>
          <TableRow>
            <TableCell className="font-medium">Personal Email</TableCell>
            <TableCell>{data.personalEmail || 'N/A'}</TableCell>
          </TableRow>
          <TableRow>
            <TableCell className="font-medium">Personal Phone</TableCell>
            <TableCell>{data.personalPhone || 'N/A'}</TableCell>
          </TableRow>
          <TableRow>
            <TableCell className="font-medium">Address</TableCell>
            <TableCell>{data.address || 'N/A'}</TableCell>
          </TableRow>
        </TableBody>
      </Table>
      {data.emergencyContacts && data.emergencyContacts.length > 0 && (
        <div className="mt-6">
          <h4 className="text-sm font-medium mb-3">Emergency Contacts</h4>
          <div className="space-y-2">
            {data.emergencyContacts.map((contact: any, idx: number) => (
              <div key={idx} className="p-3 border rounded">
                <p className="font-medium">{contact.name}</p>
                <p className="text-sm text-gray-600">{contact.relationship} • {contact.phone}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function PaySection({ data }: { data: any }) {
  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold">Pay Information</h3>
      <Table>
        <TableBody>
          <TableRow>
            <TableCell className="font-medium w-1/3">Pay Group</TableCell>
            <TableCell>{data.payGroup || 'N/A'}</TableCell>
          </TableRow>
          <TableRow>
            <TableCell className="font-medium">Pay Frequency</TableCell>
            <TableCell>{data.payFrequency || 'N/A'}</TableCell>
          </TableRow>
          <TableRow>
            <TableCell className="font-medium">Payroll Currency</TableCell>
            <TableCell>{data.payrollCurrency || 'LKR'}</TableCell>
          </TableRow>
        </TableBody>
      </Table>
      {data.bankAccounts && data.bankAccounts.length > 0 && (
        <div className="mt-6">
          <h4 className="text-sm font-medium mb-3">Bank Accounts</h4>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Bank Name</TableHead>
                <TableHead>Branch</TableHead>
                <TableHead>Account Number</TableHead>
                <TableHead>Primary</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.bankAccounts.map((account: any, idx: number) => (
                <TableRow key={idx}>
                  <TableCell>{account.bankName}</TableCell>
                  <TableCell>{account.branch}</TableCell>
                  <TableCell>{account.accountNumber}</TableCell>
                  <TableCell>{account.isPrimary ? 'Yes' : 'No'}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}

function AbsenceSection({ data }: { data: any }) {
  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold">Absence Balances</h3>
      {data.balances && data.balances.length > 0 ? (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Plan</TableHead>
              <TableHead>Unit</TableHead>
              <TableHead className="text-right">Beginning Balance</TableHead>
              <TableHead className="text-right">Accrued YTD</TableHead>
              <TableHead className="text-right">Taken YTD</TableHead>
              <TableHead className="text-right">Carry Over</TableHead>
              <TableHead className="text-right">Forfeited</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.balances.map((balance: any, idx: number) => (
              <TableRow key={idx}>
                <TableCell className="font-medium">{balance.plan}</TableCell>
                <TableCell>{balance.unit}</TableCell>
                <TableCell className="text-right">{balance.beginningBalance}</TableCell>
                <TableCell className="text-right">{balance.accruedYTD}</TableCell>
                <TableCell className="text-right">{balance.takenYTD}</TableCell>
                <TableCell className="text-right">{balance.carryOver}</TableCell>
                <TableCell className="text-right">{balance.forfeited}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      ) : (
        <p className="text-sm text-gray-500">No absence balances available.</p>
      )}
    </div>
  );
}

function BenefitsSection({ data }: { data: any }) {
  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold">Benefits</h3>
      {data.benefits && data.benefits.length > 0 ? (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Benefit Type</TableHead>
              <TableHead>Plan Name</TableHead>
              <TableHead>Provider</TableHead>
              <TableHead>Effective Date</TableHead>
              <TableHead>Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.benefits.map((benefit: any, idx: number) => (
              <TableRow key={idx}>
                <TableCell>{benefit.benefitType}</TableCell>
                <TableCell>{benefit.planName}</TableCell>
                <TableCell>{benefit.provider || 'N/A'}</TableCell>
                <TableCell>{new Date(benefit.effectiveDate).toLocaleDateString()}</TableCell>
                <TableCell>
                  <Badge className={benefit.status === 'ACTIVE' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}>
                    {benefit.status}
                  </Badge>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      ) : (
        <p className="text-sm text-gray-500">No benefits enrolled.</p>
      )}
    </div>
  );
}

// Tab Components
function ServiceDatesTab({ data }: { data: any }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Service Dates</CardTitle>
      </CardHeader>
      <CardContent>
        <Table>
          <TableBody>
            <TableRow>
              <TableCell className="font-medium w-1/3">Hire Date</TableCell>
              <TableCell>{new Date(data.hireDate).toLocaleDateString()}</TableCell>
            </TableRow>
            <TableRow>
              <TableCell className="font-medium">Original Hire Date</TableCell>
              <TableCell>{data.originalHireDate ? new Date(data.originalHireDate).toLocaleDateString() : 'N/A'}</TableCell>
            </TableRow>
            <TableRow>
              <TableCell className="font-medium">Continuous Service Date</TableCell>
              <TableCell>{data.continuousServiceDate ? new Date(data.continuousServiceDate).toLocaleDateString() : 'N/A'}</TableCell>
            </TableRow>
            <TableRow>
              <TableCell className="font-medium">Length of Service</TableCell>
              <TableCell className="font-semibold">{data.lengthOfService}</TableCell>
            </TableRow>
            <TableRow>
              <TableCell className="font-medium">Benefit Service Date</TableCell>
              <TableCell>{data.benefitServiceDate ? new Date(data.benefitServiceDate).toLocaleDateString() : 'N/A'}</TableCell>
            </TableRow>
            <TableRow>
              <TableCell className="font-medium">Company Service Date</TableCell>
              <TableCell>{data.companyServiceDate ? new Date(data.companyServiceDate).toLocaleDateString() : 'N/A'}</TableCell>
            </TableRow>
            <TableRow>
              <TableCell className="font-medium">Seniority Date</TableCell>
              <TableCell>{data.seniorityDate ? new Date(data.seniorityDate).toLocaleDateString() : 'N/A'}</TableCell>
            </TableRow>
            <TableRow>
              <TableCell className="font-medium">Probation End Date</TableCell>
              <TableCell>{data.probationEndDate ? new Date(data.probationEndDate).toLocaleDateString() : 'N/A'}</TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}

function AssignedRolesTab({ data }: { data: any }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>My Assigned Roles</CardTitle>
      </CardHeader>
      <CardContent>
        {data.roles && data.roles.length > 0 ? (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Role Name</TableHead>
                <TableHead>Organization Name</TableHead>
                <TableHead>Organization Type</TableHead>
                <TableHead>Date Assigned</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.roles.map((role: any, idx: number) => (
                <TableRow key={idx}>
                  <TableCell className="font-medium">{role.roleName}</TableCell>
                  <TableCell>{role.organizationName}</TableCell>
                  <TableCell>{role.organizationType}</TableCell>
                  <TableCell>{new Date(role.dateAssigned).toLocaleDateString()}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        ) : (
          <p className="text-sm text-gray-500">No assigned roles.</p>
        )}
      </CardContent>
    </Card>
  );
}

function SupportRolesTab({ data }: { data: any }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Support Roles</CardTitle>
      </CardHeader>
      <CardContent>
        {data.roles && data.roles.length > 0 ? (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Assignable Role</TableHead>
                <TableHead>Worker Name</TableHead>
                <TableHead>Organization</TableHead>
                <TableHead>Effective Start</TableHead>
                <TableHead>Effective End</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.roles.map((role: any, idx: number) => (
                <TableRow key={idx}>
                  <TableCell className="font-medium">{role.assignableRole}</TableCell>
                  <TableCell>{role.workerName}</TableCell>
                  <TableCell>{role.organization}</TableCell>
                  <TableCell>{role.effectiveStartDate ? new Date(role.effectiveStartDate).toLocaleDateString() : 'N/A'}</TableCell>
                  <TableCell>{role.effectiveEndDate ? new Date(role.effectiveEndDate).toLocaleDateString() : 'N/A'}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        ) : (
          <p className="text-sm text-gray-500">No support roles.</p>
        )}
      </CardContent>
    </Card>
  );
}

function ExternalInteractionsTab({ data }: { data: any }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>External Interactions</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-gray-600">Compliance questionnaire data will be displayed here.</p>
        {Object.keys(data.answers || {}).length > 0 ? (
          <div className="mt-4 space-y-2">
            {Object.entries(data.answers).map(([key, value]: [string, any]) => (
              <div key={key} className="p-3 border rounded">
                <p className="font-medium text-sm">{key}</p>
                <p className="text-sm text-gray-600">{String(value)}</p>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-gray-500 mt-4">No external interaction data available.</p>
        )}
      </CardContent>
    </Card>
  );
}

function AdditionalDataTab({ data }: { data: any }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Additional Data</CardTitle>
      </CardHeader>
      <CardContent>
        {Object.keys(data.dataGroups || {}).length > 0 ? (
          <div className="space-y-4">
            {Object.entries(data.dataGroups).map(([groupName, groupData]: [string, any]) => (
              <div key={groupName} className="border rounded p-4">
                <h4 className="font-medium mb-2">{groupName}</h4>
                <pre className="text-xs bg-gray-50 p-2 rounded overflow-auto">
                  {JSON.stringify(groupData, null, 2)}
                </pre>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-gray-500">No additional data available.</p>
        )}
      </CardContent>
    </Card>
  );
}

function OrganizationsTab({ data }: { data: any }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Organizations</CardTitle>
      </CardHeader>
      <CardContent>
        {data.organizations && data.organizations.length > 0 ? (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Organization Name</TableHead>
                <TableHead>Organization Type</TableHead>
                <TableHead>Subtype</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.organizations.map((org: any, idx: number) => (
                <TableRow key={idx}>
                  <TableCell className="font-medium">{org.organizationName}</TableCell>
                  <TableCell>{org.organizationType}</TableCell>
                  <TableCell>{org.organizationSubtype || 'N/A'}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        ) : (
          <p className="text-sm text-gray-500">No organization memberships.</p>
        )}
      </CardContent>
    </Card>
  );
}

function ManagementChainTab({ data }: { data: any }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Management Chain</CardTitle>
      </CardHeader>
      <CardContent>
        {data.chain && data.chain.length > 0 ? (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Level</TableHead>
                <TableHead>Organization</TableHead>
                <TableHead>Manager Name</TableHead>
                <TableHead>Manager Title</TableHead>
                <TableHead>Phone Number</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.chain.map((item: any, idx: number) => (
                <TableRow key={idx}>
                  <TableCell>{item.levelIndex + 1}</TableCell>
                  <TableCell>{item.organizationName}</TableCell>
                  <TableCell className="font-medium">{item.managerName}</TableCell>
                  <TableCell>{item.managerTitle}</TableCell>
                  <TableCell>{item.phoneNumber}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        ) : (
          <p className="text-sm text-gray-500">No management chain data available.</p>
        )}
      </CardContent>
    </Card>
  );
}
